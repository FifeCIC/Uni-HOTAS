# Changelog

All notable changes to Uni-HOTAS will be documented in this file.

---

## [Unreleased] — Windows app

### Added

- **Electron desktop shell** (`desktop/main.cjs`) — starts the Express server as a child process on 3001 (or the next free port), waits for it, then loads the app from that origin. Single instance, external links open in the browser, closing the window stops the server, and everything is logged to `%APPDATA%\Uni-HOTAS\desktop.log`.
- **`npm run dist:win`** — NSIS installer (~84 MB) and portable exe (~76 MB) via electron-builder (`electron-builder.yml`).
- **`npm run pack:win`** — unpacked build for quick testing.
- **`scripts/generate-icon.mjs`** — draws the hexagon mark and writes `desktop/assets/icon.png` + `icon.ico` (no rasteriser dependency).
- **`.github/workflows/release-desktop.yml`** — builds both targets on Windows runners; attaches them to a GitHub release on `v*` tags.
- **`author`** in package.json, so electron-builder stops warning.

### Changed

- **Dependencies split** — only the eight packages the server imports (`express`, `cors`, `helmet`, `express-rate-limit`, `dotenv`, `nodemailer`, `@aws-sdk/client-bedrock-runtime`, `@google/generative-ai`) stay in `dependencies`. Everything the app bundles at build time moved to `devDependencies`, which is what keeps the installer at ~84 MB instead of shipping React twice.
- README and INSTALL now document the desktop build, the artifacts, and the local symlink-privilege workaround.

---

## [Unreleased] — one-command install

### Added

- **`npm run serve`** — builds the app with base `/` and serves it from the companion API, so the whole app runs at `http://localhost:3001` with no CORS and no second terminal.
- **Controls folder discovery** — the server auto-detects `LIVE` / `PTU` / `EPTU` / `HOTFIX` installs, and `GET·POST /api/hotas/mappings-path` plus `POST /api/hotas/pick-folder` let the UI show and change the folder. A saved folder that disappears is reported, not silently swapped.
- **Mappings folder panel** in HOTAS Config (on load failure) and Settings.
- **`GET /api/hotas-overlay-positions`** — the client now reads saved overlay positions from the API instead of a static path that 404'd.

### Changed

- **User data moved to `%APPDATA%\Uni-HOTAS`** — overlay positions, backups and the mappings-folder choice no longer live inside the app folder (required for any packaged build).
- Server identity JSON moved from `/` to `/api`; `/` now serves the app.
- `/api/hotas/profiles` returns **409 `MAPPINGS_NOT_CONFIGURED`** with detected candidates instead of a bare 404.

### Removed

- The dead `/api/game/settings` endpoint and its category helper (feature already removed).
- The `game-settings` source from backup sync.

---

## [Unreleased] — Ships out, Aerobook out, VerseMail now Feedback

### Removed

- **All ship tooling** — Loadout Builder page and route, ship-class selector in the profile matrix lab, ship-branch academy data, `shipImage` profile-card overlay, and the remaining ship tasks in the dev context.
- **Aerobook** — gallery page, post card, media feed store and content, plus the YouTube/Twitch/media providers, `/api/media` routes, live-follow store and remote image cache that existed to feed it.

### Changed

- **VerseMail → Feedback** — the toolbar button, modal, form copy and server API (`/api/versemail/*` → `/api/feedback/*`) are renamed. The API still creates a GitHub issue for bugs and emails contact messages.
- The toolbar is now `AppToolbar` (HOTAS test guide, Feedback, official links) and no longer polls a media feed.

---

## [Unreleased] — HOTAS-only strip

### Removed

- **Ship Database** — page, ship artwork/pricing/role data, `/api/ships` server routes, image caches (~20 MB of assets).
- **Game Settings** — page and route.
- **Economy Tracker** — page and route.
- **Nav Charts** — location guide page, developer nav-charts lab, related screenshots.
- **Training Academy** — academy hub and new-player guide tracks. The HOTAS **feature library** (`/academy/feature-library`) is retained as a bind reference.
- Old routes redirect to `/` (or `/academy/feature-library`) so existing links do not 404.

---

## [Unreleased] — Uni-HOTAS fork

### Changed

- Forked from OmniCore (`FifeCIC/StarCitizen-OmniCore`) to become **Uni-HOTAS**, a HOTAS-focused tool for Star Citizen and Squadron 42.
- Rebranded app shell, PWA manifest, service worker cache and GitHub Pages base path to `/Uni-HOTAS/`.
- README rewritten around the Universal HOTAS App / Setup / Config / Mapping identity.
- Application storage keys and event names migrated from `omnicore.*` to `unihotas.*`.

### Notes

- Non-HOTAS surfaces inherited from OmniCore (ship database, social feed) remain present and are scheduled for removal.

---

## [Alpha 0.1.0] - 2026-04-22

### Added

**Core App**
- MobiGlass-inspired dark UI with cyan accent theming
- Sticky header with game branding (Star Citizen / Squadron 42)
- Status indicators: IN-DEV, ONLINE/OFFLINE, BACKUP status
- Bookmarks bar with Aerobook, Live, VerseMail, and official RSI links
- App-wide footer with creator attribution and CIG disclaimer
- "Made By The Community" badge
- Admin panel access for LOLinDark via user menu
- PWA manifest and service worker for installability

**HC05 — Peripheral Configuration (HOTAS/KBM)**
- Load and parse Star Citizen XML profile files directly
- Profile card scroller with colour-coded cards and game mode icons
- Sidecar `.omnicore.json` metadata for profiles (label, description, colour, game mode)
- Two table views: "Features → Inputs" and "HOTAS Inputs → Features"
- Live HOTAS input detection via Gamepad API (Logitech X52 device mapping)
- Live Input panel with minimise, detach, and pop-out-to-window modes
- Search by Live Input toggle (filter table by pressing HOTAS buttons)
- Right-click to capture HOTAS or keyboard/mouse bindings
- Captured bindings persist directly to the game's XML profile
- Conflict detection when assigning duplicate bindings
- Unified profile filter: All, HOTAS Assigned, HOTAS Empty, KB/M Assigned, KB/M Empty, Fully Unbound
- Category filter with description display
- View switcher with binding count
- X52 mode switch support (3 modes × all inputs)
- Clickable "Assigned Feature" column in HOTAS Inputs view for inline assignment
- AI-generated X52 Optimal profile (built-in)
- Session state persistence to localStorage

**GT05 — Ship Database**
- Full ship roster from RSI API with server-side caching
- Sortable columns, search, manufacturer/size/role filters
- Column visibility picker
- Expandable row with quick specs and thumbnail
- Full dossier modal with YouTube embed, image gallery, specifications, and lore
- Ship artwork backgrounds on row selection
- Pagination
- Curated YouTube video mapping for ship commercials

**APP01 — Game Settings**
- Reads Star Citizen `attributes.xml` directly
- Searchable table of all in-game settings
- Auto-categorisation (Audio, Graphics, Display, Flight, Head Tracking, etc.)
- Modified/Default filter to highlight player changes

**Aerobook — Media Feed**
- YouTube channel feed (RSI official)
- Twitch VOD feed (Star Citizen channel)
- Squadron 42 playlist feed
- Featured video with inline playback
- Hover-to-preview on video cards
- Category tabs (Star Citizen / Squadron 42 / LIVE)
- New video indicator on bookmarks bar
- Live stream monitoring with transition alerts
- Follow streamers across Twitch/YouTube/Kick/Steam

**VerseMail**
- Contact form with email delivery via SMTP
- Bug report form with GitHub Issues integration

**Backup System**
- Configure a local backup folder (Google Drive / OneDrive / Dropbox sync folder)
- Syncs HOTAS profiles + game settings on demand
- Header status pill shows backup readiness
- Incremental sync (only copies changed files)

**Developer Tools**
- Developer Panel (draggable, minimisable, route navigator)
- API test page
- Nav Charts lab
- HOTAS modes lab and profile matrix lab
- Error log viewer
- Changes tracker
- Analytics dashboard
- Rate limit monitor
- Gemini AI chat interface
- Context index page

**Infrastructure**
- React 18 + Vite frontend
- Express 5 backend with Helmet, CORS, rate limiting
- YouTube RSS feed parser (no API key required)
- Twitch scraper for VODs and live status
- Ship data aggregation with image cache warming
- Google Gemini integration (free tier)
- AWS Bedrock integration (optional)
- Bundle splitting (Mantine, Arwes, vendor, query)

---

## [Unreleased]

### Added
- HOTAS demo mode support for live display flows
- Server-required UX components for pages that depend on backend availability

### Changed
- HOTAS groups filtering now supports merged play-mode groups and categories in one control
- HOTAS filter persistence now migrates legacy saved category selections into the merged groups model
- Frontend bundle chunking strategy refined to reduce broad vendor coupling and improve route-split loading behavior
- Build output cleanup improved by clearing the out-of-root dist directory on build

### Removed
- Legacy HOTAS modes lab page and its redundant client/server route surfaces
- Deprecated HOTAS modes route registration and unused modes client helpers

### Planned
- Feature explanation column (hideable, with YouTube tutorial links)
- Keyboard usage counter (top 5 most-pressed keys)
- Game settings editor (write back to attributes.xml)
- GitHub Gist backup option
- Profile version history
- StreamerOps integration
