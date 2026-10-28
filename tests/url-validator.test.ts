import { describe, it, expect } from 'vitest';
import { isValidUrl, isSupportedUrl, sanitizeUrl, isAllowedExternalUrl } from '../electron/security/url-validator';

describe('URL Validator Security Suite', () => {
  it('validates standard HTTP and HTTPS URLs', () => {
    expect(isValidUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').valid).toBe(true);
    expect(isValidUrl('http://vimeo.com/12345678').valid).toBe(true);
  });

  it('rejects empty and malformed URLs', () => {
    expect(isValidUrl('').valid).toBe(false);
    expect(isValidUrl('not_a_url').valid).toBe(false);
    expect(isValidUrl('javascript:alert(1)').valid).toBe(false);
    expect(isValidUrl('file:///C:/Windows/System32').valid).toBe(false);
  });

  it('identifies supported platforms', () => {
    expect(isSupportedUrl('https://www.youtube.com/watch?v=abc').supported).toBe(true);
    expect(isSupportedUrl('https://youtu.be/xyz').supported).toBe(true);
    expect(isSupportedUrl('https://vimeo.com/999').supported).toBe(true);
    expect(isSupportedUrl('https://artist.bandcamp.com/track/song').supported).toBe(true);
  });

  it('sanitizes unsafe characters in input URLs', () => {
    const raw = '  https://youtube.com/watch?v=123\x00\x1f  ';
    expect(sanitizeUrl(raw)).toBe('https://youtube.com/watch?v=123');
  });

  it('restricts external links to strictly allowlisted destinations', () => {
    expect(isAllowedExternalUrl('https://github.com/yt-dlp/yt-dlp')).toBe(true);
    expect(isAllowedExternalUrl('https://ffmpeg.org/download.html')).toBe(true);
    expect(isAllowedExternalUrl('https://malicious-site.com')).toBe(false);
  });
});
