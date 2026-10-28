import React from 'react';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../../stores/app-store';
import { Home } from '../../pages/Home';
import { Downloads } from '../../pages/Downloads';
import { History } from '../../pages/History';
import { SettingsPage } from '../../pages/Settings';

export const AppLayout: React.FC = () => {
  const currentPage = useAppStore((s) => s.currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home />;
      case 'downloads': return <Downloads />;
      case 'history': return <History />;
      case 'settings': return <SettingsPage />;
      default: return <Home />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
};
