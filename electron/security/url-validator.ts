// URL validation and security utilities

const SUPPORTED_PROTOCOLS = ['http:', 'https:'];

// Known sites supported by yt-dlp (subset of most common)
const SUPPORTED_DOMAINS = [
  'youtube.com', 'www.youtube.com', 'm.youtube.com',
  'youtu.be',
  'vimeo.com', 'www.vimeo.com', 'player.vimeo.com',
  'dailymotion.com', 'www.dailymotion.com',
  'twitch.tv', 'www.twitch.tv', 'clips.twitch.tv',
  'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
  'instagram.com', 'www.instagram.com',
  'facebook.com', 'www.facebook.com', 'fb.watch',
  'tiktok.com', 'www.tiktok.com',
  'soundcloud.com', 'www.soundcloud.com',
  'bandcamp.com',
  'reddit.com', 'www.reddit.com', 'old.reddit.com',
  'bilibili.com', 'www.bilibili.com',
  'nicovideo.jp', 'www.nicovideo.jp',
  'rumble.com', 'www.rumble.com',
  'odysee.com', 'www.odysee.com',
  'archive.org', 'www.archive.org',
  'ted.com', 'www.ted.com',
  'streamable.com', 'www.streamable.com',
  'mixcloud.com', 'www.mixcloud.com',
];

export function isValidUrl(input: string): { valid: boolean; reason?: string } {
  if (!input || typeof input !== 'string') {
    return { valid: false, reason: 'URL is required' };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'URL is required' };
  }

  if (trimmed.length > 2048) {
    return { valid: false, reason: 'URL is too long' };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if (!SUPPORTED_PROTOCOLS.includes(url.protocol)) {
    return { valid: false, reason: 'Only HTTP and HTTPS URLs are supported' };
  }

  return { valid: true };
}

export function isSupportedUrl(input: string): { supported: boolean; reason?: string } {
  const validation = isValidUrl(input);
  if (!validation.valid) {
    return { supported: false, reason: validation.reason };
  }

  const url = new URL(input.trim());
  const hostname = url.hostname.toLowerCase();

  // Check against known supported domains
  // Also allow any subdomain of supported domains (e.g., music.youtube.com)
  const isKnown = SUPPORTED_DOMAINS.some(domain => {
    return hostname === domain || hostname.endsWith('.' + domain);
  });

  // Also allow bandcamp subdomains (artistname.bandcamp.com)
  const isBandcamp = hostname.endsWith('.bandcamp.com');

  if (!isKnown && !isBandcamp) {
    return {
      supported: false,
      reason: `The site "${hostname}" is not in the known supported sites list. yt-dlp may still support it — the download will be attempted but may fail.`
    };
  }

  return { supported: true };
}

export function sanitizeUrl(input: string): string {
  return input.trim().replace(/[\x00-\x1f\x7f]/g, '');
}

// Allowlist for external URLs that can be opened in the user's browser
const EXTERNAL_URL_ALLOWLIST = [
  'https://github.com/yt-dlp/yt-dlp',
  'https://ffmpeg.org',
  'https://www.gyan.dev/ffmpeg/builds/',
  'https://github.com/yt-dlp/yt-dlp/releases',
  'https://github.com/BtbN/FFmpeg-Builds/releases',
];

export function isAllowedExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    return EXTERNAL_URL_ALLOWLIST.some(allowed => url.startsWith(allowed));
  } catch {
    return false;
  }
}
