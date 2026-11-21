/**
 * userData — where Uni-HOTAS keeps anything it writes on the user's machine.
 *
 * WHY THIS EXISTS: the app used to write settings and overlay data inside its own
 * folder. That is fine when you run it from a git checkout, and fatal when it is
 * installed under Program Files, so user data lives here instead.
 *
 * Location: %APPDATA%\Uni-HOTAS (override with UNIHOTAS_DATA_DIR).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const APP_DIR_NAME = 'Uni-HOTAS';

export function getUserDataDir() {
  const base = process.env.UNIHOTAS_DATA_DIR
    || (process.env.APPDATA ? join(process.env.APPDATA, APP_DIR_NAME) : null)
    || join(homedir(), `.${APP_DIR_NAME.toLowerCase()}`);

  mkdirSync(base, { recursive: true });
  return base;
}

export function getUserDataPath(...segments) {
  return join(getUserDataDir(), ...segments);
}

export function getConfigPath() {
  return getUserDataPath('config.json');
}

export function readConfig() {
  const file = getConfigPath();
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) || {};
  } catch {
    return {};
  }
}

export function writeConfig(patch) {
  const next = { ...readConfig(), ...patch };
  writeFileSync(getConfigPath(), JSON.stringify(next, null, 2), 'utf-8');
  return next;
}
