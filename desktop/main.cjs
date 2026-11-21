/**
 * main.cjs — Electron entry point for the Uni-HOTAS desktop app.
 *
 * WHY THIS EXISTS: the browser build cannot touch the game's files, and asking a
 * player to run `npm run server` in a terminal is not an install. This process is a
 * shell around the same Express server the web build uses:
 *
 *   main.cjs  ──spawns──▶  server/index.js (as Node, not Electron)
 *      │                        │
 *      └──loads──▶ http://127.0.0.1:<port>/  ◀── serves dist/ (same origin, no CORS)
 *
 * Kept as CommonJS on purpose: the repo is "type": "module", and a .cjs entry is
 * guaranteed to load in every Electron version electron-builder targets.
 */
const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const { fork } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');

const APP_ID = 'com.fifecic.unihotas';
const PREFERRED_PORT = 3001;
const START_TIMEOUT_MS = 30000;

let mainWindow = null;
let serverProcess = null;
let serverPort = null;
let quitting = false;

function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(path.join(app.getPath('userData'), 'desktop.log'), `${line}\n`);
  } catch {
    // Logging must never take the app down.
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port, '127.0.0.1');
  });
}

async function pickPort() {
  if (await isPortFree(PREFERRED_PORT)) return PREFERRED_PORT;
  for (let port = PREFERRED_PORT + 1; port < PREFERRED_PORT + 40; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error('No free port found for the local server');
}

function waitForServer(port, deadline) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/version', timeout: 1500 }, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        return retry();
      });
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
    };

    const retry = () => {
      if (Date.now() > deadline) return reject(new Error('Local server did not start in time'));
      setTimeout(attempt, 250);
    };

    attempt();
  });
}

async function startServer() {
  const serverEntry = path.join(app.getAppPath(), 'server', 'index.js');
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Server entry not found at ${serverEntry}`);
  }

  serverPort = await pickPort();

  serverProcess = fork(serverEntry, [], {
    // ELECTRON_RUN_AS_NODE makes the packaged electron.exe behave as plain node.
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: String(serverPort),
      // Keep user data in the same place the installer/uninstaller leaves alone.
      UNIHOTAS_DATA_DIR: app.getPath('userData'),
    },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  serverProcess.stdout?.on('data', (chunk) => logLine(`server: ${chunk.toString().trimEnd()}`));
  serverProcess.stderr?.on('data', (chunk) => logLine(`server(err): ${chunk.toString().trimEnd()}`));

  serverProcess.on('exit', (code) => {
    logLine(`server exited with code ${code}`);
    serverProcess = null;
    if (!quitting) {
      dialog.showErrorBox(
        'Uni-HOTAS server stopped',
        `The local server exited (code ${code}).\n\nLog: ${path.join(app.getPath('userData'), 'desktop.log')}`
      );
      app.quit();
    }
  });

  await waitForServer(serverPort, Date.now() + START_TIMEOUT_MS);
  logLine(`server ready on port ${serverPort}`);
  return serverPort;
}

function stopServer() {
  if (!serverProcess) return;
  const child = serverProcess;
  serverProcess = null;
  try {
    child.kill();
  } catch {
    // Already gone.
  }
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0b1628',
    title: 'Uni-HOTAS',
    autoHideMenuBar: false,
    webPreferences: {
      // The renderer only needs to be a browser: no node, no preload bridge.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // External links (GitHub, RSI, Buy Me a Coffee) belong in the user's browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = `http://127.0.0.1:${port}`;
    if (!url.startsWith(allowed)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open data folder',
          click: () => shell.openPath(app.getPath('userData')),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Uni-HOTAS on GitHub', click: () => shell.openExternal('https://github.com/FifeCIC/Uni-HOTAS') },
        { label: 'Installation guide', click: () => shell.openExternal('https://github.com/FifeCIC/Uni-HOTAS/blob/main/documentation/guides/INSTALL.md') },
        { type: 'separator' },
        {
          label: 'About',
          click: () => dialog.showMessageBox({
            type: 'info',
            title: 'Uni-HOTAS',
            message: `Uni-HOTAS ${app.getVersion()}`,
            detail: `Universal HOTAS App for Star Citizen and Squadron 42.\n\nLocal server: http://127.0.0.1:${serverPort || '?'}\nData: ${app.getPath('userData')}`,
          }),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId(APP_ID);
    try {
      const port = await startServer();
      buildMenu();
      createWindow(port);
    } catch (error) {
      logLine(`startup failed: ${error.message}`);
      dialog.showErrorBox(
        'Uni-HOTAS could not start',
        `${error.message}\n\nLog: ${path.join(app.getPath('userData'), 'desktop.log')}`
      );
      app.quit();
    }
  });

  app.on('before-quit', () => {
    quitting = true;
    stopServer();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
