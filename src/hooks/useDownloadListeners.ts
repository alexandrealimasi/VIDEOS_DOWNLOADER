import { useEffect } from 'react';
import { useAppStore } from '../stores/app-store';
import type { DownloadJob, HistoryItem } from '../types';

export function useDownloadListeners() {
  useEffect(() => {
    const unsubProgress = window.electronAPI.onDownloadProgress((data) => {
      const job = data as unknown as DownloadJob;
      const { downloads, updateDownload, addDownload } = useAppStore.getState();
      const exists = downloads.some((d) => d.id === job.id);
      if (exists) {
        updateDownload(job);
      } else {
        addDownload(job);
      }
    });

    const unsubComplete = window.electronAPI.onDownloadComplete((data) => {
      const { updateDownload, downloads, addHistoryItem } = useAppStore.getState();
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
        const item: HistoryItem = {
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
        };
        addHistoryItem(item);

        // Persist to main process
        window.electronAPI.addHistoryItem(item);
      }
    });

    const unsubError = window.electronAPI.onDownloadError((data) => {
      useAppStore.getState().updateDownload({
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
  }, []);
}
