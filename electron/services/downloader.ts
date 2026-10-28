// Download engine service - manages download queue and yt-dlp processes

import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { DownloadJob, DownloadOptions, DownloadStatus, HistoryItem } from '../types';
import { getYtDlpPath } from './dependency-manager';
import { sanitizeFilename, verifyFileExists, getUniqueFilename, ensureDirSync } from './file-manager';

// Progress parsing patterns for yt-dlp stderr output
const PROGRESS_REGEX = /\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*([\d.]+\s*\w+)\s+at\s+([\d.]+\s*\w+\/s)\s+ETA\s+(\S+)/;
const PROGRESS_SIMPLE = /\[download\]\s+(\d+\.?\d*)%/;
const DESTINATION_REGEX = /\[download\]\s+Destination:\s+(.+)/;
const ALREADY_DOWNLOADED = /\[download\]\s+(.+)\s+has already been downloaded/;
const MERGER_REGEX = /\[Merger\]\s+Merging formats into/;
const FFMPEG_REGEX = /\[ExtractAudio\]\s+Destination:\s+(.+)/;
const DOWNLOAD_COMPLETE = /\[download\]\s+100%/;

export class DownloaderService {
  private jobs: Map<string, DownloadJob> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private maxConcurrent = 3;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  setMaxConcurrent(max: number) {
    this.maxConcurrent = Math.max(1, Math.min(10, max));
  }

  getActiveDownloads(): DownloadJob[] {
    return Array.from(this.jobs.values());
  }

  getJob(id: string): DownloadJob | undefined {
    return this.jobs.get(id);
  }

  isDuplicate(url: string, formatId: string, audioOnly: boolean): boolean {
    for (const job of this.jobs.values()) {
      if (job.url === url && job.format === formatId && job.audioOnly === audioOnly &&
          (job.status === 'queued' || job.status === 'downloading' || job.status === 'processing')) {
        return true;
      }
    }
    return false;
  }

  startDownload(options: DownloadOptions): DownloadJob {
    const id = uuidv4();
    const sanitizedTitle = sanitizeFilename(options.title);
    const ext = options.audioOnly ? 'mp3' : options.ext;

    ensureDirSync(options.outputPath);
    const filePath = getUniqueFilename(options.outputPath, sanitizedTitle, ext);

    const job: DownloadJob = {
      id,
      url: options.url,
      title: options.title,
      thumbnail: options.thumbnail,
      format: options.formatId,
      quality: options.quality,
      ext,
      audioOnly: options.audioOnly,
      outputPath: options.outputPath,
      filename: path.basename(filePath),
      status: 'queued',
      progress: 0,
      speed: '',
      eta: '',
      downloadedSize: '',
      totalSize: '',
      error: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      filePath: filePath,
    };

    this.jobs.set(id, job);
    this.processQueue();
    this.sendProgress(job);

    return job;
  }

  private processQueue() {
    const activeCount = Array.from(this.jobs.values())
      .filter(j => j.status === 'downloading' || j.status === 'processing').length;

    if (activeCount >= this.maxConcurrent) return;

    const queued = Array.from(this.jobs.values())
      .filter(j => j.status === 'queued')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const slotsAvailable = this.maxConcurrent - activeCount;

    for (let i = 0; i < Math.min(slotsAvailable, queued.length); i++) {
      this.executeDownload(queued[i]);
    }
  }

  private executeDownload(job: DownloadJob) {
    const ytdlpPath = getYtDlpPath();
    const args: string[] = [];

    if (job.audioOnly) {
      args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      // Select format
      if (job.format && job.format !== 'best') {
        args.push('-f', job.format);
      } else {
        args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best');
      }
    }

    // Output template
    args.push('-o', job.filePath!);

    // Progress output
    args.push('--newline');
    args.push('--no-warnings');
    args.push('--no-playlist');
    args.push('--no-part');
    args.push('--console-title');

    // Don't overwrite
    args.push('--no-overwrites');

    // FFmpeg location if available
    args.push('--ffmpeg-location', 'ffmpeg');

    // Add URL last
    args.push(job.url);

    job.status = 'downloading';
    job.progress = 0;
    this.sendProgress(job);

    const proc = spawn(ytdlpPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.processes.set(job.id, proc);

    let lastOutputFile = job.filePath;

    const handleOutput = (data: Buffer) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check for destination
        const destMatch = trimmed.match(DESTINATION_REGEX);
        if (destMatch) {
          lastOutputFile = destMatch[1].trim();
          continue;
        }

        // Check for FFmpeg extraction destination
        const ffmpegMatch = trimmed.match(FFMPEG_REGEX);
        if (ffmpegMatch) {
          lastOutputFile = ffmpegMatch[1].trim();
          job.status = 'processing';
          this.sendProgress(job);
          continue;
        }

        // Check for merge
        if (MERGER_REGEX.test(trimmed)) {
          job.status = 'processing';
          job.progress = 99;
          this.sendProgress(job);
          continue;
        }

        // Check for already downloaded
        const alreadyMatch = trimmed.match(ALREADY_DOWNLOADED);
        if (alreadyMatch) {
          lastOutputFile = alreadyMatch[1].trim();
          job.progress = 100;
          continue;
        }

        // Parse progress
        const progressMatch = trimmed.match(PROGRESS_REGEX);
        if (progressMatch) {
          job.progress = parseFloat(progressMatch[1]);
          job.totalSize = progressMatch[2].trim();
          job.speed = progressMatch[3].trim();
          job.eta = progressMatch[4].trim();
          this.sendProgress(job);
          continue;
        }

        const simpleMatch = trimmed.match(PROGRESS_SIMPLE);
        if (simpleMatch) {
          job.progress = parseFloat(simpleMatch[1]);
          this.sendProgress(job);
          continue;
        }
      }
    };

    proc.stdout.on('data', handleOutput);
    proc.stderr.on('data', handleOutput);

    proc.on('close', async (code) => {
      this.processes.delete(job.id);

      if (job.status === 'cancelled') {
        this.sendProgress(job);
        this.processQueue();
        return;
      }

      // Determine the actual output file
      const candidatePaths = [
        lastOutputFile,
        job.filePath,
      ].filter(Boolean) as string[];

      let foundFile: string | null = null;
      let fileSize = 0;

      for (const candidate of candidatePaths) {
        const result = await verifyFileExists(candidate);
        if (result.exists) {
          foundFile = candidate;
          fileSize = result.size;
          break;
        }
        // Try without extension variants
        const withoutExt = candidate.replace(/\.[^.]+$/, '');
        for (const ext of ['mp4', 'webm', 'mkv', 'mp3', 'm4a', 'flac', 'wav', 'opus']) {
          const variant = `${withoutExt}.${ext}`;
          const vResult = await verifyFileExists(variant);
          if (vResult.exists) {
            foundFile = variant;
            fileSize = vResult.size;
            break;
          }
        }
        if (foundFile) break;
      }

      if (code === 0 && foundFile) {
        job.status = 'completed';
        job.progress = 100;
        job.filePath = foundFile;
        job.filename = path.basename(foundFile);
        job.completedAt = new Date().toISOString();
        job.error = null;

        this.mainWindow?.webContents.send('download-complete', {
          id: job.id,
          filePath: foundFile,
          fileSize,
          title: job.title,
        });
      } else {
        job.status = 'failed';
        job.error = job.error || 'Download failed. The file could not be verified.';

        this.mainWindow?.webContents.send('download-error', {
          id: job.id,
          error: job.error,
          title: job.title,
        });
      }

      this.sendProgress(job);
      this.processQueue();
    });

    proc.on('error', (err) => {
      this.processes.delete(job.id);
      job.status = 'failed';
      if (err.message.includes('ENOENT')) {
        job.error = 'yt-dlp is not installed or not found on PATH';
      } else {
        job.error = err.message;
      }

      this.mainWindow?.webContents.send('download-error', {
        id: job.id,
        error: job.error,
        title: job.title,
      });

      this.sendProgress(job);
      this.processQueue();
    });
  }

  cancelDownload(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    const proc = this.processes.get(id);
    if (proc) {
      job.status = 'cancelled';
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
      }, 5000);
      this.processes.delete(id);
    } else if (job.status === 'queued') {
      job.status = 'cancelled';
    }

    this.sendProgress(job);
    return true;
  }

  retryDownload(id: string): DownloadJob | null {
    const oldJob = this.jobs.get(id);
    if (!oldJob || (oldJob.status !== 'failed' && oldJob.status !== 'cancelled')) return null;

    // Remove old job
    this.jobs.delete(id);

    // Create new download with same options
    return this.startDownload({
      url: oldJob.url,
      formatId: oldJob.format,
      quality: oldJob.quality,
      ext: oldJob.ext,
      audioOnly: oldJob.audioOnly,
      outputPath: oldJob.outputPath,
      title: oldJob.title,
      thumbnail: oldJob.thumbnail,
    });
  }

  removeJob(id: string) {
    this.cancelDownload(id);
    this.jobs.delete(id);
  }

  getCompletedAsHistory(): HistoryItem[] {
    return Array.from(this.jobs.values())
      .filter(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled')
      .map(j => ({
        id: j.id,
        url: j.url,
        title: j.title,
        thumbnail: j.thumbnail,
        format: j.format,
        quality: j.quality,
        fileSize: null,
        filePath: j.filePath,
        status: j.status as 'completed' | 'failed' | 'cancelled',
        completedAt: j.completedAt || new Date().toISOString(),
        downloadedAt: j.createdAt,
      }));
  }

  killAllProcesses() {
    for (const [id, proc] of this.processes) {
      try {
        proc.kill('SIGTERM');
      } catch {
        // Ignore
      }
      this.processes.delete(id);
    }
  }

  private sendProgress(job: DownloadJob) {
    this.mainWindow?.webContents.send('download-progress', {
      id: job.id,
      progress: job.progress,
      speed: job.speed,
      eta: job.eta,
      downloadedSize: job.downloadedSize,
      totalSize: job.totalSize,
      status: job.status,
      title: job.title,
      thumbnail: job.thumbnail,
      url: job.url,
      format: job.format,
      quality: job.quality,
      ext: job.ext,
      audioOnly: job.audioOnly,
      outputPath: job.outputPath,
      filename: job.filename,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      filePath: job.filePath,
    });
  }
}

export const downloaderService = new DownloaderService();
