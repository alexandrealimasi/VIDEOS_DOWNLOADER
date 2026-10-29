import { describe, it, expect } from 'vitest';
import { isPlaylistUrl, formatDuration } from '../electron/services/media-info';
import {
  validateDownloadOptions,
  validateFfmpegConvertOptions,
  ALLOWED_VIDEO_FORMATS,
  ALLOWED_AUDIO_FORMATS,
  ALLOWED_AUDIO_BITRATES,
} from '../electron/security/input-validator';

describe('Playlists & Extended Formats Suite', () => {
  it('correctly identifies playlist URLs', () => {
    expect(isPlaylistUrl('https://www.youtube.com/playlist?list=PLrAXtmErZgOdP_8GzKtMBBWCE0XTmNZhr')).toBe(true);
    expect(isPlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL12345')).toBe(true);
    expect(isPlaylistUrl('https://soundcloud.com/artist/sets/my-album')).toBe(true);
    expect(isPlaylistUrl('https://bandcamp.com/album/great-songs')).toBe(true);

    expect(isPlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(isPlaylistUrl('https://vimeo.com/123456')).toBe(false);
  });

  it('formats duration in seconds to HH:MM:SS or MM:SS', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3665)).toBe('1:01:05');
  });

  it('validates all requested video containers (MP4, MKV, WEBM, MOV, AVI)', () => {
    const videoFormats = ['mp4', 'mkv', 'webm', 'mov', 'avi'];
    for (const fmt of videoFormats) {
      expect(ALLOWED_VIDEO_FORMATS).toContain(fmt);
      const res = validateDownloadOptions({
        url: 'https://www.youtube.com/watch?v=sample',
        outputPath: 'C:\\Users\\Downloads',
        formatId: 'best',
        quality: '1080p',
        ext: fmt,
        audioOnly: false,
      });
      expect(res.valid).toBe(true);
      expect(res.data?.ext).toBe(fmt);
    }
  });

  it('validates all requested audio formats and bitrates (MP3, M4A, WAV, FLAC, OPUS, AAC, OGG)', () => {
    const audioFormats = ['mp3', 'm4a', 'wav', 'flac', 'opus', 'aac', 'ogg'];
    for (const fmt of audioFormats) {
      expect(ALLOWED_AUDIO_FORMATS).toContain(fmt);
      const res = validateDownloadOptions({
        url: 'https://www.youtube.com/watch?v=sample',
        outputPath: 'C:\\Users\\Downloads',
        formatId: 'bestaudio',
        quality: 'best',
        ext: fmt,
        audioOnly: true,
        audioBitrate: '320k',
      });
      expect(res.valid).toBe(true);
      expect(res.data?.ext).toBe(fmt);
      expect(res.data?.audioBitrate).toBe('320k');
    }

    const bitrates = ['320k', '256k', '192k', '128k', '96k', '64k'];
    for (const br of bitrates) {
      expect(ALLOWED_AUDIO_BITRATES).toContain(br);
    }
  });

  it('validates FFmpeg conversion payloads', () => {
    const valid = validateFfmpegConvertOptions({
      inputPath: 'C:\\Users\\Videos\\sample.mov',
      targetFormat: 'mp4',
      audioOnly: false,
      resolution: '1080p',
    });
    expect(valid.valid).toBe(true);
    expect(valid.data?.targetFormat).toBe('mp4');
    expect(valid.data?.resolution).toBe('1080p');

    const invalid = validateFfmpegConvertOptions({
      inputPath: 'C:\\Users\\Videos\\..\\..\\Windows\\System32\\cmd.exe',
      targetFormat: 'mp4',
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toContain('Path traversal');
  });
});
