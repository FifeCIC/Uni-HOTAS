# Uni-HOTAS Roadmap

**Alpha 0.1.0.** What is ticked below is what works today; what is open is what is honestly not
built yet. Priorities are set by what people report — if something missing matters to you,
[say so in an issue](https://github.com/FifeCIC/Uni-HOTAS/issues) rather than assuming it is
already planned.

## Installation & packaging — next priority

- [x] **Step 0 — same-origin serving**: Express serves the built `dist/`; `npm run serve` runs the whole app at `http://localhost:3111`
- [x] **Step 1 — configurable mappings path**: detects `LIVE` / `PTU` / `EPTU` / `HOTFIX`, native folder picker, user data in `%APPDATA%\Uni-HOTAS`
- [x] **Step 2 — Electron + electron-builder**: NSIS installer and portable `.exe`, built in GitHub Actions on tag
- [ ] **Step 3 — code signing and auto-update**

Tracked in [#5](https://github.com/FifeCIC/Uni-HOTAS/issues/5). See [Installation Guide](INSTALL.md) for the current options.

## Active HOTAS work

- [ ] [#1 HOTAS overlay — grouped hotspots](https://github.com/FifeCIC/Uni-HOTAS/issues/1)
- [ ] [#2 Mode flow cheatsheet in the feature library](https://github.com/FifeCIC/Uni-HOTAS/issues/2)
- [ ] [#3 Isolate HOTAS-only UI surfaces from the shared app path](https://github.com/FifeCIC/Uni-HOTAS/issues/3)
- [ ] [#4 Binding helpsheet generator — PDF export and desktop wallpaper](https://github.com/FifeCIC/Uni-HOTAS/issues/4)

## Site

- [x] Open Graph / Twitter meta tags on the app shell
- [ ] Landing copy and screenshots that show a real HOTAS session
- [ ] Demo GIF of a rebind (capture → save → XML change)
- [ ] Wiki home page (enabled, first page not yet created)

## Branding & identity

- [ ] **Animated hexagon logo** — replace the placeholder mark; must work as PWA icon, GitHub Pages mark and social preview

## Done

- [x] Fork OmniCore and rebrand as **Uni-HOTAS** (Universal HOTAS App)
- [x] Remove ship database, game settings, economy tracker, nav charts and training academy
- [x] Remove ship tooling (loadout builder, ship-class profile variants)
- [x] Remove Aerobook and its media pipeline
- [x] Rename VerseMail to **Feedback**