import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Info,
  Sparkles,
  Copy,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { ConfirmDialog } from '../components/ui/dialog';
import { useSettings } from '../hooks/useSettings';
import { useAppStore } from '../stores/app-store';
import type { DependencyInfo } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, saveSettings, resetSettings } = useSettings();
  const dependencies = useAppStore((s) => s.dependencies);
  const setDependencies = useAppStore((s) => s.setDependencies);

  const [checkingDeps, setCheckingDeps] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [installGuide, setInstallGuide] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    async function loadMeta() {
      try {
        const ver = await window.electronAPI.getAppVersion();
        if (ver) setAppVersion(ver);
      } catch (err) {
        console.error('Failed to get app version:', err);
      }
    }
    loadMeta();
  }, []);

  const handleSelectFolder = async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        await saveSettings({ downloadPath: folder });
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
    }
  };

  const handleCheckDependencies = async () => {
    setCheckingDeps(true);
    try {
      const deps = await window.electronAPI.checkDependencies();
      setDependencies(deps);
    } catch (err) {
      console.error('Failed to check dependencies:', err);
    } finally {
      setCheckingDeps(false);
    }
  };

  const handleInstallGuide = async (name: string) => {
    try {
      const result = await window.electronAPI.installDependency(name);
      setInstallGuide(result.message);
    } catch {
      setInstallGuide('Unable to fetch guide.');
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      await window.electronAPI.openExternal(url);
    } catch (err) {
      console.error('Failed to open external link:', err);
    }
  };

  const handleOpenExtensionFolder = async () => {
    try {
      await window.electronAPI.openExtensionFolder();
    } catch (err) {
      console.error('Failed to open extension folder:', err);
    }
  };

  const handleCopyUserscript = () => {
    const scriptCode = `// ==UserScript==
// @name         VideoGrabber Desktop Direct Download
// @match        https://*.youtube.com/*
// @match        https://*.vimeo.com/*
// @match        https://*.dailymotion.com/*
// @match        https://*.tiktok.com/*
// @match        https://*.soundcloud.com/*
// @run-at       document-end
// ==/UserScript==
(function() {
  function inject() {
    if (document.getElementById('vg-btn')) return;
    const target = document.querySelector('#top-level-buttons-computed') || document.body;
    const btn = document.createElement('button');
    btn.id = 'vg-btn';
    btn.innerHTML = '⚡ Télécharger';
    btn.style = 'background:#7c3aed;color:#fff;border:none;border-radius:18px;padding:6px 16px;font-weight:bold;cursor:pointer;margin-left:8px;';
    btn.onclick = () => window.location.href = 'videograbber://download?url=' + encodeURIComponent(window.location.href);
    target.appendChild(btn);
  }
  setInterval(inject, 1500);
})();`;

    navigator.clipboard.writeText(scriptCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Paramètres</h2>
        <p className="text-sm text-gray-400 mt-1">
          Configurez vos préférences de téléchargement, formats par défaut, intégration YouTube et dépendances locales.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. General Downloads Section */}
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-accent" />
            Préférences de téléchargement
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Download Path */}
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Dossier de téléchargement par défaut</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={settings.downloadPath}
                  className="bg-background cursor-default text-xs"
                />
                <Button variant="outline" onClick={handleSelectFolder}>
                  <FolderOpen className="h-4 w-4 mr-1.5" />
                  Parcourir
                </Button>
              </div>
            </div>

            {/* Max Concurrent */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Téléchargements simultanés maximum</label>
              <Select
                value={String(settings.maxConcurrentDownloads)}
                onChange={(e) => saveSettings({ maxConcurrentDownloads: parseInt(e.target.value, 10) })}
                options={[
                  { value: '1', label: '1 Téléchargement à la fois' },
                  { value: '2', label: '2 Téléchargements simultanés' },
                  { value: '3', label: '3 Simultanés (Recommandé)' },
                  { value: '5', label: '5 Simultanés' },
                ]}
              />
            </div>

            {/* Preferred Format */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Format vidéo par défaut</label>
              <Select
                value={settings.preferredFormat}
                onChange={(e) => saveSettings({ preferredFormat: e.target.value })}
                options={[
                  { value: 'mp4', label: 'MP4 (Compatible partout)' },
                  { value: 'mkv', label: 'MKV (Matroska)' },
                  { value: 'webm', label: 'WebM (VP9)' },
                  { value: 'mov', label: 'MOV (QuickTime)' },
                  { value: 'avi', label: 'AVI' },
                ]}
              />
            </div>

            {/* Preferred Audio Format */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Format audio par défaut</label>
              <Select
                value={settings.preferredAudioFormat || 'mp3'}
                onChange={(e) => saveSettings({ preferredAudioFormat: e.target.value })}
                options={[
                  { value: 'mp3', label: 'MP3' },
                  { value: 'm4a', label: 'M4A' },
                  { value: 'wav', label: 'WAV' },
                  { value: 'flac', label: 'FLAC' },
                  { value: 'opus', label: 'OPUS' },
                  { value: 'aac', label: 'AAC' },
                  { value: 'ogg', label: 'OGG' },
                ]}
              />
            </div>

            {/* Preferred Audio Bitrate */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Bitrate audio par défaut</label>
              <Select
                value={settings.preferredAudioBitrate || '320k'}
                onChange={(e) => saveSettings({ preferredAudioBitrate: e.target.value })}
                options={[
                  { value: '320k', label: '320 kbps (Excellente)' },
                  { value: '256k', label: '256 kbps (Très haute)' },
                  { value: '192k', label: '192 kbps (Standard)' },
                  { value: '128k', label: '128 kbps (Normale)' },
                  { value: '96k', label: '96 kbps' },
                  { value: '64k', label: '64 kbps' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* 2. YouTube & Browser Direct Download Integration */}
        <div className="bg-background-card border border-accent/40 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Icône de téléchargement sur YouTube & Navigateurs
            </h3>
            <span className="text-xs bg-accent/20 text-accent font-semibold px-2 py-0.5 rounded">
              Protocole videograbber://
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Ajoutez un bouton de téléchargement direct sous les vidéos et playlists YouTube, Vimeo, Dailymotion et SoundCloud. En un clic, la vidéo est envoyée directement à VideoGrabber Desktop !
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-background border border-border p-4 rounded-lg space-y-2">
              <span className="text-sm font-semibold text-white block">Option 1 : Extension Chrome / Edge / Brave</span>
              <p className="text-xs text-gray-400">
                Extension prête à l'emploi. Activez le mode développeur dans <code className="text-accent">chrome://extensions</code> et cliquez sur "Charger l'extension non empaquetée".
              </p>
              <Button variant="outline" size="sm" onClick={handleOpenExtensionFolder}>
                <FolderOpen className="h-4 w-4 mr-1.5" />
                Ouvrir le dossier de l'extension
              </Button>
            </div>

            <div className="bg-background border border-border p-4 rounded-lg space-y-2">
              <span className="text-sm font-semibold text-white block">Option 2 : Script Tampermonkey / Violentmonkey</span>
              <p className="text-xs text-gray-400">
                Fonctionne avec Tampermonkey ou Violentmonkey sur n'importe quel navigateur (Chrome, Firefox, Safari, Edge, Opera).
              </p>
              <Button variant="outline" size="sm" onClick={handleCopyUserscript}>
                <Copy className="h-4 w-4 mr-1.5" />
                {copySuccess ? 'Copié dans le presse-papiers !' : 'Copier le script Userscript'}
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Dependencies Status */}
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-accent" />
              Dépendances logicielles (yt-dlp & FFmpeg)
            </h3>
            <Button variant="outline" size="sm" onClick={handleCheckDependencies} loading={checkingDeps}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Vérifier l'état
            </Button>
          </div>

          <p className="text-xs text-gray-400">
            VideoGrabber utilise yt-dlp et FFmpeg pour l'extraction de flux, la conversion vidéo/audio et le mixage haute résolution.
          </p>

          <div className="space-y-3 pt-2">
            {dependencies.map((dep: DependencyInfo) => (
              <div
                key={dep.name}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div className="flex items-center gap-3">
                  {dep.installed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-white block uppercase">{dep.name}</span>
                    <span className="text-xs text-gray-500">
                      {dep.installed ? `Version : ${dep.version} (Opérationnel)` : 'Non détecté sur le PATH'}
                    </span>
                  </div>
                </div>

                {!dep.installed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInstallGuide(dep.name)}
                  >
                    Guide d'installation
                  </Button>
                )}
              </div>
            ))}
          </div>

          {installGuide && (
            <div className="p-4 bg-background border border-border rounded-lg text-xs space-y-2">
              <pre className="text-gray-300 font-mono whitespace-pre-wrap">{installGuide}</pre>
              <Button variant="ghost" size="sm" onClick={() => setInstallGuide(null)}>
                Fermer
              </Button>
            </div>
          )}
        </div>

        {/* 4. System & Startup */}
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-white">Intégration Système</h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-white">Lancer VideoGrabber au démarrage de Windows</p>
              <p className="text-xs text-gray-400">Démarrer automatiquement l'application en arrière-plan à la connexion.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoLaunch}
              onChange={async (e) => {
                const enable = e.target.checked;
                await window.electronAPI.setAutoLaunch(enable);
                await saveSettings({ autoLaunch: enable });
              }}
              className="h-4 w-4 rounded border-border bg-background text-accent focus:ring-accent cursor-pointer"
            />
          </div>
        </div>

        {/* 5. About & Legal */}
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-3">
          <h3 className="text-base font-semibold text-white">À propos de VideoGrabber Desktop</h3>
          <p className="text-xs text-gray-400">
            Version {appVersion} &bull; Édition Native Windows 64-bit
          </p>
          <div className="flex gap-4 text-xs text-accent-light pt-2">
            <button
              onClick={() => handleOpenLink('https://github.com/yt-dlp/yt-dlp')}
              className="hover:underline flex items-center gap-1"
            >
              Projet yt-dlp <ExternalLink className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleOpenLink('https://ffmpeg.org')}
              className="hover:underline flex items-center gap-1"
            >
              Projet FFmpeg <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 6. Danger Zone */}
        <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-6 space-y-3">
          <h3 className="text-base font-semibold text-red-400 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Réinitialisation
          </h3>
          <p className="text-xs text-gray-400">
            Rétablir les paramètres par défaut de l'application.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Réinitialiser tous les paramètres
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={resetSettings}
        title="Réinitialiser la configuration"
        description="Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs d'origine ?"
        confirmText="Réinitialiser"
        destructive
      />
    </div>
  );
};
