import type { MediaInfo, DownloadOptions, DownloadJob, HistoryItem, AppSettings, DependencyInfo } from '../types';

export interface ElectronAPI {
  checkDependencies: () => Promise<DependencyInfo[]>;
  installDependency: (name: string) => Promise<{ success: boolean; message: string }>;
  analyzeUrl: (url: string) => Promise<MediaInfo>;
  startDownload: (options: DownloadOptions) => Promise<{ id: string }>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  getActiveDownloads: () => Promise<DownloadJob[]>;
  onDownloadProgress: (callback: (data: DownloadJob) => void) => () => void;
  onDownloadComplete: (callback: (data: { id: string; filePath: string; fileSize: number; title: string }) => void) => () => void;
  onDownloadError: (callback: (data: { id: string; error: string; title: string }) => void) => () => void;
  getHistory: () => Promise<HistoryItem[]>;
  addHistoryItem: (item: HistoryItem) => Promise<void>;
  removeHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  resetSettings: () => Promise<AppSettings>;
  selectFolder: () => Promise<string | null>;
  openFile: (filePath: string) => Promise<void>;
  openFolder: (filePath: string) => Promise<void>;
  getDefaultDownloadPath: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  readClipboard: () => Promise<string>;
  setAutoLaunch: (enable: boolean) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
