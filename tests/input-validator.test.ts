import { describe, it, expect } from 'vitest';
import { validateDownloadOptions, validateSettings } from '../electron/security/input-validator';

describe('IPC Input Validation Suite', () => {
  it('validates correct download payload', () => {
    const validPayload = {
      url: 'https://www.youtube.com/watch?v=sample',
      outputPath: 'C:\\Users\\Downloads',
      formatId: '137',
      quality: '1080p',
      ext: 'mp4',
      audioOnly: false,
      title: 'Sample Video',
      thumbnail: 'https://example.com/thumb.jpg',
    };

    const res = validateDownloadOptions(validPayload);
    expect(res.valid).toBe(true);
    expect(res.data?.url).toBe(validPayload.url);
  });

  it('rejects path traversal in download destination', () => {
    const invalidPayload = {
      url: 'https://www.youtube.com/watch?v=sample',
      outputPath: 'C:\\Users\\Downloads\\..\\..\\Windows',
    };

    const res = validateDownloadOptions(invalidPayload);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Path traversal');
  });

  it('validates settings boundaries', () => {
    const validSettings = {
      maxConcurrentDownloads: 4,
      preferredFormat: 'mp4',
      preferredQuality: '1080p',
      audioOnly: true,
      theme: 'dark',
    };
    const res = validateSettings(validSettings);
    expect(res.valid).toBe(true);

    const invalidSettings = {
      maxConcurrentDownloads: 99, // exceeds max limit of 10
    };
    const badRes = validateSettings(invalidSettings);
    expect(badRes.valid).toBe(false);
  });
});
