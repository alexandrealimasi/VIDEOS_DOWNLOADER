// IPC handlers for download history

import { ipcMain } from 'electron';
import { getStore } from './settings-handlers';
import { HistoryItem } from '../types';

export function registerHistoryHandlers() {
  const store = getStore();

  ipcMain.handle('get-history', async () => {
    return (store.get('history', []) as unknown) as HistoryItem[];
  });

  ipcMain.handle('add-history-item', async (_event, item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid history item');
    const history = (store.get('history', []) as unknown) as HistoryItem[];
    history.unshift(item as HistoryItem);
    // Keep last 500 items
    if (history.length > 500) {
      history.length = 500;
    }
    store.set('history', history);
  });

  ipcMain.handle('remove-history-item', async (_event, id: unknown) => {
    if (typeof id !== 'string') throw new Error('Invalid ID');
    const history = (store.get('history', []) as unknown) as HistoryItem[];
    const filtered = history.filter((item: HistoryItem) => item.id !== id);
    store.set('history', filtered);
  });

  ipcMain.handle('clear-history', async () => {
    store.set('history', []);
  });
}
