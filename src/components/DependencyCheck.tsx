import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, RefreshCw, ArrowDownToLine } from 'lucide-react';
import { Button } from './ui/button';
import { useAppStore } from '../stores/app-store';

export const DependencyCheck: React.FC = () => {
  const dependencies = useAppStore((s) => s.dependencies);
  const setDependencies = useAppStore((s) => s.setDependencies);
  const setDependenciesChecked = useAppStore((s) => s.setDependenciesChecked);
  const [checking, setChecking] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(null);

  const allInstalled = dependencies.every((d) => d.installed);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const deps = await window.electronAPI.checkDependencies();
      setDependencies(deps);
    } catch {
      // Keep current state
    }
    setChecking(false);
  };

  const handleShowInstructions = async (name: string) => {
    try {
      const result = await window.electronAPI.installDependency(name);
      setInstructions(result.message);
    } catch {
      setInstructions('Failed to get installation instructions.');
    }
  };

  const handleContinue = () => {
    setDependenciesChecked(true);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <ArrowDownToLine className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">VideoGrabber Desktop</h1>
          <p className="text-gray-400 mt-2">Checking required dependencies...</p>
        </div>

        {/* Dependencies */}
        <div className="bg-background-card border border-border rounded-xl p-6 space-y-4">
          {dependencies.map((dep) => (
            <div key={dep.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {dep.installed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{dep.name}</p>
                  {dep.installed ? (
                    <p className="text-xs text-gray-500">v{dep.version}</p>
                  ) : (
                    <p className="text-xs text-red-400">Not found</p>
                  )}
                </div>
              </div>
              {!dep.installed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShowInstructions(dep.name)}
                >
                  Install Guide
                </Button>
              )}
            </div>
          ))}

          {instructions && (
            <div className="mt-4 p-4 bg-background rounded-lg border border-border">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{instructions}</pre>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setInstructions(null)}>
                Close
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={handleCheck} loading={checking}>
            <RefreshCw className="h-4 w-4" />
            Check Again
          </Button>

          <div className="flex gap-3">
            {!allInstalled && (
              <Button variant="ghost" onClick={handleContinue}>
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Continue Anyway
              </Button>
            )}
            {allInstalled && (
              <Button onClick={handleContinue}>
                Get Started
              </Button>
            )}
          </div>
        </div>

        {!allInstalled && (
          <p className="text-center text-xs text-gray-500 mt-4">
            Some features will not work without the required dependencies.
          </p>
        )}
      </div>
    </div>
  );
};
