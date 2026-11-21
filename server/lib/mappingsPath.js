/**
 * mappingsPath — finds the folder that holds the game's control XML profiles.
 *
 * WHY THIS EXISTS: the path used to be a hardcoded constant pointing at a default
 * install of the LIVE channel. Anyone with a custom install path, or on PTU/EPTU,
 * got an empty profile list with no explanation.
 *
 * Resolution order (first win):
 *   1. config.json  -> mappingsPath   (set from the UI)
 *   2. UNIHOTAS_MAPPINGS_PATH         (env override, useful for scripts)
 *   3. auto-detection across the RSI launcher's known channels
 *
 * ⚠️ A value from config that no longer exists is reported, not silently replaced,
 * so the UI can say "the folder you chose has moved" instead of "not found".
 */
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { readConfig, writeConfig } from './userData.js';

const CHANNELS = ['LIVE', 'PTU', 'EPTU', 'HOTFIX'];
const CHANNEL_SUFFIX = ['user', 'client', '0', 'controls', 'mappings'];

function launcherRoots() {
  const roots = [];
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  roots.push(join(programFiles, 'Roberts Space Industries', 'StarCitizen'));
  roots.push(join(programFilesX86, 'Roberts Space Industries', 'StarCitizen'));

  if (process.env.RSI_STARCITIZEN_DIR) {
    roots.push(process.env.RSI_STARCITIZEN_DIR);
  }

  return [...new Set(roots)];
}

export function isMappingsDir(dir) {
  if (!dir || typeof dir !== 'string') return false;
  try {
    return existsSync(dir) && statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

export function listCandidates() {
  const candidates = [];

  launcherRoots().forEach((root) => {
    CHANNELS.forEach((channel) => {
      const dir = join(root, channel, ...CHANNEL_SUFFIX);
      if (isMappingsDir(dir)) {
        candidates.push({ channel, path: dir });
      }
    });
  });

  return candidates;
}

export function getMappingsStatus() {
  const config = readConfig();
  const configured = config.mappingsPath || null;

  if (configured) {
    if (isMappingsDir(configured)) {
      return { path: configured, source: 'config', configured };
    }
    // The user chose this folder explicitly, so do NOT silently switch to a
    // detected install — writing to the wrong profile set is worse than asking.
    return { path: null, source: 'config-missing', configured, candidates: listCandidates() };
  }

  const fromEnv = process.env.UNIHOTAS_MAPPINGS_PATH;
  if (fromEnv && isMappingsDir(fromEnv)) {
    return { path: fromEnv, source: 'env', configured };
  }

  const candidates = listCandidates();
  if (candidates.length > 0) {
    return { path: candidates[0].path, source: 'detected', configured, candidates };
  }

  return {
    path: null,
    source: configured ? 'config-missing' : 'none',
    configured,
    candidates: [],
  };
}

export function getMappingsPath() {
  return getMappingsStatus().path;
}

/**
 * Persist a user-chosen folder. Returns the new status, or throws with a reason
 * the API can hand straight back to the UI.
 */
export function setMappingsPath(dir) {
  if (!dir || typeof dir !== 'string' || !dir.trim()) {
    throw new Error('A folder path is required');
  }

  const normalized = dir.trim().replace(/[\\/]+$/, '');
  if (!isMappingsDir(normalized)) {
    throw new Error('That folder does not exist');
  }

  let xmlCount = 0;
  try {
    xmlCount = readdirSync(normalized).filter((f) => f.toLowerCase().endsWith('.xml')).length;
  } catch {
    xmlCount = 0;
  }

  writeConfig({ mappingsPath: normalized });
  return { ...getMappingsStatus(), xmlCount };
}
