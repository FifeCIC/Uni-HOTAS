# Installation Guide

Uni-HOTAS is a browser app with a small local server that reads and writes the game's control files. That split is what makes installation worth a page.

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

```powershell
git clone https://github.com/FifeCIC/Uni-HOTAS.git
cd Uni-HOTAS
npm install
```

Open two terminals:

```powershell
npm run server   # companion API on http://localhost:3001
npm run dev      # UI on http://localhost:4242
```

Then open **http://localhost:4242**.

### First run checklist

| Step | Expected |
|---|---|
| `npm run server` prints `Server Alpha V0.1.0 running on port 3001` | Server up |
| App header shows **ONLINE** instead of **DEMO MODE** | UI found the server |
| **HOTAS Config** lists your `.xml` profiles | Mappings folder found |
| Right-click a binding, press an input, save | XML written, backup created |

### Optional configuration

Copy `.env.example` to `.env` in the project root. Nothing is required for HOTAS editing; the AI chat and Feedback email delivery are the only features that read keys.

---

## 4. Known limits

These are the three things that stop this from being a double-click install, and they are tracked in [issue #5](https://github.com/FifeCIC/Uni-HOTAS/issues/5):

| Limit | Symptom | Workaround today |
|---|---|---|
| Mappings path is fixed to `…\StarCitizen\LIVE\…` | Profiles list is empty on a custom install or PTU install | Install the game to the default path, or edit `STAR_CITIZEN_MAPPINGS_PATH` in `server/index.js` |
| Overlay data is saved inside the app folder | Fails if the app is placed in `Program Files` | Run from a user-writable folder |
| Hosted page cannot call the local server | Demo mode only | Use Option B (localhost:4242 is trusted; fifecic.github.io is not) |

---

## 5. Option C — Windows app (planned)

A packaged build removes Node, the terminal and the two-command dance. The plan and its trade-offs are in [issue #5](https://github.com/FifeCIC/Uni-HOTAS/issues/5). Nothing in this guide depends on it — Option B works today.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **DEMO MODE** banner stays on | Server not running, or running on the wrong port | Start `npm run server`; confirm `http://localhost:3001/api/version` answers |
| Profiles list empty | Mappings folder not found | Check the game is installed at the default path and that `<CHANNEL>` matches |
| `EADDRINUSE :3001` | Something else is on 3001 | Stop the other process, or set `PORT` in `.env` |
| Save fails with *Access denied* | Profile path outside the allowed mappings folder | The server refuses writes outside the configured folder by design |
| CORS error in the console | Using the hosted page with a local server | Use Option B |
