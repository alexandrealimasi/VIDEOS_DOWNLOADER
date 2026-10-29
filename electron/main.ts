// Electron main process entry point

import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import { registerDownloadHandlers } from './ipc/download-handlers';
import { registerMediaHandlers } from './ipc/media-handlers';
import { registerSettingsHandlers } from './ipc/settings-handlers';
import { registerHistoryHandlers } from './ipc/history-handlers';
import { registerDependencyHandlers } from './ipc/dependency-handlers';
import { registerFfmpegHandlers } from './ipc/ffmpeg-handlers';
import { downloaderService } from './services/downloader';

// Register custom protocol for direct downloading from browser/extension
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('videograbber', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('videograbber');
}

// Handle single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let pendingExternalUrl: string | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function extractUrlFromProtocol(args: string[]): string | null {
  for (const arg of args) {
    if (arg.startsWith('videograbber://')) {
      try {
        const parsed = new URL(arg);
        const urlParam = parsed.searchParams.get('url');
        if (urlParam) return decodeURIComponent(urlParam);
        const direct = arg.replace(/^videograbber:\/\/(download\?url=)?/, '');
        if (direct) return decodeURIComponent(direct);
      } catch {
        const match = arg.match(/url=([^&]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
    }
  }
  return null;
}

// Extract any initial protocol URL
const initialUrl = extractUrlFromProtocol(process.argv);
if (initialUrl) {
  pendingExternalUrl = initialUrl;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'VideoGrabber Desktop',
    backgroundColor: '#0f0f13',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self'; " +
          "font-src 'self'; " +
          "object-src 'none'; " +
          "base-uri 'self';"
        ],
      },
    });
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    if (isDev && parsedUrl.hostname === 'localhost') return;
    if (parsedUrl.protocol === 'file:') return;
    event.preventDefault();
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Register IPC handlers
  registerDownloadHandlers(mainWindow);
  registerMediaHandlers();
  registerSettingsHandlers(mainWindow);
  registerHistoryHandlers();
  registerDependencyHandlers();
  registerFfmpegHandlers(mainWindow);

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (pendingExternalUrl && mainWindow) {
      mainWindow.webContents.send('external-url-received', pendingExternalUrl);
      pendingExternalUrl = null;
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('second-instance', (_event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    const externalUrl = extractUrlFromProtocol(commandLine);
    if (externalUrl) {
      mainWindow.webContents.send('external-url-received', externalUrl);
    }
  }
});

// macOS open-url event
app.on('open-url', (event, urlStr) => {
  event.preventDefault();
  const externalUrl = extractUrlFromProtocol([urlStr]);
  if (externalUrl) {
    if (mainWindow) {
      mainWindow.webContents.send('external-url-received', externalUrl);
    } else {
      pendingExternalUrl = externalUrl;
    }
  }
});

app.on('window-all-closed', () => {
  downloaderService.killAllProcesses();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  downloaderService.killAllProcesses();
});
