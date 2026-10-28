import React, { useState } from 'react';
import {
  Download,
  FolderOpen,
  FileCheck,
  RotateCcw,
  XCircle,
  Pause,
  Play,
  Film,
  Music,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../stores/app-store';
import type { DownloadJob, DownloadStatus } from '../types';

type FilterTab = 'all' | 'active' | 'queued' | 'completed' | 'failed';

export const Downloads: React.FC = () => {
  const downloads = useAppStore((s) => s.downloads);
  const [currentTab, setCurrentTab] = useState<FilterTab>('all');

  const filteredDownloads = downloads.filter((d) => {
    if (currentTab === 'all') return true;
    if (currentTab === 'active') return d.status === 'downloading' || d.status === 'processing';
    if (currentTab === 'queued') return d.status === 'queued';
    if (currentTab === 'completed') return d.status === 'completed';
    if (currentTab === 'failed') return d.status === 'failed' || d.status === 'cancelled';
    return true;
  });

  const handlePause = async (id: string) => {
    try {
      await window.electronAPI.pauseDownload(id);
    } catch (err) {
      console.error('Failed to pause download:', err);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await window.electronAPI.resumeDownload(id);
    } catch (err) {
      console.error('Failed to resume download:', err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await window.electronAPI.cancelDownload(id);
    } catch (err) {
      console.error('Failed to cancel download:', err);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await window.electronAPI.retryDownload(id);
    } catch (err) {
      console.error('Failed to retry download:', err);
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

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Downloads</h2>
          <p className="text-sm text-gray-400 mt-1">
            Monitor background download jobs, view network speeds, and manage completed media.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex rounded-lg border border-border p-1 bg-background-card">
          {(['all', 'active', 'queued', 'completed', 'failed'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                currentTab === tab
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Downloads List */}
      {filteredDownloads.length === 0 ? (
        <div className="bg-background-card border border-border rounded-xl p-12 text-center space-y-3">
          <Download className="h-10 w-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-semibold text-gray-300">No downloads found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {currentTab === 'all'
              ? 'You have not initiated any downloads yet. Go to the Home tab and paste a video URL.'
              : `There are currently no items under the ${currentTab} filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDownloads.map((job: DownloadJob) => {
            const isProcessing = job.status === 'processing';
            const isDownloading = job.status === 'downloading';
            const isCompleted = job.status === 'completed';
            const isFailed = job.status === 'failed' || job.status === 'cancelled';
            const isPaused = job.status === 'paused';

            return (
              <div
                key={job.id}
                className="bg-background-card border border-border rounded-xl p-5 shadow-sm space-y-4 transition-all hover:border-border/80"
              >
                <div className="flex gap-4 items-start">
                  {/* Thumbnail / Media Icon */}
                  <div className="w-28 h-18 aspect-video rounded-lg overflow-hidden bg-background border border-border flex-shrink-0 relative">
                    {job.thumbnail ? (
                      <img
                        src={job.thumbnail}
                        alt={job.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        {job.audioOnly ? <Music className="h-6 w-6" /> : <Film className="h-6 w-6" />}
                      </div>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-white truncate" title={job.title}>
                        {job.title}
                      </h4>
                      <Badge status={job.status} />
                    </div>

                    <p className="text-xs text-gray-400 mt-1 truncate">{job.url}</p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="uppercase font-mono bg-background px-2 py-0.5 rounded border border-border">
                        {job.ext}
                      </span>
                      <span>Quality: {job.quality || 'Auto'}</span>
                      {job.speed && <span>Speed: {job.speed}</span>}
                      {job.eta && <span>ETA: {job.eta}</span>}
                      {job.totalSize && <span>Size: {job.totalSize}</span>}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {(isDownloading || isProcessing || isPaused) && (
                  <div className="space-y-1">
                    <Progress value={job.progress} />
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>{isProcessing ? 'Processing audio/video muxing...' : `${job.progress.toFixed(1)}%`}</span>
                      <span>{job.speed || ''}</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {isFailed && job.error && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{job.error}</span>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="text-gray-500 text-[11px]">
                    {job.completedAt
                      ? `Completed at: ${new Date(job.completedAt).toLocaleTimeString()}`
                      : `Started: ${new Date(job.createdAt).toLocaleTimeString()}`}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Active controls */}
                    {isDownloading && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePause(job.id)}
                          title="Pause"
                        >
                          <Pause className="h-3.5 w-3.5" />
                          Pause
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(job.id)}
                          title="Cancel"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </>
                    )}

                    {isPaused && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResume(job.id)}
                          title="Resume"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Resume
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(job.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}

                    {/* Failed controls */}
                    {isFailed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(job.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Retry
                      </Button>
                    )}

                    {/* Completed controls */}
                    {isCompleted && job.filePath && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenFile(job.filePath)}
                        >
                          <FileCheck className="h-3.5 w-3.5 text-accent-light" />
                          Open File
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFolder(job.filePath)}
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          Open Folder
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
