import React from 'react';
import { clsx } from 'clsx';

interface ProgressProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({ value, className, showLabel = true }) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clamped}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-xs text-gray-400 min-w-[3rem] text-right font-medium">
            {clamped.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
};
