// Input validation utilities for IPC handlers

import * as path from 'path';
import { AppSettings, DownloadOptions, FfmpegConvertOptions } from '../types';

export const ALLOWED_VIDEO_FORMATS = ['mp4', 'mkv', 'webm', 'mov', 'avi', 'best'];
export const ALLOWED_AUDIO_FORMATS = ['mp3', 'm4a', 'wav', 'flac', 'opus', 'aac', 'ogg', 'best'];
export const ALLOWED_ALL_FORMATS = Array.from(new Set([...ALLOWED_VIDEO_FORMATS, ...ALLOWED_AUDIO_FORMATS]));
export const ALLOWED_QUALITIES = ['best', '4320p', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
export const ALLOWED_AUDIO_BITRATES = ['320k', '256k', '192k', '128k', '96k', '64k', 'best'];

export function validateDownloadOptions(options: unknown): { valid: boolean; error?: string; data?: DownloadOptions } {
  if (!options || typeof options !== 'object') {
    return { valid: false, error: 'Invalid download options' };
  }

  const opts = options as Record<string, unknown>;

  if (typeof opts.url !== 'string' || opts.url.trim().length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  if (typeof opts.outputPath !== 'string' || opts.outputPath.trim().length === 0) {
    return { valid: false, error: 'Output path is required' };
  }

  // Validate output path is absolute and doesn't contain traversal
  const normalizedPath = path.resolve(opts.outputPath as string);
  if (normalizedPath !== path.normalize(opts.outputPath as string).replace(/[\\/]$/, '')) {
    // Allow it but use the resolved path
  }

  // Check for path traversal attempts
  if ((opts.outputPath as string).includes('..')) {
    return { valid: false, error: 'Path traversal is not allowed' };
  }

  const audioOnly = typeof opts.audioOnly === 'boolean' ? opts.audioOnly : false;
  let ext = typeof opts.ext === 'string' ? opts.ext.toLowerCase() : (audioOnly ? 'mp3' : 'mp4');
  if (!ALLOWED_ALL_FORMATS.includes(ext)) {
    ext = audioOnly ? 'mp3' : 'mp4';
  }

  let audioBitrate = '320k';
  if (typeof opts.audioBitrate === 'string' && ALLOWED_AUDIO_BITRATES.includes(opts.audioBitrate)) {
    audioBitrate = opts.audioBitrate;
  }

  const data: DownloadOptions = {
    url: (opts.url as string).trim(),
    formatId: typeof opts.formatId === 'string' ? opts.formatId : 'best',
    quality: typeof opts.quality === 'string' ? opts.quality : 'best',
    ext,
    audioOnly,
    audioBitrate,
    outputPath: normalizedPath,
    title: typeof opts.title === 'string' ? opts.title : 'Unknown',
    thumbnail: typeof opts.thumbnail === 'string' ? opts.thumbnail : '',
  };

  return { valid: true, data };
}

export function validateSettings(settings: unknown): { valid: boolean; error?: string; data?: Partial<AppSettings> } {
  if (!settings || typeof settings !== 'object') {
    return { valid: false, error: 'Invalid settings' };
  }

  const s = settings as Record<string, unknown>;
  const data: Partial<AppSettings> = {};

  if (s.downloadPath !== undefined) {
    if (typeof s.downloadPath !== 'string') {
      return { valid: false, error: 'Download path must be a string' };
    }
    if ((s.downloadPath as string).includes('..')) {
      return { valid: false, error: 'Path traversal is not allowed' };
    }
    data.downloadPath = path.resolve(s.downloadPath);
  }

  if (s.maxConcurrentDownloads !== undefined) {
    const max = Number(s.maxConcurrentDownloads);
    if (isNaN(max) || max < 1 || max > 10) {
      return { valid: false, error: 'Max concurrent downloads must be between 1 and 10' };
    }
    data.maxConcurrentDownloads = max;
  }

  if (s.preferredFormat !== undefined) {
    if (!ALLOWED_ALL_FORMATS.includes(s.preferredFormat as string)) {
      return { valid: false, error: 'Invalid preferred format' };
    }
    data.preferredFormat = s.preferredFormat as string;
  }

  if (s.preferredQuality !== undefined) {
    if (!ALLOWED_QUALITIES.includes(s.preferredQuality as string)) {
      return { valid: false, error: 'Invalid preferred quality' };
    }
    data.preferredQuality = s.preferredQuality as string;
  }

  if (s.preferredAudioFormat !== undefined) {
    if (!ALLOWED_AUDIO_FORMATS.includes(s.preferredAudioFormat as string)) {
      return { valid: false, error: 'Invalid preferred audio format' };
    }
    data.preferredAudioFormat = s.preferredAudioFormat as string;
  }

  if (s.preferredAudioBitrate !== undefined) {
    if (!ALLOWED_AUDIO_BITRATES.includes(s.preferredAudioBitrate as string)) {
      return { valid: false, error: 'Invalid preferred audio bitrate' };
    }
    data.preferredAudioBitrate = s.preferredAudioBitrate as string;
  }

  if (s.audioOnly !== undefined) {
    if (typeof s.audioOnly !== 'boolean') {
      return { valid: false, error: 'Audio only must be a boolean' };
    }
    data.audioOnly = s.audioOnly;
  }

  if (s.theme !== undefined) {
    if (s.theme !== 'dark' && s.theme !== 'light') {
      return { valid: false, error: 'Theme must be dark or light' };
    }
    data.theme = s.theme;
  }

  if (s.autoLaunch !== undefined) {
    if (typeof s.autoLaunch !== 'boolean') {
      return { valid: false, error: 'Auto launch must be a boolean' };
    }
    data.autoLaunch = s.autoLaunch;
  }

  if (s.enableClipboardWatcher !== undefined) {
    if (typeof s.enableClipboardWatcher !== 'boolean') {
      return { valid: false, error: 'Clipboard watcher must be a boolean' };
    }
    data.enableClipboardWatcher = s.enableClipboardWatcher;
  }

  return { valid: true, data };
}

export function validateFfmpegConvertOptions(options: unknown): { valid: boolean; error?: string; data?: FfmpegConvertOptions } {
  if (!options || typeof options !== 'object') {
    return { valid: false, error: 'Invalid conversion options' };
  }

  const opts = options as Record<string, unknown>;

  if (typeof opts.inputPath !== 'string' || opts.inputPath.trim().length === 0) {
    return { valid: false, error: 'Input file path is required' };
  }

  if (opts.inputPath.includes('..')) {
    return { valid: false, error: 'Path traversal is not allowed' };
  }

  const audioOnly = typeof opts.audioOnly === 'boolean' ? opts.audioOnly : false;
  let targetFormat = typeof opts.targetFormat === 'string' ? opts.targetFormat.toLowerCase() : (audioOnly ? 'mp3' : 'mp4');
  if (!ALLOWED_ALL_FORMATS.includes(targetFormat)) {
    targetFormat = audioOnly ? 'mp3' : 'mp4';
  }

  let audioBitrate = '320k';
  if (typeof opts.audioBitrate === 'string' && ALLOWED_AUDIO_BITRATES.includes(opts.audioBitrate)) {
    audioBitrate = opts.audioBitrate;
  }

  let resolution = 'original';
  if (typeof opts.resolution === 'string' && (ALLOWED_QUALITIES.includes(opts.resolution) || opts.resolution === 'original')) {
    resolution = opts.resolution;
  }

  let outputPath: string | undefined = undefined;
  if (typeof opts.outputPath === 'string' && opts.outputPath.trim().length > 0) {
    if (opts.outputPath.includes('..')) {
      return { valid: false, error: 'Path traversal is not allowed in output path' };
    }
    outputPath = path.resolve(opts.outputPath);
  }

  return {
    valid: true,
    data: {
      inputPath: path.resolve(opts.inputPath),
      outputPath,
      targetFormat,
      audioOnly,
      audioBitrate,
      resolution,
    },
  };
}

export function sanitizePath(inputPath: string): string {
  const resolved = path.resolve(inputPath);
  return resolved;
}

export function isValidId(id: unknown): boolean {
  return typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
}
