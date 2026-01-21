'use client';

interface ClarpProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * CLARP - The official $CLARP mascot
 * An inverted design - terracotta background with black void cutout
 * Represents emptiness, vaporware, and the shape of promises
 * Centered and maximized within the viewBox
 */
export default function Clarp({ size = 64, className = '', animate = false }: ClarpProps) {
  return (
    <div
      className={`inline-block ${animate ? 'animate-float' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ border: '2px solid #FF6B35', outline: '1px solid #0a0a09' }}
      >
        {/* Terracotta background - the substance */}
        <rect width="256" height="256" fill="#D97757"/>

        {/* CLARP mascot - scaled down to 75% and centered for breathing room */}
        <g transform="translate(128, 128) scale(0.88) translate(-128, -128)">
          {/* Body void */}
          <rect x="28" y="38" width="200" height="120" fill="#0a0a09"/>

          {/* Left ear */}
          <rect x="8" y="66" width="20" height="30" fill="#0a0a09"/>

          {/* Right ear */}
          <rect x="228" y="66" width="20" height="30" fill="#0a0a09"/>

          {/* Left eye - positioned for perfect mirror symmetry */}
          <rect x="64" y="80" width="32" height="48" fill="#D97757"/>

          {/* Right eye - mirror of left: 256 - 64 - 32 = 160 */}
          <rect x="160" y="80" width="32" height="48" fill="#D97757"/>

          {/* Left leg */}
          <rect x="40" y="158" width="40" height="60" fill="#0a0a09"/>

          {/* Middle-left leg */}
          <rect x="100" y="158" width="30" height="60" fill="#0a0a09"/>

          {/* Middle-right leg */}
          <rect x="126" y="158" width="30" height="60" fill="#0a0a09"/>

          {/* Right leg */}
          <rect x="176" y="158" width="40" height="60" fill="#0a0a09"/>
        </g>
      </svg>
    </div>
  );
}

/**
 * CLARP with glitch effect for more dramatic appearances
 */
export function ClarpGlitch({ size = 64, className = '' }: Omit<ClarpProps, 'animate'>) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Glitch layers */}
      <div className="absolute inset-0 opacity-50" style={{ transform: 'translate(-2px, 0)', filter: 'hue-rotate(90deg)' }}>
        <Clarp size={size} />
      </div>
      <div className="absolute inset-0 opacity-50" style={{ transform: 'translate(2px, 0)', filter: 'hue-rotate(-90deg)' }}>
        <Clarp size={size} />
      </div>
      <div className="relative">
        <Clarp size={size} />
      </div>
    </div>
  );
}
