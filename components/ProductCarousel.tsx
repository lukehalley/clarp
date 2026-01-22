'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from './ProductCard';
import PRODUCTS_DATA from '@/data/products.json';

const PRODUCTS = PRODUCTS_DATA as Array<{
  name: string;
  tagline: string;
  description: string;
  features: string[];
  progress: number;
  status: 'coming-soon' | 'development' | 'roadmap';
}>;

const AUTO_SCROLL_INTERVAL = 4000; // 4 seconds between auto-scrolls

export default function ProductCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Number of visible cards (3 on desktop, 2 on tablet, 1 on mobile)
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

  const maxIndex = PRODUCTS.length - visibleCount;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Handle manual navigation - stops auto-scroll
  const handleManualNav = useCallback((dir: 'prev' | 'next') => {
    setIsAutoScrolling(false);
    if (dir === 'prev') {
      goToPrev();
    } else {
      goToNext();
    }
  }, [goToPrev, goToNext]);

  // Auto-scroll logic
  useEffect(() => {
    if (isAutoScrolling) {
      autoScrollRef.current = setInterval(() => {
        setIsButtonPressed(true);
        setTimeout(() => setIsButtonPressed(false), 150);
        goToNext();
      }, AUTO_SCROLL_INTERVAL);
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isAutoScrolling, goToNext]);

  // Get visible products
  const visibleProducts = PRODUCTS.slice(currentIndex, currentIndex + visibleCount);
  // If we're at the end and need to wrap, add from the beginning
  if (visibleProducts.length < visibleCount) {
    visibleProducts.push(...PRODUCTS.slice(0, visibleCount - visibleProducts.length));
  }

  return (
    <div className="relative">
      {/* Navigation arrows - brutalist style */}
      <div className="flex items-center justify-between gap-4 sm:gap-8">
        {/* Left arrow */}
        <button
          onClick={() => handleManualNav('prev')}
          className="group relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-slate-dark border-2 border-danger-orange flex items-center justify-center hover:bg-danger-orange active:translate-x-1 active:translate-y-1 active:shadow-none"
          style={{ boxShadow: '4px 4px 0 var(--danger-orange)' }}
          aria-label="Previous products"
        >
          <span className="text-danger-orange group-hover:text-black text-2xl sm:text-3xl font-mono font-bold">
            ←
          </span>
          {/* Brutalist corner accent */}
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-danger-orange" />
        </button>

        {/* Cards container - fixed height to prevent layout shift */}
        <div className="flex-1 overflow-hidden -m-4 p-4">
          <div
            className="grid gap-4 sm:gap-6"
            style={{
              gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))`,
            }}
          >
            {visibleProducts.map((product, i) => (
              <div key={`${currentIndex}-${i}`} className="min-h-[420px] sm:min-h-[460px]">
                <ProductCard {...product} />
              </div>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => handleManualNav('next')}
          className={`group relative shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-slate-dark border-2 border-danger-orange flex items-center justify-center hover:bg-danger-orange active:translate-x-1 active:translate-y-1 active:shadow-none ${isButtonPressed ? 'translate-x-1 translate-y-1 !shadow-none' : ''}`}
          style={{ boxShadow: isButtonPressed ? 'none' : '4px 4px 0 var(--danger-orange)' }}
          aria-label="Next products"
        >
          <span className="text-danger-orange group-hover:text-black text-2xl sm:text-3xl font-mono font-bold">
            →
          </span>
          {/* Brutalist corner accent */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-danger-orange" />
        </button>
      </div>

      {/* Progress indicator - brutalist squares */}
      <div className="flex items-center justify-center gap-1 mt-6 sm:mt-8">
        {Array.from({ length: Math.ceil(PRODUCTS.length / visibleCount) }).map((_, i) => {
          const isActive = Math.floor(currentIndex / visibleCount) === i ||
            (currentIndex === maxIndex && i === Math.ceil(PRODUCTS.length / visibleCount) - 1);
          return (
            <button
              key={i}
              onClick={() => {
                setIsAutoScrolling(false);
                setCurrentIndex(Math.min(i * visibleCount, maxIndex));
              }}
              className={`w-3 h-3 border-2 border-slate-dark ${
                isActive ? 'bg-danger-orange' : 'bg-transparent hover:bg-slate-dark'
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          );
        })}
      </div>

      {/* Auto-scroll indicator */}
      <div className="flex items-center justify-center mt-4">
        <div className="flex items-center gap-2 px-3 py-1 border-2 border-slate-dark">
          <div className={`w-2 h-2 ${isAutoScrolling ? 'bg-larp-green' : 'bg-slate-light'}`} />
          <span className="text-[10px] font-mono text-slate-dark">
            {isAutoScrolling ? 'auto-scrolling (like your losses)' : 'manual mode (you took control. rare.)'}
          </span>
        </div>
      </div>

      {/* Product counter */}
      <div className="absolute -top-10 sm:-top-12 left-0 sm:left-auto sm:right-0 font-mono text-[10px] sm:text-xs text-slate-light">
        <span className="text-danger-orange">{currentIndex + 1}</span>
        <span className="mx-1">/</span>
        <span>{PRODUCTS.length}</span>
        <span className="ml-1 sm:ml-2 text-slate-light/50 hidden sm:inline">(theirs, not ours)</span>
      </div>
    </div>
  );
}
