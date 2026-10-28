export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'downloading': return 'text-blue-400';
    case 'processing': return 'text-yellow-400';
    case 'completed': return 'text-green-400';
    case 'failed': return 'text-red-400';
    case 'cancelled': return 'text-gray-400';
    case 'queued': return 'text-purple-400';
    case 'paused': return 'text-orange-400';
    default: return 'text-gray-400';
  }
}

export function getStatusBgColor(status: string): string {
  switch (status) {
    case 'downloading': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'queued': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'paused': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'downloading': return 'Downloading';
    case 'processing': return 'Processing';
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    case 'cancelled': return 'Cancelled';
    case 'queued': return 'Queued';
    case 'paused': return 'Paused';
    default: return status;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
