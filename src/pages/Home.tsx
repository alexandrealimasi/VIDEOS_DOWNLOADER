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
  ListVideo,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { useAppStore } from '../stores/app-store';
import type { MediaFormat } from '../types';

const VIDEO_CONTAINER_OPTIONS = [
  { value: 'mp4', label: 'MP4 (Recommandé / H.264)' },
  { value: 'mkv', label: 'MKV (Matroska)' },
  { value: 'webm', label: 'WEBM (VP9)' },
  { value: 'mov', label: 'MOV (QuickTime)' },
  { value: 'avi', label: 'AVI' },
];

const AUDIO_CONTAINER_OPTIONS = [
  { value: 'mp3', label: 'MP3 (Universel)' },
  { value: 'm4a', label: 'M4A (AAC Apple)' },
  { value: 'wav', label: 'WAV (Non compressé)' },
  { value: 'flac', label: 'FLAC (Sans perte / Lossless)' },
  { value: 'opus', label: 'OPUS (Haute fidélité)' },
  { value: 'aac', label: 'AAC (Codec haute efficacité)' },
  { value: 'ogg', label: 'OGG (Vorbis)' },
];

const AUDIO_BITRATE_OPTIONS = [
  { value: '320k', label: '320 kbps (Excellente qualité)' },
  { value: '256k', label: '256 kbps (Très haute qualité)' },
  { value: '192k', label: '192 kbps (Qualité standard)' },
  { value: '128k', label: '128 kbps (Bonne qualité)' },
  { value: '96k', label: '96 kbps (Compact)' },
  { value: '64k', label: '64 kbps (Voix)' },
];

export const Home: React.FC = () => {
  const urlInput = useAppStore((s) => s.urlInput);
  const setUrlInput = useAppStore((s) => s.setUrlInput);
  const mediaInfo = useAppStore((s) => s.mediaInfo);
  const setMediaInfo = useAppStore((s) => s.setMediaInfo);
  const isAnalyzing = useAppStore((s) => s.isAnalyzing);
  const setIsAnalyzing = useAppStore((s) => s.setIsAnalyzing);
  const analyzeError = useAppStore((s) => s.analyzeError);
  const setAnalyzeError = useAppStore((s) => s.setAnalyzeError);

  // Playlist store
  const playlistInfo = useAppStore((s) => s.playlistInfo);
  const setPlaylistInfo = useAppStore((s) => s.setPlaylistInfo);
  const isAnalyzingPlaylist = useAppStore((s) => s.isAnalyzingPlaylist);
  const setIsAnalyzingPlaylist = useAppStore((s) => s.setIsAnalyzingPlaylist);
  const selectedPlaylistIds = useAppStore((s) => s.selectedPlaylistIds);
  const togglePlaylistId = useAppStore((s) => s.togglePlaylistId);
  const selectAllPlaylistIds = useAppStore((s) => s.selectAllPlaylistIds);
  const deselectAllPlaylistIds = useAppStore((s) => s.deselectAllPlaylistIds);

  const settings = useAppStore((s) => s.settings);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  const [selectedFormatId, setSelectedFormatId] = useState<string>('best');
  const [selectedQuality, setSelectedQuality] = useState<string>('best');
  const [videoContainer, setVideoContainer] = useState<string>('mp4');
  const [audioContainer, setAudioContainer] = useState<string>('mp3');
  const [audioBitrate, setAudioBitrate] = useState<string>('320k');
  const [audioOnly, setAudioOnly] = useState<boolean>(settings.audioOnly || false);
  const [customDownloadPath, setCustomDownloadPath] = useState<string>('');
  const [downloadStarting, setDownloadStarting] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const isPlaylistDetected =
    urlInput.toLowerCase().includes('list=') ||
    urlInput.toLowerCase().includes('/playlist') ||
    Boolean(mediaInfo?.isPlaylist);

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
    setPlaylistInfo(null);
    setAnalyzeError(null);
    setDownloadSuccessMessage(null);
  };

  const handleAnalyze = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setAnalyzeError('Veuillez saisir une URL valide.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setMediaInfo(null);
    setDownloadSuccessMessage(null);

    // If it's explicitly a playlist URL, analyze playlist automatically
    if (trimmed.includes('list=') && (trimmed.includes('/playlist') || !trimmed.includes('/watch'))) {
      setIsAnalyzing(false);
      handleAnalyzePlaylist();
      return;
    }

    try {
      const info = await window.electronAPI.analyzeUrl(trimmed);
      setMediaInfo(info);

      if (info.bestFormat) {
        setSelectedFormatId(info.bestFormat.formatId);
        setSelectedQuality(info.bestFormat.quality);
        if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(info.bestFormat.ext.toLowerCase())) {
          setVideoContainer(info.bestFormat.ext.toLowerCase());
        }
      } else if (info.formats && info.formats.length > 0) {
        setSelectedFormatId(info.formats[0].formatId);
        setSelectedQuality(info.formats[0].quality);
      }
    } catch (err) {
      setAnalyzeError((err as Error).message || 'Échec de l\'analyse de la vidéo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzePlaylist = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setAnalyzeError('Veuillez saisir une URL de playlist valide.');
      return;
    }

    setIsAnalyzingPlaylist(true);
    setAnalyzeError(null);
    setPlaylistInfo(null);

    try {
      const pInfo = await window.electronAPI.analyzePlaylist(trimmed);
      setPlaylistInfo(pInfo);
    } catch (err) {
      setAnalyzeError((err as Error).message || 'Échec de l\'analyse de la playlist.');
    } finally {
      setIsAnalyzingPlaylist(false);
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
    const ext = audioOnly ? audioContainer : videoContainer;

    try {
      await window.electronAPI.startDownload({
        url: urlInput.trim(),
        formatId: selectedFormatId,
        quality: selectedQuality,
        ext,
        audioOnly,
        audioBitrate,
        outputPath: effectivePath,
        title: mediaInfo.title,
        thumbnail: mediaInfo.thumbnail,
      });

      setDownloadSuccessMessage('Téléchargement ajouté à la file d\'attente !');
      setTimeout(() => {
        setCurrentPage('downloads');
      }, 1000);
    } catch (err) {
      setAnalyzeError((err as Error).message || 'Échec du démarrage du téléchargement.');
    } finally {
      setDownloadStarting(false);
    }
  };

  const handleStartPlaylistDownload = async () => {
    if (!playlistInfo || selectedPlaylistIds.length === 0 || downloadStarting) return;

    setDownloadStarting(true);
    setDownloadSuccessMessage(null);

    const effectivePath = customDownloadPath || settings.downloadPath;
    const ext = audioOnly ? audioContainer : videoContainer;
    const selectedVideos = playlistInfo.videos.filter((v) => selectedPlaylistIds.includes(v.id));

    try {
      await window.electronAPI.startPlaylistDownload(
        {
          url: urlInput.trim(),
          formatId: selectedFormatId,
          quality: selectedQuality,
          ext,
          audioOnly,
          audioBitrate,
          outputPath: effectivePath,
          title: playlistInfo.title,
          thumbnail: playlistInfo.thumbnail,
        },
        selectedVideos
      );

      setDownloadSuccessMessage(`${selectedVideos.length} vidéos de la playlist ajoutées à la file !`);
      setTimeout(() => {
        setCurrentPage('downloads');
      }, 1000);
    } catch (err) {
      setAnalyzeError((err as Error).message || 'Échec du téléchargement de la playlist.');
    } finally {
      setDownloadStarting(false);
    }
  };

  const formatOptions = mediaInfo
    ? mediaInfo.formats.map((f: MediaFormat) => ({
        value: f.formatId,
        label: `${f.quality} - ${f.ext.toUpperCase()} ${
          f.filesizeApprox ? `(~${Math.round(f.filesizeApprox / 1024 / 1024)}MB)` : ''
        }`,
      }))
    : [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Downloader Multimédia</h2>
          <p className="text-sm text-gray-400 mt-1">
            Téléchargement de vidéos & playlists YouTube, conversion FFmpeg, sélection de résolution et de bitrate audio.
          </p>
        </div>

        {/* Quick button to browser integration in settings */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage('settings')}
          className="text-xs text-accent-light border-accent/40 bg-accent/10 hover:bg-accent/20"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5 text-accent" />
          Extension YouTube & Navigateur
        </Button>
      </div>

      {/* Input Card */}
      <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
            URL Vidéo ou Playlist
          </label>
          <span className="text-xs text-gray-500">
            Glissez-déposez un lien ou collez depuis le presse-papiers
          </span>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... ou /playlist?list=..."
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
                title="Effacer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" onClick={handlePaste} title="Coller depuis le presse-papiers">
            <Clipboard className="h-4 w-4 mr-1.5" />
            Coller
          </Button>
          <Button onClick={handleAnalyze} loading={isAnalyzing}>
            <Search className="h-4 w-4 mr-1.5" />
            Analyser
          </Button>
          {isPlaylistDetected && (
            <Button
              variant="outline"
              onClick={handleAnalyzePlaylist}
              loading={isAnalyzingPlaylist}
              className="border-accent text-accent hover:bg-accent/10"
              title="Analyser l'ensemble de la playlist"
            >
              <ListVideo className="h-4 w-4 mr-1.5" />
              Playlist
            </Button>
          )}
        </div>

        {/* Playlist Detection Pill */}
        {isPlaylistDetected && !playlistInfo && (
          <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent/20 rounded-lg text-xs text-accent-light">
            <span className="flex items-center gap-2">
              <ListVideo className="h-4 w-4 text-accent" />
              Une playlist YouTube a été détectée dans ce lien.
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAnalyzePlaylist}
              loading={isAnalyzingPlaylist}
              className="text-xs text-accent hover:text-white h-7"
            >
              Charger toute la playlist
            </Button>
          </div>
        )}

        {analyzeError && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Erreur lors de l'analyse</p>
              <p className="text-xs text-red-300 mt-0.5">{analyzeError}</p>
            </div>
          </div>
        )}

        {downloadSuccessMessage && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{downloadSuccessMessage} Redirection vers Téléchargements...</span>
          </div>
        )}
      </div>

      {/* PLAYLIST INSPECTION CARD */}
      {playlistInfo && (
        <div className="bg-background-card border border-accent/30 rounded-xl p-6 shadow-md space-y-6 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-accent/20 overflow-hidden flex items-center justify-center flex-shrink-0 border border-accent/30">
                {playlistInfo.thumbnail ? (
                  <img src={playlistInfo.thumbnail} alt={playlistInfo.title} className="w-full h-full object-cover" />
                ) : (
                  <ListVideo className="h-8 w-8 text-accent" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-accent/20 text-accent rounded uppercase">
                    Playlist YouTube
                  </span>
                  <span className="text-xs text-gray-400">
                    {playlistInfo.videoCount} vidéos trouvées
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{playlistInfo.title}</h3>
                <p className="text-xs text-gray-400">{playlistInfo.uploader || 'Chaîne inconnue'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllPlaylistIds}>
                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                Tout cocher
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAllPlaylistIds}>
                <Square className="h-3.5 w-3.5 mr-1" />
                Tout décocher
              </Button>
            </div>
          </div>

          {/* Videos Checklist */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 border border-border rounded-lg p-2 bg-background/50">
            {playlistInfo.videos.map((video, idx) => {
              const isSelected = selectedPlaylistIds.includes(video.id);
              return (
                <div
                  key={video.id}
                  onClick={() => togglePlaylistId(video.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent/15 border border-accent/30 text-white'
                      : 'hover:bg-background-hover text-gray-300 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Controlled by row click
                    className="rounded border-gray-600 text-accent focus:ring-accent h-4 w-4 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-gray-500 w-6 text-right">#{idx + 1}</span>
                  {video.thumbnail && (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-12 h-8 rounded object-cover flex-shrink-0 bg-background"
                    />
                  )}
                  <span className="text-xs font-medium flex-1 truncate">{video.title}</span>
                  <span className="text-xs text-gray-400 font-mono flex-shrink-0">
                    {video.durationFormatted}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Format Options & Batch Download */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Mode</label>
              <Select
                options={[
                  { value: 'video', label: 'Vidéos complètes' },
                  { value: 'audio', label: 'Audio uniquement' },
                ]}
                value={audioOnly ? 'audio' : 'video'}
                onChange={(e) => setAudioOnly(e.target.value === 'audio')}
              />
            </div>

            {!audioOnly ? (
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Format Vidéo</label>
                <Select
                  options={VIDEO_CONTAINER_OPTIONS}
                  value={videoContainer}
                  onChange={(e) => setVideoContainer(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">Format & Bitrate Audio</label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    options={AUDIO_CONTAINER_OPTIONS}
                    value={audioContainer}
                    onChange={(e) => setAudioContainer(e.target.value)}
                  />
                  <Select
                    options={AUDIO_BITRATE_OPTIONS}
                    value={audioBitrate}
                    onChange={(e) => setAudioBitrate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-end">
              <Button
                className="w-full py-5 text-sm font-semibold shadow-lg shadow-accent/20"
                onClick={handleStartPlaylistDownload}
                loading={downloadStarting}
                disabled={selectedPlaylistIds.length === 0 || downloadStarting}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger la sélection ({selectedPlaylistIds.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE MEDIA INSPECTION PREVIEW */}
      {mediaInfo && !playlistInfo && (
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
                  <span className="truncate">{mediaInfo.uploader || 'Chaîne inconnue'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Durée : {mediaInfo.durationFormatted || 'Inconnue'}</span>
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
                  Mode de téléchargement
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
                    Vidéo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAudioOnly(true);
                      if (mediaInfo?.audioFormats && mediaInfo.audioFormats.length > 0) {
                        setSelectedFormatId(mediaInfo.audioFormats[0].formatId);
                        setSelectedQuality(mediaInfo.audioFormats[0].quality || 'Audio');
                      } else {
                        setSelectedFormatId('best');
                        setSelectedQuality('Audio');
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      audioOnly ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Audio uniquement
                  </button>
                </div>
              </div>

              {/* Format selection */}
              {!audioOnly ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Résolution détectée
                    </label>
                    {formatOptions.length > 0 ? (
                      <Select
                        options={formatOptions}
                        value={selectedFormatId}
                        onChange={(e) => {
                          setSelectedFormatId(e.target.value);
                          const match = mediaInfo.formats.find((f: MediaFormat) => f.formatId === e.target.value);
                          if (match) {
                            setSelectedQuality(match.quality);
                            if (['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(match.ext.toLowerCase())) {
                              setVideoContainer(match.ext.toLowerCase());
                            }
                          }
                        }}
                      />
                    ) : (
                      <p className="text-xs text-gray-500">Meilleure résolution automatique</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Format de conteneur vidéo (MP4, MKV, WEBM, MOV, AVI)
                    </label>
                    <Select
                      options={VIDEO_CONTAINER_OPTIONS}
                      value={videoContainer}
                      onChange={(e) => setVideoContainer(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Format Audio
                    </label>
                    <Select
                      options={AUDIO_CONTAINER_OPTIONS}
                      value={audioContainer}
                      onChange={(e) => setAudioContainer(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Débit binaire (Bitrate)
                    </label>
                    <Select
                      options={AUDIO_BITRATE_OPTIONS}
                      value={audioBitrate}
                      onChange={(e) => setAudioBitrate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Destination folder */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                  Dossier d'enregistrement
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    readOnly
                    value={customDownloadPath || settings.downloadPath || 'Dossier Téléchargements par défaut'}
                    className="cursor-default bg-background"
                  />
                  <Button variant="outline" onClick={handleSelectFolder} title="Changer de dossier">
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
                  <Download className="h-5 w-5 mr-2" />
                  Démarrer le téléchargement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
