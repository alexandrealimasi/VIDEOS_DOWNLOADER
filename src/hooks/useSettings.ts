import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/app-store';
import type { AppSettings } from '../types';

export function useSettings() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const updateSettingsInStore = useAppStore((s) => s.updateSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const storedSettings = await window.electronAPI.getSettings();
        if (storedSettings) {
          setSettings(storedSettings);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, [setSettings]);

  const saveSettings = async (partial: Partial<AppSettings>) => {
    setLoading(true);
    try {
      const updated = await window.electronAPI.updateSettings(partial);
      updateSettingsInStore(updated);
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    setLoading(true);
    try {
      const defaults = await window.electronAPI.resetSettings();
      setSettings(defaults);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { settings, saveSettings, resetSettings, loading };
}
