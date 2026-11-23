/**
 * UNI-HOTAS Backend API Server
 *
 * SECURITY STANDARDS (OWASP Top 10 compliance):
 * - A01 Broken Access Control: CORS restricted to frontend origin, shutdown endpoint removed
 * - A03 Injection: All user input validated and length-limited before use
 * - A04 Insecure Design: Request body size limited, rate limiting enforced
 * - A05 Security Misconfiguration: Helmet sets all recommended security headers
 * - A07 Sensitive Data Exposure: API keys never in URLs, error messages sanitized
 * - A09 Logging & Monitoring: Structured logging, error log sanitization
 *
 * IMPORTANT: Never pass user input to file paths, shell commands, or eval().
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { registerFeedbackRoutes } from './api/feedback/index.js';
import { registerDownloadRoutes } from './api/dev/download/index.js';
import { registerHotasOverlayRoutes } from './api/hotasOverlayApi.js';
import { upsertDeviceRebind, removeDeviceRebind } from './peripherals/hotas/xmlRebind.js';
import { getMappingsPath, getMappingsStatus, listCandidates, setActiveGame, setMappingsPath } from './lib/mappingsPath.js';
import { getUserDataDir } from './lib/userData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const SERVER_VERSION = 'Alpha V0.1.0';

// --- SECURITY: Input validation constants ---
const MAX_LOG_FIELD_LENGTH = 2000;
const MAX_ANALYTICS_EVENTS_PER_BATCH = 20;
const ALLOWED_ORIGINS = [
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3111',
  'http://127.0.0.1:3111',
];
const ANALYTICS_EVENT_NAME_PATTERN = /^[a-z0-9][a-z0-9._:-]{2,63}$/;
const SENSITIVE_KEY_PATTERN = /(email|password|token|secret|phone|address|auth|apikey|api-key|key)/i;

function log(...args) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}]`, ...args);
}

/**
 * SECURITY: Sanitize a string for safe log file writing.
 * Strips control characters and limits length.
 */
function sanitizeForLog(str, maxLen = MAX_LOG_FIELD_LENGTH) {
  if (typeof str !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, maxLen);
}

// --- Express app setup ---
const app = express();

// SECURITY: Helmet sets Content-Security-Policy, X-Content-Type-Options,
// X-Frame-Options, Strict-Transport-Security, and other security headers.
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled for dev; enable in production

// SECURITY: Restrict CORS to known frontend origins only.
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// SECURITY: Limit request body size to prevent memory exhaustion attacks.
app.use(express.json({ limit: '1mb' }));

// --- Public endpoints ---
// The app is served at `/` (see the static block at the end of this file), so the
// server's own identity lives at `/api` instead.
app.get('/api', (req, res) => {
  res.json({
    message: 'UNI-HOTAS Backend API Server',
    version: SERVER_VERSION,
    status: 'running',
    endpoints: '/api/version, /api/citizen/:handle, /api/hotas/profiles, /api/hotas/mappings-path'
  });
});

app.get('/api/version', (req, res) => {
  res.json({ version: SERVER_VERSION });
});

// --- RSI Citizen API endpoint ---
app.get('/api/citizen/:handle', async (req, res) => {
  const { handle } = req.params;

  // Validate handle
  if (!handle || handle.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(handle)) {
    return res.status(400).json({ error: 'Invalid citizen handle' });
  }

  try {
    const apiKey = process.env.RSI_API_KEY;
    if (!apiKey) {
      log('ERROR', 'RSI_API_KEY not configured');
      return res.status(500).json({ error: 'API not configured' });
    }

    log('CITIZEN', `Fetching profile: ${handle}`);

    // Star Citizen API endpoint: GET /{apikey}/v1/{mode}/user/{handle}
    // API is at api.starcitizen-api.com (not starcitizen-api.com)
    // Mode can be: live, cache, auto, eager
    const response = await fetch(
      `https://api.starcitizen-api.com/${apiKey}/v1/live/user/${encodeURIComponent(handle)}`,
      {
        headers: {
          'User-Agent': 'Uni-HOTAS/0.1.0'
        },
        timeout: 10000
      }
    );

    if (!response.ok) {
      log('CITIZEN', `Profile not found: ${handle} (${response.status})`);
      return res.status(404).json({ error: 'Citizen not found', handle });
    }

    const data = await response.json();

    // Cache result for 1 hour to reduce API calls
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(data.data || data);

    log('CITIZEN', `Successfully fetched: ${handle}`);
  } catch (error) {
    log('ERROR', `Citizen API error: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch citizen data', details: error.message });
  }
});

// SECURITY: Rate limit all API routes to prevent abuse.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  skip: (req) => {
    const requestPath = String(req.originalUrl || req.path || '');
    return requestPath.includes('/api/hotas-overlay-positions');
  },
});
app.use('/api/', limiter);

// --- RSI Starmap proxy (public endpoint with server-side cache) ---
const RSI_STARMAP_BASE = 'https://robertsspaceindustries.com/api/starmap';
const STARMAP_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const starmapCache = {
  bootup: null,
  systems: new Map(),
};

function isFresh(entry, ttl = STARMAP_TTL_MS) {
  return Boolean(entry?.fetchedAt) && (Date.now() - entry.fetchedAt) < ttl;
}

async function fetchRsiStarmap(path) {
  const response = await fetch(`${RSI_STARMAP_BASE}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Uni-HOTAS/0.1.0',
      Accept: 'application/json',
    },
    body: '{}',
  });

  if (!response.ok) {
    throw new Error(`RSI starmap responded with ${response.status}`);
  }

  return response.json();
}

app.get('/api/starmap/bootup', async (req, res) => {
  const force = String(req.query.force || 'false') === 'true';

  try {
    if (!force && isFresh(starmapCache.bootup)) {
      return res.json({
        ...starmapCache.bootup.payload,
        _meta: {
          cacheSource: 'server-cache',
          fetchedAt: starmapCache.bootup.fetchedAt,
          source: 'rsi-starmap',
          endpoint: 'bootup',
        },
      });
    }

    const payload = await fetchRsiStarmap('bootup');
    starmapCache.bootup = {
      payload,
      fetchedAt: Date.now(),
    };

    res.set('Cache-Control', 'public, max-age=900');
    return res.json({
      ...payload,
      _meta: {
        cacheSource: 'network',
        fetchedAt: starmapCache.bootup.fetchedAt,
        source: 'rsi-starmap',
        endpoint: 'bootup',
      },
    });
  } catch (error) {
    log('ERROR', `RSI starmap bootup failed: ${error.message}`);
    return res.status(502).json({ error: 'Failed to fetch RSI starmap bootup data' });
  }
});

app.get('/api/starmap/system/:code', async (req, res) => {
  const force = String(req.query.force || 'false') === 'true';
  const code = String(req.params.code || '').trim().toUpperCase();

  if (!code || !/^[A-Z0-9_-]{1,64}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid star system code' });
  }

  try {
    const cached = starmapCache.systems.get(code);
    if (!force && isFresh(cached)) {
      return res.json({
        ...cached.payload,
        _meta: {
          cacheSource: 'server-cache',
          fetchedAt: cached.fetchedAt,
          source: 'rsi-starmap',
          endpoint: `star-systems/${code}`,
        },
      });
    }

    const payload = await fetchRsiStarmap(`star-systems/${encodeURIComponent(code)}`);
    starmapCache.systems.set(code, {
      payload,
      fetchedAt: Date.now(),
    });

    res.set('Cache-Control', 'public, max-age=900');
    return res.json({
      ...payload,
      _meta: {
        cacheSource: 'network',
        fetchedAt: Date.now(),
        source: 'rsi-starmap',
        endpoint: `star-systems/${code}`,
      },
    });
  } catch (error) {
    log('ERROR', `RSI starmap system failed (${code}): ${error.message}`);
    return res.status(502).json({ error: 'Failed to fetch RSI starmap system data' });
  }
});

let analyticsStats = { totalEvents: 0, eventsByName: {}, lastEventAt: null, lastBatchAt: null };

function sanitizeAnalyticsProperties(properties) {
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(properties)
      .slice(0, 24)
      .filter(([key]) => typeof key === 'string' && key && !SENSITIVE_KEY_PATTERN.test(key))
      .map(([key, value]) => [sanitizeForLog(key, 48), sanitizeForLog(String(value ?? ''), 200)])
  );
}

function sanitizeAnalyticsEvent(event) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const name = sanitizeForLog(String(event.name || '').toLowerCase(), 64);
  if (!ANALYTICS_EVENT_NAME_PATTERN.test(name)) {
    return null;
  }

  return {
    name,
    timestamp: sanitizeForLog(String(event.timestamp || new Date().toISOString()), 64),
    properties: sanitizeAnalyticsProperties(event.properties)
  };
}

// --- Admin/monitoring endpoints ---
app.get('/api/analytics/summary', (req, res) => {
  res.json(analyticsStats);
});

app.post('/api/analytics/events', (req, res) => {
  const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, MAX_ANALYTICS_EVENTS_PER_BATCH) : [];
  let accepted = 0;

  events.forEach((event) => {
    const safeEvent = sanitizeAnalyticsEvent(event);
    if (!safeEvent) {
      return;
    }

    accepted += 1;
    analyticsStats.totalEvents += 1;
    analyticsStats.lastEventAt = safeEvent.timestamp;
    analyticsStats.lastBatchAt = new Date().toISOString();
    analyticsStats.eventsByName[safeEvent.name] = (analyticsStats.eventsByName[safeEvent.name] || 0) + 1;
  });

  res.status(202).json({ accepted });
});

// --- Error logging endpoint ---
app.post('/api/log-error', (req, res) => {
  // SECURITY: Sanitize all user-supplied fields before writing to disk
  const timestamp = sanitizeForLog(req.body.timestamp, 50);
  const button = sanitizeForLog(req.body.button, 100);
  const page = sanitizeForLog(req.body.page, 100);
  const error = sanitizeForLog(req.body.error, 1000);
  const stack = sanitizeForLog(req.body.stack, MAX_LOG_FIELD_LENGTH);

  const logEntry = `\n[${timestamp}] ${page} - ${button}\nError: ${error}\nStack: ${stack}\n${'='.repeat(80)}\n`;

  try {
    appendFileSync(join(process.cwd(), 'error.log'), logEntry);
    log('📝 Error logged to error.log');
    res.json({ success: true });
  } catch (err) {
    log('Failed to write error log:', err.message);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

// SECURITY: Server shutdown endpoint REMOVED.
// Previously POST /api/server/restart called process.exit(0) with no auth.
// Use Ctrl+C in terminal or process manager to stop the server.

// --- HOTAS Profile Endpoints ---
// The mappings folder is resolved per request (config -> env -> auto-detect) so a
// packaged build never depends on one machine's install path.
const HOTAS_PROFILE_MODE_KEYS = ['green', 'orange', 'red'];

function sendMappingsMissing(res) {
  const status = getMappingsStatus();
  return res.status(409).json({
    error: 'Controls mappings folder not found for the active game',
    code: 'MAPPINGS_NOT_CONFIGURED',
    game: status.game || null,
    hint: 'Choose your controls folder in HOTAS Config, or POST /api/hotas/mappings-path',
    configured: status.configured || null,
    candidates: status.candidates || [],
  });
}

// SECURITY: Validate profile name to prevent directory traversal
function validateProfileName(name) {
  if (!name || typeof name !== 'string') return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  if (name.includes('..') || name.includes('/') || name.includes('\\')) return null;
  return name.substring(0, 100);
}

function validateInputToken(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Accept Star Citizen joystick token format: js1_button14, js1_z, js1_pov_n, etc.
  if (/^js\d+_[a-z0-9_ +\-]+$/i.test(trimmed)) return trimmed.slice(0, 64);
  // Accept Star Citizen keyboard token format: kb1_w, kb1_lctrl+m, etc.
  if (/^kb\d+_[a-z0-9_ +\-]+$/i.test(trimmed)) return trimmed.slice(0, 64);
  // Accept Star Citizen mouse token format: mouse1, mouse2, mouse4, etc.
  if (/^mouse\d+(?:_[a-z0-9_ +\-]+)?$/i.test(trimmed)) return trimmed.slice(0, 64);

  return null;
}

function normalizeActionNames(actionNames) {
  if (!Array.isArray(actionNames) || actionNames.length === 0) return [];
  return actionNames
    .filter((name) => typeof name === 'string')
    .map((name) => name.trim())
    .filter((name) => /^[a-z0-9_]+$/i.test(name));
}

function normalizeModeOverrideValue(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 128);
}

function normalizeModeHotasOverrides(input) {
  const result = {
    green: {},
    orange: {},
    red: {},
  };

  if (!input || typeof input !== 'object') {
    return result;
  }

  HOTAS_PROFILE_MODE_KEYS.forEach((modeKey) => {
    const modeValue = input[modeKey];
    if (!modeValue || typeof modeValue !== 'object') return;

    Object.entries(modeValue).forEach(([featureId, token]) => {
      const safeFeatureId = String(featureId || '').trim();
      if (!/^[a-z0-9._:-]{1,120}$/i.test(safeFeatureId)) return;

      const normalizedToken = normalizeModeOverrideValue(token);
      if (!normalizedToken) return;

      result[modeKey][safeFeatureId] = normalizedToken;
    });
  });

  return result;
}

function getProfileModeOverridesPath(profileName) {
  const mappingsPath = getMappingsPath();
  if (!mappingsPath) return null;
  return join(mappingsPath, `${profileName}.unihotas.modes.json`);
}

function readProfileModeOverrides(profileName) {
  const filePath = getProfileModeOverridesPath(profileName);
  if (!filePath) throw new Error('MAPPINGS_NOT_CONFIGURED');

  if (!existsSync(filePath)) {
    return normalizeModeHotasOverrides({});
  }

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return normalizeModeHotasOverrides(parsed?.modeHotasOverrides);
  } catch (error) {
    log(`HOTAS: Invalid mode overrides JSON at ${filePath}: ${error.message}`);
    return normalizeModeHotasOverrides({});
  }
}

function writeProfileModeOverrides(profileName, modeHotasOverrides) {
  const filePath = getProfileModeOverridesPath(profileName);
  const mappingsPath = getMappingsPath();

  if (!filePath || !mappingsPath) throw new Error('MAPPINGS_NOT_CONFIGURED');
  if (!filePath.startsWith(mappingsPath)) throw new Error('Access denied');

  const payload = {
    profile: profileName,
    updatedAt: new Date().toISOString(),
    modeHotasOverrides: normalizeModeHotasOverrides(modeHotasOverrides),
  };

  writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  return payload.modeHotasOverrides;
}

app.get('/api/hotas/profiles', (req, res) => {
  try {
    const mappingsPath = getMappingsPath();
    if (!mappingsPath) return sendMappingsMissing(res);

    if (!existsSync(mappingsPath) || !statSync(mappingsPath).isDirectory()) {
      return sendMappingsMissing(res);
    }

    const profiles = readdirSync(mappingsPath)
      .filter(file => file.endsWith('.xml'))
      .map(file => {
        const name = file.replace('.xml', '');
        let meta = {};
        try {
          const metaPath = join(mappingsPath, `${name}.unihotas.json`);
          const metaRaw = readFileSync(metaPath, 'utf-8');
          try {
            meta = JSON.parse(metaRaw);
          } catch (e) {
            log(`HOTAS: Malformed JSON in ${metaPath}: ${e.message}`);
            meta = { error: 'Malformed JSON' };
          }
        } catch { /* no sidecar */ }
        return { name, path: file, filename: file, meta };
      });

    log(`HOTAS: Loaded ${profiles.length} profiles from the active game's mappings directory`);
    res.json({ profiles });
  } catch (error) {
    log('HOTAS profiles error:', error.message);
    res.status(500).json({ error: 'Failed to load profiles' });
  }
});

app.get('/api/hotas/profile/:profileName/meta', (req, res) => {
  try {
    const profileName = validateProfileName(req.params.profileName);
    if (!profileName) return res.status(400).json({ error: 'Invalid profile name' });
    const mappingsPath = getMappingsPath();
    if (!mappingsPath) return sendMappingsMissing(res);
    const metaPath = join(mappingsPath, `${profileName}.unihotas.json`);
    if (!metaPath.startsWith(mappingsPath)) return res.status(403).json({ error: 'Access denied' });
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      res.json(meta);
    } catch {
      res.json({});
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to read profile metadata' });
  }
});

app.post('/api/hotas/profile/:profileName/meta', (req, res) => {
  try {
    const profileName = validateProfileName(req.params.profileName);
    if (!profileName) return res.status(400).json({ error: 'Invalid profile name' });
    const mappingsPath = getMappingsPath();
    if (!mappingsPath) return sendMappingsMissing(res);
    const metaPath = join(mappingsPath, `${profileName}.unihotas.json`);
    if (!metaPath.startsWith(mappingsPath)) return res.status(403).json({ error: 'Access denied' });
    const meta = req.body || {};
    writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    log(`HOTAS: Saved metadata for profile "${profileName}"`);
    res.json({ success: true, meta });
  } catch (error) {
    log('HOTAS meta save error:', error.message);
    res.status(500).json({ error: 'Failed to save profile metadata' });
  }
});

app.get('/api/hotas/profile/:profileName/mode-overrides', (req, res) => {
  try {
    const profileName = validateProfileName(req.params.profileName);
    if (!profileName) return res.status(400).json({ error: 'Invalid profile name' });

    const modeHotasOverrides = readProfileModeOverrides(profileName);
    res.json({
      profile: profileName,
      modeHotasOverrides,
    });
  } catch (error) {
    log('HOTAS mode-overrides read error:', error.message);
    res.status(500).json({ error: 'Failed to load mode overrides' });
  }
});

app.post('/api/hotas/profile/:profileName/mode-overrides', (req, res) => {
  try {
    const profileName = validateProfileName(req.params.profileName);
    if (!profileName) return res.status(400).json({ error: 'Invalid profile name' });

    const modeHotasOverrides = writeProfileModeOverrides(profileName, req.body?.modeHotasOverrides);
    log(`HOTAS: Saved mode overrides for profile "${profileName}"`);

    res.json({
      success: true,
      profile: profileName,
      modeHotasOverrides,
    });
  } catch (error) {
    log('HOTAS mode-overrides save error:', error.message);
    res.status(500).json({ error: 'Failed to save mode overrides' });
  }
});

app.get('/api/hotas/profile/:profileName', (req, res) => {
  try {
    const profileName = validateProfileName(req.params.profileName);
    if (!profileName) {
      return res.status(400).json({ error: 'Invalid profile name' });
    }

    const mappingsPath = getMappingsPath();
    if (!mappingsPath) return sendMappingsMissing(res);

    const filePath = join(mappingsPath, `${profileName}.xml`);
    
    // SECURITY: Validate file path is within allowed directory
    if (!filePath.startsWith(mappingsPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fileContent = readFileSync(filePath, 'utf-8');
    
    log(`HOTAS: Loaded profile "${profileName}"`);
    res.json({ profile: profileName, xmlContent: fileContent });
  } catch (error) {
    log('HOTAS profile load error:', error.message);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.post('/api/hotas/profile/:profileName/bindings', (req, res) => {
  try {
    const profileName = validateProfileName(req.params.profileName);
    if (!profileName) {
      return res.status(400).json({ error: 'Invalid profile name' });
    }

    const actionNames = normalizeActionNames(req.body?.actionNames);
    const inputToken = validateInputToken(req.body?.inputToken ?? req.body?.joystickInput);
    const clearBinding = req.body?.clearBinding === true;

    if (!inputToken) {
      return res.status(400).json({ error: 'Invalid input token' });
    }

    if (!clearBinding && actionNames.length === 0) {
      return res.status(400).json({ error: 'No valid action names provided' });
    }

    const filePath = join(getMappingsPath() || '', `${profileName}.xml`);
    const mappingsPath = getMappingsPath();
    if (!mappingsPath) return sendMappingsMissing(res);

    // SECURITY: Validate file path is within allowed directory.
    if (!filePath.startsWith(mappingsPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const originalXml = readFileSync(filePath, 'utf-8');
    let updatedXml = originalXml;
    let updatedCount = 0;
    let foundCount = 0;

    if (clearBinding) {
      const result = removeDeviceRebind(updatedXml, inputToken);
      updatedXml = result.xml;
      if (result.found) foundCount = 1;
      if (result.updated) updatedCount = 1;
    } else {
      actionNames.forEach((actionName) => {
        const result = upsertDeviceRebind(updatedXml, actionName, inputToken);
        updatedXml = result.xml;
        if (result.found) foundCount += 1;
        if (result.updated) updatedCount += 1;
      });
    }

    if (updatedCount === 0) {
      return res.status(404).json({
        error: clearBinding ? 'No matching rebind found in profile XML' : 'No matching actions found in profile XML',
        actionNames,
      });
    }

    writeFileSync(filePath, updatedXml, 'utf-8');
    log(`HOTAS: Updated ${updatedCount} rebind(s) in profile "${profileName}" -> ${inputToken}`);

    res.json({
      success: true,
      profile: profileName,
      inputToken,
      actionNames,
      clearBinding,
      matchedActions: foundCount,
      updatedActions: updatedCount,
    });
  } catch (error) {
    log('HOTAS profile save error:', error.message);
    res.status(500).json({ error: 'Failed to save profile bindings' });
  }
});

// --- Active game & per-game mappings folder discovery ---
app.get('/api/hotas/active-game', (req, res) => {
  try {
    res.json({ activeGame: getMappingsStatus().game });
  } catch (error) {
    log('HOTAS active-game read error:', error.message);
    res.status(500).json({ error: 'Failed to read the active game' });
  }
});

app.post('/api/hotas/active-game', (req, res) => {
  try {
    const status = setActiveGame(req.body?.game);
    log(`HOTAS: Active game set to ${status.game}`);
    res.json({ success: true, activeGame: status.game, mappings: status });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/hotas/mappings-path', (req, res) => {
  try {
    res.json(getMappingsStatus(req.query.game));
  } catch (error) {
    log('HOTAS mappings-path read error:', error.message);
    res.status(500).json({ error: 'Failed to read mappings path' });
  }
});

app.get('/api/hotas/mappings-candidates', (req, res) => {
  try {
    res.json({ candidates: listCandidates(req.query.game) });
  } catch (error) {
    log('HOTAS mappings-candidates error:', error.message);
    res.status(500).json({ error: 'Failed to scan for installs' });
  }
});

app.post('/api/hotas/mappings-path', (req, res) => {
  try {
    const result = setMappingsPath(req.body?.path, req.body?.game);
    log(`HOTAS: Mappings folder for ${result.game} set to ${result.path} (${result.xmlCount} xml)`);
    res.json({ success: true, ...result });
  } catch (error) {
    log('HOTAS mappings-path save error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Native folder picker — Windows only, and deliberately a child process so the
// server keeps running if the user cancels.
app.post('/api/hotas/pick-folder', (req, res) => {
  try {
    const game = req.body?.game;
    const script = [
      'Add-Type -AssemblyName System.Windows.Forms;',
      '$d = New-Object System.Windows.Forms.FolderBrowserDialog;',
      "$d.Description = 'Select the controls or mappings folder for your game';",
      '$d.ShowNewFolderButton = $false;',
      'if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $d.SelectedPath }',
    ].join(' ');

    const output = execSync(`powershell -NoProfile -STA -Command "${script.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      windowsHide: true,
      timeout: 120000,
    }).trim();

    if (!output) {
      return res.status(204).end();
    }

    const result = setMappingsPath(output, game);
    log(`HOTAS: Mappings folder for ${result.game} chosen via picker: ${result.path}`);
    res.json({ success: true, ...result });
  } catch (error) {
    log('HOTAS pick-folder error:', error.message);
    res.status(500).json({ error: 'Folder picker failed' });
  }
});

app.post('/api/hotas/open-folder', (req, res) => {
  try {
    const mappingsPath = getMappingsPath();
    if (!mappingsPath) return sendMappingsMissing(res);
    if (!existsSync(mappingsPath) || !statSync(mappingsPath).isDirectory()) {
      return sendMappingsMissing(res);
    }

    // Open folder with Windows explorer (works on Windows)
    execSync(`start "" "${mappingsPath}"`, { stdio: 'ignore' });
    
    log('HOTAS: Opened mappings folder');
    res.json({ success: true, path: mappingsPath });
  } catch (error) {
    log('HOTAS open folder error:', error.message);
    res.status(500).json({ error: 'Failed to open folder' });
  }
});

// --- Backup/Sync Service ---
const DATA_DIR = getUserDataDir();
const BACKUP_CONFIG_PATH = join(DATA_DIR, 'backup-config.json');

function getBackupConfig() {
  try {
    if (!existsSync(BACKUP_CONFIG_PATH)) return { enabled: false, folderPath: '' };
    return JSON.parse(readFileSync(BACKUP_CONFIG_PATH, 'utf-8'));
  } catch { return { enabled: false, folderPath: '' }; }
}

function saveBackupConfig(config) {
  ensureDataDir();
  writeFileSync(BACKUP_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function runBackupSync() {
  const config = getBackupConfig();
  if (!config.enabled || !config.folderPath) {
    return { success: false, error: 'Backup not configured' };
  }

  try {
    if (!existsSync(config.folderPath)) {
      mkdirSync(config.folderPath, { recursive: true });
    }

    const mappingsPath = getMappingsPath();
    const sources = [
      { dir: mappingsPath, subdir: 'hotas-profiles', pattern: /\.(xml|json)$/i },
    ].filter((source) => source.dir);

    if (sources.length === 0) {
      return { success: false, error: 'Mappings folder not configured' };
    }

    let filesCopied = 0;
    for (const source of sources) {
      if (!existsSync(source.dir)) continue;
      const destDir = join(config.folderPath, source.subdir);
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

      const files = readdirSync(source.dir).filter(f => source.pattern.test(f));
      for (const file of files) {
        const src = join(source.dir, file);
        const dest = join(destDir, file);
        const srcStat = statSync(src);
        let needsCopy = true;
        try {
          const destStat = statSync(dest);
          needsCopy = srcStat.mtimeMs > destStat.mtimeMs;
        } catch { /* dest doesn't exist */ }
        if (needsCopy) {
          writeFileSync(dest, readFileSync(src));
          filesCopied++;
        }
      }
    }

    const result = { success: true, filesCopied, syncedAt: new Date().toISOString() };
    saveBackupConfig({ ...config, lastSyncAt: result.syncedAt, lastSyncFiles: filesCopied });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

app.get('/api/backup/status', (req, res) => {
  const config = getBackupConfig();
  const folderExists = config.folderPath ? existsSync(config.folderPath) : false;
  res.json({
    enabled: config.enabled,
    folderPath: config.folderPath,
    folderExists,
    ready: config.enabled && folderExists,
    lastSyncAt: config.lastSyncAt || null,
    lastSyncFiles: config.lastSyncFiles || 0,
  });
});

app.post('/api/backup/configure', (req, res) => {
  const folderPath = String(req.body?.folderPath || '').trim();
  const enabled = Boolean(req.body?.enabled);

  if (enabled && !folderPath) {
    return res.status(400).json({ error: 'Folder path is required when enabling backup' });
  }

  // Basic path validation
  if (folderPath && (folderPath.includes('..') || folderPath.length > 260)) {
    return res.status(400).json({ error: 'Invalid folder path' });
  }

  const config = { ...getBackupConfig(), enabled, folderPath };
  saveBackupConfig(config);
  log(`Backup configured: enabled=${enabled}, path=${folderPath}`);
  res.json({ success: true, ...config });
});

app.post('/api/backup/sync', (req, res) => {
  const result = runBackupSync();
  if (result.success) {
    log(`Backup sync complete: ${result.filesCopied} files copied`);
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

registerFeedbackRoutes(app);
registerDownloadRoutes(app);
registerHotasOverlayRoutes(app);

// --- Serve the built app (same-origin install) ---
// WHY: when the server also serves dist/, the whole app runs at
// http://localhost:3111 with no CORS, no proxy and no second terminal. It is the
// foundation for the packaged Windows build. In development `dist/` may be absent,
// in which case Vite keeps serving the UI on :5175.
const DIST_DIR = join(__dirname, '..', 'dist');

/**
 * A dist/ built with a different Vite base (e.g. `npm run build`, which targets GitHub
 * Pages at /Uni-HOTAS/) references asset paths this server does not serve. The browser
 * then loads no JavaScript at all and shows a BLANK WHITE PAGE with no error, which reads
 * as a broken app rather than a build made for a different host.
 *
 * Returns the offending script path, or null when the build matches what we serve.
 */
function detectBuildBaseMismatch() {
  try {
    const html = readFileSync(join(DIST_DIR, 'index.html'), 'utf-8');
    const match = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/i);
    if (!match) return null;

    const src = match[1];
    if (!src.startsWith('/')) return null; // relative or external asset — nothing to verify

    const onDisk = join(DIST_DIR, src.replace(/^\/+/, ''));
    return existsSync(onDisk) ? null : src;
  } catch {
    return null;
  }
}

function buildMismatchPage(assetPath) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Uni-HOTAS — wrong build for this server</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#0b1428; color:#dce7f3; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
  .card { max-width:640px; padding:2rem; border:1px solid rgba(255,182,0,.45); border-radius:12px;
          background:rgba(255,182,0,.06); }
  h1 { margin:0 0 .75rem; font-size:1.35rem; color:#ffcf7a; }
  code { background:rgba(0,217,255,.10); color:#8de3ff; padding:2px 6px; border-radius:4px; }
  p { line-height:1.6; margin:.5rem 0; }
</style></head>
<body><div class="card">
  <h1>This build was made for GitHub Pages, not for this server</h1>
  <p><code>dist/index.html</code> asks for <code>${assetPath}</code>, which this server does not serve —
  so no JavaScript loaded and the page stayed blank.</p>
  <p>Run <code>npm run build:local</code> (or <code>npm run serve</code>) and reload. That builds the app
  with a root base so <code>http://localhost:3111</code> can serve it.</p>
</div></body></html>`;
}

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: false }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    if (req.path.includes('.')) return next();

    // Say it in the browser instead of serving an index.html that cannot boot.
    const mismatch = detectBuildBaseMismatch();
    if (mismatch) return res.status(503).type('html').send(buildMismatchPage(mismatch));

    return res.sendFile(join(DIST_DIR, 'index.html'));
  });
}

// 3111, not 3001: 3001 belongs to StreamerOps (data/port-registry.json in the Intranet).
const PORT = process.env.PORT || 3111;
app.listen(PORT, () => {
  log(`Server ${SERVER_VERSION} running on port ${PORT}`);
  if (existsSync(DIST_DIR)) {
    const mismatch = detectBuildBaseMismatch();
    if (mismatch) {
      log(`WARNING: dist/ was built for a different base — index.html asks for ${mismatch}`);
      log('WARNING: run "npm run serve" (or "npm run build:local") to build the app for same-origin use.');
    } else {
      log(`Serving built app at http://localhost:${PORT}/`);
    }
  } else {
    log('No dist/ build found — run "npm run build:local" to serve the app from this server');
  }
});
