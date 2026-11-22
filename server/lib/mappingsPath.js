/**
 * mappingsPath — finds the folder that holds the active game's control profiles.
 *
 * WHY THIS EXISTS: the path used to be a hardcoded constant pointing at a default Star
 * Citizen install, so anyone with a custom install path (or on PTU/EPTU) got an empty
 * profile list with no explanation.
 *
 * WHY IT IS NOW PER GAME: the app supports more than one title. One shared folder meant
 * switching game re-pointed the same setting, so the previous game's path was lost. Each
 * game now gets its own entry; `activeGame` says which one the profile endpoints read.
 *
 * Resolution order (first win), for the game being resolved:
 *   1. config.json -> gameMappings[<game>]   (set from the UI)
 *   2. config.json -> mappingsPath           (legacy, Star Citizen only)
 *   3. UNIHOTAS_MAPPINGS_PATH                (env override, Star Citizen only)
 *   4. auto-detection across the RSI launcher's known channels (Star Citizen only)
 *
 * ⚠️ A value from config that no longer exists is reported, not silently replaced,
 * so the UI can say "the folder you chose has moved" instead of "not found".
 */
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { readConfig, writeConfig } from './userData.js';

export const DEFAULT_GAME_ID = 'star-citizen';

const CHANNELS = ['LIVE', 'PTU', 'EPTU', 'HOTFIX'];
const CHANNEL_SUFFIX = ['user', 'client', '0', 'controls', 'mappings'];

function normalizeGameId(gameId) {
  if (typeof gameId !== 'string') return null;
  const trimmed = gameId.trim();
  return trimmed ? trimmed.slice(0, 64) : null;
}

function readGameMappings(config) {
  return config.gameMappings && typeof config.gameMappings === 'object' ? config.gameMappings : {};
}

export function getActiveGameId() {
  return normalizeGameId(readConfig().activeGame) || DEFAULT_GAME_ID;
}

function resolveGameId(gameId) {
  return normalizeGameId(gameId) || getActiveGameId();
}

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

/**
 * Auto-detection is a Star Citizen adapter concern: only RSI's launcher layout is known.
 * Other games must be pointed at their folder explicitly until an adapter adds detection.
 */
export function listCandidates(gameId = null) {
  const resolvedGame = resolveGameId(gameId);
  if (resolvedGame !== DEFAULT_GAME_ID) return [];

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

export function getMappingsStatus(gameId = null) {
  const resolvedGame = resolveGameId(gameId);
  const config = readConfig();
  const configured = readGameMappings(config)[resolvedGame] || null;
  const legacy = resolvedGame === DEFAULT_GAME_ID ? (config.mappingsPath || null) : null;
  const chosen = configured || legacy;

  if (chosen) {
    if (isMappingsDir(chosen)) {
      return { game: resolvedGame, path: chosen, source: configured ? 'config' : 'legacy', configured: chosen };
    }
    // The user chose this folder explicitly, so do NOT silently switch to a
    // detected install — writing to the wrong profile set is worse than asking.
    return { game: resolvedGame, path: null, source: 'config-missing', configured: chosen, candidates: listCandidates(resolvedGame) };
  }

  const fromEnv = resolvedGame === DEFAULT_GAME_ID ? process.env.UNIHOTAS_MAPPINGS_PATH : null;
  if (fromEnv && isMappingsDir(fromEnv)) {
    return { game: resolvedGame, path: fromEnv, source: 'env', configured: null };
  }

  const candidates = listCandidates(resolvedGame);
  if (candidates.length > 0) {
    return { game: resolvedGame, path: candidates[0].path, source: 'detected', configured: null, candidates };
  }

  return {
    game: resolvedGame,
    path: null,
    source: chosen ? 'config-missing' : 'none',
    configured: chosen,
    candidates: [],
  };
}

/** The folder the profile endpoints read — always the ACTIVE game's folder. */
export function getMappingsPath(gameId = null) {
  return getMappingsStatus(gameId).path;
}

/**
 * Persist a user-chosen folder for one game. Returns the new status, or throws with a
 * reason the API can hand straight back to the UI.
 */
export function setMappingsPath(dir, gameId = null) {
  if (!dir || typeof dir !== 'string' || !dir.trim()) {
    throw new Error('A folder path is required');
  }

  const resolvedGame = resolveGameId(gameId);
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

  const config = readConfig();
  const patch = {
    activeGame: resolvedGame,
    gameMappings: { ...readGameMappings(config), [resolvedGame]: normalized },
  };
  // Keep the legacy single value in step for existing installs and older callers.
  if (resolvedGame === DEFAULT_GAME_ID) patch.mappingsPath = normalized;

  writeConfig(patch);
  return { ...getMappingsStatus(resolvedGame), xmlCount };
}

/** Switch which game's folder the profile endpoints read. */
export function setActiveGame(gameId) {
  const resolvedGame = normalizeGameId(gameId);
  if (!resolvedGame) {
    throw new Error('A game id is required');
  }

  writeConfig({ activeGame: resolvedGame });
  return getMappingsStatus(resolvedGame);
}
