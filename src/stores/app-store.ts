import { create } from 'zustand';
import type { Page, MediaInfo, DownloadJob, HistoryItem, AppSettings, DependencyInfo } from '../types';

interface AppState {
  // Navigation
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  // Media analysis
  mediaInfo: MediaInfo | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  setMediaInfo: (info: MediaInfo | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  setAnalyzeError: (err: string | null) => void;

  // Downloads
  downloads: DownloadJob[];
  setDownloads: (downloads: DownloadJob[]) => void;
  updateDownload: (job: Partial<DownloadJob> & { id: string }) => void;
  addDownload: (job: DownloadJob) => void;
  removeDownload: (id: string) => void;
  clearCompletedDownloads: () => void;

  // History
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  addHistoryItem: (item: HistoryItem) => void;
  removeHistoryItem: (id: string) => void;
  clearHistory: () => void;

  // Settings
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Dependencies
  dependencies: DependencyInfo[];
  dependenciesChecked: boolean;
  setDependencies: (deps: DependencyInfo[]) => void;
  setDependenciesChecked: (v: boolean) => void;

  // URL input
  urlInput: string;
  setUrlInput: (url: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentPage: 'home',
  setCurrentPage: (page) => set({ currentPage: page }),

  // Media analysis
  mediaInfo: null,
  isAnalyzing: false,
  analyzeError: null,
  setMediaInfo: (info) => set({ mediaInfo: info }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalyzeError: (err) => set({ analyzeError: err }),

  // Downloads
  downloads: [],
  setDownloads: (downloads) => set({
    downloads: downloads.reduce<DownloadJob[]>((acc, job) => {
      if (!acc.some((j) => j.id === job.id)) {
        acc.push(job);
      }
      return acc;
    }, []),
  }),
  updateDownload: (job) => set((state) => {
    const exists = state.downloads.some((d) => d.id === job.id);
    if (!exists) {
      return {
        downloads: [job as DownloadJob, ...state.downloads],
      };
    }
    return {
      downloads: state.downloads.map((d) =>
        d.id === job.id ? { ...d, ...job } : d
      ),
    };
  }),
  addDownload: (job) => set((state) => {
    const existingIndex = state.downloads.findIndex((d) => d.id === job.id);
    if (existingIndex >= 0) {
      const updated = [...state.downloads];
      updated[existingIndex] = { ...updated[existingIndex], ...job };
      return { downloads: updated };
    }
    return {
      downloads: [job, ...state.downloads],
    };
  }),
  removeDownload: (id) => set((state) => ({
    downloads: state.downloads.filter((d) => d.id !== id),
  })),
  clearCompletedDownloads: () => set((state) => ({
    downloads: state.downloads.filter(
      (d) => d.status === 'downloading' || d.status === 'processing' || d.status === 'queued'
    ),
  })),

  // History
  history: [],
  setHistory: (history) => set({ history }),
  addHistoryItem: (item) => set((state) => ({
    history: [item, ...state.history],
  })),
  removeHistoryItem: (id) => set((state) => ({
    history: state.history.filter((h) => h.id !== id),
  })),
  clearHistory: () => set({ history: [] }),

  // Settings
  settings: {
    downloadPath: '',
    maxConcurrentDownloads: 3,
    preferredFormat: 'mp4',
    preferredQuality: '1080p',
    audioOnly: false,
    theme: 'dark',
    autoLaunch: false,
  },
  setSettings: (settings) => set({ settings }),
  updateSettings: (partial) => set((state) => ({
    settings: { ...state.settings, ...partial },
  })),

  // Dependencies
  dependencies: [],
  dependenciesChecked: false,
  setDependencies: (deps) => set({ dependencies: deps }),
  setDependenciesChecked: (v) => set({ dependenciesChecked: v }),

  // URL input
  urlInput: '',
  setUrlInput: (url) => set({ urlInput: url }),
}));
