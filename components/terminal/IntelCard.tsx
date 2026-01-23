'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  type Project,
  type LarpScore,
  CHAIN_INFO,
} from '@/types/terminal';
import { Shield, AlertTriangle, TrendingUp, Skull, CheckCircle } from 'lucide-react';

interface IntelCardProps {
  project: Project;
  score: LarpScore;
  scoreDelta24h?: number;
}

const LOADING_MESSAGES = [
  'calculating jeet probability...',
  'scanning for rug vectors...',
  'analyzing shill clusters...',
  'checking team wallet activity...',
  'verifying hopium levels (high)...',
  'loading cope mechanisms...',
];

export default function IntelCard({ project, score, scoreDelta24h }: IntelCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const chainInfo = CHAIN_INFO[project.chain];
  const isTrusted = score.score < 30 || (project.verified && score.score < 50);
  const isCritical = score.score >= 70;
  const displayProgress = Math.min(score.score, 99);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
    setIsLoading(true);
    setLoadingText(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

    const interval = setInterval(() => {
      setLoadingText(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    }, 1500);

    setTimeout(() => {
      clearInterval(interval);
      setIsLoading(false);
    }, 2000);
  };

  const getRiskLabel = () => {
    if (score.score >= 90) return 'confirmed larp';
    if (score.score >= 70) return 'highly sus';
    if (score.score >= 50) return 'yellow flags';
    if (score.score >= 30) return 'probably fine';
    return 'appears legit';
  };

  const getAccentColor = () => {
    if (isTrusted) return 'larp-green';
    if (isCritical) return 'larp-red';
    if (score.score >= 50) return 'danger-orange';
    return 'larp-yellow';
  };

  const accent = getAccentColor();

  const getProgressColor = () => {
    if (score.score >= 70) return 'bg-larp-red';
    if (score.score >= 50) return 'bg-danger-orange';
    if (score.score >= 30) return 'bg-larp-yellow';
    return 'bg-larp-green';
  };

  return (
    <Link
      href={`/terminal/project/${project.id}`}
      onClick={handleClick}
      className="group relative block h-full"
    >
      {/* Main card - dark brutalist style */}
      <div
        className={`relative h-full flex flex-col p-5 sm:p-6 bg-slate-dark border-2 transition-all duration-200 min-h-[420px] sm:min-h-[460px] ${
          isTrusted
            ? 'border-larp-green/50 hover:border-larp-green'
            : isCritical
            ? 'border-larp-red/50 hover:border-larp-red'
            : 'border-danger-orange/50 hover:border-danger-orange'
        }`}
        style={{
          boxShadow: `4px 4px 0 var(--${accent})`,
        }}
      >
        {/* Corner accent - like larp-card × but with status icon */}
        <div
          className={`absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center text-black font-bold bg-${accent}`}
        >
          {isTrusted ? (
            <CheckCircle size={16} />
          ) : isCritical ? (
            <Skull size={16} />
          ) : (
            <AlertTriangle size={16} />
          )}
        </div>

        {/* Status badge */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono border ${
              isTrusted
                ? 'bg-larp-green/20 text-larp-green border-larp-green/50'
                : isCritical
                ? 'bg-larp-red/20 text-larp-red border-larp-red/50'
                : 'bg-danger-orange/20 text-danger-orange border-danger-orange/50'
            }`}
          >
            {isTrusted ? (
              <>
                <Shield size={12} />
                {project.verified ? 'verified' : 'low risk'}
              </>
            ) : (
              <>
                <AlertTriangle size={12} />
                {score.riskLevel} risk
              </>
            )}
          </span>
        </div>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl sm:text-2xl font-mono font-bold text-ivory-light">
              {project.name}
            </h3>
            {scoreDelta24h !== undefined && scoreDelta24h !== 0 && (
              <span
                className={`flex items-center gap-0.5 text-sm font-mono ${
                  scoreDelta24h > 0 ? 'text-larp-red' : 'text-larp-green'
                }`}
              >
                <TrendingUp size={14} className={scoreDelta24h < 0 ? 'rotate-180' : ''} />
                {scoreDelta24h > 0 ? '+' : ''}
                {scoreDelta24h}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {project.ticker && (
              <span className="text-sm font-mono text-danger-orange">${project.ticker}</span>
            )}
            <span
              className="text-xs font-mono px-2 py-0.5 border"
              style={{ borderColor: chainInfo.color, color: chainInfo.color }}
            >
              {chainInfo.shortName}
            </span>
            {project.verified && (
              <span className="text-xs font-mono px-2 py-0.5 bg-larp-green/20 text-larp-green border border-larp-green/50">
                KYC
              </span>
            )}
          </div>
        </div>

        {/* Big Score Display */}
        <div className="my-6 text-center">
          <div
            className={`text-6xl sm:text-7xl font-mono font-bold ${
              isTrusted
                ? 'text-larp-green'
                : isCritical
                ? 'text-larp-red'
                : 'text-danger-orange'
            }`}
          >
            {score.score}
          </div>
          <p className="text-sm font-mono text-ivory-light/60 mt-1">{getRiskLabel()}</p>
        </div>

        {/* Top Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6 min-h-[28px]">
          {score.topTags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-xs font-mono px-2 py-0.5 bg-ivory-light/5 text-ivory-light/70 border border-ivory-light/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Risk Progress Bar - industrial style */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-ivory-light/50">risk meter</span>
            <span className={`text-xs font-mono text-${accent}`}>
              {displayProgress}%
              {isCritical && <span className="ml-1 animate-pulse">(!!)</span>}
            </span>
          </div>
          <div className="relative h-3 bg-ivory-light/10 overflow-hidden">
            {/* Progress fill */}
            <div
              className={`absolute inset-y-0 left-0 ${getProgressColor()} ${
                isCritical ? 'animate-pulse' : ''
              }`}
              style={{ width: `${displayProgress}%` }}
            />
            {/* Danger stripes overlay for critical */}
            {isCritical && (
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 4px,
                    rgba(0,0,0,0.3) 4px,
                    rgba(0,0,0,0.3) 8px
                  )`,
                }}
              />
            )}
          </div>
        </div>

        {/* CTA - brutalist button */}
        <div className="mt-6 pt-6 border-t border-ivory-light/10">
          <div
            className={`w-full h-11 text-sm font-mono font-bold flex items-center justify-center border-2 transition-all ${
              isLoading
                ? `bg-${accent} text-black border-${accent}`
                : `bg-transparent text-${accent} border-${accent} group-hover:bg-${accent} group-hover:text-black`
            }`}
            style={{
              boxShadow: isLoading ? 'none' : `3px 3px 0 var(--${accent})`,
            }}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                <span className="truncate">{loadingText}</span>
              </>
            ) : (
              'view intel →'
            )}
          </div>
          {clickCount >= 2 && !isLoading && (
            <p className="text-[10px] text-ivory-light/30 mt-2 text-center font-mono">
              clicked {clickCount}x. patience isn't your strength.
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
