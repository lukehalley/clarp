'use client';

import Link from 'next/link';
import {
  type Project,
  type LarpScore,
  getScoreColor,
} from '@/types/terminal';
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import ContractAvatar from '@/components/ContractAvatar';
import ChainIcon from '@/components/terminal/ChainIcon';

interface IntelCardProps {
  project: Project;
  score: LarpScore;
  scoreDelta24h?: number;
}

export default function IntelCard({ project, score, scoreDelta24h }: IntelCardProps) {
  // Never display 0 - minimum score is 1
  const displayScore = Math.max(1, score.score);
  const isTrusted = displayScore < 30 || (project.verified && displayScore < 50);
  const isCritical = displayScore >= 70;
  const scoreColor = getScoreColor(displayScore);

  const getRiskLabel = () => {
    if (displayScore >= 90) return 'confirmed larp';
    if (displayScore >= 70) return 'highly sus';
    if (displayScore >= 50) return 'yellow flags';
    if (displayScore >= 30) return 'probably fine';
    return 'appears legit';
  };

  // Calculate contribution bar width (out of 100)
  const contributionPercent = Math.min(100, displayScore);

  return (
    <Link
      href={`/terminal/project/${project.id}`}
      className="group block h-full"
    >
      <div className="h-full flex border-2 border-ivory-light/20 bg-ivory-light/5 hover:border-danger-orange/30 transition-colors overflow-hidden">
        {/* Left: Full-height Contract Avatar */}
        {project.contract && (
          <div className="hidden sm:flex shrink-0 self-stretch items-center justify-center bg-[#0a0a09] border-r border-ivory-light/10">
            <ContractAvatar
              address={project.contract}
              size={100}
              bgColor="transparent"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Project name and badges */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-mono font-bold text-ivory-light text-base sm:text-lg truncate">
                  {project.name}
                </h3>
                {project.ticker && (
                  <span className="font-mono text-sm text-danger-orange shrink-0">
                    ${project.ticker}
                  </span>
                )}
              </div>

              {/* Chain and status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <ChainIcon chain={project.chain} size={18} />
                {project.verified && (
                  <span className="text-xs font-mono px-2 py-0.5 bg-larp-green/20 text-larp-green border border-larp-green/30">
                    Verified
                  </span>
                )}
                {scoreDelta24h !== undefined && scoreDelta24h !== 0 && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-mono ${
                      scoreDelta24h > 0 ? 'text-larp-red' : 'text-larp-green'
                    }`}
                  >
                    <TrendingUp size={12} className={scoreDelta24h < 0 ? 'rotate-180' : ''} />
                    {scoreDelta24h > 0 ? '+' : ''}
                    {scoreDelta24h}
                  </span>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="text-right shrink-0">
              <span
                className="font-mono font-bold text-3xl sm:text-4xl"
                style={{ color: scoreColor }}
              >
                {displayScore}
              </span>
            </div>
          </div>

          {/* Risk label */}
          <div className="mt-3 flex items-center gap-2">
            {isTrusted ? (
              <Shield size={14} className="text-larp-green" />
            ) : (
              <AlertTriangle size={14} style={{ color: scoreColor }} />
            )}
            <span className="text-xs font-mono text-ivory-light/60">
              {getRiskLabel()}
            </span>
          </div>

          {/* Risk meter */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="text-ivory-light/40">risk score</span>
              <span className="text-ivory-light/60">{displayScore}/100</span>
            </div>
            <div className="h-1.5 bg-slate-dark/50 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isCritical ? 'animate-pulse' : ''}`}
                style={{
                  width: `${contributionPercent}%`,
                  backgroundColor: scoreColor,
                }}
              />
            </div>
          </div>

          {/* Top tags */}
          {score.topTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {score.topTags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono px-2 py-0.5 bg-slate-dark/50 text-ivory-light/50 border border-ivory-light/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

        </div>
      </div>
    </Link>
  );
}
