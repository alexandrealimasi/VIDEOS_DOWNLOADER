// IPC handlers for media info extraction

import { ipcMain } from 'electron';
import { analyzeUrl, analyzePlaylist } from '../services/media-info';
import { isValidUrl, sanitizeUrl } from '../security/url-validator';

export function registerMediaHandlers() {
  ipcMain.handle('analyze-url', async (_event, url: unknown) => {
    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }

    const sanitized = sanitizeUrl(url);
    const validation = isValidUrl(sanitized);

    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid URL');
    }

    try {
      const info = await analyzeUrl(sanitized);
      return info;
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to analyze URL');
    }
  });

  ipcMain.handle('analyze-playlist', async (_event, url: unknown) => {
    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }

    const sanitized = sanitizeUrl(url);
    const validation = isValidUrl(sanitized);

    if (!validation.valid) {
      throw new Error(validation.reason || 'Invalid URL');
    }

    try {
      const info = await analyzePlaylist(sanitized);
      return info;
    } catch (error) {
      throw new Error((error as Error).message || 'Failed to analyze playlist');
    }
  });
}
