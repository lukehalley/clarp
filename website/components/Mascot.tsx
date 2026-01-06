'use client';

import { useState } from 'react';
import Clarp from './Clarp';

const MASCOT_STATES = [
  { label: 'C L A R P', message: '' },
  { label: 'C O P E', message: 'you double-clicked a mascot.' },
  { label: 'N G M I', message: 'keep clicking. it helps.' },
  { label: 'R E K T', message: 'this is what you do with your time.' },
  { label: 'W A G M I', message: 'jk. we won\'t.' },
  { label: 'G M', message: 'gn.' },
  { label: 'S O O N', message: '™' },
];

export default function Mascot() {
  const [stateIndex, setStateIndex] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleDoubleClick = () => {
    setIsGlitching(true);
    setIsSpinning(true);

    setTimeout(() => {
      setStateIndex(prev => (prev + 1) % MASCOT_STATES.length);
      setIsGlitching(false);
    }, 300);

    setTimeout(() => {
      setIsSpinning(false);
    }, 600);
  };

  const currentState = MASCOT_STATES[stateIndex];

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className={`absolute inset-0 blur-3xl rounded-full scale-150 transition-colors duration-300 ${
        stateIndex > 0 ? 'bg-larp-red/40' : 'bg-danger-orange/30'
      }`} />

      {/* Mascot container */}
      <div
        className={`relative animate-float cursor-pointer select-none ${isGlitching ? 'animate-[glitch_0.1s_ease-in-out_3]' : ''}`}
        onDoubleClick={handleDoubleClick}
      >
        {/* Main CLARP mascot */}
        <div className={`relative transition-transform duration-500 ${isSpinning ? 'rotate-[360deg]' : ''}`}>
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
          <Clarp
            size={200}
            className={`drop-shadow-[0_0_30px_rgba(255,107,53,0.5)] transition-all duration-300 ${
              stateIndex > 0 ? 'grayscale-[30%] hue-rotate-15' : ''
            }`}
          />

          {/* Glitch lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute top-1/4 left-0 right-0 h-0.5 animate-pulse ${stateIndex > 0 ? 'bg-larp-red' : 'bg-larp-red/60'}`} />
            <div className={`absolute top-1/2 left-0 right-0 h-0.5 animate-pulse ${stateIndex > 0 ? 'bg-larp-red/80' : 'bg-danger-orange/40'}`} style={{ animationDelay: '0.3s' }} />
            <div className={`absolute top-3/4 left-0 right-0 h-0.5 animate-pulse ${stateIndex > 0 ? 'bg-larp-red/60' : 'bg-clay/50'}`} style={{ animationDelay: '0.6s' }} />
          </div>
        </div>

        {/* Label */}
        <div className="text-center mt-4 sm:mt-6">
          <div className={`font-mono text-lg sm:text-2xl font-bold tracking-widest transition-colors duration-300 ${
            stateIndex > 0 ? 'text-larp-red' : 'text-danger-orange'
          }`}>
            {currentState.label}
          </div>
          {currentState.message && (
            <div className="text-xs text-ivory-light/50 font-mono mt-2 animate-fade-in">
              {currentState.message}
            </div>
          )}
          {stateIndex === 0 && (
            <div className="text-[10px] text-ivory-light/30 font-mono mt-2">
              (double-click for nothing)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
