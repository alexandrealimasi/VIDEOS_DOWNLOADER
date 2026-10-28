import React from 'react';
import { Home, Download, Clock, Settings, ArrowDownToLine } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import type { Page } from '../../types';

const navItems: { page: Page; icon: React.ElementType; label: string }[] = [
  { page: 'home', icon: Home, label: 'Home' },
  { page: 'downloads', icon: Download, label: 'Downloads' },
  { page: 'history', icon: Clock, label: 'History' },
  { page: 'settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const downloads = useAppStore((s) => s.downloads);
  const activeCount = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'queued' || d.status === 'processing'
  ).length;

  return (
    <aside className="w-64 h-full bg-background-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <ArrowDownToLine className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">VideoGrabber</h1>
          <p className="text-xs text-gray-500">Desktop</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ page, icon: Icon, label }) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-accent/15 text-accent-light'
                  : 'text-gray-400 hover:text-white hover:bg-background-hover'
                }
                focus:outline-none focus:ring-2 focus:ring-accent/50`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{label}</span>
              {page === 'downloads' && activeCount > 0 && (
                <span className="ml-auto bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {activeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-gray-600">
          Downloads are supported only where permitted by the source website's terms.
        </p>
      </div>
    </aside>
  );
};
