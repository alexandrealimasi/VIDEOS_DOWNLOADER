export interface MediaInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  durationFormatted: string;
  uploader: string;
  uploaderUrl: string;
  webpageUrl: string;
  description: string;
  formats: MediaFormat[];
  audioFormats: MediaFormat[];
  bestFormat: MediaFormat | null;
  isPlaylist?: boolean;
}

export interface PlaylistItem {
  id: string;
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  url: string;
  uploader?: string;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  thumbnail: string;
  uploader: string;
  videoCount: number;
  videos: PlaylistItem[];
  webpageUrl: string;
}

export interface MediaFormat {
  formatId: string;
  ext: string;
  resolution: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  filesize: number | null;
  filesizeApprox: number | null;
  vcodec: string;
  acodec: string;
  quality: string;
  hasVideo: boolean;
  hasAudio: boolean;
  label: string;
}

export interface DownloadOptions {
  url: string;
  formatId: string;
  quality: string;
  ext: string;
  audioOnly: boolean;
  audioBitrate?: string;
  outputPath: string;
  title: string;
  thumbnail: string;
}

export interface DownloadJob {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  format: string;
  quality: string;
  ext: string;
  audioOnly: boolean;
  audioBitrate?: string;
  outputPath: string;
  filename: string;
  status: DownloadStatus;
  progress: number;
  speed: string;
  eta: string;
  downloadedSize: string;
  totalSize: string;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  filePath: string | null;
}

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'cancelled' | 'failed' | 'processing';

export interface DownloadProgress {
  id: string;
  progress: number;
  speed: string;
  eta: string;
  downloadedSize: string;
  totalSize: string;
  status: DownloadStatus;
  [key: string]: unknown;
}

export interface DownloadComplete {
  id: string;
  filePath: string;
  fileSize: number;
  title: string;
}

export interface DownloadError {
  id: string;
  error: string;
  title: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  format: string;
  quality: string;
  fileSize: number | null;
  filePath: string | null;
  status: 'completed' | 'failed' | 'cancelled';
  completedAt: string;
  downloadedAt: string;
}

export interface AppSettings {
  downloadPath: string;
  maxConcurrentDownloads: number;
  preferredFormat: string;
  preferredQuality: string;
  preferredAudioFormat?: string;
  preferredAudioBitrate?: string;
  audioOnly: boolean;
  theme: 'dark' | 'light';
  autoLaunch: boolean;
  enableClipboardWatcher?: boolean;
}

export interface DependencyInfo {
  name: string;
  installed: boolean;
  version: string | null;
  path: string | null;
}

export interface FfmpegConvertOptions {
  inputPath: string;
  outputPath?: string;
  targetFormat: string;
  audioOnly: boolean;
  audioBitrate?: string;
  resolution?: string;
}

export interface FfmpegJob {
  id: string;
  inputPath: string;
  outputPath: string;
  filename: string;
  targetFormat: string;
  audioOnly: boolean;
  audioBitrate?: string;
  resolution?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  speed: string;
  time: string;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type Page = 'home' | 'downloads' | 'converter' | 'history' | 'settings';
