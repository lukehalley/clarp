'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Shield, AlertTriangle, TrendingUp, User, Boxes, Building2 } from 'lucide-react';
import ContractAvatar from '@/components/ContractAvatar';
import ChainIcon, { type Chain } from '@/components/terminal/ChainIcon';
import type { Project, EntityType } from '@/types/project';

interface IntelCardProps {
  project: Project;
  scoreDelta24h?: number;
}

// Entity type styling configuration
const ENTITY_STYLES: Record<EntityType | 'default', {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  accentGlow: string;
}> = {
  project: {
    icon: <Boxes size={10} />,
    label: 'Project',
    color: 'text-danger-orange',
    bgColor: 'bg-danger-orange/10',
    borderColor: 'border-danger-orange/30',
    accentGlow: 'shadow-[0_0_12px_rgba(255,107,53,0.15)]',
  },
  person: {
    icon: <User size={10} />,
    label: 'Person',
    color: 'text-larp-purple',
    bgColor: 'bg-larp-purple/10',
    borderColor: 'border-larp-purple/30',
    accentGlow: 'shadow-[0_0_12px_rgba(155,89,182,0.15)]',
  },
  organization: {
    icon: <Building2 size={10} />,
    label: 'Org',
    color: 'text-larp-yellow',
    bgColor: 'bg-larp-yellow/10',
    borderColor: 'border-larp-yellow/30',
    accentGlow: 'shadow-[0_0_12px_rgba(255,217,61,0.15)]',
  },
  default: {
    icon: <Boxes size={10} />,
    label: 'Project',
    color: 'text-danger-orange',
    bgColor: 'bg-danger-orange/10',
    borderColor: 'border-danger-orange/30',
    accentGlow: 'shadow-[0_0_12px_rgba(255,107,53,0.15)]',
  },
};

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

  // Get entity type styling
  const entityType = project.entityType || 'default';
  const entityStyle = ENTITY_STYLES[entityType] || ENTITY_STYLES.default;
  const isPerson = entityType === 'person';
  const isOrganization = entityType === 'organization';

  // Calculate contribution bar width
  const contributionPercent = Math.min(100, displayScore);

  // Extract tags from project
  const tags = project.tags?.slice(0, 3) || [];

  // Get the correct route based on entity type
  const getEntityRoute = () => {
    const identifier = project.xHandle || project.id;
    switch (project.entityType) {
      case 'person':
        return `/terminal/person/${identifier}`;
      case 'organization':
        return `/terminal/org/${identifier}`;
      default:
        return `/terminal/project/${identifier}`;
    }
  };

  const handleClick = () => {
    router.push(getEntityRoute());
  };

  return (
    <div
      onClick={handleClick}
      className="group block cursor-pointer"
    >
      <div className={`
        flex border-2 bg-ivory-light/5 transition-all duration-200 overflow-hidden min-h-[90px] sm:h-[100px]
        ${isPerson
          ? 'border-larp-purple/20 hover:border-larp-purple/40 hover:shadow-[0_0_20px_rgba(155,89,182,0.1)]'
          : isOrganization
          ? 'border-larp-yellow/20 hover:border-larp-yellow/40 hover:shadow-[0_0_20px_rgba(255,217,61,0.1)]'
          : 'border-ivory-light/20 hover:border-danger-orange/30'
        }
      `}>
        {/* Left: Avatar - Responsive sizing with entity type indicator */}
        <div className={`
          shrink-0 bg-[#0a0a09] border-r w-[80px] h-[90px] sm:w-[100px] sm:h-[100px] overflow-hidden relative pointer-events-none
          ${isPerson ? 'border-larp-purple/20' : isOrganization ? 'border-larp-yellow/20' : 'border-ivory-light/10'}
        `}>
          {project.avatarUrl ? (
            <Image
              src={project.avatarUrl}
              alt={project.name}
              fill
              className={`object-cover ${isPerson ? 'rounded-full scale-90' : ''}`}
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
          {/* Entity type corner badge */}
          <div className={`
            absolute top-1 left-1 p-1 ${entityStyle.bgColor} ${entityStyle.borderColor} border
          `}>
            <span className={entityStyle.color}>{entityStyle.icon}</span>
          </div>
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
                {/* Entity type badge for non-projects */}
                {(isPerson || isOrganization) && (
                  <span className={`
                    text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5
                    ${entityStyle.bgColor} ${entityStyle.color} ${entityStyle.borderColor} border
                    flex items-center gap-1
                  `}>
                    {entityStyle.icon}
                    <span className="hidden xs:inline">{entityStyle.label}</span>
                  </span>
                )}
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

          {/* Bottom row: Trust bar + Tags/Handle */}
          <div className="flex items-end justify-between gap-2 sm:gap-3">
            {/* Trust bar */}
            <div className="flex-1 max-w-[120px] sm:max-w-[200px]">
              <div className={`h-1 bg-slate-dark/50 overflow-hidden ${isPerson ? 'rounded-full' : ''}`}>
                <div
                  className={`h-full transition-all duration-300 ${isPerson ? 'rounded-full' : ''}`}
                  style={{
                    width: `${contributionPercent}%`,
                    backgroundColor: isPerson ? '#9B59B6' : isOrganization ? '#FFD93D' : scoreColor,
                  }}
                />
              </div>
            </div>
            {/* X Handle for people, Tags for others */}
            {isPerson && project.xHandle ? (
              <span className="text-[9px] sm:text-[10px] font-mono text-larp-purple/70">
                @{project.xHandle}
              </span>
            ) : tags.length > 0 ? (
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
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
