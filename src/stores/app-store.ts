import { create } from 'zustand';
import type { Page, MediaInfo, PlaylistInfo, DownloadJob, HistoryItem, AppSettings, DependencyInfo, FfmpegJob } from '../types';

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

  // Playlist analysis
  playlistInfo: PlaylistInfo | null;
  isAnalyzingPlaylist: boolean;
  selectedPlaylistIds: string[];
  setPlaylistInfo: (info: PlaylistInfo | null) => void;
  setIsAnalyzingPlaylist: (v: boolean) => void;
  setSelectedPlaylistIds: (ids: string[]) => void;
  togglePlaylistId: (id: string) => void;
  selectAllPlaylistIds: () => void;
  deselectAllPlaylistIds: () => void;

  // FFmpeg jobs & dropped file for conversion
  ffmpegJobs: FfmpegJob[];
  droppedFilePath: string | null;
  setDroppedFilePath: (path: string | null) => void;
  addFfmpegJob: (job: FfmpegJob) => void;
  updateFfmpegJob: (job: Partial<FfmpegJob> & { id: string }) => void;
  removeFfmpegJob: (id: string) => void;

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

  // Playlist analysis
  playlistInfo: null,
  isAnalyzingPlaylist: false,
  selectedPlaylistIds: [],
  setPlaylistInfo: (info) => set({
    playlistInfo: info,
    selectedPlaylistIds: info ? info.videos.map((v) => v.id) : [],
  }),
  setIsAnalyzingPlaylist: (v) => set({ isAnalyzingPlaylist: v }),
  setSelectedPlaylistIds: (ids) => set({ selectedPlaylistIds: ids }),
  togglePlaylistId: (id) => set((state) => {
    const exists = state.selectedPlaylistIds.includes(id);
    return {
      selectedPlaylistIds: exists
        ? state.selectedPlaylistIds.filter((item) => item !== id)
        : [...state.selectedPlaylistIds, id],
    };
  }),
  selectAllPlaylistIds: () => set((state) => ({
    selectedPlaylistIds: state.playlistInfo ? state.playlistInfo.videos.map((v) => v.id) : [],
  })),
  deselectAllPlaylistIds: () => set({ selectedPlaylistIds: [] }),

  // FFmpeg conversion
  ffmpegJobs: [],
  droppedFilePath: null,
  setDroppedFilePath: (p) => set({ droppedFilePath: p }),
  addFfmpegJob: (job) => set((state) => {
    const existing = state.ffmpegJobs.findIndex((j) => j.id === job.id);
    if (existing >= 0) {
      const updated = [...state.ffmpegJobs];
      updated[existing] = { ...updated[existing], ...job };
      return { ffmpegJobs: updated };
    }
    return { ffmpegJobs: [job, ...state.ffmpegJobs] };
  }),
  updateFfmpegJob: (job) => set((state) => ({
    ffmpegJobs: state.ffmpegJobs.map((j) => (j.id === job.id ? { ...j, ...job } : j)),
  })),
  removeFfmpegJob: (id) => set((state) => ({
    ffmpegJobs: state.ffmpegJobs.filter((j) => j.id !== id),
  })),

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
    maxConcurrentDownloads: 1,
    preferredFormat: 'mp4',
    preferredQuality: '1080p',
    preferredAudioFormat: 'mp3',
    preferredAudioBitrate: '320k',
    audioOnly: false,
    theme: 'dark',
    autoLaunch: false,
    enableClipboardWatcher: true,
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
