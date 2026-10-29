// IPC handlers for FFmpeg conversion and local media utilities

import { ipcMain, BrowserWindow, dialog, shell } from 'electron';
import * as path from 'path';
import { ffmpegService } from '../services/ffmpeg-service';
import { validateFfmpegConvertOptions } from '../security/input-validator';

export function registerFfmpegHandlers(mainWindow: BrowserWindow) {
  ffmpegService.setMainWindow(mainWindow);

  ipcMain.handle('convert-file', async (_event, options: unknown) => {
    const validation = validateFfmpegConvertOptions(options);
    if (!validation.valid || !validation.data) {
      throw new Error(validation.error || 'Options de conversion invalides');
    }

    const job = await ffmpegService.convertFile(validation.data);
    return { id: job.id };
  });

  ipcMain.handle('cancel-conversion', async (_event, id: string) => {
    if (typeof id !== 'string') throw new Error('ID invalide');
    const success = ffmpegService.cancelJob(id);
    if (!success) throw new Error('Conversion introuvable');
  });

  ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Sélectionner un fichier vidéo ou audio',
      properties: ['openFile'],
      filters: [
        { name: 'Fichiers multimédias', extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi', 'flv', 'wmv', 'mp3', 'm4a', 'wav', 'flac', 'opus', 'aac', 'ogg'] },
        { name: 'Vidéos', extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi', 'flv', 'wmv'] },
        { name: 'Audio', extensions: ['mp3', 'm4a', 'wav', 'flac', 'opus', 'aac', 'ogg'] },
        { name: 'Tous les fichiers', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('open-extension-folder', async () => {
    const extPath = path.join(__dirname, '../resources/extension');
    await shell.openPath(extPath);
  });
}
