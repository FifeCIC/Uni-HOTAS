# Uni-HOTAS — Universal HOTAS App

![Status](https://img.shields.io/badge/status-alpha%200.1.0-orange)
![License](https://img.shields.io/badge/license-MIT-green)

> **One setup. Every stick.**

**Uni-HOTAS** is a **Universal HOTAS Config** tool for PC flight sims. Load your game's control profile, map every axis, button and hat in a visual editor, capture real input from your hardware, and write the result straight back to the game's own mapping files — with backups and conflict detection.

It is built as a **Universal HOTAS Setup** because the engine under it is not tied to one title: bindings are read, merged and written through a profile format, so adding a sim means adding an adapter, not rewriting the app.

> **Uni-HOTAS Mapping** and the browser app are the same thing: a **Universal HOTAS App** that runs in your browser, installs as a PWA, and can talk to a small local companion server when it needs file access.

---

## Directly supported games

| Game | Status | Mapping format |
|---|---|---|
| **Star Citizen** | Supported | `actionmaps.xml` (device-aware read/write) |
| **Squadron 42** | Supported | Same Star Citizen input system |

These are the first two directly supported titles. The peripheral engine is game-agnostic — see [Other sims](#other-sims).

---

## What's inside

| Tool | Description |
|---|---|
| **HOTAS Config (HC05)** | Load a Star Citizen `actionmaps.xml`, browse every binding by device and action, right-click any row to rebind, and export back to XML |
| **Live input capture** | Press a key or move a stick axis and watch it register — no guessing which button is which |
| **Device-aware upsert** | Rebinding a keyboard key will not clobber a HOTAS binding for the same action, and vice versa |
| **Duplicate-binding detection** | Flags two actions fighting over the same input before it reaches the game |
| **Mode profiles** | Multi-mode sticks (e.g. the X52 three-position switch) can carry separate bindings per mode |
| **HOTAS overlay** | A visual stick/throttle diagram with hotspots you can arrange and map |
| **Testing routine** | A guided pass through the controls so nothing is left unverified |
| **Binding helpsheet** | A printable / wallpaper reference of your own binds |
| **Feature library** | Mode vs action bind explainers (NAV/SCM, missile mode vs launch, weapon groups) |

### Other sims

The engine reads and writes bindings through a profile format, so any title with editable binding files is a candidate: **DCS World**, **Elite Dangerous**, **Microsoft Flight Simulator**, **X-Plane**, **IL-2 Sturmovik**.

Supporting a new sim is real work — a profile-format adapter plus a per-sim data set, not a config flag. Interest decides what is built next: open an issue and say what you fly.

---

## Status: alpha, HOTAS-only direction

This repository began life as **OmniCore**, a broader Star Citizen companion app. It has been forked here to become **Uni-HOTAS**, a focused HOTAS tool.

The non-HOTAS surfaces inherited from OmniCore — ship database, game settings, economy tracker, nav charts and the training academy — have been removed. The HOTAS feature library remains as the bind reference.

---

## Use it

- **App (GitHub Pages)**: [fifecic.github.io/Uni-HOTAS](https://fifecic.github.io/Uni-HOTAS/)
- **Source**: [github.com/FifeCIC/Uni-HOTAS](https://github.com/FifeCIC/Uni-HOTAS)
- **Issues**: [github.com/FifeCIC/Uni-HOTAS/issues](https://github.com/FifeCIC/Uni-HOTAS/issues)

### Requirements

| Need it for | Requirement |
|---|---|
| Real binding edits | Windows 10/11, with Star Citizen or Squadron 42 installed |
| The hosted app | Any modern browser (Chrome, Edge, Firefox) |
| Running it from source | Node.js 20+ |

### Option A — Hosted app (no install)

Open **https://fifecic.github.io/Uni-HOTAS/**. It installs as a PWA (browser menu → *Install app*).

The hosted build is **demo mode**: it can browse the interface, but it cannot read your game folder. File access needs the local companion server (Option B), so today the hosted build is for exploring and for the feature library.

### Option B — Run locally

**One command** (builds the app and serves everything from one port):

```powershell
npm install
npm run serve    # builds with base "/" then opens http://localhost:3001
```

**Development, two terminals** (hot reload):

```powershell
npm run server   # companion API on http://localhost:3001
npm run dev      # UI on http://localhost:4242 (proxies /api to :3001)
```

Then open `http://localhost:3001` (serve) or `http://localhost:4242` (dev), go to **HOTAS Config**, pick a profile, right-click a binding and press the input you want.

If the profiles list is empty, the **Controls folder** panel appears: it shows any install it detected (`LIVE`/`PTU`/`EPTU`), lets you pick the folder natively, and saves the choice to `%APPDATA%\Uni-HOTAS\config.json`.

### Option C — A packaged Windows app (planned)

A one-click Windows build is the next installation milestone — see [Why installation is manual today](#why-installation-is-manual-today) and [issue #5](https://github.com/FifeCIC/Uni-HOTAS/issues/5).

### Why installation is still manual

Two of the three original limits are now fixed; the third is what the Windows app work removes.

| Limit | Status |
|---|---|
| **The mappings folder was a fixed path** | ✅ Fixed — auto-detects `LIVE`/`PTU`/`EPTU`/`HOTFIX`, and the folder can be chosen in the app (saved to `%APPDATA%\Uni-HOTAS\config.json`) |
| **Hosted page could not call the server** | ✅ Fixed for local use — `npm run serve` serves the UI *from* the API, so there is no CORS and no second terminal |
| **No installer** | ⏳ Needs Node.js and a terminal — that is what [#5](https://github.com/FifeCIC/Uni-HOTAS/issues/5) packages |

### Getting started with the editor

1. Start the companion server (Option B) so the app can see your profiles.
2. Open **HOTAS Config**, pick your profile, right-click a binding, and press the input you want.
3. Export back to XML, and keep the backup the app writes for you.

---

## For contributors

### Tech stack

- **Frontend**: React 18, Vite 7, Mantine 8, React Router, Zustand, TanStack Query
- **Visual systems**: Arwes + custom sci-fi UI components
- **Backend**: Express 5, Helmet, CORS, rate limiting
- **Profile engine**: `fast-xml-parser`, `jsonc-parser`

### Local development

```bash
npm install
npm run dev      # Vite app on http://localhost:4242
npm run server   # Express API on http://localhost:3001
```

The dev server proxies `/api` to `http://127.0.0.1:3001`.

### Quality commands

```bash
npm run build                      # production frontend build
npm run check:bundle               # bundle budget check
npm run build:guard                # build + bundle budget
npm run check:hotas:mapping        # HOTAS mapping integrity
npm run check:hotas:mapping:strict # same, strict mode (CI gate)
npm run check:hotas:xml-rebind     # XML rebind regression suite
npm run lint                       # eslint
```

CI runs the strict mapping check and the XML rebind regression on every push and pull request (`.github/workflows/hotas-quality-gates.yml`).

### Key routes

| Route | Page |
|---|---|
| `/hotas-config` | HOTAS Config — the main mapping editor |
| `/settings/hotas` | Live input test lab |
| `/hotas-diagram` | Visual stick/throttle diagram |
| `/hotas-testing-routine` | Guided testing pass |
| `/academy/feature-library` | Mode vs action bind explainers |

### API surfaces (companion server)

| Endpoint | Description |
|---|---|
| `GET /api/hotas/profiles` | Enumerate profile files |
| `GET /api/hotas/profile/:name` | Load a profile XML |
| `POST /api/hotas/profile/:name/bindings` | Persist captured bindings to XML |
| `POST /api/hotas/open-folder` | Open the mappings folder in Explorer (Windows) |
| `GET /api/hotas/mappings-path` | Current folder, how it was resolved, detected installs |
| `POST /api/hotas/mappings-path` | Save a folder (`{ "path": "…" }`) |
| `POST /api/hotas/pick-folder` | Native Windows folder picker, then saves the choice |
| `GET·POST /api/hotas-overlay-positions` | Read/save overlay layout (stored under `%APPDATA%`) |

### Project structure

```
Uni-HOTAS/
├── app/                 ← React PWA (Vite root)
├── public/              ← Static assets, manifest, service worker
├── server/              ← Express companion API
├── documentation/       ← Guides and developer reference
├── scripts/             ← Build and integrity tooling
├── vite.config.js
└── package.json
```

**→ Documentation hub: [documentation/README.md](documentation/README.md)**

---

## Disclaimer

Uni-HOTAS is a fan-made, non-commercial project. Star Citizen® and Squadron 42® are trademarks of Cloud Imperium Rights LLC. Not affiliated with or endorsed by Cloud Imperium Games.

---

## Support

- ☕ [Buy Me a Coffee](https://buymeacoffee.com/ryanbayne)
- 💜 [GitHub Sponsors](https://github.com/sponsors/LOLinDark)

Built by [LOLinDark](https://github.com/LOLinDark), supported by [FifeCIC](https://fifecic.scot).