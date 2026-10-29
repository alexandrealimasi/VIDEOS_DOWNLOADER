// IPC handlers for download operations

import { ipcMain, BrowserWindow } from 'electron';
import { downloaderService } from '../services/downloader';
import { validateDownloadOptions } from '../security/input-validator';
import { isValidUrl } from '../security/url-validator';
import { PlaylistItem } from '../types';

export function registerDownloadHandlers(_mainWindow: BrowserWindow) {
  downloaderService.setMainWindow(_mainWindow);

  ipcMain.handle('start-download', async (_event, options: unknown) => {
    const validation = validateDownloadOptions(options);
    if (!validation.valid || !validation.data) {
      throw new Error(validation.error || 'Invalid download options');
    }

    const urlCheck = isValidUrl(validation.data.url);
    if (!urlCheck.valid) {
      throw new Error(urlCheck.reason || 'Invalid URL');
    }

    // Check for duplicates
    if (downloaderService.isDuplicate(validation.data.url, validation.data.formatId, validation.data.audioOnly)) {
      throw new Error('This download is already in progress');
    }

    const job = downloaderService.startDownload(validation.data);
    return { id: job.id };
  });

  ipcMain.handle('start-playlist-download', async (_event, options: unknown, items: unknown) => {
    const validation = validateDownloadOptions(options);
    if (!validation.valid || !validation.data) {
      throw new Error(validation.error || 'Invalid download options');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('No playlist items provided');
    }

    const validItems: PlaylistItem[] = items.filter(
      (it) => it && typeof it.url === 'string' && typeof it.title === 'string'
    );

    if (validItems.length === 0) {
      throw new Error('No valid videos found in playlist');
    }

    const jobs = downloaderService.startPlaylistDownload(validation.data, validItems);
    return { ids: jobs.map((j) => j.id) };
  });

  ipcMain.handle('pause-download', async (_event, id: string) => {
    if (typeof id !== 'string') throw new Error('Invalid ID');
    downloaderService.cancelDownload(id);
  });

  ipcMain.handle('resume-download', async (_event, id: string) => {
    if (typeof id !== 'string') throw new Error('Invalid ID');
    const job = downloaderService.retryDownload(id);
    if (!job) throw new Error('Cannot resume this download');
    return { id: job.id };
  });

  ipcMain.handle('cancel-download', async (_event, id: string) => {
    if (typeof id !== 'string') throw new Error('Invalid ID');
    const success = downloaderService.cancelDownload(id);
    if (!success) throw new Error('Download not found');
  });

  ipcMain.handle('retry-download', async (_event, id: string) => {
    if (typeof id !== 'string') throw new Error('Invalid ID');
    const job = downloaderService.retryDownload(id);
    if (!job) throw new Error('Cannot retry this download');
    return { id: job.id };
  });

  ipcMain.handle('remove-download', async (_event, id: string) => {
    if (typeof id !== 'string') throw new Error('Invalid ID');
    downloaderService.removeJob(id);
  });

  ipcMain.handle('clear-completed-downloads', async () => {
    downloaderService.clearCompleted();
  });

  ipcMain.handle('get-active-downloads', async () => {
    return downloaderService.getActiveDownloads();
  });
}
