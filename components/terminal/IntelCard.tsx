'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import ContractAvatar from '@/components/ContractAvatar';
import ChainIcon, { type Chain } from '@/components/terminal/ChainIcon';
import type { Project } from '@/types/project';

interface IntelCardProps {
  project: Project;
  scoreDelta24h?: number;
}

// Get color based on trust score (inverted - higher = better = green)
function getScoreColor(score: number): string {
  if (score >= 85) return '#22c55e'; // green
  if (score >= 70) return '#84cc16'; // lime
  if (score >= 50) return '#6b7280'; // gray
  if (score >= 30) return '#f97316'; // orange
  return '#dc2626'; // red
}

// Get risk label based on trust score (inverted from LARP score)
function getRiskLabel(score: number): string {
  if (score >= 85) return 'verified';
  if (score >= 70) return 'trusted';
  if (score >= 50) return 'neutral';
  if (score >= 30) return 'yellow flags';
  return 'high risk';
}

// Detect chain from token address
function detectChain(address?: string): Chain | null {
  if (!address) return null;
  if (address.startsWith('0x')) return 'ethereum'; // Could be base/arb too
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'solana';
  return null;
}

export default function IntelCard({ project, scoreDelta24h }: IntelCardProps) {
  const router = useRouter();
  const score = project.trustScore?.score ?? 50;
  const displayScore = Math.max(1, score);
  const isTrusted = displayScore >= 70;
  const scoreColor = getScoreColor(displayScore);
  const riskLabel = getRiskLabel(displayScore);
  const chain = detectChain(project.tokenAddress);

  // Calculate contribution bar width
  const contributionPercent = Math.min(100, displayScore);

  // Extract tags from project
  const tags = project.tags?.slice(0, 3) || [];

  const handleClick = () => {
    router.push(`/terminal/project/${project.xHandle || project.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group block cursor-pointer"
    >
      <div className="flex border-2 border-ivory-light/20 bg-ivory-light/5 hover:border-danger-orange/30 transition-colors overflow-hidden min-h-[90px] sm:h-[100px]">
        {/* Left: Avatar - Responsive sizing */}
        <div className="shrink-0 bg-[#0a0a09] border-r border-ivory-light/10 w-[80px] h-[90px] sm:w-[100px] sm:h-[100px] overflow-hidden relative pointer-events-none">
          {project.avatarUrl ? (
            <Image
              src={project.avatarUrl}
              alt={project.name}
              fill
              className="object-cover"
            />
          ) : project.tokenAddress ? (
            <ContractAvatar
              address={project.tokenAddress}
              size={100}
              bgColor="#0a0a09"
            />
          ) : (
            <ContractAvatar
              address={project.id || project.name}
              size={100}
              bgColor="#0a0a09"
            />
          )}
        </div>

        {/* Content - responsive compact layout */}
        <div className="flex-1 min-w-0 p-2 sm:p-3 flex flex-col justify-between">
          {/* Top row: Name + Ticker + Score */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-mono font-bold text-ivory-light text-sm sm:text-base truncate max-w-[120px] xs:max-w-none">
                  {project.name}
                </h3>
                {project.ticker && (
                  <span className="font-mono text-xs sm:text-sm text-danger-orange shrink-0">
                    ${project.ticker}
                  </span>
                )}
              </div>
              {/* Badges row */}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                {chain && <ChainIcon chain={chain} size={14} className="sm:w-4 sm:h-4" />}
                {project.trustScore?.tier === 'verified' && (
                  <span className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 bg-larp-green/20 text-larp-green border border-larp-green/30">
                    Verified
                  </span>
                )}
                {isTrusted ? (
                  <Shield size={11} className="text-larp-green sm:w-3 sm:h-3" />
                ) : displayScore < 40 ? (
                  <AlertTriangle size={11} style={{ color: scoreColor }} className="sm:w-3 sm:h-3" />
                ) : null}
                <span className="text-[9px] sm:text-[10px] font-mono text-ivory-light/50 hidden xs:inline">
                  {riskLabel}
                </span>
              </div>
            </div>
            {/* Score */}
            <div
              className="font-mono font-bold text-2xl sm:text-3xl shrink-0"
              style={{ color: scoreColor }}
            >
              {displayScore}
            </div>
          </div>

          {/* Bottom row: Trust bar + Tags */}
          <div className="flex items-end justify-between gap-2 sm:gap-3">
            {/* Trust bar */}
            <div className="flex-1 max-w-[120px] sm:max-w-[200px]">
              <div className="h-1 bg-slate-dark/50 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${contributionPercent}%`,
                    backgroundColor: scoreColor,
                  }}
                />
              </div>
            </div>
            {/* Tags - hide on very small screens */}
            {tags.length > 0 && (
              <div className="hidden xs:flex gap-1">
                {tags.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 bg-slate-dark/50 text-ivory-light/40 border border-ivory-light/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
