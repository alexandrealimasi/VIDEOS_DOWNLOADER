// Dependency detection for yt-dlp and FFmpeg

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { DependencyInfo } from '../types';

function findExecutable(name: string): string | null {
  // Check in app resources first (for packaged app)
  const resourcePaths = [
    path.join(process.resourcesPath || '', 'resources', 'bin', name + '.exe'),
    path.join(process.resourcesPath || '', 'resources', 'bin', name),
    path.join(app.getAppPath(), 'resources', 'bin', name + '.exe'),
    path.join(app.getAppPath(), 'resources', 'bin', name),
  ];

  for (const p of resourcePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Will rely on PATH
  return null;
}

function getVersion(executable: string, args: string[]): Promise<{ version: string | null; path: string | null }> {
  return new Promise((resolve) => {
    try {
      const proc = spawn(executable, args, {
        windowsHide: true,
        timeout: 10000,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 || stdout.length > 0 || stderr.length > 0) {
          const output = stdout || stderr;
          const versionMatch = output.match(/(\d+\.\d+[\.\d]*\S*)/);
          resolve({
            version: versionMatch ? versionMatch[1] : output.trim().substring(0, 50),
            path: executable,
          });
        } else {
          resolve({ version: null, path: null });
        }
      });

      proc.on('error', () => {
        resolve({ version: null, path: null });
      });
    } catch {
      resolve({ version: null, path: null });
    }
  });
}

export async function checkYtDlp(): Promise<DependencyInfo> {
  const localPath = findExecutable('yt-dlp');
  const executable = localPath || 'yt-dlp';

  const result = await getVersion(executable, ['--version']);

  return {
    name: 'yt-dlp',
    installed: result.version !== null,
    version: result.version,
    path: result.version ? (localPath || executable) : null,
  };
}

export async function checkFfmpeg(): Promise<DependencyInfo> {
  const localPath = findExecutable('ffmpeg');
  const executable = localPath || 'ffmpeg';

  const result = await getVersion(executable, ['-version']);

  return {
    name: 'ffmpeg',
    installed: result.version !== null,
    version: result.version,
    path: result.version ? (localPath || executable) : null,
  };
}

export async function checkAllDependencies(): Promise<DependencyInfo[]> {
  const [ytdlp, ffmpeg] = await Promise.all([
    checkYtDlp(),
    checkFfmpeg(),
  ]);

  return [ytdlp, ffmpeg];
}

export function getYtDlpPath(): string {
  const localPath = findExecutable('yt-dlp');
  return localPath || 'yt-dlp';
}

export function getFfmpegPath(): string {
  const localPath = findExecutable('ffmpeg');
  return localPath || 'ffmpeg';
}

export function getInstallInstructions(name: string): string {
  if (name === 'yt-dlp') {
    return [
      'Install yt-dlp using one of these methods:',
      '',
      '1. winget (recommended):',
      '   winget install yt-dlp.yt-dlp',
      '',
      '2. pip:',
      '   pip install yt-dlp',
      '',
      '3. Manual download:',
      '   Download yt-dlp.exe from https://github.com/yt-dlp/yt-dlp/releases',
      '   Place it in a directory on your PATH',
      '',
      'After installation, restart VideoGrabber Desktop.',
    ].join('\n');
  }

  if (name === 'ffmpeg') {
    return [
      'Install FFmpeg using one of these methods:',
      '',
      '1. winget (recommended):',
      '   winget install Gyan.FFmpeg',
      '',
      '2. Manual download:',
      '   Download from https://www.gyan.dev/ffmpeg/builds/',
      '   Extract and add the bin folder to your PATH',
      '',
      '3. Chocolatey:',
      '   choco install ffmpeg',
      '',
      'After installation, restart VideoGrabber Desktop.',
    ].join('\n');
  }

  return 'Unknown dependency';
}
