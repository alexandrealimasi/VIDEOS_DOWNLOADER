import type {
  MediaInfo,
  PlaylistInfo,
  PlaylistItem,
  DownloadOptions,
  DownloadJob,
  HistoryItem,
  AppSettings,
  DependencyInfo,
  FfmpegConvertOptions,
  FfmpegJob,
} from '../types';

export interface ElectronAPI {
  checkDependencies: () => Promise<DependencyInfo[]>;
  installDependency: (name: string) => Promise<{ success: boolean; message: string }>;
  analyzeUrl: (url: string) => Promise<MediaInfo>;
  analyzePlaylist: (url: string) => Promise<PlaylistInfo>;
  startDownload: (options: DownloadOptions) => Promise<{ id: string }>;
  startPlaylistDownload: (options: DownloadOptions, items: PlaylistItem[]) => Promise<{ ids: string[] }>;
  pauseDownload: (id: string) => Promise<void>;
  resumeDownload: (id: string) => Promise<void>;
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  removeDownload: (id: string) => Promise<void>;
  clearCompletedDownloads: () => Promise<void>;
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
  selectFile: () => Promise<string | null>;
  openFile: (filePath: string) => Promise<void>;
  openFolder: (filePath: string) => Promise<void>;
  getDefaultDownloadPath: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  readClipboard: () => Promise<string>;
  setAutoLaunch: (enable: boolean) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  openExtensionFolder: () => Promise<void>;
  convertFile: (options: FfmpegConvertOptions) => Promise<{ id: string }>;
  cancelConversion: (id: string) => Promise<void>;
  onFfmpegProgress: (callback: (data: FfmpegJob) => void) => () => void;
  onFfmpegComplete: (callback: (data: { id: string; filePath: string }) => void) => () => void;
  onExternalUrlReceived: (callback: (url: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
