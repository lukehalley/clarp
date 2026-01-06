'use client';

import { useState } from 'react';
import Badge from './Badge';
import ProgressBar from './ProgressBar';
import Button from './Button';

const LOADING_EXCUSES = [
  'fetching data from blockchain (lie)...',
  'connecting to smart contract (nonexistent)...',
  'loading documentation (there is none)...',
  'initializing dashboard (static image)...',
  'syncing with mainnet (localhost)...',
  'verifying your bag (empty)...',
  'calculating returns (negative)...',
  'compiling typescript (forever)...',
];

interface ProductCardProps {
  name: string;
  tagline: string;
  description: string;
  features: string[];
  progress: number;
  status: 'coming-soon' | 'development' | 'roadmap';
  delay?: number;
}

export default function ProductCard({
  name,
  tagline,
  description,
  features,
  progress,
  status,
  delay = 0,
}: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const handleLearnMore = () => {
    setClickCount(prev => prev + 1);
    setIsLoading(true);
    setLoadingText(LOADING_EXCUSES[Math.floor(Math.random() * LOADING_EXCUSES.length)]);

    // Never actually finish loading - just cycle through messages
    const interval = setInterval(() => {
      setLoadingText(LOADING_EXCUSES[Math.floor(Math.random() * LOADING_EXCUSES.length)]);
    }, 2000);

    // Give up after 6 seconds
    setTimeout(() => {
      clearInterval(interval);
      setIsLoading(false);
    }, 6000);
  };

  const statusConfig = {
    'coming-soon': { badge: 'warning' as const, label: 'Coming Soon' },
    'development': { badge: 'larp' as const, label: 'In Development' },
    'roadmap': { badge: 'default' as const, label: 'On Roadmap' },
  };

  const buttonText = () => {
    if (isLoading) return loadingText;
    if (clickCount >= 5) return 'give up';
    if (clickCount >= 3) return 'still nothing';
    if (clickCount >= 1) return 'try again (same result)';
    return 'Learn More';
  };

  return (
    <div
      className="larp-card animate-slide-up p-4 sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Status badge */}
      <Badge variant={statusConfig[status].badge} className="mb-3 sm:mb-4">
        {statusConfig[status].label}
      </Badge>

      {/* Header */}
      <h3 className="text-lg sm:text-xl font-semibold text-slate-dark mb-1">{name}</h3>
      <p className="text-xs sm:text-sm font-mono text-clay mb-3 sm:mb-4">{tagline}</p>

      {/* Description */}
      <p className="text-slate-light text-xs sm:text-sm mb-4 sm:mb-6">{description}</p>

      {/* Features */}
      <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-slate-light">
            <span className="text-cloud-medium shrink-0">▸</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Progress */}
      <ProgressBar progress={progress} label="Development Progress" showPercent interactive />

      {/* CTA */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-cloud-light">
        <button
          onClick={handleLearnMore}
          disabled={isLoading}
          className={`w-full text-xs sm:text-sm px-4 py-2 border-2 border-slate-dark font-mono transition-all ${
            isLoading
              ? 'bg-slate-dark text-danger-orange animate-pulse'
              : 'bg-transparent text-slate-dark hover:bg-slate-dark hover:text-ivory-light'
          }`}
          style={{ boxShadow: isLoading ? 'none' : '3px 3px 0 var(--slate-dark)' }}
        >
          {isLoading && (
            <span className="inline-block w-3 h-3 border-2 border-danger-orange border-t-transparent rounded-full animate-spin mr-2" />
          )}
          {buttonText()}
        </button>
        {clickCount >= 3 && !isLoading && (
          <p className="text-[10px] text-slate-light/50 mt-2 text-center font-mono">
            clicked {clickCount} times. nothing will happen.
          </p>
        )}
      </div>
    </div>
  );
}
