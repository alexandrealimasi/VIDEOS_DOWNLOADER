import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  FolderOpen,
  FileVideo,
  Music,
  CheckCircle2,
  AlertCircle,
  Play,
  XCircle,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../stores/app-store';

const VIDEO_FORMAT_OPTIONS = [
  { value: 'mp4', label: 'MP4 (H.264 / AAC - Universel)' },
  { value: 'mkv', label: 'MKV (Matroska Multimédia)' },
  { value: 'webm', label: 'WEBM (VP9 / Opus - Web)' },
  { value: 'mov', label: 'MOV (Apple QuickTime)' },
  { value: 'avi', label: 'AVI (Audio Video Interleaved)' },
];

const AUDIO_FORMAT_OPTIONS = [
  { value: 'mp3', label: 'MP3 (MPEG Audio Layer 3)' },
  { value: 'm4a', label: 'M4A (Apple AAC Audio)' },
  { value: 'wav', label: 'WAV (Audio haute fidélité non compressé)' },
  { value: 'flac', label: 'FLAC (Lossless compression sans perte)' },
  { value: 'opus', label: 'OPUS (Codec interactif haute efficacité)' },
  { value: 'aac', label: 'AAC (Advanced Audio Coding)' },
  { value: 'ogg', label: 'OGG (Vorbis audio)' },
];

const RESOLUTION_OPTIONS = [
  { value: 'original', label: 'Résolution originale (Conserver)' },
  { value: '2160p', label: '4K Ultra HD (2160p)' },
  { value: '1440p', label: '2K Quad HD (1440p)' },
  { value: '1080p', label: 'Full HD (1080p)' },
  { value: '720p', label: 'HD Ready (720p)' },
  { value: '480p', label: 'SD (480p)' },
  { value: '360p', label: 'Compact (360p)' },
];

const BITRATE_OPTIONS = [
  { value: '320k', label: '320 kbps (Qualité maximale)' },
  { value: '256k', label: '256 kbps (Très haute qualité)' },
  { value: '192k', label: '192 kbps (Haute qualité standard)' },
  { value: '128k', label: '128 kbps (Qualité normale standard)' },
  { value: '96k', label: '96 kbps (Économique)' },
  { value: '64k', label: '64 kbps (Voix / Compact)' },
];

export const Converter: React.FC = () => {
  const droppedFilePath = useAppStore((s) => s.droppedFilePath);
  const setDroppedFilePath = useAppStore((s) => s.setDroppedFilePath);
  const ffmpegJobs = useAppStore((s) => s.ffmpegJobs);
  const removeFfmpegJob = useAppStore((s) => s.removeFfmpegJob);

  const [inputFilePath, setInputFilePath] = useState<string>(droppedFilePath || '');
  const [audioOnly, setAudioOnly] = useState<boolean>(false);
  const [targetFormat, setTargetFormat] = useState<string>('mp4');
  const [resolution, setResolution] = useState<string>('original');
  const [audioBitrate, setAudioBitrate] = useState<string>('320k');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (droppedFilePath) {
      setInputFilePath(droppedFilePath);
      setDroppedFilePath(null);
    }
  }, [droppedFilePath, setDroppedFilePath]);

  const handleSelectFile = async () => {
    try {
      const file = await window.electronAPI.selectFile();
      if (file) {
        setInputFilePath(file);
        setErrorMessage(null);
        setSuccessMessage(null);
      }
    } catch (err) {
      console.error('Failed to select file:', err);
    }
  };

  const handleStartConversion = async () => {
    if (!inputFilePath.trim()) {
      setErrorMessage('Veuillez sélectionner un fichier à convertir.');
      return;
    }

    setIsConverting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await window.electronAPI.convertFile({
        inputPath: inputFilePath.trim(),
        targetFormat,
        audioOnly,
        resolution: !audioOnly ? resolution : undefined,
        audioBitrate,
      });

      setSuccessMessage('Tâche de conversion ajoutée avec succès !');
    } catch (err) {
      setErrorMessage((err as Error).message || 'Échec du lancement de la conversion FFmpeg.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleCancelJob = async (id: string) => {
    try {
      await window.electronAPI.cancelConversion(id);
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const handleOpenFile = async (filePath: string) => {
    try {
      await window.electronAPI.openFile(filePath);
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  const handleOpenFolder = async (filePath: string) => {
    try {
      await window.electronAPI.openFolder(filePath);
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
          <RefreshCw className="h-6 w-6 text-accent" />
          Convertisseur & Extracteur FFmpeg
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Convertissez vos vidéos et fichiers locaux dans tous les formats majeurs (MP4, MKV, WEBM, MOV, AVI) ou extrayez l'audio haute qualité (MP3, M4A, WAV, FLAC, OPUS, AAC, OGG).
        </p>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        {/* Source file selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
            Fichier source local (Vidéo ou Audio)
          </label>
          <div className="flex gap-3">
            <Input
              type="text"
              readOnly
              placeholder="Cliquez sur Parcourir ou glissez-déposez un fichier ici..."
              value={inputFilePath}
              className="flex-1 bg-background"
            />
            <Button variant="outline" onClick={handleSelectFile}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Parcourir
            </Button>
          </div>
        </div>

        {/* Mode Selector: Video conversion vs Audio extraction */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm font-medium text-white flex items-center gap-2">
            {audioOnly ? <Music className="h-4 w-4 text-accent" /> : <FileVideo className="h-4 w-4 text-accent" />}
            Mode de conversion
          </span>
          <div className="flex rounded-lg border border-border p-1 bg-background">
            <button
              type="button"
              onClick={() => {
                setAudioOnly(false);
                setTargetFormat('mp4');
              }}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                !audioOnly ? 'bg-accent text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Conversion Vidéo
            </button>
            <button
              type="button"
              onClick={() => {
                setAudioOnly(true);
                setTargetFormat('mp3');
              }}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                audioOnly ? 'bg-accent text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Extraction Audio
            </button>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Format selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
              Format de sortie
            </label>
            <Select
              options={audioOnly ? AUDIO_FORMAT_OPTIONS : VIDEO_FORMAT_OPTIONS}
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
            />
          </div>

          {/* Resolution or Bitrate */}
          {!audioOnly ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                Résolution vidéo
              </label>
              <Select
                options={RESOLUTION_OPTIONS}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                Débit binaire audio (Bitrate)
              </label>
              <Select
                options={BITRATE_OPTIONS}
                value={audioBitrate}
                onChange={(e) => setAudioBitrate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Error / Success alerts */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button
            className="w-full py-6 text-base font-semibold shadow-lg shadow-accent/20"
            onClick={handleStartConversion}
            loading={isConverting}
            disabled={!inputFilePath || isConverting}
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            {audioOnly ? "Extraire l'audio avec FFmpeg" : 'Convertir la vidéo avec FFmpeg'}
          </Button>
        </div>
      </div>

      {/* Active & Recent Conversions */}
      {ffmpegJobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Historique des conversions</h3>
          </div>

          <div className="space-y-3">
            {ffmpegJobs.map((job) => (
              <div
                key={job.id}
                className="bg-background-card border border-border rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                      {job.audioOnly ? <Music className="h-5 w-5" /> : <FileVideo className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{job.filename}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        Source : {job.inputPath}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={job.status} />
                    <span className="text-xs uppercase font-mono px-2 py-0.5 bg-background border border-border rounded text-gray-300">
                      {job.targetFormat}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                {(job.status === 'processing' || job.status === 'queued') && (
                  <div className="space-y-1.5">
                    <Progress value={job.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{job.progress}% {job.speed ? `à ${job.speed}` : ''}</span>
                      <span>{job.time || 'Calcul en cours...'}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-gray-400">
                  <span>Créé le {new Date(job.createdAt).toLocaleTimeString()}</span>
                  <div className="flex items-center gap-2">
                    {job.status === 'processing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelJob(job.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Annuler
                      </Button>
                    )}
                    {job.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenFile(job.outputPath)}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Lire le fichier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenFolder(job.outputPath)}
                        >
                          <FolderOpen className="h-3.5 w-3.5 mr-1" />
                          Dossier
                        </Button>
                      </>
                    )}
                    {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFfmpegJob(job.id)}
                        className="text-gray-500 hover:text-red-400"
                        title="Supprimer de la liste"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
