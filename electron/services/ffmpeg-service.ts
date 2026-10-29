// FFmpeg service for media conversion and audio extraction

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { BrowserWindow, Notification } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { FfmpegConvertOptions, FfmpegJob } from '../types';
import { getFfmpegPath } from './dependency-manager';
import { verifyFileExists, getUniqueFilename, ensureDirSync } from './file-manager';

export class FfmpegService {
  private jobs: Map<string, FfmpegJob> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  getActiveJobs(): FfmpegJob[] {
    return Array.from(this.jobs.values());
  }

  getJob(id: string): FfmpegJob | undefined {
    return this.jobs.get(id);
  }

  async convertFile(options: FfmpegConvertOptions): Promise<FfmpegJob> {
    const fileCheck = await verifyFileExists(options.inputPath);
    if (!fileCheck.exists) {
      throw new Error(`Fichier introuvable : ${options.inputPath}`);
    }

    const id = uuidv4();
    const inputExt = path.extname(options.inputPath);
    const baseName = path.basename(options.inputPath, inputExt);
    const targetExt = options.targetFormat.toLowerCase().replace(/^\./, '');

    const outputDir = options.outputPath
      ? (path.extname(options.outputPath) ? path.dirname(options.outputPath) : options.outputPath)
      : path.dirname(options.inputPath);

    ensureDirSync(outputDir);
    const finalOutputPath = getUniqueFilename(outputDir, `${baseName}_converted`, targetExt);

    const job: FfmpegJob = {
      id,
      inputPath: options.inputPath,
      outputPath: finalOutputPath,
      filename: path.basename(finalOutputPath),
      targetFormat: targetExt,
      audioOnly: options.audioOnly,
      audioBitrate: options.audioBitrate || '320k',
      resolution: options.resolution || 'original',
      status: 'queued',
      progress: 0,
      speed: '',
      time: '',
      error: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.jobs.set(id, job);
    this.sendProgress(job);

    this.executeConversion(job);
    return job;
  }

  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    const proc = this.processes.get(id);
    if (proc) {
      job.status = 'cancelled';
      proc.kill('SIGTERM');
      setTimeout(() => {
        if (!proc.killed) proc.kill('SIGKILL');
      }, 3000);
      this.processes.delete(id);
    } else {
      job.status = 'cancelled';
    }

    this.sendProgress(job);
    return true;
  }

  private executeConversion(job: FfmpegJob) {
    const ffmpegPath = getFfmpegPath();
    const args: string[] = ['-y', '-i', job.inputPath];

    if (job.audioOnly) {
      args.push('-vn'); // No video

      const bitrate = job.audioBitrate || '320k';
      switch (job.targetFormat) {
        case 'mp3':
          args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
          break;
        case 'm4a':
        case 'aac':
          args.push('-c:a', 'aac', '-b:a', bitrate);
          break;
        case 'wav':
          args.push('-c:a', 'pcm_s16le');
          break;
        case 'flac':
          args.push('-c:a', 'flac');
          break;
        case 'opus':
          args.push('-c:a', 'libopus', '-b:a', bitrate);
          break;
        case 'ogg':
          args.push('-c:a', 'libvorbis', '-b:a', bitrate);
          break;
        default:
          args.push('-c:a', 'libmp3lame', '-b:a', bitrate);
          break;
      }
    } else {
      // Video conversion
      // Resolution scale filter if specified
      if (job.resolution && job.resolution !== 'original') {
        const heightMatch = job.resolution.match(/^(\d+)p/);
        if (heightMatch) {
          const h = heightMatch[1];
          args.push('-vf', `scale=-2:${h}`);
        }
      }

      switch (job.targetFormat) {
        case 'mp4':
          args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart');
          break;
        case 'mkv':
          args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-c:a', 'aac', '-b:a', '192k');
          break;
        case 'webm':
          args.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus', '-b:a', '160k');
          break;
        case 'mov':
          args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-c:a', 'aac', '-b:a', '192k');
          break;
        case 'avi':
          args.push('-c:v', 'mpeg4', '-vtag', 'xvid', '-qscale:v', '4', '-c:a', 'libmp3lame', '-b:a', '192k');
          break;
        default:
          args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-c:a', 'aac', '-b:a', '192k');
          break;
      }
    }

    args.push(job.outputPath);

    job.status = 'processing';
    this.sendProgress(job);

    const proc = spawn(ffmpegPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.processes.set(job.id, proc);

    let totalDurationSeconds = 0;

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();

      // Look for Duration: 00:01:23.45
      if (!totalDurationSeconds) {
        const durationMatch = text.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
        if (durationMatch) {
          const hours = parseFloat(durationMatch[1]);
          const mins = parseFloat(durationMatch[2]);
          const secs = parseFloat(durationMatch[3]);
          totalDurationSeconds = hours * 3600 + mins * 60 + secs;
        }
      }

      // Look for time=00:00:12.34 speed= 2.1x
      const timeMatch = text.match(/time=\s*(\d+):(\d+):(\d+\.?\d*)/);
      if (timeMatch && totalDurationSeconds > 0) {
        const hours = parseFloat(timeMatch[1]);
        const mins = parseFloat(timeMatch[2]);
        const secs = parseFloat(timeMatch[3]);
        const currentSeconds = hours * 3600 + mins * 60 + secs;
        job.progress = Math.min(99, Math.round((currentSeconds / totalDurationSeconds) * 100));
        job.time = `${Math.round(currentSeconds)}s / ${Math.round(totalDurationSeconds)}s`;
      }

      const speedMatch = text.match(/speed=\s*([\d.]+x)/);
      if (speedMatch) {
        job.speed = speedMatch[1];
      }

      this.sendProgress(job);
    });

    proc.on('close', async (code) => {
      this.processes.delete(job.id);

      if (job.status === 'cancelled') {
        this.sendProgress(job);
        return;
      }

      const fileCheck = await verifyFileExists(job.outputPath);
      if (code === 0 && fileCheck.exists) {
        job.status = 'completed';
        job.progress = 100;
        job.completedAt = new Date().toISOString();
        job.error = null;

        if (Notification.isSupported()) {
          new Notification({
            title: 'Conversion FFmpeg terminée',
            body: job.filename,
          }).show();
        }

        this.mainWindow?.webContents.send('ffmpeg-complete', {
          id: job.id,
          filePath: job.outputPath,
        });
      } else {
        job.status = 'failed';
        job.error = job.error || 'Erreur lors de la conversion FFmpeg.';

        if (Notification.isSupported()) {
          new Notification({
            title: 'Échec de la conversion FFmpeg',
            body: job.filename,
          }).show();
        }
      }

      this.sendProgress(job);
    });

    proc.on('error', (err) => {
      this.processes.delete(job.id);
      job.status = 'failed';
      job.error = `FFmpeg introuvable ou erreur d'exécution : ${err.message}`;
      this.sendProgress(job);
    });
  }

  private sendProgress(job: FfmpegJob) {
    this.mainWindow?.webContents.send('ffmpeg-progress', job);
  }
}

export const ffmpegService = new FfmpegService();
