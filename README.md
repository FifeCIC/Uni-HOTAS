# Uni-HOTAS — Universal HOTAS App

![Status](https://img.shields.io/badge/status-alpha%200.1.0-orange)
![License](https://img.shields.io/badge/license-AGPL--3.0-blue)

> ## 🚧 Alpha — looking for its first users
>
> This is **alpha 0.1.0**. The HOTAS editor works end to end for **Star Citizen** and
> **Squadron 42**, and it has been used on one person's setup and hardware. That is the honest
> extent of the testing.
>
> **If you fly with a HOTAS, your feedback is the most useful thing you can give right now.**
> Bug reports, "this didn't work with my stick", a screenshot of something that looks wrong, or a
> note that an instruction made no sense — all of it is wanted, and all of it changes what gets
> built next. → **[Open an issue](https://github.com/FifeCIC/Uni-HOTAS/issues)** or use the
> **✉ Feedback** button in the app.

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

These are the titles with a built-in adapter today — **not a limit.** The peripheral engine is game-agnostic: adding a sim means adding an adapter, not rewriting the app. See [Other sims](#other-sims) and the in-app **Games & Extra Support** page at `/games`.

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

## What to expect from an alpha

Being straight about it, because a version number is not much of a warning on its own:

| | |
|---|---|
| **Works** | Reading a Star Citizen / Squadron 42 profile, browsing and sorting every binding, live input capture, rebinding and writing back to the XML, conflict detection, backups |
| **Rough** | One hardware overlay (the X52, 41 hand-positioned hotspots). Adapters for other sims are listed but not built. Layout and settings screens still get passes. |
| **Untested by anyone else** | Other sticks, throttles, pedals and yokes. If yours misbehaves, that is a bug report worth having rather than something you did wrong. |
| **Where bugs go** | [Issues](https://github.com/FifeCIC/Uni-HOTAS/issues) with what you did, what happened, and what you expected. A sample of your binding file helps enormously for anything profile-related. |

Nothing here is hidden inside the app either: a game without an adapter says so, and a build that
cannot reach the local server explains itself instead of showing an empty table.

---

## Status: alpha, HOTAS-only direction

This repository began life as **OmniCore**, a broader Star Citizen companion app. It has been forked here to become **Uni-HOTAS**, a focused HOTAS tool.

The non-HOTAS surfaces inherited from OmniCore — ship database, game settings, economy tracker, nav charts, the training academy and the Theme Lab — have been removed, along with the onboarding checklist and the developer API test page. What remains is the HOTAS tooling, the games list, and the developer documentation pages (`/developer`, `/developer/hotas-data-flow`).

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
npm run serve    # builds with base "/" then opens http://localhost:3111
```

**Development, two terminals** (hot reload):

```powershell
npm run server   # companion API on http://localhost:3111
npm run dev      # UI on http://localhost:5175 (proxies /api to :3111)
```

Then open `http://localhost:3111` (serve) or `http://localhost:5175` (dev), go to **HOTAS Config**, pick a profile, right-click a binding and press the input you want.

If the profiles list is empty, the **Controls folder** panel appears: it shows any install it detected (`LIVE`/`PTU`/`EPTU`), lets you pick the folder natively, and saves the choice to `%APPDATA%\Uni-HOTAS\config.json`.

### Option C — Windows app

A packaged build is produced from this repo — no separate project:

```powershell
npm install
npm run dist:win     # NSIS installer + portable exe in release/
```

| Command | What you get |
|---|---|
| `npm run pack:win` | `release\win-unpacked\Uni-HOTAS.exe` — fastest loop, no installer |
| `npm run dist:win` | `release\Uni-HOTAS-<version>-x64.exe` (installer, ~84 MB) and `-portable.exe` (~76 MB) |
| `npm run desktop` | Runs the app from the working tree (expects a previous `build:local`) |

Tagged builds (`v*`) run `.github/workflows/release-desktop.yml` and attach both exes to the GitHub release.

⚠️ **Building locally on Windows:** electron-builder extracts a tools archive containing macOS symlinks, which needs the **Create symbolic links** privilege. If the build stops with *"Cannot create symbolic link"*, either enable Windows **Developer Mode**, or append `--config.win.signAndEditExecutable=false` (the app then keeps Electron's default exe icon; CI builds are unaffected).

### Why installation is still manual

Two of the three original limits are now fixed; the third is what the Windows app work removes.

| Limit | Status |
|---|---|
| **The mappings folder was a fixed path** | ✅ Fixed — auto-detects `LIVE`/`PTU`/`EPTU`/`HOTFIX`, and the folder can be chosen in the app (saved to `%APPDATA%\Uni-HOTAS\config.json`) |
| **Hosted page could not call the server** | ✅ Fixed for local use — `npm run serve` serves the UI *from* the API, so there is no CORS and no second terminal |
| **No installer** | ✅ Fixed — `npm run dist:win` produces an NSIS installer and a portable exe; tagged builds publish them |

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
npm run dev      # Vite app on http://localhost:5175
npm run server   # Express API on http://localhost:3111
```

The dev server proxies `/api` to `http://127.0.0.1:3111`.

### Quality commands

```bash
npm run build                      # production frontend build (root base — servable by the local server)
npm run build:pages                # GitHub Pages build (/Uni-HOTAS/ base — CI only)
npm run check:bundle               # bundle budget check
npm run build:guard                # build + bundle budget
npm run check:hotas:mapping        # HOTAS mapping integrity
npm run check:hotas:mapping:strict # same, strict mode (CI gate)
npm run check:hotas:xml-rebind     # XML rebind regression suite
npm run lint                       # eslint
```

> ⚠️ `dist/` is shared by the local server, Electron packaging and the Pages build. Never leave a
> Pages build in `dist/` — it references `/Uni-HOTAS/assets/…`, which the local server does not
> serve, and the page goes blank white. The server now detects this and says so instead.

CI runs the strict mapping check and the XML rebind regression on every push and pull request (`.github/workflows/hotas-quality-gates.yml`).

### Key routes

| Route | Page |
|---|---|
| `/hotas-config` | HOTAS Config — the main mapping editor |
| `/settings/hotas` | Live input test lab |
| `/hotas-diagram` | Visual stick/throttle diagram |
| `/hotas-testing-routine` | Guided testing pass |
| `/games` | Games with extra built-in support |
| `/developer` | Developer tools and the Dev Mode switch |
| `/developer/hotas-data-flow` | Early technical documentation — how a bind travels through the pipeline |

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

## Licence

Uni-HOTAS is free software: you can redistribute it and/or modify it under the terms of the
**GNU Affero General Public License, version 3** as published by the Free Software Foundation — see
[LICENSE](LICENSE) for the full text.

Copyright (C) 2026 FifeCIC.

The AGPL is a strong copyleft licence and it is deliberately chosen here, because Uni-HOTAS has a
server component: **if you run a modified version of it and let other people use that version over a
network, you must offer them the complete corresponding source.** Running it for yourself carries no
such obligation.

It comes with **no warranty**, to the extent permitted by law. It is distributed in the hope that it
will be useful, but without even the implied warranty of merchantability or fitness for a particular
purpose.

Releases published before this licence change remain available under the terms they were published
with (MIT).

---

## Disclaimer

Uni-HOTAS is a fan-made, non-commercial project. Star Citizen® and Squadron 42® are trademarks of Cloud Imperium Rights LLC. Not affiliated with or endorsed by Cloud Imperium Games.

---

## Support

- ☕ [Buy Me a Coffee](https://buymeacoffee.com/ryanbayne)
- 💜 [GitHub Sponsors](https://github.com/sponsors/LOLinDark)

Built by [LOLinDark](https://github.com/LOLinDark), supported by [FifeCIC](https://fifecic.scot).