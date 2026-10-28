import { describe, it, expect } from 'vitest';
import { sanitizeFilename, getUniqueFilename } from '../electron/services/file-manager';
import * as path from 'path';

describe('File Manager & Sanitization Suite', () => {
  it('strips illegal characters on Windows', () => {
    const raw = 'Video: Test <Episode> "1" | 2026? *Special*';
    const clean = sanitizeFilename(raw);
    expect(clean).not.toMatch(/[<>:"/\\|?*]/);
    expect(clean).toBe('Video_ Test _Episode_ _1_ _ 2026_ _Special_');
  });

  it('prevents path traversal sequences', () => {
    const malicious = '../../etc/passwd';
    const clean = sanitizeFilename(malicious);
    expect(clean).not.toContain('..');
    expect(clean).not.toContain('/');
  });

  it('sanitizes reserved Windows system device names', () => {
    expect(sanitizeFilename('CON')).toBe('_CON');
    expect(sanitizeFilename('PRN.txt')).toBe('_PRN.txt');
    expect(sanitizeFilename('aux.mp4')).toBe('_aux.mp4');
    expect(sanitizeFilename('NUL')).toBe('_NUL');
  });

  it('handles empty or whitespace-only names with default fallback', () => {
    expect(sanitizeFilename('')).toBe('download');
    expect(sanitizeFilename('   ')).toBe('download');
    expect(sanitizeFilename('...')).toBe('download');
  });

  it('generates predictable unique filenames when candidates are clean', () => {
    const dir = 'C:\\Downloads';
    const result = getUniqueFilename(dir, 'cool-video', 'mp4');
    expect(result).toBe(path.join(dir, 'cool-video.mp4'));
  });
});
