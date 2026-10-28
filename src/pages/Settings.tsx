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
    } catch (err) {
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

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-sm text-gray-400 mt-1">
          Configure default download folders, engine limits, system preferences, and runtime dependencies.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. General Downloads Section */}
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-accent" />
            Download Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Download Path */}
            <div className="col-span-1 md:col-span-2 space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Default Download Directory</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={settings.downloadPath}
                  className="bg-background cursor-default text-xs"
                />
                <Button variant="outline" onClick={handleSelectFolder}>
                  <FolderOpen className="h-4 w-4" />
                  Browse
                </Button>
              </div>
            </div>

            {/* Max Concurrent */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Max Simultaneous Downloads</label>
              <Select
                value={String(settings.maxConcurrentDownloads)}
                onChange={(e) => saveSettings({ maxConcurrentDownloads: parseInt(e.target.value, 10) })}
                options={[
                  { value: '1', label: '1 Download' },
                  { value: '2', label: '2 Simultaneous' },
                  { value: '3', label: '3 Simultaneous (Recommended)' },
                  { value: '5', label: '5 Simultaneous' },
                ]}
              />
            </div>

            {/* Preferred Format */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-gray-400">Preferred Container</label>
              <Select
                value={settings.preferredFormat}
                onChange={(e) => saveSettings({ preferredFormat: e.target.value })}
                options={[
                  { value: 'mp4', label: 'MP4 (Widely Compatible)' },
                  { value: 'webm', label: 'WebM' },
                  { value: 'mkv', label: 'MKV' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* 2. Dependencies Status */}
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-accent" />
              Runtime Dependencies
            </h3>
            <Button variant="outline" size="sm" onClick={handleCheckDependencies} loading={checkingDeps}>
              <RefreshCw className="h-3.5 w-3.5" />
              Check Status
            </Button>
          </div>

          <p className="text-xs text-gray-400">
            VideoGrabber relies on local installations of yt-dlp and FFmpeg to process and extract streams safely.
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
                    <span className="text-sm font-medium text-white block capitalize">{dep.name}</span>
                    <span className="text-xs text-gray-500">
                      {dep.installed ? `Version: ${dep.version} (Active)` : 'Not detected on system PATH'}
                    </span>
                  </div>
                </div>

                {!dep.installed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInstallGuide(dep.name)}
                  >
                    Setup Guide
                  </Button>
                )}
              </div>
            ))}
          </div>

          {installGuide && (
            <div className="p-4 bg-background border border-border rounded-lg text-xs space-y-2">
              <pre className="text-gray-300 font-mono whitespace-pre-wrap">{installGuide}</pre>
              <Button variant="ghost" size="sm" onClick={() => setInstallGuide(null)}>
                Dismiss
              </Button>
            </div>
          )}
        </div>

        {/* 3. System & Startup */}
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-white">System Integration</h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-white">Start VideoGrabber on Windows Boot</p>
              <p className="text-xs text-gray-400">Automatically launch the app in the background when logging into Windows.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoLaunch}
              onChange={async (e) => {
                const enable = e.target.checked;
                await window.electronAPI.setAutoLaunch(enable);
                await saveSettings({ autoLaunch: enable });
              }}
              className="h-4 w-4 rounded border-border bg-background text-accent focus:ring-accent"
            />
          </div>
        </div>

        {/* 4. About & Legal */}
        <div className="bg-background-card border border-border rounded-xl p-6 shadow-sm space-y-3">
          <h3 className="text-base font-semibold text-white">About VideoGrabber Desktop</h3>
          <p className="text-xs text-gray-400">
            Version {appVersion} &bull; Native Windows 64-bit Edition
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            VideoGrabber Desktop is built to facilitate personal video and audio archiving solely from sources where
            downloading is permitted by the rights holders, public domain, or open licenses. Please respect intellectual property laws.
          </p>
          <div className="flex gap-4 text-xs text-accent-light pt-2">
            <button
              onClick={() => handleOpenLink('https://github.com/yt-dlp/yt-dlp')}
              className="hover:underline flex items-center gap-1"
            >
              yt-dlp Project <ExternalLink className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleOpenLink('https://ffmpeg.org')}
              className="hover:underline flex items-center gap-1"
            >
              FFmpeg Project <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* 5. Danger Zone */}
        <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-6 space-y-3">
          <h3 className="text-base font-semibold text-red-400 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Reset Defaults
          </h3>
          <p className="text-xs text-gray-400">
            Revert all download preferences and configuration flags back to the clean default factory settings.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Settings
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={resetSettings}
        title="Reset Configuration"
        description="Are you sure you want to reset all preferences to their initial defaults?"
        confirmText="Reset"
        destructive
      />
    </div>
  );
};
