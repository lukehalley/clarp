'use client';

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';

interface IntelCarouselProps {
  children: ReactNode[];
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  variant?: 'safe' | 'danger' | 'neutral';
}

export default function IntelCarousel({
  children,
  title,
  subtitle,
  icon,
  autoScroll = false,
  autoScrollInterval = 5000,
  variant = 'neutral',
}: IntelCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(autoScroll);
  const [isButtonPressed, setIsButtonPressed] = useState<'left' | 'right' | null>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const getVisibleCount = useCallback(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }, []);

  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getVisibleCount]);

  const maxIndex = Math.max(0, children.length - visibleCount);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const handleManualNav = useCallback(
    (dir: 'prev' | 'next') => {
      setIsAutoScrolling(false);
      setIsButtonPressed(dir === 'prev' ? 'left' : 'right');
      setTimeout(() => setIsButtonPressed(null), 150);
      if (dir === 'prev') {
        goToPrev();
      } else {
        goToNext();
      }
    },
    [goToPrev, goToNext]
  );

  useEffect(() => {
    if (isAutoScrolling && autoScroll) {
      autoScrollRef.current = setInterval(() => {
        setIsButtonPressed('right');
        setTimeout(() => setIsButtonPressed(null), 150);
        goToNext();
      }, autoScrollInterval);
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isAutoScrolling, autoScroll, autoScrollInterval, goToNext]);

  const visibleChildren = children.slice(currentIndex, currentIndex + visibleCount);
  if (visibleChildren.length < visibleCount) {
    visibleChildren.push(...children.slice(0, visibleCount - visibleChildren.length));
  }

  const getAccentColor = () => {
    switch (variant) {
      case 'safe':
        return 'larp-green';
      case 'danger':
        return 'danger-orange';
      default:
        return 'danger-orange';
    }
  };

  const accentColor = getAccentColor();

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {icon && <span className={`text-${accentColor}`}>{icon}</span>}
          <div>
            <h2 className="text-lg sm:text-xl font-mono font-bold text-ivory-light">{title}</h2>
            {subtitle && (
              <p className="text-xs font-mono text-ivory-light/50 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Counter */}
        <div className="font-mono text-xs text-ivory-light/50">
          <span className={`text-${accentColor}`}>{currentIndex + 1}</span>
          <span className="mx-1">/</span>
          <span>{children.length}</span>
          <span className="ml-2 hidden sm:inline text-ivory-light/30">(swipe or click)</span>
        </div>
      </div>

      {/* Navigation + Cards */}
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        {/* Left arrow - brutalist style */}
        <button
          onClick={() => handleManualNav('prev')}
          className={`group relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-slate-dark border-2 flex items-center justify-center transition-all active:translate-x-1 active:translate-y-1 ${
            isButtonPressed === 'left' ? 'translate-x-1 translate-y-1' : ''
          } ${
            variant === 'safe'
              ? 'border-larp-green hover:bg-larp-green'
              : 'border-danger-orange hover:bg-danger-orange'
          }`}
          style={{
            boxShadow:
              isButtonPressed === 'left'
                ? 'none'
                : variant === 'safe'
                ? '4px 4px 0 var(--larp-green)'
                : '4px 4px 0 var(--danger-orange)',
          }}
          aria-label="Previous"
        >
          <span
            className={`group-hover:text-black text-2xl sm:text-3xl font-mono font-bold ${
              variant === 'safe' ? 'text-larp-green' : 'text-danger-orange'
            }`}
          >
            ←
          </span>
          {/* Corner accent */}
          <div
            className={`absolute -top-1 -left-1 w-3 h-3 ${
              variant === 'safe' ? 'bg-larp-green' : 'bg-danger-orange'
            }`}
          />
        </button>

        {/* Cards container */}
        <div className="flex-1 overflow-hidden -m-4 p-4">
          <div
            className="grid gap-4 sm:gap-6"
            style={{
              gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
            }}
          >
            {visibleChildren.map((child, i) => (
              <div key={`${currentIndex}-${i}`} className="min-h-[420px] sm:min-h-[460px]">
                {child}
              </div>
            ))}
          </div>
        </div>

        {/* Right arrow - brutalist style */}
        <button
          onClick={() => handleManualNav('next')}
          className={`group relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-slate-dark border-2 flex items-center justify-center transition-all active:translate-x-1 active:translate-y-1 ${
            isButtonPressed === 'right' ? 'translate-x-1 translate-y-1' : ''
          } ${
            variant === 'safe'
              ? 'border-larp-green hover:bg-larp-green'
              : 'border-danger-orange hover:bg-danger-orange'
          }`}
          style={{
            boxShadow:
              isButtonPressed === 'right'
                ? 'none'
                : variant === 'safe'
                ? '4px 4px 0 var(--larp-green)'
                : '4px 4px 0 var(--danger-orange)',
          }}
          aria-label="Next"
        >
          <span
            className={`group-hover:text-black text-2xl sm:text-3xl font-mono font-bold ${
              variant === 'safe' ? 'text-larp-green' : 'text-danger-orange'
            }`}
          >
            →
          </span>
          {/* Corner accent */}
          <div
            className={`absolute -top-1 -right-1 w-3 h-3 ${
              variant === 'safe' ? 'bg-larp-green' : 'bg-danger-orange'
            }`}
          />
        </button>
      </div>

      {/* Progress dots - brutalist squares */}
      <div className="flex items-center justify-center gap-1.5 mt-6 sm:mt-8">
        {Array.from({ length: Math.ceil(children.length / visibleCount) }).map((_, i) => {
          const isActive =
            Math.floor(currentIndex / visibleCount) === i ||
            (currentIndex === maxIndex && i === Math.ceil(children.length / visibleCount) - 1);
          return (
            <button
              key={i}
              onClick={() => {
                setIsAutoScrolling(false);
                setCurrentIndex(Math.min(i * visibleCount, maxIndex));
              }}
              className={`w-3 h-3 border-2 transition-colors ${
                isActive
                  ? variant === 'safe'
                    ? 'bg-larp-green border-larp-green'
                    : 'bg-danger-orange border-danger-orange'
                  : 'bg-transparent border-ivory-light/30 hover:border-ivory-light/50'
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          );
        })}
      </div>

      {/* Auto-scroll indicator */}
      {autoScroll && (
        <div className="flex items-center justify-center mt-4">
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className="flex items-center gap-2 px-4 py-1.5 border-2 border-ivory-light/20 hover:border-ivory-light/40 transition-colors"
          >
            <div
              className={`w-2 h-2 ${isAutoScrolling ? 'bg-larp-green animate-pulse' : 'bg-ivory-light/30'}`}
            />
            <span className="text-[10px] font-mono text-ivory-light/60">
              {isAutoScrolling ? 'auto-scanning (like a bot)' : 'manual mode (you do the work)'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
