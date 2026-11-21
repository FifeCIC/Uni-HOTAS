// Express routes that persist HOTAS overlay positions (ESM version).
//
// WHY USER DATA: positions used to be written into app/data/ inside the project.
// That breaks once the app is installed somewhere read-only, so both the saved
// file and its backups live under %APPDATA%\Uni-HOTAS now.
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUserDataPath } from '../lib/userData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OVERLAY_FILENAME = 'hotas-x52-overlay-positions.jsonc';
// Shipped defaults, used until the user saves their own layout.
const BUNDLED_OVERLAY_PATH = path.join(__dirname, '../../app/data/hotas/overlays', OVERLAY_FILENAME);

function overlayFile() {
  return getUserDataPath('overlays', OVERLAY_FILENAME);
}

function overlayBackupDir() {
  return getUserDataPath('overlays', 'backups');
}

function buildBackupStamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function readOverlayText() {
  const saved = overlayFile();
  if (fs.existsSync(saved)) return fs.readFileSync(saved, 'utf8');
  if (fs.existsSync(BUNDLED_OVERLAY_PATH)) return fs.readFileSync(BUNDLED_OVERLAY_PATH, 'utf8');
  return '[]';
}

export function registerHotasOverlayRoutes(app) {
  // The client reads saved positions here instead of a static file, which is what
  // lets a saved layout survive a rebuild or an app update.
  app.get('/api/hotas-overlay-positions', (req, res) => {
    try {
      res.type('application/json').send(readOverlayText().replace(/^\uFEFF/, ''));
    } catch (error) {
      console.error('Failed to read overlay positions:', error);
      res.status(500).json({ error: 'Failed to read file' });
    }
  });

  app.post('/api/hotas-overlay-positions', express.json({ limit: '1mb' }), (req, res) => {
    const overlays = req.body;
    if (!Array.isArray(overlays)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    try {
      const overlayPath = overlayFile();
      const backupDir = overlayBackupDir();
      fs.mkdirSync(backupDir, { recursive: true });

      // Keep a safety copy of the current persisted file before every overwrite.
      if (fs.existsSync(overlayPath)) {
        const existingContents = fs.readFileSync(overlayPath, 'utf8');
        const stamp = buildBackupStamp();
        const timestampedBackupPath = path.join(backupDir, `hotas-x52-overlay-positions.${stamp}.jsonc`);
        const latestBackupPath = path.join(backupDir, 'hotas-x52-overlay-positions.latest.jsonc');
        fs.writeFileSync(timestampedBackupPath, existingContents, 'utf8');
        fs.writeFileSync(latestBackupPath, existingContents, 'utf8');

        // Prune old timestamped backups - keep only the 3 most recent
        const MAX_BACKUPS = 3;
        const backups = fs.readdirSync(backupDir)
          .filter((f) => f !== 'hotas-x52-overlay-positions.latest.jsonc' && f.endsWith('.jsonc'))
          .sort()
          .reverse();
        backups.slice(MAX_BACKUPS).forEach((f) => {
          try { fs.unlinkSync(path.join(backupDir, f)); } catch { /* ignore */ }
        });
      }

      const serialized = JSON.stringify(overlays, null, 2);
      // Write directly - the backup above already protects against data loss.
      // renameSync fails on Windows when the destination is held open by an editor.
      fs.writeFileSync(overlayPath, serialized, 'utf8');

      return res.json({
        success: true,
        backupDir,
      });
    } catch (error) {
      console.error('Failed to save overlay positions:', error);
      return res.status(500).json({
        error: 'Failed to save file',
        detail: error?.message || 'Unknown server error',
      });
    }
  });
}