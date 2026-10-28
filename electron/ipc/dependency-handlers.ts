// IPC handlers for dependency detection

import { ipcMain } from 'electron';
import { checkAllDependencies, getInstallInstructions } from '../services/dependency-manager';

export function registerDependencyHandlers() {
  ipcMain.handle('check-dependencies', async () => {
    return await checkAllDependencies();
  });

  ipcMain.handle('install-dependency', async (_event, name: unknown) => {
    if (typeof name !== 'string') throw new Error('Invalid dependency name');
    // We do NOT auto-install binaries. We provide instructions.
    const instructions = getInstallInstructions(name);
    return { success: false, message: instructions };
  });
}
