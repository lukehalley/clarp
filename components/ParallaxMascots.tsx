'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const MASCOT_POSITIONS = [
  // Edges
  { size: 80, top: '4%', left: '2%', duration: '8s', delay: '0s', speed: 0.03 },
  { size: 100, top: '3%', right: '6%', duration: '7s', delay: '2s', speed: 0.02 },
  { size: 120, top: '40%', left: '0%', duration: '10s', delay: '4s', speed: 0.06 },
  { size: 64, bottom: '8%', right: '3%', duration: '5s', delay: '1s', speed: 0.08 },
  { size: 90, bottom: '15%', left: '8%', duration: '9s', delay: '3s', speed: 0.07 },
  { size: 72, top: '25%', right: '1%', duration: '11s', delay: '5s', speed: 0.04 },
  { size: 56, top: '60%', right: '10%', duration: '6s', delay: '0.5s', speed: 0.065 },
  { size: 110, top: '15%', left: '15%', duration: '12s', delay: '2.5s', speed: 0.035 },
  { size: 68, bottom: '5%', left: '30%', duration: '7.5s', delay: '4.5s', speed: 0.08 },
  { size: 85, top: '70%', right: '20%', duration: '8.5s', delay: '1.5s', speed: 0.07 },
  // Middle top
  { size: 72, top: '2%', left: '40%', duration: '9s', delay: '1.5s', speed: 0.02 },
  { size: 96, top: '6%', left: '55%', duration: '7.5s', delay: '3.5s', speed: 0.03 },
  // Middle - offset from center
  { size: 64, top: '35%', left: '25%', duration: '10.5s', delay: '0.5s', speed: 0.05 },
  { size: 88, top: '50%', left: '72%', duration: '8s', delay: '4s', speed: 0.055 },
  // Middle bottom
  { size: 80, bottom: '3%', left: '48%', duration: '6.5s', delay: '3s', speed: 0.08 },
  { size: 60, bottom: '12%', left: '55%', duration: '9.5s', delay: '5.5s', speed: 0.075 },
  // Extra density
  { size: 48, top: '12%', left: '32%', duration: '7s', delay: '1s', speed: 0.035 },
  { size: 52, top: '55%', left: '5%', duration: '9s', delay: '3.5s', speed: 0.06 },
  { size: 44, top: '80%', right: '30%', duration: '6s', delay: '2s', speed: 0.08 },
  { size: 56, top: '8%', right: '25%', duration: '10s', delay: '4.5s', speed: 0.03 },
  { size: 40, top: '45%', left: '45%', duration: '8.5s', delay: '0s', speed: 0.05 },
  { size: 50, bottom: '25%', right: '15%', duration: '7.5s', delay: '5s', speed: 0.07 },
  { size: 46, top: '30%', left: '60%', duration: '11s', delay: '2.5s', speed: 0.045 },
  { size: 54, bottom: '35%', left: '18%', duration: '6.5s', delay: '1.5s', speed: 0.065 },
  { size: 42, top: '65%', left: '35%', duration: '8s', delay: '4s', speed: 0.06 },
  { size: 60, top: '20%', right: '40%', duration: '9.5s', delay: '3s', speed: 0.04 },
];

export default function ParallaxMascots() {
  const [scrollY, setScrollY] = useState(0);
  const [maskGradient, setMaskGradient] = useState('white');
  const ticking = useRef(false);
  const prefersReducedMotion = useRef(false);

  const updateMask = useCallback(() => {
    const vh = window.innerHeight;
    const darkSections = document.querySelectorAll('.bg-slate-dark');
    const rects = Array.from(darkSections)
      .map(el => el.getBoundingClientRect())
      .filter(r => r.bottom > 0 && r.top < vh)
      .sort((a, b) => a.top - b.top);

    if (rects.length === 0) {
      setMaskGradient('white');
      return;
    }

    const stops: string[] = [];
    let lastEnd = 0;

    for (const rect of rects) {
      const topPct = Math.max(0, (rect.top / vh) * 100);
      const bottomPct = Math.min(100, (rect.bottom / vh) * 100);

      if (topPct > lastEnd) {
        stops.push(`white ${lastEnd}%`, `white ${topPct}%`);
      }
      stops.push(`transparent ${topPct}%`, `transparent ${bottomPct}%`);
      lastEnd = bottomPct;
    }

    if (lastEnd < 100) {
      stops.push(`white ${lastEnd}%`, `white 100%`);
    }

    setMaskGradient(`linear-gradient(to bottom, ${stops.join(', ')})`);
  }, []);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          updateMask();
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    updateMask();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [updateMask]);

  return (
    <div
      className="fixed inset-0 pointer-events-none hidden md:block"
      style={{
        zIndex: 0,
        opacity: 0.05,
        WebkitMaskImage: maskGradient,
        maskImage: maskGradient,
      }}
    >
      {MASCOT_POSITIONS.map(({ size, duration, delay, speed, ...pos }, i) => {
        const parallaxY = prefersReducedMotion.current ? 0 : scrollY * -speed;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              ...pos,
              transform: `translateY(${parallaxY}px)`,
              willChange: 'transform',
            }}
          >
            <div
              className="animate-float"
              style={{
                animationDuration: duration,
                animationDelay: delay,
              }}
            >
              <svg
                width={size}
                height={size}
                viewBox="0 0 400 400"
                fill="none"
                aria-hidden="true"
              >
                <rect x="60" y="68" width="280" height="168" fill="#0a0a09" />
                <rect x="32" y="104" width="28" height="42" fill="#0a0a09" />
                <rect x="340" y="104" width="28" height="42" fill="#0a0a09" />
                <rect x="116" y="124" width="42" height="70" fill="#FAF9F5" />
                <rect x="242" y="124" width="42" height="70" fill="#FAF9F5" />
                <rect x="74" y="236" width="56" height="96" fill="#0a0a09" />
                <rect x="158" y="236" width="42" height="96" fill="#0a0a09" />
                <rect x="200" y="236" width="42" height="96" fill="#0a0a09" />
                <rect x="270" y="236" width="56" height="96" fill="#0a0a09" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
