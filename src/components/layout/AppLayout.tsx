import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAppStore } from '../../stores/app-store';
import { Home } from '../../pages/Home';
import { Downloads } from '../../pages/Downloads';
import { Converter } from '../../pages/Converter';
import { History } from '../../pages/History';
import { SettingsPage } from '../../pages/Settings';
import { ArrowDownToLine, Link as LinkIcon, FileVideo } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setUrlInput = useAppStore((s) => s.setUrlInput);
  const setDroppedFilePath = useAppStore((s) => s.setDroppedFilePath);

  const [isDragging, setIsDragging] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home />;
      case 'downloads': return <Downloads />;
      case 'converter': return <Converter />;
      case 'history': return <History />;
      case 'settings': return <SettingsPage />;
      default: return <Home />;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the main container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // 1. Check for local files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0] as File & { path?: string };
      const filePath = file.path || file.name;
      if (filePath) {
        setDroppedFilePath(filePath);
        setCurrentPage('converter');
        return;
      }
    }

    // 2. Check for URLs or text
    const droppedText = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (droppedText && droppedText.trim().startsWith('http')) {
      const url = droppedText.trim().split('\n')[0].trim();
      setUrlInput(url);
      setCurrentPage('home');
    }
  };

  return (
    <div
      className="relative flex h-screen bg-background overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>

      {/* Visual Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 border-4 border-dashed border-accent m-4 rounded-2xl animate-in fade-in duration-200">
          <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center text-accent mb-6 animate-bounce">
            <ArrowDownToLine className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Déposez votre contenu ici</h2>
          <p className="text-gray-400 text-sm max-w-md text-center mb-8">
            Glissez-déposez n'importe quel lien YouTube, playlist ou fichier vidéo/audio local pour analyse ou conversion instantanée.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
            <div className="bg-background-card border border-border p-4 rounded-xl flex items-center gap-3">
              <LinkIcon className="h-6 w-6 text-accent flex-shrink-0" />
              <div className="text-left text-xs">
                <span className="font-semibold text-white block">Liens & Playlists</span>
                <span className="text-gray-400">YouTube, Vimeo, SoundCloud...</span>
              </div>
            </div>
            <div className="bg-background-card border border-border p-4 rounded-xl flex items-center gap-3">
              <FileVideo className="h-6 w-6 text-accent flex-shrink-0" />
              <div className="text-left text-xs">
                <span className="font-semibold text-white block">Fichiers locaux</span>
                <span className="text-gray-400">MP4, MKV, AVI, MP3, WAV...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
