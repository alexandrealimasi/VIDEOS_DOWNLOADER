// Secure preload script - exposes a narrowly-scoped API to the renderer

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Dependency management
  checkDependencies: () => ipcRenderer.invoke('check-dependencies'),
  installDependency: (name: string) => ipcRenderer.invoke('install-dependency', name),

  // Media info
  analyzeUrl: (url: string) => ipcRenderer.invoke('analyze-url', url),

  // Downloads
  startDownload: (options: Record<string, unknown>) => ipcRenderer.invoke('start-download', options),
  pauseDownload: (id: string) => ipcRenderer.invoke('pause-download', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('resume-download', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('cancel-download', id),
  retryDownload: (id: string) => ipcRenderer.invoke('retry-download', id),
  getActiveDownloads: () => ipcRenderer.invoke('get-active-downloads'),

  // Download progress events - returns unsubscribe function
  onDownloadProgress: (callback: (data: Record<string, unknown>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: Record<string, unknown>) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => { ipcRenderer.removeListener('download-progress', handler); };
  },
  onDownloadComplete: (callback: (data: Record<string, unknown>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: Record<string, unknown>) => callback(data);
    ipcRenderer.on('download-complete', handler);
    return () => { ipcRenderer.removeListener('download-complete', handler); };
  },
  onDownloadError: (callback: (data: Record<string, unknown>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: Record<string, unknown>) => callback(data);
    ipcRenderer.on('download-error', handler);
    return () => { ipcRenderer.removeListener('download-error', handler); };
  },

  // History
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistoryItem: (item: Record<string, unknown>) => ipcRenderer.invoke('add-history-item', item),
  removeHistoryItem: (id: string) => ipcRenderer.invoke('remove-history-item', id),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: Record<string, unknown>) => ipcRenderer.invoke('update-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),

  // File system
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  openFolder: (filePath: string) => ipcRenderer.invoke('open-folder', filePath),
  getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Clipboard
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),

  // System
  setAutoLaunch: (enable: boolean) => ipcRenderer.invoke('set-auto-launch', enable),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
});
