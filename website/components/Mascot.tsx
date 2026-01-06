'use client';

import Clarp from './Clarp';

export default function Mascot() {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute inset-0 blur-3xl bg-danger-orange/30 rounded-full scale-150" />

      {/* Mascot container */}
      <div className="relative animate-float">
        {/* Main CLARP mascot */}
        <div className="relative">
          {/* Scanline overlay effect */}
          <div className="absolute inset-0 pointer-events-none z-10 opacity-20">
            <div
              className="w-full h-full"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
              }}
            />
          </div>

          {/* CLARP - The Void */}
          <Clarp size={200} className="drop-shadow-[0_0_30px_rgba(255,107,53,0.5)]" />

          {/* Glitch lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-larp-red/60 animate-pulse" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-danger-orange/40 animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-clay/50 animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>

        {/* Label */}
        <div className="text-center mt-4 sm:mt-6">
          <div className="font-mono text-danger-orange text-lg sm:text-2xl font-bold tracking-widest">
            C L A R P
          </div>
        </div>
      </div>
    </div>
  );
}
