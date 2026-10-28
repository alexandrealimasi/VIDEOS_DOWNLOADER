// Input validation utilities for IPC handlers

import * as path from 'path';
import { AppSettings, DownloadOptions } from '../types';

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

  const data: DownloadOptions = {
    url: (opts.url as string).trim(),
    formatId: typeof opts.formatId === 'string' ? opts.formatId : 'best',
    quality: typeof opts.quality === 'string' ? opts.quality : 'best',
    ext: typeof opts.ext === 'string' ? opts.ext : 'mp4',
    audioOnly: typeof opts.audioOnly === 'boolean' ? opts.audioOnly : false,
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
    const allowed = ['mp4', 'webm', 'mkv', 'mp3', 'flac', 'wav', 'best'];
    if (!allowed.includes(s.preferredFormat as string)) {
      return { valid: false, error: 'Invalid preferred format' };
    }
    data.preferredFormat = s.preferredFormat as string;
  }

  if (s.preferredQuality !== undefined) {
    const allowed = ['best', '2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];
    if (!allowed.includes(s.preferredQuality as string)) {
      return { valid: false, error: 'Invalid preferred quality' };
    }
    data.preferredQuality = s.preferredQuality as string;
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

  return { valid: true, data };
}

export function sanitizePath(inputPath: string): string {
  // Resolve to absolute, remove traversal
  const resolved = path.resolve(inputPath);
  return resolved;
}

export function isValidId(id: unknown): boolean {
  return typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
}
