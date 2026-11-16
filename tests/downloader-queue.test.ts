import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
  Notification: { isSupported: () => false },
  app: { getPath: () => 'C:\\Downloads', getAppPath: () => 'C:\\app' },
}));

vi.mock('child_process', () => {
  return {
    spawn: vi.fn(() => {
      const mockProc: any = new EventEmitter();
      mockProc.stdout = new EventEmitter();
      mockProc.stderr = new EventEmitter();
      mockProc.kill = vi.fn();
      mockProc.killed = false;
      return mockProc;
    }),
  };
});

vi.mock('../electron/services/dependency-manager', () => ({
  getYtDlpPath: () => 'yt-dlp',
  getFfmpegLocation: () => null,
}));

vi.mock('../electron/services/file-manager', () => ({
  sanitizeFilename: (s: string) => s,
  verifyFileExists: vi.fn().mockResolvedValue({ exists: false, size: 0 }),
  getUniqueFilename: (_dir: string, title: string, ext: string) => `C:\\Downloads\\${title}.${ext}`,
  ensureDirSync: vi.fn(),
}));

import { DownloaderService } from '../electron/services/downloader';

describe('DownloaderService Queue & Concurrency', () => {
  let service: DownloaderService;

  beforeEach(() => {
    service = new DownloaderService();
  });

  it('defaults to 1 concurrent download (one by one sequential download)', () => {
    // Check initial state
    expect(service.getActiveDownloads()).toHaveLength(0);

    // Start two downloads
    const job1 = service.startDownload({
      url: 'https://example.com/v1',
      formatId: 'best',
      quality: '1080p',
      ext: 'mp4',
      audioOnly: false,
      outputPath: 'C:\\Downloads',
      title: 'Video 1',
      thumbnail: '',
    });

    const job2 = service.startDownload({
      url: 'https://example.com/v2',
      formatId: 'best',
      quality: '1080p',
      ext: 'mp4',
      audioOnly: false,
      outputPath: 'C:\\Downloads',
      title: 'Video 2',
      thumbnail: '',
    });

    // First job should be actively downloading, second job must be queued
    expect(job1.status).toBe('downloading');
    expect(job2.status).toBe('queued');

    // Clean up processes
    service.killAllProcesses();
  });

  it('queues playlist items one by one', () => {
    const playlistItems = [
      { id: '1', title: 'Video 1', duration: 100, durationFormatted: '1:40', thumbnail: '', url: 'https://example.com/item1' },
      { id: '2', title: 'Video 2', duration: 120, durationFormatted: '2:00', thumbnail: '', url: 'https://example.com/item2' },
      { id: '3', title: 'Video 3', duration: 140, durationFormatted: '2:20', thumbnail: '', url: 'https://example.com/item3' },
    ];

    const jobs = service.startPlaylistDownload({
      url: 'https://example.com/playlist',
      formatId: 'best',
      quality: '1080p',
      ext: 'mp4',
      audioOnly: false,
      outputPath: 'C:\\Downloads',
      title: 'Playlist',
      thumbnail: '',
    }, playlistItems);

    expect(jobs).toHaveLength(3);
    // Only the first one is downloading, others are queued
    expect(jobs[0].status).toBe('downloading');
    expect(jobs[1].status).toBe('queued');
    expect(jobs[2].status).toBe('queued');

    service.killAllProcesses();
  });
});
