'use client';

import Link from 'next/link';
import {
  type Project,
  type LarpScore,
  CHAIN_INFO,
  getScoreColor,
  getRiskLevelColor,
} from '@/types/terminal';
import { ExternalLink, Copy, Check } from 'lucide-react';
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

  return (
    <Link
      href={`/terminal/project/${project.id}`}
      className={`block border-2 border-ivory-light/20 bg-ivory-light/5 hover:border-danger-orange/50 transition-colors ${
        compact ? 'p-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Project info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Name */}
            <h3 className={`font-mono font-bold text-ivory-light ${compact ? 'text-sm' : 'text-base'}`}>
              {project.name}
            </h3>

            {/* Ticker */}
            {project.ticker && (
              <span className="font-mono text-danger-orange text-sm">
                ${project.ticker}
              </span>
            )}

            {/* Chain badge */}
            <span
              className="text-xs font-mono px-2 py-0.5 border"
              style={{
                borderColor: chainInfo.color,
                color: chainInfo.color,
              }}
            >
              {chainInfo.shortName}
            </span>

            {/* Verified badge */}
            {project.verified && (
              <span className="text-xs font-mono px-2 py-0.5 bg-larp-green/20 text-larp-green border border-larp-green/30">
                Verified
              </span>
            )}
          </div>

          {/* Contract */}
          {project.contract && !compact && (
            <button
              onClick={handleCopyContract}
              className="flex items-center gap-1 text-xs font-mono text-ivory-light/40 hover:text-ivory-light/60 mt-2"
            >
              {truncateContract(project.contract)}
              {copied ? <Check size={12} className="text-larp-green" /> : <Copy size={12} />}
            </button>
          )}

          {/* Top risk tag */}
          {score && score.topTags.length > 0 && (
            <div className="mt-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-danger-orange/10 text-danger-orange border border-danger-orange/30">
                {score.topTags[0]}
              </span>
            </div>
          )}
        </div>

        {/* Right: Score */}
        {score && (
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1">
              <span
                className={`font-mono font-bold ${compact ? 'text-2xl' : 'text-3xl'}`}
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
              className="text-xs font-mono uppercase"
              style={{ color: riskColor }}
            >
              {score.riskLevel}
            </span>
          </div>
        )}
      </div>

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
                className="text-xs font-mono px-3 py-1 border border-danger-orange/50 text-danger-orange hover:bg-danger-orange/10"
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
