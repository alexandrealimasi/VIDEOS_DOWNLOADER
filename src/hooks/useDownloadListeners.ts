import { useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import type { DownloadJob } from '../types';

export function useDownloadListeners() {
  const updateDownload = useAppStore((s) => s.updateDownload);
  const addDownload = useAppStore((s) => s.addDownload);
  const downloads = useAppStore((s) => s.downloads);
  const addHistoryItem = useAppStore((s) => s.addHistoryItem);

  useEffect(() => {
    const unsubProgress = window.electronAPI.onDownloadProgress((data) => {
      const job = data as unknown as DownloadJob;
      const exists = downloads.find((d) => d.id === job.id);
      if (exists) {
        updateDownload(job);
      } else {
        addDownload(job);
      }
    });

    const unsubComplete = window.electronAPI.onDownloadComplete((data) => {
      updateDownload({
        id: data.id,
        status: 'completed',
        progress: 100,
        filePath: data.filePath,
        completedAt: new Date().toISOString(),
      });

      // Add to history
      const job = downloads.find((d) => d.id === data.id);
      if (job) {
        addHistoryItem({
          id: job.id,
          url: job.url,
          title: data.title || job.title,
          thumbnail: job.thumbnail,
          format: job.format,
          quality: job.quality,
          fileSize: data.fileSize,
          filePath: data.filePath,
          status: 'completed',
          completedAt: new Date().toISOString(),
          downloadedAt: job.createdAt,
        });

        // Persist to main process
        window.electronAPI.addHistoryItem({
          id: job.id,
          url: job.url,
          title: data.title || job.title,
          thumbnail: job.thumbnail,
          format: job.format,
          quality: job.quality,
          fileSize: data.fileSize,
          filePath: data.filePath,
          status: 'completed',
          completedAt: new Date().toISOString(),
          downloadedAt: job.createdAt,
        });
      }
    });

    const unsubError = window.electronAPI.onDownloadError((data) => {
      updateDownload({
        id: data.id,
        status: 'failed',
        error: data.error,
      });
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  // We intentionally exclude downloads from deps to avoid re-subscribing on every update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
