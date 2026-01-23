'use client';

import { useState, useEffect } from 'react';

const BOOT_SEQUENCE = [
  'CLARP TERMINAL v1.0',
  'initializing neural trust engine...',
  'loading polymarket oracles...',
  'scanning 847,293 wallets...',
  'mapping shill clusters...',
  'calibrating larp detection...',
  'connecting to chain indexers...',
  '[OK] all systems nominal',
  '',
  'READY.',
];

const CHAR_DELAY = 18; // ms per character
const LINE_PAUSE = 150; // ms pause between lines

interface TerminalLoaderProps {
  onComplete: () => void;
}

export default function TerminalLoader({ onComplete }: TerminalLoaderProps) {
  // Track typed characters per line (all lines exist from start)
  const [lineProgress, setLineProgress] = useState<number[]>(BOOT_SEQUENCE.map(() => 0));
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [scanlineY, setScanlineY] = useState(0);
  const [glitchFrame, setGlitchFrame] = useState(0);

  // Boot sequence typing effect - type each line in sequence
  useEffect(() => {
    let currentLine = 0;
    let charIndex = 0;
    let timer: NodeJS.Timeout;

    const tick = () => {
      if (currentLine >= BOOT_SEQUENCE.length) {
        // All done - wait a moment then complete
        setIsComplete(true);
        timer = setTimeout(() => {
          onComplete();
        }, 600);
        return;
      }

      const line = BOOT_SEQUENCE[currentLine];
      setCurrentLineIndex(currentLine);

      if (!line || charIndex >= line.length) {
        // Line complete, move to next
        currentLine++;
        charIndex = 0;
        timer = setTimeout(tick, LINE_PAUSE);
        return;
      }

      // Type next character
      charIndex++;
      setLineProgress(prev => {
        const next = [...prev];
        next[currentLine] = charIndex;
        return next;
      });

      timer = setTimeout(tick, CHAR_DELAY);
    };

    // Start typing
    timer = setTimeout(tick, 300);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Scanline animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanlineY(prev => (prev + 2) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Random glitch frames
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.92) {
        setGlitchFrame(prev => prev + 1);
        setTimeout(() => setGlitchFrame(prev => prev + 1), 50);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const getLineColor = (line: string) => {
    if (line.startsWith('[OK]')) return 'text-larp-green';
    if (line === 'READY.') return 'text-danger-orange font-bold';
    if (line.startsWith('CLARP')) return 'text-danger-orange font-bold';
    return 'text-ivory-light/70';
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      {/* CRT screen container */}
      <div
        className="relative w-full h-full max-w-4xl max-h-[80vh] mx-4 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, #0a0a09 0%, #000000 100%)',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9), 0 0 50px rgba(255, 107, 53, 0.1)',
          transform: glitchFrame % 2 === 1 ? 'translateX(2px)' : 'none',
        }}
      >
        {/* Scanline effect */}
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-b from-danger-orange/20 to-transparent pointer-events-none z-10"
          style={{ top: `${scanlineY}%` }}
        />

        {/* CRT curve overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Main content */}
        <div className="relative z-0 p-8 sm:p-12 h-full flex flex-col justify-center">
          {/* ASCII Logo */}
          <pre className="text-danger-orange text-[8px] sm:text-[10px] md:text-xs font-mono leading-none mb-8 sm:mb-12 opacity-80">
{` ██████╗██╗      █████╗ ██████╗ ██████╗
██╔════╝██║     ██╔══██╗██╔══██╗██╔══██╗
██║     ██║     ███████║██████╔╝██████╔╝
██║     ██║     ██╔══██║██╔══██╗██╔═══╝
╚██████╗███████╗██║  ██║██║  ██║██║
 ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝`}
          </pre>

          {/* Boot sequence lines - all lines exist from start for stable layout */}
          <div className="space-y-1 font-mono text-xs sm:text-sm">
            {BOOT_SEQUENCE.map((line, i) => {
              const typedChars = lineProgress[i];
              const displayText = line.slice(0, typedChars);
              const lineComplete = typedChars >= line.length;
              const isTypingLine = i === currentLineIndex && !lineComplete && line.length > 0;

              return (
                <div key={i} className="h-5 flex items-center gap-2">
                  {/* Show icon for [OK] line only when typing starts */}
                  {line.startsWith('[OK]') && typedChars > 0 && (
                    <span className="text-larp-green">&#9632;</span>
                  )}
                  {/* Display typed portion */}
                  <span className={typedChars > 0 ? getLineColor(line) : 'text-transparent'}>
                    {displayText || (line ? '\u00A0' : '')}
                  </span>
                  {/* Cursor on current line */}
                  {isTypingLine && showCursor && !isComplete && (
                    <span className="w-2 h-4 bg-danger-orange inline-block" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-8 sm:mt-12">
            <div className="h-1 bg-slate-dark/50 overflow-hidden">
              <div
                className="h-full bg-danger-orange transition-all duration-200 ease-out"
                style={{
                  width: isComplete ? '100%' : `${Math.min(((currentLineIndex + 1) / BOOT_SEQUENCE.length) * 100, 95)}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] sm:text-xs font-mono text-ivory-light/40">
              <span>SYSTEM BOOT</span>
              <span>{isComplete ? '100' : Math.floor(((currentLineIndex + 1) / BOOT_SEQUENCE.length) * 95)}%</span>
            </div>
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-danger-orange/30" />
        <div className="absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 border-danger-orange/30" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 border-danger-orange/30" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-danger-orange/30" />

        {/* System info */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-mono text-ivory-light/20">
          CLARP TRUST INTELLIGENCE SYSTEM
        </div>
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
        }}
      />
    </div>
  );
}
