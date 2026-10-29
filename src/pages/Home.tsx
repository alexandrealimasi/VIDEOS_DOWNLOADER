import React, { useState } from 'react';
import {
  Clipboard,
  Search,
  Download,
  FolderOpen,
  X,
  Clock,
  User,
  Globe,
  Film,
  Music,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { useAppStore } from '../stores/app-store';
import type { MediaFormat } from '../types';

export const Home: React.FC = () => {
  const urlInput = useAppStore((s) => s.urlInput);
  const setUrlInput = useAppStore((s) => s.setUrlInput);
  const mediaInfo = useAppStore((s) => s.mediaInfo);
  const setMediaInfo = useAppStore((s) => s.setMediaInfo);
  const isAnalyzing = useAppStore((s) => s.isAnalyzing);
  const setIsAnalyzing = useAppStore((s) => s.setIsAnalyzing);
  const analyzeError = useAppStore((s) => s.analyzeError);
  const setAnalyzeError = useAppStore((s) => s.setAnalyzeError);
  const settings = useAppStore((s) => s.settings);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const [selectedFormatId, setSelectedFormatId] = useState<string>('best');
  const [selectedQuality, setSelectedQuality] = useState<string>('best');
  const [audioOnly, setAudioOnly] = useState<boolean>(settings.audioOnly || false);
  const [customDownloadPath, setCustomDownloadPath] = useState<string>('');
  const [downloadStarting, setDownloadStarting] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await window.electronAPI.readClipboard();
      if (text) {
        setUrlInput(text);
        setAnalyzeError(null);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleClear = () => {
    setUrlInput('');
    setMediaInfo(null);
    setAnalyzeError(null);
    setDownloadSuccessMessage(null);
  };

  const handleAnalyze = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setAnalyzeError('Please enter a valid video URL.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setMediaInfo(null);
    setDownloadSuccessMessage(null);

    try {
      const info = await window.electronAPI.analyzeUrl(trimmed);
      setMediaInfo(info);

      // Pre-select format based on availability and preferences
      if (info.bestFormat) {
        setSelectedFormatId(info.bestFormat.formatId);
        setSelectedQuality(info.bestFormat.quality);
      } else if (info.formats && info.formats.length > 0) {
        setSelectedFormatId(info.formats[0].formatId);
        setSelectedQuality(info.formats[0].quality);
      }
    } catch (err) {
      setAnalyzeError((err as Error).message || 'Failed to analyze URL.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setCustomDownloadPath(folder);
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
    }
  };

  const handleStartDownload = async () => {
    if (!mediaInfo || downloadStarting) return;

    setDownloadStarting(true);
    setDownloadSuccessMessage(null);

    const effectivePath = customDownloadPath || settings.downloadPath;
    let ext = 'mp4';

    if (audioOnly) {
      ext = 'mp3';
    } else {
      const fmt = mediaInfo.formats.find((f: MediaFormat) => f.formatId === selectedFormatId);
      if (fmt && fmt.ext) {
        ext = fmt.ext;
      }
    }

    try {
      await window.electronAPI.startDownload({
        url: urlInput.trim(),
        formatId: selectedFormatId,
        quality: selectedQuality,
        ext,
        audioOnly,
        outputPath: effectivePath,
        title: mediaInfo.title,
        thumbnail: mediaInfo.thumbnail,
      });

      setDownloadSuccessMessage('Download added to queue!');
      setTimeout(() => {
        setCurrentPage('downloads');
      }, 1000);
    } catch (err) {
      setAnalyzeError((err as Error).message || 'Failed to start download.');
    } finally {
      setDownloadStarting(false);
    }
  };

  const formatOptions = mediaInfo
    ? mediaInfo.formats.map((f: MediaFormat) => ({
        value: f.formatId,
        label: `${f.quality} - ${f.ext.toUpperCase()} ${f.filesizeApprox ? `(~${Math.round(f.filesizeApprox / 1024 / 1024)}MB)` : ''}`,
      }))
    : [];

  const audioOptions = mediaInfo
    ? mediaInfo.audioFormats.map((f: MediaFormat) => ({
        value: f.formatId,
        label: `${f.ext.toUpperCase()} ${f.quality || ''}`,
      }))
    : [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Downloader</h2>
        <p className="text-sm text-gray-400 mt-1">
          Paste any authorized video URL to inspect available streams, select quality, and start downloading.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
          Media Source URL
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnalyze();
              }}
              className="pr-10"
            />
            {urlInput && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                title="Clear input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={handlePaste} title="Paste from clipboard">
            <Clipboard className="h-4 w-4" />
            Paste
          </Button>
          <Button onClick={handleAnalyze} loading={isAnalyzing}>
            <Search className="h-4 w-4" />
            Analyze
          </Button>
        </div>

        {analyzeError && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error analyzing URL</p>
              <p className="text-xs text-red-300 mt-0.5">{analyzeError}</p>
            </div>
          </div>
        )}

        {downloadSuccessMessage && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{downloadSuccessMessage} Redirecting to Downloads...</span>
          </div>
        )}
      </div>

      {/* Media Inspection Preview */}
      {mediaInfo && (
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-full md:w-80 flex-shrink-0">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-background border border-border shadow-inner">
                {mediaInfo.thumbnail ? (
                  <img
                    src={mediaInfo.thumbnail}
                    alt={mediaInfo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Film className="h-10 w-10" />
                  </div>
                )}
                {mediaInfo.durationFormatted && (
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono">
                    {mediaInfo.durationFormatted}
                  </span>
                )}
              </div>
            </div>

            {/* Info details */}
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-bold text-white leading-snug line-clamp-2">
                {mediaInfo.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="truncate">{mediaInfo.uploader || 'Unknown Channel'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Duration: {mediaInfo.durationFormatted || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate text-gray-400">{mediaInfo.webpageUrl}</span>
                </div>
              </div>

              {mediaInfo.description && (
                <p className="text-xs text-gray-400 line-clamp-3 bg-background/50 p-3 rounded-lg border border-border">
                  {mediaInfo.description}
                </p>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audio Toggle & Format */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  {audioOnly ? <Music className="h-4 w-4 text-accent" /> : <Film className="h-4 w-4 text-accent" />}
                  Download Mode
                </span>
                <div className="flex rounded-lg border border-border p-1 bg-background">
                  <button
                    type="button"
                    onClick={() => {
                      setAudioOnly(false);
                      if (mediaInfo) {
                        if (mediaInfo.bestFormat) {
                          setSelectedFormatId(mediaInfo.bestFormat.formatId);
                          setSelectedQuality(mediaInfo.bestFormat.quality);
                        } else if (mediaInfo.formats && mediaInfo.formats.length > 0) {
                          setSelectedFormatId(mediaInfo.formats[0].formatId);
                          setSelectedQuality(mediaInfo.formats[0].quality);
                        }
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      !audioOnly ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Video
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioOnly(true);
                      if (mediaInfo?.audioFormats && mediaInfo.audioFormats.length > 0) {
                        setSelectedFormatId(mediaInfo.audioFormats[0].formatId);
                        setSelectedQuality(mediaInfo.audioFormats[0].quality || 'MP3 Audio');
                      } else {
                        setSelectedFormatId('best');
                        setSelectedQuality('MP3 Audio');
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      audioOnly ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Audio Only (MP3)
                  </button>
                </div>
              </div>

              {/* Format selection */}
              {!audioOnly ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                    Resolution & Format
                  </label>
                  {formatOptions.length > 0 ? (
                    <Select
                      options={formatOptions}
                      value={selectedFormatId}
                      onChange={(e) => {
                        setSelectedFormatId(e.target.value);
                        const match = mediaInfo.formats.find((f: MediaFormat) => f.formatId === e.target.value);
                        if (match) setSelectedQuality(match.quality);
                      }}
                    />
                  ) : (
                    <p className="text-xs text-gray-500">Auto / Best format available</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                    Audio Stream
                  </label>
                  {audioOptions.length > 0 ? (
                    <Select
                      options={audioOptions}
                      value={selectedFormatId}
                      onChange={(e) => {
                        setSelectedFormatId(e.target.value);
                        const match = mediaInfo.audioFormats.find((f: MediaFormat) => f.formatId === e.target.value);
                        if (match) setSelectedQuality(match.quality || 'MP3 Audio');
                      }}
                    />
                  ) : (
                    <p className="text-xs text-gray-500">Best available audio stream (MP3)</p>
                  )}
                </div>
              )}
            </div>

            {/* Destination folder */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                  Save To Directory
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    readOnly
                    value={customDownloadPath || settings.downloadPath || 'Default Downloads Folder'}
                    className="cursor-default bg-background"
                  />
                  <Button variant="outline" onClick={handleSelectFolder} title="Change folder">
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  className="w-full py-6 text-base font-semibold shadow-lg shadow-accent/20"
                  onClick={handleStartDownload}
                  loading={downloadStarting}
                  disabled={downloadStarting || isAnalyzing}
                >
                  <Download className="h-5 w-5" />
                  Start Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
