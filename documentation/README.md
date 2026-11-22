# Uni-HOTAS Documentation Hub

Everything needed to install, use and extend **Uni-HOTAS** — a Universal HOTAS App for Star Citizen and Squadron 42.

---

## Start here

| I want to… | Read |
|---|---|
| Install it | [Installation Guide](guides/INSTALL.md) |
| Use the mapping editor | [HOTAS Configuration Guide](developers/HOTAS-CONFIG-GUIDE.md) |
| Know what is planned | [Roadmap](guides/Uni-HOTAS-ROADMAP.md) |
| Work on the code | [Developer Reference](developers/DEVELOPER-REFERENCE.md) |
| Understand the codebase map | [Developer Map](developers/DEVELOPER-MAP.md) |
| Integrate with the API | [API Integration Guide](developers/API-INTEGRATION.md) |
| Report a problem | In-app **Feedback**, or [open an issue](https://github.com/FifeCIC/Uni-HOTAS/issues) |

---

## How it is put together

```
Browser UI (React)  ──HTTP──▶  Companion server (Express, localhost:3111)  ──▶  Game XML profiles
```

The UI can run from GitHub Pages, but **file access requires the companion server** running on the same machine. This split is why the installation guide has more than one option.

| Part | Where |
|---|---|
| React app (Vite root) | `app/` |
| Static assets, manifest, service worker | `public/` |
| Companion API | `server/` |
| Quality tooling | `scripts/` |
| Documentation | `documentation/` (this folder) |

---

## Documentation by type

### Guides
- [Installation Guide](guides/INSTALL.md) — hosted, local and (planned) Windows app
- [Roadmap](guides/Uni-HOTAS-ROADMAP.md) — what is next and what was cut

### Developer docs
- [Developer Reference](developers/DEVELOPER-REFERENCE.md) — architecture, routes, API surfaces
- [Developer Map](developers/DEVELOPER-MAP.md) — visual guide to the codebase
- [HOTAS Configuration Guide](developers/HOTAS-CONFIG-GUIDE.md) — profile handling and the mapping model
- [HOTAS Advanced User Mode](developers/HOTAS-ADVANCED-USER-MODE.md) — press-duration constraints and UX boundaries
- [API Integration Guide](developers/API-INTEGRATION.md) — backend endpoints and integration patterns
- [Security Guide](developers/SECURITY.md) — security policy and known limits
- [Media Library Guide](developers/MEDIA-LIBRARY-GUIDE.md) — hero and tool artwork
- [Content Markers Guide](developers/CONTENT-MARKERS-GUIDE.md) — documentation markers

---

## Documentation standards

- Standard Markdown, with fenced code blocks for commands.
- Relative links inside this folder.
- Write for someone who has never seen the project.
- When behaviour changes, change the doc in the same commit.

---

**Status**: Alpha V0.1.0