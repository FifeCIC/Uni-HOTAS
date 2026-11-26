# Installation Guide

Uni-HOTAS is a browser app with a small local server that reads and writes the game's control files. That split is what makes installation worth a page.

> **🚧 Alpha 0.1.0.** These steps are known to work on one person's machine. If a step does not
> match what you see — a button in a different place, a folder that is not there, an installer that
> will not run — that is worth reporting rather than working around silently:
> [open an issue](https://github.com/FifeCIC/Uni-HOTAS/issues).

---

## 1. What you need

| Requirement | Why |
|---|---|
| Windows 10/11 | The companion server reads and writes files under the Star Citizen install |
| Star Citizen **or** Squadron 42 installed | There is no profile to edit otherwise |
| A Chromium browser (Chrome/Edge) | Best PWA support; Firefox works for the hosted demo |
| Node.js 20+ | Only for Option B (running from source) |

**Where the game stores bindings**

```
C:\Program Files\Roberts Space Industries\StarCitizen\<CHANNEL>\user\client\0\controls\mappings
```

`<CHANNEL>` is normally `LIVE`, but can be `PTU` or `EPTU`. The server currently assumes `LIVE` — a custom install location is not detected (see [Known limits](#4-known-limits)).

---

## 2. Option A — Hosted app (no install)

1. Open **https://fifecic.github.io/Uni-HOTAS/**
2. Optional: browser menu → **Install Uni-HOTAS** to get a desktop shortcut.

**This is demo mode.** The page can show the interface and the feature library, but a web page cannot read your game folder — every reading/writing feature needs the companion server.

---

## 3. Option B — Run from source

**One command** — builds the app and serves it from the API on one port:

```powershell
git clone https://github.com/FifeCIC/Uni-HOTAS.git
cd Uni-HOTAS
npm install
npm run serve
```

Open **http://localhost:3111**. UI and API share an origin, so there is no CORS and nothing else to start.

### Or: development mode (hot reload)

Open two terminals:

```powershell
npm run server   # companion API on http://localhost:3111
npm run dev      # UI on http://localhost:5175
```

Then open **http://localhost:5175**.

### First run checklist

| Step | Expected |
|---|---|
| `npm run serve` prints `Serving built app at http://localhost:3111/` | Server up, UI served |
| App header shows **ONLINE** instead of **DEMO MODE** | UI found the server |
| **HOTAS Config** lists your `.xml` profiles | Mappings folder found automatically |
| Right-click a binding, press an input, save | XML written, backup created |

### If the controls folder is not found

The **Controls folder** panel appears under the error message:

| Column | Meaning |
|---|---|
| **Detected installs** | Every `LIVE` / `PTU` / `EPTU` / `HOTFIX` mappings folder the server found — click one, then **Save path** |
| **Folder path** | Paste any path, then **Save path** |
| **Choose folder…** | Opens the native Windows folder dialog and saves the result |
| **Refresh** | Re-scans the disk |

The choice is written to `%APPDATA%\Uni-HOTAS\config.json`. A saved folder that later disappears is reported as *"Your saved folder is missing"* rather than silently swapped for a different install.

### Optional configuration

Copy `.env.example` to `.env` in the project root. Nothing is required for HOTAS editing; the AI chat and Feedback email delivery are the only features that read keys.

`UNIHOTAS_MAPPINGS_PATH` overrides the folder, and `UNIHOTAS_DATA_DIR` moves the `%APPDATA%` data folder somewhere else (both useful for testing).

---

## 4. Known limits

| Limit | Status |
|---|---|
| Mappings path was fixed to `…\StarCitizen\LIVE\…` | ✅ Fixed — auto-detects channels, and the folder is user-selectable |
| Overlay/settings data was written inside the app folder | ✅ Fixed — user data lives in `%APPDATA%\Uni-HOTAS` |
| Hosted page could not call the local server | ✅ Fixed for local use — `npm run serve` serves the UI from the API |
| No installer yet | ✅ Fixed — `npm run dist:win`; installers publish on tags |

### User data locations

| What | Where |
|---|---|
| Mappings folder choice, app config | `%APPDATA%\Uni-HOTAS\config.json` |
| Overlay positions + last 3 backups | `%APPDATA%\Uni-HOTAS\overlays\` |
| Backup/sync settings | `%APPDATA%\Uni-HOTAS\` (backup-config.json present when enabled) |

---

## 5. Option C — Windows app

The desktop build is produced from this repo: an Electron shell around the same Express server, so the window and the API share an origin and no terminal is needed.

### For players

Installers are attached to [GitHub Releases](https://github.com/FifeCIC/Uni-HOTAS/releases) on each tag:

| File | Use |
|---|---|
| `Uni-HOTAS-<version>-x64.exe` | Installer — per-user, no admin rights, Start Menu + desktop shortcuts |
| `Uni-HOTAS-<version>-portable.exe` | Single file; run it anywhere, nothing installed |

Unsigned builds show a SmartScreen prompt (*More info → Run anyway*). Code signing is step 3 of [issue #5](https://github.com/FifeCIC/Uni-HOTAS/issues/5).

### For developers

```powershell
npm install
npm run pack:win    # release\win-unpacked\Uni-HOTAS.exe
npm run dist:win    # installer + portable exe in release\
```

⚠️ **"Cannot create symbolic link" during a local build** — electron-builder needs the *Create symbolic links* privilege to unpack a tools archive (it contains macOS symlinks we never use). Fix with either:

- Enable Windows **Developer Mode** (Settings → System → For developers), then rebuild; or
- Append `--config.win.signAndEditExecutable=false` to the electron-builder call — the exe then keeps Electron's default icon and version metadata. CI runners hold the privilege, so released builds are unaffected.

### What the desktop app does differently

| Behaviour | Detail |
|---|---|
| Server | Child process on port 3111, or the next free port if 3111 is taken |
| Data | `%APPDATA%\Uni-HOTAS` (config, overlays, backups, `desktop.log`) |
| Window | 1440×900, minimum 1024×700; external links open in your browser |
| Menu | **File → Open data folder**, reload / devtools, Help links |
| Shutdown | Closing the window stops the server; single instance only |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **DEMO MODE** banner stays on | Server not running, or running on the wrong port | Start `npm run serve`; confirm `http://localhost:3111/api/version` answers |
| Profiles list empty | Mappings folder not found | Use the **Controls folder** panel to pick it, or press Refresh |
| *Your saved folder is missing* | The folder you chose was moved or uninstalled | Pick a detected install, or choose a new folder |
| `EADDRINUSE :3111` | Something else is on 3111 | Stop the other process, or set `PORT` in `.env` |
| Blank page with no error when served by the API | `dist/` was built for GitHub Pages (`/Uni-HOTAS/assets/…`) | Use `npm run serve` (builds with base `/`); the server also logs a warning for this |
| Save fails with *Access denied* | Profile path outside the allowed mappings folder | The server refuses writes outside the configured folder by design |
| CORS error in the console | Using the hosted page with a local server | Use Option B |
