// IPC handlers for settings, file operations, and system actions

import { ipcMain, dialog, shell, clipboard, app, BrowserWindow } from 'electron';
import Store from 'electron-store';
import * as path from 'path';
import { AppSettings } from '../types';
import { validateSettings } from '../security/input-validator';
import { isAllowedExternalUrl } from '../security/url-validator';
import { downloaderService } from '../services/downloader';

const DEFAULT_SETTINGS: AppSettings = {
  downloadPath: app.getPath('downloads'),
  maxConcurrentDownloads: 3,
  preferredFormat: 'mp4',
  preferredQuality: '1080p',
  audioOnly: false,
  theme: 'dark',
  autoLaunch: false,
};

const store = new Store<{ settings: AppSettings; history: Record<string, unknown>[] }>({
  defaults: {
    settings: DEFAULT_SETTINGS,
    history: [],
  },
});

export function getStore() {
  return store;
}

export function registerSettingsHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle('get-settings', async () => {
    const settings = store.get('settings', DEFAULT_SETTINGS);
    // Ensure downloadPath exists as a valid path
    if (!settings.downloadPath) {
      settings.downloadPath = app.getPath('downloads');
    }
    return settings;
  });

  ipcMain.handle('update-settings', async (_event, newSettings: unknown) => {
    const validation = validateSettings(newSettings);
    if (!validation.valid || !validation.data) {
      throw new Error(validation.error || 'Invalid settings');
    }

    const current = store.get('settings', DEFAULT_SETTINGS);
    const updated = { ...current, ...validation.data };
    store.set('settings', updated);

    // Apply maxConcurrent to the downloader
    if (validation.data.maxConcurrentDownloads !== undefined) {
      downloaderService.setMaxConcurrent(validation.data.maxConcurrentDownloads);
    }

    return updated;
  });

  ipcMain.handle('reset-settings', async () => {
    store.set('settings', DEFAULT_SETTINGS);
    downloaderService.setMaxConcurrent(DEFAULT_SETTINGS.maxConcurrentDownloads);
    return DEFAULT_SETTINGS;
  });

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Download Folder',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('open-file', async (_event, filePath: unknown) => {
    if (typeof filePath !== 'string') throw new Error('Invalid file path');
    // Ensure the path is absolute and doesn't traverse
    const resolved = path.resolve(filePath);
    const result = await shell.openPath(resolved);
    if (result) {
      throw new Error(`Failed to open file: ${result}`);
    }
  });

  ipcMain.handle('open-folder', async (_event, filePath: unknown) => {
    if (typeof filePath !== 'string') throw new Error('Invalid file path');
    const resolved = path.resolve(filePath);
    shell.showItemInFolder(resolved);
  });

  ipcMain.handle('get-default-download-path', async () => {
    return app.getPath('downloads');
  });

  ipcMain.handle('get-app-version', async () => {
    return app.getVersion();
  });

  ipcMain.handle('read-clipboard', async () => {
    const text = clipboard.readText();
    // Only return if it looks like a URL
    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
      return text.trim();
    }
    return '';
  });

  ipcMain.handle('set-auto-launch', async (_event, enable: unknown) => {
    if (typeof enable !== 'boolean') throw new Error('Invalid value');
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath,
    });
    const current = store.get('settings', DEFAULT_SETTINGS);
    store.set('settings', { ...current, autoLaunch: enable });
  });

  ipcMain.handle('open-external', async (_event, url: unknown) => {
    if (typeof url !== 'string') throw new Error('Invalid URL');
    if (!isAllowedExternalUrl(url)) {
      throw new Error('This URL is not in the allowed list');
    }
    await shell.openExternal(url);
  });
}
