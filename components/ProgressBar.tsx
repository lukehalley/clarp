'use client';

import { useState } from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercent?: boolean;
  stuck?: boolean;
  className?: string;
  interactive?: boolean;
}

export default function ProgressBar({
  progress,
  label,
  showPercent = false,
  stuck = true,
  className = '',
  interactive = false,
}: ProgressBarProps) {
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [clickCount, setClickCount] = useState(0);

  const displayProgress = stuck ? Math.min(currentProgress, 99) : currentProgress;

  const handleClick = () => {
    if (!interactive) return;

    setClickCount(prev => prev + 1);
    // Each click reduces progress, mocking crypto projects
    setCurrentProgress(prev => Math.max(0, prev - Math.floor(Math.random() * 15 + 5)));
  };

  const getLabel = () => {
    if (!interactive) return label;
    if (clickCount >= 5) return 'you broke it';
    if (clickCount >= 3) return 'why are you clicking this';
    if (clickCount >= 1) return 'progress regressing...';
    return label;
  };

  const getStuckText = () => {
    if (currentProgress <= 0) return '(rugged)';
    if (currentProgress < 50) return '(scope creep)';
    if (currentProgress >= 99) return '(stuck)';
    return '(regressing)';
  };

  return (
    <div
      className={`${className} ${interactive ? 'cursor-pointer select-none' : ''}`}
      onClick={handleClick}
    >
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-xs text-slate-light">{getLabel()}</span>}
          {showPercent && (
            <span className="text-xs font-mono text-clay">
              {displayProgress}%
              {stuck && (
                <span className={`ml-1 ${currentProgress <= 0 ? 'text-larp-red' : currentProgress < progress ? 'text-danger-orange' : 'text-larp-red'}`}>
                  {getStuckText()}
                </span>
              )}
            </span>
          )}
        </div>
      )}
      <div className="relative h-2 bg-cloud-light/50 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
            currentProgress <= 0
              ? 'bg-larp-red'
              : currentProgress < progress
              ? 'bg-gradient-to-r from-danger-orange to-larp-red'
              : 'bg-gradient-to-r from-clay to-clay-deep'
          } ${stuck && displayProgress >= 99 ? 'animate-pulse' : ''}`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      {interactive && clickCount >= 3 && (
        <p className="text-[10px] text-slate-light/40 mt-1 font-mono">
          click to destroy progress
        </p>
      )}
    </div>
  );
}
