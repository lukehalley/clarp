'use client';

import Link from 'next/link';
import {
  type Project,
  type LarpScore,
  CHAIN_INFO,
  getScoreColor,
  getRiskLevelColor,
} from '@/types/terminal';
import { ExternalLink, Copy, Check, Shield, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ProjectCardProps {
  project: Project;
  score?: LarpScore;
  scoreDelta24h?: number;
  compact?: boolean;
  showActions?: boolean;
  onWatch?: () => void;
}

export default function ProjectCard({
  project,
  score,
  scoreDelta24h,
  compact = false,
  showActions = false,
  onWatch,
}: ProjectCardProps) {
  const [copied, setCopied] = useState(false);

  const chainInfo = CHAIN_INFO[project.chain];
  const scoreColor = score ? getScoreColor(score.score) : undefined;
  const riskColor = score ? getRiskLevelColor(score.riskLevel) : undefined;

  // Determine if this is a "safe" project (low risk or verified with good score)
  const isTrusted = score && (score.score < 30 || (project.verified && score.score < 50));

  const handleCopyContract = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (project.contract) {
      navigator.clipboard.writeText(project.contract);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateContract = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get border color based on risk level
  const getBorderColor = () => {
    if (!score) return 'border-ivory-light/20';
    if (score.score >= 70) return 'border-larp-red/40';
    if (score.score >= 50) return 'border-danger-orange/40';
    if (score.score >= 30) return 'border-larp-yellow/40';
    return 'border-larp-green/40';
  };

  const getHoverBorderColor = () => {
    if (!score) return 'hover:border-ivory-light/40';
    if (score.score >= 70) return 'hover:border-larp-red/60';
    if (score.score >= 50) return 'hover:border-danger-orange/60';
    if (score.score >= 30) return 'hover:border-larp-yellow/60';
    return 'hover:border-larp-green/60';
  };

  return (
    <Link
      href={`/terminal/project/${project.id}`}
      className={`block border-2 ${getBorderColor()} ${getHoverBorderColor()} bg-slate-dark/50 transition-all duration-200 ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      {/* Main content - fixed height for alignment */}
      <div className="flex items-start justify-between gap-3 min-h-[72px]">
        {/* Left: Project info */}
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-mono font-bold text-ivory-light text-base leading-tight">
              {project.name}
            </h3>
            {project.ticker && (
              <span className="font-mono text-clay text-sm">
                ${project.ticker}
              </span>
            )}
          </div>

          {/* Chain badge row */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs font-mono px-2 py-0.5 border"
              style={{
                borderColor: chainInfo.color,
                color: chainInfo.color,
              }}
            >
              {chainInfo.shortName}
            </span>

            {project.verified && (
              <span className="text-xs font-mono px-2 py-0.5 bg-larp-green/20 text-larp-green border border-larp-green/30 flex items-center gap-1">
                <Shield size={10} />
                Verified
              </span>
            )}
          </div>

          {/* Top risk tag - consistent placement */}
          <div className="mt-auto pt-2">
            {score && score.topTags.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 border ${
                  isTrusted
                    ? 'bg-larp-green/10 text-larp-green border-larp-green/30'
                    : 'bg-danger-orange/10 text-danger-orange border-danger-orange/30'
                }`}
              >
                {!isTrusted && <AlertTriangle size={10} />}
                {score.topTags[0]}
              </span>
            )}
          </div>
        </div>

        {/* Right: Score - fixed width for alignment */}
        {score && (
          <div className="text-right shrink-0 w-16 flex flex-col items-end">
            <div className="flex items-baseline gap-0.5">
              <span
                className="font-mono font-bold text-2xl tabular-nums"
                style={{ color: scoreColor }}
              >
                {score.score}
              </span>
              {scoreDelta24h !== undefined && scoreDelta24h !== 0 && (
                <span
                  className={`text-xs font-mono ${
                    scoreDelta24h > 0 ? 'text-larp-red' : 'text-larp-green'
                  }`}
                >
                  {scoreDelta24h > 0 ? '+' : ''}{scoreDelta24h}
                </span>
              )}
            </div>

            {/* Risk level */}
            <span
              className="text-xs font-mono uppercase mt-0.5"
              style={{ color: riskColor }}
            >
              {score.riskLevel}
            </span>
          </div>
        )}
      </div>

      {/* Contract - only on non-compact */}
      {project.contract && !compact && (
        <button
          onClick={handleCopyContract}
          className="flex items-center gap-1 text-xs font-mono text-ivory-light/40 hover:text-ivory-light/60 mt-3"
        >
          {truncateContract(project.contract)}
          {copied ? <Check size={12} className="text-larp-green" /> : <Copy size={12} />}
        </button>
      )}

      {/* Actions */}
      {showActions && (
        <div className="mt-4 pt-3 border-t border-ivory-light/10 flex items-center justify-between">
          <span className="text-xs font-mono text-ivory-light/40">
            Updated {score?.lastUpdated ? new Date(score.lastUpdated).toLocaleDateString() : 'N/A'}
          </span>
          <div className="flex items-center gap-2">
            {project.website && (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-ivory-light/40 hover:text-ivory-light/60"
              >
                <ExternalLink size={14} />
              </a>
            )}
            {onWatch && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onWatch();
                }}
                className="text-xs font-mono px-3 py-1 border border-clay/50 text-clay hover:bg-clay/10"
              >
                Watch
              </button>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
