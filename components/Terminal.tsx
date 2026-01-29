'use client';

import { ReactNode, useState } from 'react';
import FullscreenTerminal from './FullscreenTerminal';

interface TerminalProps {
  children: ReactNode;
  title?: string;
  className?: string;
  canMaximize?: boolean;
}

export default function Terminal({ children, title = 'terminal', className = '', canMaximize = true }: TerminalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if we need flex layout (when className contains flex or h-full)
  const needsFlex = className.includes('flex') || className.includes('h-full');

  return (
    <>
      <div className={`terminal ${needsFlex ? 'flex flex-col' : ''} ${className}`}>
        <div className="terminal-header shrink-0">
          <div
            className="terminal-dot bg-larp-red opacity-50"
            title="close (disabled)"
          />
          <div
            className="terminal-dot bg-larp-yellow opacity-50"
            title="minimize (disabled)"
          />
          <div
            className={`terminal-dot bg-larp-green transition-all ${
              canMaximize
                ? 'cursor-pointer hover:brightness-125 hover:ring-2 hover:ring-larp-green/50 animate-pulse'
                : 'opacity-50'
            }`}
            onClick={() => canMaximize && setIsFullscreen(true)}
            title={canMaximize ? "maximize (actually works)" : "maximize (disabled)"}
          />
          <span className="ml-3 text-xs text-ivory-light/50 font-mono">{title}</span>
        </div>
        <div className={`terminal-body text-sm ${needsFlex ? 'flex-1 overflow-hidden' : ''}`}>
          {children}
        </div>
      </div>

      {/* Fullscreen terminal modal */}
      <FullscreenTerminal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
      />
    </>
  );
}
