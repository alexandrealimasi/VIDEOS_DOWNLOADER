import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  FolderOpen,
  FileCheck,
  Clock,
  Film,
  Music,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ConfirmDialog } from '../components/ui/dialog';
import { useAppStore } from '../stores/app-store';
import { formatBytes, formatDate } from '../utils/format';
import type { HistoryItem } from '../types';

export const History: React.FC = () => {
  const history = useAppStore((s) => s.history);
  const setHistory = useAppStore((s) => s.setHistory);
  const removeHistoryItemFromStore = useAppStore((s) => s.removeHistoryItem);
  const clearHistoryInStore = useAppStore((s) => s.clearHistory);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'size'>('date');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const stored = await window.electronAPI.getHistory();
        if (stored) {
          setHistory(stored);
        }
      } catch (err) {
        console.error('Failed to get history:', err);
      }
    }
    fetchHistory();
  }, [setHistory]);

  const handleRemove = async (id: string) => {
    try {
      await window.electronAPI.removeHistoryItem(id);
      removeHistoryItemFromStore(id);
    } catch (err) {
      console.error('Failed to remove history item:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await window.electronAPI.clearHistory();
      clearHistoryInStore();
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleOpenFile = async (filePath: string | null) => {
    if (!filePath) return;
    try {
      await window.electronAPI.openFile(filePath);
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  const handleOpenFolder = async (filePath: string | null) => {
    if (!filePath) return;
    try {
      await window.electronAPI.openFolder(filePath);
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  // Filter & Search
  const filtered = history
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.completedAt || b.downloadedAt).getTime() - new Date(a.completedAt || a.downloadedAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'size') {
        return (b.fileSize || 0) - (a.fileSize || 0);
      }
      return 0;
    });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Download History</h2>
          <p className="text-sm text-gray-400 mt-1">
            Browse previous downloads, open downloaded files, or clean up your record logs.
          </p>
        </div>

        {history.length > 0 && (
          <Button
            variant="outline"
            className="text-red-400 hover:text-red-300 hover:border-red-500/50"
            onClick={() => setClearDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </Button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-background-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by title or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'size')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      {/* History Items */}
      {filtered.length === 0 ? (
        <div className="bg-background-card border border-border rounded-xl p-12 text-center space-y-3">
          <Clock className="h-10 w-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-gray-300">No records found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {history.length === 0
              ? 'Your download history is currently empty.'
              : 'No history items match your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: HistoryItem) => (
            <div
              key={item.id}
              className="bg-background-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-border/80 transition-all shadow-sm"
            >
              <div className="flex gap-3 items-center min-w-0 flex-1">
                <div className="w-16 h-12 aspect-video rounded bg-background border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : item.format === 'mp3' ? (
                    <Music className="h-5 w-5 text-gray-500" />
                  ) : (
                    <Film className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <Badge status={item.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span className="uppercase font-mono bg-background px-1.5 py-0.5 rounded border border-border text-[10px]">
                      {item.format}
                    </span>
                    {item.quality && <span>{item.quality}</span>}
                    {item.fileSize ? <span>{formatBytes(item.fileSize)}</span> : null}
                    <span>{formatDate(item.completedAt || item.downloadedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {item.status === 'completed' && item.filePath && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenFile(item.filePath)}
                      title="Open file"
                    >
                      <FileCheck className="h-4 w-4 text-accent-light" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenFolder(item.filePath)}
                      title="Open containing folder"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item.id)}
                  className="text-gray-500 hover:text-red-400"
                  title="Remove from history"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearAll}
        title="Clear Download History"
        description="Are you sure you want to remove all download history? Your downloaded files on disk will NOT be deleted."
        confirmText="Clear All"
        destructive
      />
    </div>
  );
};
