'use client';

import { useState, useEffect } from 'react';

const BOOT_SEQUENCE = [
  { text: 'CLARP TERMINAL v1.0', delay: 0 },
  { text: 'initializing neural trust engine...', delay: 200 },
  { text: 'loading polymarket oracles...', delay: 600 },
  { text: 'scanning 847,293 wallets...', delay: 1000 },
  { text: 'mapping shill clusters...', delay: 1400 },
  { text: 'calibrating larp detection...', delay: 1800 },
  { text: 'connecting to chain indexers...', delay: 2200 },
  { text: '[OK] all systems nominal', delay: 2600 },
  { text: '', delay: 2900 },
  { text: 'READY.', delay: 3000 },
];

interface TerminalLoaderProps {
  onComplete: () => void;
  minDuration?: number;
}

export default function TerminalLoader({ onComplete, minDuration = 3400 }: TerminalLoaderProps) {
  // Track typed characters per line (all lines exist from start)
  const [lineProgress, setLineProgress] = useState<number[]>(BOOT_SEQUENCE.map(() => 0));
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [scanlineY, setScanlineY] = useState(0);
  const [glitchFrame, setGlitchFrame] = useState(0);

  // Boot sequence typing effect - type each line in sequence
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    let currentLine = 0;

    const typeNextLine = () => {
      if (currentLine >= BOOT_SEQUENCE.length) return;

      const line = BOOT_SEQUENCE[currentLine];
      const lineIndex = currentLine;

      // Schedule this line to start typing after its delay
      const startTimer = setTimeout(() => {
        setCurrentLineIndex(lineIndex);

        if (!line.text) {
          // Empty line, mark as complete and move on
          setLineProgress(prev => {
            const next = [...prev];
            next[lineIndex] = 0;
            return next;
          });
          currentLine++;
          typeNextLine();
          return;
        }

        // Type out characters one by one
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          charIndex++;
          setLineProgress(prev => {
            const next = [...prev];
            next[lineIndex] = charIndex;
            return next;
          });

          if (charIndex >= line.text.length) {
            clearInterval(typeInterval);
            currentLine++;
            typeNextLine();
          }
        }, 15);
        timers.push(typeInterval as unknown as NodeJS.Timeout);
      }, line.delay);

      timers.push(startTimer);
    };

    typeNextLine();

    // Complete after min duration
    const completeTimer = setTimeout(() => {
      onComplete();
    }, minDuration);
    timers.push(completeTimer);

    return () => timers.forEach(t => clearTimeout(t as NodeJS.Timeout));
  }, [onComplete, minDuration]);

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

  const getLineColor = (text: string) => {
    if (text.startsWith('[OK]')) return 'text-larp-green';
    if (text === 'READY.') return 'text-danger-orange font-bold';
    if (text.startsWith('CLARP')) return 'text-danger-orange font-bold';
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
              const displayText = line.text.slice(0, typedChars);
              const isComplete = typedChars >= line.text.length;
              const isCurrentLine = i === currentLineIndex && !isComplete && line.text.length > 0;

              return (
                <div key={i} className="h-5 flex items-center gap-2">
                  {/* Show icon for [OK] line only when typing starts */}
                  {line.text.startsWith('[OK]') && typedChars > 0 && (
                    <span className="text-larp-green">&#9632;</span>
                  )}
                  {/* Display typed portion */}
                  <span className={typedChars > 0 ? getLineColor(line.text) : 'text-transparent'}>
                    {displayText || (line.text ? '\u00A0' : '')}
                  </span>
                  {/* Cursor on current line */}
                  {isCurrentLine && showCursor && (
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
                className="h-full bg-danger-orange transition-all duration-300 ease-out"
                style={{
                  width: `${Math.min(((currentLineIndex + 1) / BOOT_SEQUENCE.length) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] sm:text-xs font-mono text-ivory-light/40">
              <span>SYSTEM BOOT</span>
              <span>{Math.floor(((currentLineIndex + 1) / BOOT_SEQUENCE.length) * 100)}%</span>
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
