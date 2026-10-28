// File management utilities

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Characters not allowed in Windows filenames
const UNSAFE_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;
const RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
const MAX_FILENAME_LENGTH = 200;

export function sanitizeFilename(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'download';
  }

  let sanitized = name
    .replace(UNSAFE_CHARS, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .trim();

  // Handle reserved Windows names
  if (RESERVED_NAMES.test(sanitized)) {
    sanitized = '_' + sanitized;
  }

  // Truncate if too long
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
  }

  // Fallback if empty
  if (sanitized.length === 0) {
    sanitized = 'download';
  }

  return sanitized;
}

export async function verifyFileExists(filePath: string): Promise<{ exists: boolean; size: number }> {
  try {
    const stats = await fs.promises.stat(filePath);
    return { exists: stats.isFile() && stats.size > 0, size: stats.size };
  } catch {
    return { exists: false, size: 0 };
  }
}

export function getTempDir(): string {
  const tempDir = path.join(app.getPath('temp'), 'videograbber-desktop');
  ensureDirSync(tempDir);
  return tempDir;
}

export async function cleanupTempFiles(downloadId: string): Promise<void> {
  const tempDir = getTempDir();
  try {
    const files = await fs.promises.readdir(tempDir);
    for (const file of files) {
      if (file.includes(downloadId)) {
        const filePath = path.join(tempDir, file);
        try {
          await fs.promises.unlink(filePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  } catch {
    // Ignore if temp dir doesn't exist
  }
}

export function ensureDirSync(dirPath: string): void {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

export function getUniqueFilename(dir: string, name: string, ext: string): string {
  const sanitized = sanitizeFilename(name);
  let candidate = path.join(dir, `${sanitized}.${ext}`);
  let counter = 1;

  while (fs.existsSync(candidate)) {
    candidate = path.join(dir, `${sanitized} (${counter}).${ext}`);
    counter++;
    if (counter > 999) {
      // Safety limit
      candidate = path.join(dir, `${sanitized}_${Date.now()}.${ext}`);
      break;
    }
  }

  return candidate;
}

export function getFileSizeFormatted(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
