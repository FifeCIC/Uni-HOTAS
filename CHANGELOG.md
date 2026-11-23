# Changelog

All notable changes to Uni-HOTAS will be documented in this file.

---

## [Unreleased] — retired pages

### Removed

- **Onboarding checklist** (`/onboarding`) — page, `useOnboardingStore`, `onboardingChecklist` data and
  the `ChecklistSection` component it was the only user of.
- **Academy** (`/academy`, `/academy/feature-library`, `/academy/:track`) — page and data-driven
  feature library. The "Details" link on every bind row pointed at it and is gone; the bind data
  itself (`trainingAcademyFeatureNotes`) stays because the config page shows its training notes.
- **Theme Lab** — `/theme`, `/theme/star-citizen`, `/theme/squadron-42`,
  `/theme/placeholder-samples`, `/theme/hotas-test`, plus the `/settings/theme` token editor,
  `app/pages/theme/`, `app/theme/themeLabStandard.js`, the sidebar link and the `customTheme`
  settings fields.
- **API test page** (`/developer/api-test`) — page, dev tag `DEV03`, context entry and its card on
  `/developer`.
- **Analytics card** on `/developer` ("View usage statistics"), which pointed at a route
  (`/admin/analytics`) that does not exist.

Old links redirect to `/` rather than 404.

### Changed

- **Technical documentation is now in the main menu.** `☰ Menu` carries a *Technical documentation*
  section: **📘 Developer Docs & Tools** (`/developer`) and **🔀 HOTAS Data Flow**
  (`/developer/hotas-data-flow`) — the early docs the project is keeping.

---

## [Unreleased] — hotspot editing is reachable

### Fixed

- **Hotspot editing could not be enabled in the shipped app.** The overlay card gates its
  `Enable Resize/Drag` / `Disable Resize/Drag + Save` controls on "dev mode", and that flag was
  read from Vite's build-time `import.meta.env` — which is always `production` for the bundle
  Express serves on `:3111`, and `DEVELOPMENT_MODE` is never defined for Vite (it is not
  `VITE_`-prefixed, and `.env` sits outside Vite's `app/` root). So the controls existed but no
  switch could ever reveal them.
  - Dev mode is now `isDevBuild || <the Dev Mode switch>`, resolved once in
    `app/utils/devMode.js`. Enable it at **`/developer` → sidebar → Dev Mode**, and the overlay
    on **Peripheral Config** becomes draggable/resizable.
  - The Admin Panel menu item is no longer hidden behind `rsiHandle === 'LOLinDark'` (that gate
    outlived the login page it belonged to), so `/developer` is reachable from the header menu.
  - The Dev Mode switch now says what it unlocks.

---

## [Unreleased] — menu navigation on Peripheral Config

### Fixed

- **Menu items now navigate even from `/hotas-config`.** Two page-specific causes were removed:
  - Detaching the Live Input panel hoisted the **whole overlay and assignment table** into a
    `position: fixed`, full-viewport layer (the panel card accepts the page as children, and the
    floating/window branches rendered them inside it). Detached mode is persisted in
    `localStorage`, so it came back on every visit. Children now always stay in page flow; only
    the compact readout card floats, is pointer-transparent outside its own box, and sits below
    app chrome.
  - Arming a keyboard binding installs a capture-phase `mousedown` listener on `window` that
    consumed the press for the 3-second capture window, so a click on app chrome bound a stray
    mouse button and never reached the menu. A press on chrome (header, menu, dialog, tooltip) now
    **cancels** the capture instead.

### Changed

- Header menu items are real anchors (`<Link>`), so navigation survives a disturbed event path and
  middle-click / open-in-new-tab work.

---

## [Unreleased] — AI support removed

### Removed

- **All AI features are gone.** UNI-HOTAS does not use an AI provider, so the Gemini and AWS
  Bedrock integrations, the chat endpoints and their admin surfaces have been deleted rather than
  left switched off.
  - Settings loses the **AWS & Costs** tab (cost alert threshold and Bedrock pricing calculator)
    and the **AI Provider** selector.
  - The shell loses the AI status pill, the Claude/Gemini chat links, and the usage/cost and
    rate-limit panels in the admin sidebar.
  - The developer API test page loses the Gemini and Rate Limits tabs.
  - Server routes `POST /api/gemini`, `GET /api/gemini/models`, `POST /api/chat`, `POST /api/model`,
    `GET /api/usage`, `GET /api/rate-limits`, `GET /api/pricing` and `POST /api/pricing/calculate`
    are removed, along with the AI request counters they reported.
- **Dependencies removed:** `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-qbusiness` and
  `@google/generative-ai` (89 packages pruned).
- **Env keys removed:** `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `QBUSINESS_APPLICATION_ID`, `GEMINI_API_KEY`, `MAX_DAILY_REQUESTS`, `MAX_HOURLY_REQUESTS` and
  `COST_ALERT_THRESHOLD`.
- `GET /api/version` no longer reports `projectHours`/`lastActive`, which were derived from AI
  requests.

The Star Citizen profile lookup, RSI starmap proxy, HOTAS profile/mappings endpoints, backup sync,
error logging and app analytics are unchanged.

---

## [Unreleased] — multi-game shell & HOTAS config layout

### Changed

- **The shell is no longer Star Citizen-branded.** The header reads **Created by LOLinDark** ·
  UNI-HOTAS · **version**, and the version pill in the top-left is gone.
- **The second toolbar bar is removed entirely.** Feedback now sits in the header beside the game
  selector; the `+ Links`, HOTAS Test Guide and Games entries go with the bar.
- **Login is removed.** `/login`, the login page, the **Sign in** button, the sign-out action and
  the `welcomeCompleted` gate are all gone. Unknown routes return to the dashboard.
- **New `/games` page** lists the titles with extra built-in support and the planned adapters, and
  says explicitly that any game with a readable binding profile can be supported. RSI links use
  the project's referral URL.
- **Quick game selector** in the header switches the active title. The choice persists and decides
  which controls folder the app reads.
- **Controls folders are stored per game** — `gameMappings` in `%APPDATA%\Uni-HOTAS\config.json`,
  with `activeGame` selecting which one the profile endpoints use. New
  `GET`/`POST /api/hotas/active-game`.
- **HOTAS config header compacted**: the four controls fit one row, Reload is a square icon
  button, the "Configure your flight stick…" line is removed, and the Groups label and
  description sit inline.
- **A game with no profile adapter** now gets an explicit notice and no bindings table, instead
  of its files being parsed by the Star Citizen adapter.
- **POV hotspots tidied.** The three four-way POV hats on the overlay are now even crosses with a
  connector bar, and all twelve POV circles share one size (5%). Each group's centre is unchanged,
  so nothing moved more than ~1% of the image.

### Fixed

- **A blank white page no longer happens silently, and can no longer be caused locally.**
  `dist/` is shared by the local server, Electron and the Pages deploy, but the Pages build uses a
  `/Uni-HOTAS/` base — leaving one in `dist/` made `localhost:3111` load no JavaScript and show a
  blank page with no error. Two changes:
  - **`npm run build` is now the root-base build** (servable locally and packagable by Electron).
    The Pages base moved to **`npm run build:pages`**, which is what `.github/workflows/deploy-pages.yml`
    now runs. `vite.config.js` no longer switches base on `command === 'build'`.
  - the server verifies that the entry `<script src>` in `dist/index.html` exists on disk and, when
    it does not, answers with a page naming the offending path and the fix instead of serving an
    index.html that cannot boot. The check is generic, so a renamed repo or any other base is caught.
- Dropped the hard-coded "Star Citizen mappings folder" wording from the API error and first-run
  panel.
- **Hotspot clicks now do something.** Clicking a circle on the HOTAS overlay highlights that
  physical input in the assignment table, jumps to the page holding it and scrolls it into view;
  clicking the same circle again clears it. Before, the circles were decorative — the only handler
  was an `alert()` on the un-routed dev overlay page.
- **Hovering a row lights its hotspot.** Rows in the X52 Input Assignment Table now tint on hover and
  light the matching circle on the HOTAS overlay (glow + outer ring), the reverse of the click
  behaviour. Matching uses the same resolved `type + index`, so Short and Long rows light the same
  physical button.
- **Assignment table scrolls inside its own frame, with a sticky header.** The table area is capped
  so its bottom lines up with the bottom of the HOTAS photo beside it (measured, not hard-coded),
  and the column headers stay pinned while the rows scroll.

---

## [Unreleased] — the real cause of the blank page

### Fixed

- **`t.map is not a function` on `/hotas-config`** — the overlay loader fetched
  `/api/hotas-overlay-positions` and passed the body straight to `jsonc-parser.parse()`. On a
  static host that path is not the API: GitHub Pages answers with its 404 HTML, and
  **`parse()` returns `undefined` for invalid input rather than throwing**, so the overlay array
  was replaced with `undefined` about 200 ms after mount and the next `overlays.map(...)` threw.
  That is why the page painted and then went blank.
  - the loader now ignores a non-OK response and validates `Array.isArray(parsed)` before setting state
  - `useHotasOverlayState().setOverlays` refuses a non-array, so no caller can reintroduce it
  - the bundled X52 layout is now the initial state, so the demo build shows hotspots instead of none

Verified against a deliberately hostile static host that answers `/api/*` with `200` + HTML: the
page renders and stays up, with no `t.map` error in the console.

---

## [Unreleased] — crash visibility

### Fixed

- **A failed lazy chunk no longer blanks the app.** A deploy replaces every hashed chunk; a
  browser still holding the previous `index.html` asks for a file that no longer exists, the
  dynamic import rejects, and with no error boundary React unmounted the whole tree — the app
  painted for a moment, then went to a flat background with no message. Two changes:
  - **`AppErrorBoundary`** wraps `<App />` and renders the error, its message, and a reload
    button instead of an empty page.
  - **`lazyWithRetry`** reloads once automatically when a chunk fails to load (guarded by a
    60-second `sessionStorage` window so a genuinely broken build cannot reload-loop).
- **Service-worker cache bumped to `uni-hotas-v10`**, so the activate handler purges the previous
  cache instead of serving an old chunk after an update.

Reproduced deliberately: deleting one page chunk from `dist/` and loading its route produced
`TypeError: Failed to fetch dynamically imported module` → one reload → the boundary, with the
message and both buttons.

---

## [Unreleased] — install guidance on the hosted demo

### Changed

- **"Server required" notice now offers two paths, joined by an OR** — on GitHub Pages,
  `/hotas-config` previously told a visitor to clone the repo and run `npm run server`, which is
  the developer answer to a player's question. It now shows **Windows installer** (download from
  Releases, run it, no Node.js) beside **Run from source**, with an **OR** between them. Each
  option is a panel and the OR is the middle flex child, so wide screens get two columns and
  narrow screens keep the installer → OR → source order.
- **Demo-mode banner links the installer** — its "Want to run it fully?" line now points at
  `releases/latest` before the clone instruction, so the global banner and the page notice agree.
- Small-text contrast raised from `rgba(255,255,255,0.4)` to `0.62` in the notice, for AA.

---

## [Unreleased] — Windows app

### Added

- **Electron desktop shell** (`desktop/main.cjs`) — starts the Express server as a child process on 3111 (or the next free port), waits for it, then loads the app from that origin. Single instance, external links open in the browser, closing the window stops the server, and everything is logged to `%APPDATA%\Uni-HOTAS\desktop.log`.
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

- **`npm run serve`** — builds the app with base `/` and serves it from the companion API, so the whole app runs at `http://localhost:3111` with no CORS and no second terminal.
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
