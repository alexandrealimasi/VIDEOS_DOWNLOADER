// Media info extraction using yt-dlp

import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { MediaInfo, MediaFormat } from '../types';
import { getYtDlpPath } from './dependency-manager';

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseFormat(f: Record<string, unknown>): MediaFormat {
  const vcodec = (f.vcodec as string) || 'none';
  const acodec = (f.acodec as string) || 'none';
  const hasVideo = vcodec !== 'none' && vcodec !== '';
  const hasAudio = acodec !== 'none' && acodec !== '';
  const height = f.height as number | null;
  const width = f.width as number | null;
  const ext = (f.ext as string) || 'unknown';
  const fps = f.fps as number | null;

  let resolution = 'unknown';
  if (height) {
    resolution = `${height}p`;
  } else if (f.resolution && typeof f.resolution === 'string') {
    resolution = f.resolution;
  }

  let quality = resolution;
  if (fps && fps > 30) {
    quality = `${resolution}${fps}`;
  }

  let label = '';
  if (hasVideo && hasAudio) {
    label = `${resolution} ${ext.toUpperCase()} (video+audio)`;
  } else if (hasVideo) {
    label = `${resolution} ${ext.toUpperCase()} (video only)`;
  } else if (hasAudio) {
    const abr = f.abr as number | null;
    label = `${ext.toUpperCase()} ${abr ? abr + 'kbps' : ''} (audio)`;
  } else {
    label = `${ext.toUpperCase()} ${resolution}`;
  }

  return {
    formatId: (f.format_id as string) || 'unknown',
    ext,
    resolution,
    width: width || null,
    height: height || null,
    fps: fps || null,
    filesize: (f.filesize as number) || null,
    filesizeApprox: (f.filesize_approx as number) || null,
    vcodec: hasVideo ? vcodec : 'none',
    acodec: hasAudio ? acodec : 'none',
    quality,
    hasVideo,
    hasAudio,
    label,
  };
}

export function analyzeUrl(url: string): Promise<MediaInfo> {
  return new Promise((resolve, reject) => {
    const ytdlpPath = getYtDlpPath();
    const args = [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--no-playlist',
      url,
    ];

    const proc = spawn(ytdlpPath, args, {
      windowsHide: true,
      timeout: 60000,
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
      if (code !== 0) {
        const errorMsg = stderr.trim() || 'Failed to analyze URL';
        // Provide user-friendly error messages
        if (errorMsg.includes('is not a valid URL')) {
          reject(new Error('The provided URL is not valid'));
        } else if (errorMsg.includes('Unsupported URL')) {
          reject(new Error('This website is not supported'));
        } else if (errorMsg.includes('Private video') || errorMsg.includes('Sign in')) {
          reject(new Error('This video is private or requires authentication'));
        } else if (errorMsg.includes('Video unavailable') || errorMsg.includes('not available')) {
          reject(new Error('This video is unavailable'));
        } else if (errorMsg.includes('HTTP Error 429')) {
          reject(new Error('Rate limited by the server. Please try again later'));
        } else if (errorMsg.includes('getaddrinfo') || errorMsg.includes('network')) {
          reject(new Error('Network error. Please check your internet connection'));
        } else {
          reject(new Error(errorMsg.substring(0, 300)));
        }
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const allFormats = (data.formats || []).map((f: Record<string, unknown>) => parseFormat(f));

        // Filter to usable formats: those with video+audio, or video-only for merging
        const videoFormats = allFormats
          .filter((f: MediaFormat) => f.hasVideo)
          .sort((a: MediaFormat, b: MediaFormat) => (b.height || 0) - (a.height || 0));

        // Deduplicate by resolution and extension
        const seen = new Set<string>();
        const uniqueFormats = videoFormats.filter((f: MediaFormat) => {
          const key = `${f.resolution}-${f.ext}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const audioFormats = allFormats
          .filter((f: MediaFormat) => f.hasAudio && !f.hasVideo)
          .sort((a: MediaFormat, b: MediaFormat) => {
            const aSize = a.filesize || a.filesizeApprox || 0;
            const bSize = b.filesize || b.filesizeApprox || 0;
            return bSize - aSize;
          });

        // Deduplicate audio by extension
        const seenAudio = new Set<string>();
        const uniqueAudio = audioFormats.filter((f: MediaFormat) => {
          if (seenAudio.has(f.ext)) return false;
          seenAudio.add(f.ext);
          return true;
        });

        const info: MediaInfo = {
          id: uuidv4(),
          title: data.title || 'Unknown Title',
          thumbnail: data.thumbnail || '',
          duration: data.duration || 0,
          durationFormatted: formatDuration(data.duration || 0),
          uploader: data.uploader || data.channel || 'Unknown',
          uploaderUrl: data.uploader_url || data.channel_url || '',
          webpageUrl: data.webpage_url || url,
          description: (data.description || '').substring(0, 500),
          formats: uniqueFormats,
          audioFormats: uniqueAudio,
          bestFormat: uniqueFormats.length > 0 ? uniqueFormats[0] : null,
        };

        resolve(info);
      } catch (parseError) {
        reject(new Error('Failed to parse media information'));
      }
    });

    proc.on('error', (err) => {
      if (err.message.includes('ENOENT')) {
        reject(new Error('yt-dlp is not installed. Please install it from Settings.'));
      } else {
        reject(new Error('Failed to run yt-dlp: ' + err.message));
      }
    });
  });
}
