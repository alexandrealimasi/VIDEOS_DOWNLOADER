import React, { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { DependencyCheck } from './components/DependencyCheck';
import { useDownloadListeners } from './hooks/useDownloadListeners';
import { useAppStore } from './stores/app-store';

export const App: React.FC = () => {
  const dependenciesChecked = useAppStore((s) => s.dependenciesChecked);
  const setDependencies = useAppStore((s) => s.setDependencies);
  const setSettings = useAppStore((s) => s.setSettings);
  const setDownloads = useAppStore((s) => s.setDownloads);

  // Hook up real-time IPC download streams
  useDownloadListeners();

  useEffect(() => {
    async function initApp() {
      try {
        // Load settings
        const settings = await window.electronAPI.getSettings();
        if (settings) {
          setSettings(settings);
        }

        // Check dependencies initially
        const deps = await window.electronAPI.checkDependencies();
        setDependencies(deps);

        // Fetch active queue if any
        const active = await window.electronAPI.getActiveDownloads();
        if (active) {
          setDownloads(active);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    initApp();
  }, [setDependencies, setSettings, setDownloads]);

  return (
    <div className="w-full h-full text-white bg-background select-none">
      {!dependenciesChecked ? <DependencyCheck /> : <AppLayout />}
    </div>
  );
};

export default App;
