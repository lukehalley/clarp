'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  RefreshCw,
  Twitter,
  Share2,
  ChevronDown,
  ChevronUp,
  Star,
  GitFork,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Code,
  Clock,
  Building2,
  MapPin,
  Award,
  Coins,
  Flame,
  Lock,
  Unlock,
  Target,
  CheckCircle2,
  Circle,
  XCircle,
  Cpu,
  Wifi,
  WifiOff,
  HardDrive,
  FileSearch,
  Calendar,
  Zap,
  Briefcase,
  Link2,
  GitCommit,
  Eye,
  CircleDot,
  Globe,
  MessageCircle,
  Send,
  Package,
  Snowflake,
  UserCheck,
  UserX,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Activity,
} from 'lucide-react';
import ContractAvatar from '@/components/ContractAvatar';
import type {
  Project,
  LegalEntity,
  Affiliation,
  Tokenomics,
  LiquidityInfo,
  RoadmapMilestone,
  AuditInfo,
  TechStack,
  SecurityIntel,
  ShippingMilestone,
} from '@/types/project';

// ============================================================================
// UTILITIES
// ============================================================================

function getTrustColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 50) return '#6b7280';
  if (score >= 30) return '#f97316';
  return '#dc2626';
}

function getTrustLabel(score: number): string {
  if (score >= 85) return 'VERIFIED';
  if (score >= 70) return 'TRUSTED';
  if (score >= 50) return 'NEUTRAL';
  if (score >= 30) return 'CAUTION';
  return 'AVOID';
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatNumber(num: number | undefined): string {
  if (!num) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function formatCurrency(num: number | undefined | null): string {
  if (!num) return '$0';
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPrice(num: number | undefined): string {
  if (!num) return '$0.00';
  if (num < 0.0001) return `$${num.toExponential(2)}`;
  if (num < 1) return `$${num.toFixed(6)}`;
  return `$${num.toFixed(2)}`;
}

function formatSupply(val: number | string | undefined | null): string {
  if (!val) return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return String(val);
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toLocaleString();
}

// ============================================================================
// GITHUB ICON
// ============================================================================

function GithubIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

// ============================================================================
// BADGE COMPONENTS
// ============================================================================

function Badge({
  children,
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const styles = {
    default: 'bg-ivory-light/5 border-ivory-light/10 text-ivory-light/60',
    success: 'bg-larp-green/10 border-larp-green/20 text-larp-green',
    warning: 'bg-larp-yellow/10 border-larp-yellow/20 text-larp-yellow',
    danger: 'bg-larp-red/10 border-larp-red/20 text-larp-red',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono border ${styles[variant]}`}>
      {children}
    </span>
  );
}

function StatusDot({ status }: { status: 'active' | 'warning' | 'error' | 'neutral' }) {
  const colors = {
    active: 'bg-larp-green',
    warning: 'bg-larp-yellow',
    error: 'bg-larp-red',
    neutral: 'bg-ivory-light/30',
  };
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status]} ${status === 'active' ? 'animate-pulse' : ''}`} />;
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

function Section({
  title,
  icon: Icon,
  children,
  action,
  accentColor = '#f97316',
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="mb-6 last:mb-0">
      {/* Simple header like GitHub */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: accentColor }} />
          <h3 className="text-sm text-ivory-light/80 font-medium">{title}</h3>
        </div>
        {action}
      </div>
      {/* Content */}
      <div className="pl-[22px]">
        {children}
      </div>
    </div>
  );
}

function DataItem({
  label,
  value,
  link,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  link?: string;
  mono?: boolean;
}) {
  const content = (
    <div className="flex items-center justify-between py-2 group">
      <span className="text-xs text-ivory-light/40">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} text-sm text-ivory-light ${link ? 'group-hover:text-danger-orange transition-colors' : ''}`}>
        {value}
        {link && <ExternalLink size={10} className="inline ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </span>
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="block hover:bg-ivory-light/[0.02] -mx-2 px-2 transition-colors">
        {content}
      </a>
    );
  }

  return content;
}

// ============================================================================
// EXPANDABLE SUMMARY
// ============================================================================

function ExpandableSummary({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = text.length > 300;

  return (
    <div>
      <p className={`text-sm text-ivory-light/70 leading-relaxed ${!isExpanded && needsTruncation ? 'line-clamp-3' : ''}`}>
        {text}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-xs text-danger-orange/70 hover:text-danger-orange transition-colors"
        >
          {isExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// TRUST SCORE RING
// ============================================================================

function TrustScoreRing({ score }: { score: number }) {
  const color = getTrustColor(score);
  const label = getTrustLabel(score);
  const circumference = 2 * Math.PI * 40;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-ivory-light/10"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold text-ivory-light">{score}</span>
        <span className="text-[9px] uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

// ============================================================================
// GITHUB INTEL SECTION
// ============================================================================

function GitHubSection({ project }: { project: Project }) {
  const intel = project.githubIntel;

  if (!intel) {
    return (
      <Section title="Development Activity" icon={GithubIcon} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <GithubIcon size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No GitHub data available</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">{project.githubUrl ? 'GitHub not analyzed yet' : 'No GitHub linked'}</p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Development Activity"
      icon={GithubIcon}
      accentColor="#22c55e"
      action={
        project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ivory-light/30 hover:text-larp-green transition-colors flex items-center gap-1"
          >
            View on GitHub <ExternalLink size={10} />
          </a>
        )
      }
    >
      {/* Inline stats like GitHub */}
      <div className="flex items-center gap-4 mb-4 text-xs text-ivory-light/60">
        <span className="flex items-center gap-1">
          <Star size={14} className="text-larp-yellow" />
          <span className="font-medium text-ivory-light">{formatNumber(intel.stars)}</span>
        </span>
        <span className="flex items-center gap-1">
          <GitFork size={14} className="text-ivory-light/40" />
          <span>{formatNumber(intel.forks)}</span>
        </span>
        <span className="flex items-center gap-1">
          <Eye size={14} className="text-ivory-light/40" />
          <span>{formatNumber(intel.watchers)}</span>
        </span>
        <span className="flex items-center gap-1">
          <Users size={14} className="text-ivory-light/40" />
          <span>{intel.contributorsCount}</span>
        </span>
        <span className="flex items-center gap-1">
          <GitCommit size={14} className="text-larp-green" />
          <span className="text-larp-green">{intel.commitsLast30d}</span>
          <span className="text-ivory-light/40">in 30d</span>
        </span>
      </div>

      <div className="space-y-0">
        {intel.primaryLanguage && <DataItem label="Primary Language" value={intel.primaryLanguage} />}
        {intel.license && <DataItem label="License" value={intel.license} />}
        {intel.lastCommitDate && <DataItem label="Last Commit" value={formatDate(intel.lastCommitDate)} />}
        <DataItem
          label="Health Score"
          value={
            <span style={{ color: intel.healthScore >= 70 ? '#22c55e' : intel.healthScore >= 50 ? '#f97316' : '#dc2626' }}>
              {intel.healthScore}/100
            </span>
          }
        />
      </div>
    </Section>
  );
}

// ============================================================================
// TEAM SECTION
// ============================================================================

function TeamSection({ project }: { project: Project }) {
  const team = project.team || [];

  if (team.length === 0) {
    return (
      <Section title="Team" icon={Users} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <UserX size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No team members identified</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">Team not discovered or anonymous</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Team" icon={Users} accentColor="#3b82f6">
      <div className="space-y-2">
        {team.map((member, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 bg-ivory-light/[0.02] border border-ivory-light/5">
            {member.avatarUrl ? (
              <Image src={member.avatarUrl} alt={member.displayName || member.handle} width={32} height={32} className="rounded" />
            ) : (
              <div className="w-8 h-8 rounded bg-ivory-light/10 flex items-center justify-center">
                <Users size={14} className="text-ivory-light/30" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-ivory-light truncate">
                  {member.realName || member.displayName || member.handle}
                </span>
                {member.isDoxxed && <Badge variant="success">Doxxed</Badge>}
              </div>
              {member.role && (
                <span className="text-xs text-danger-orange/70">{member.role}</span>
              )}
              {member.previousEmployers && member.previousEmployers.length > 0 && (
                <div className="text-[10px] text-ivory-light/40 mt-0.5">
                  Ex: {member.previousEmployers.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
            {member.handle && (
              <a
                href={`https://x.com/${member.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory-light/30 hover:text-ivory-light/60 transition-colors"
              >
                <Twitter size={14} />
              </a>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// MARKET DATA SECTION
// ============================================================================

function MarketSection({ project }: { project: Project }) {
  const market = project.marketData;

  if (!market) {
    return (
      <Section title="Market Data" icon={BarChart3} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <BarChart3 size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No market data available</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">{project.tokenAddress ? 'Token not found on DEX' : 'No token address'}</p>
        </div>
      </Section>
    );
  }

  const priceUp = (market.priceChange24h ?? 0) >= 0;

  return (
    <Section
      title="Market Data"
      icon={BarChart3}
      accentColor={priceUp ? '#22c55e' : '#dc2626'}
      action={
        project.tokenAddress && (
          <a
            href={`https://dexscreener.com/solana/${project.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ivory-light/30 hover:text-danger-orange transition-colors flex items-center gap-1"
          >
            DexScreener <ExternalLink size={10} />
          </a>
        )
      }
    >
      {/* Price with change */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-xl font-mono text-ivory-light font-bold">{formatPrice(market.price)}</span>
        <span className={`flex items-center gap-0.5 text-sm font-mono ${priceUp ? 'text-larp-green' : 'text-larp-red'}`}>
          {priceUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {priceUp ? '+' : ''}{market.priceChange24h?.toFixed(2)}%
        </span>
      </div>

      {/* Inline stats */}
      <div className="flex items-center gap-4 text-xs text-ivory-light/60">
        <span>MCap <span className="text-ivory-light font-medium">{formatCurrency(market.marketCap)}</span></span>
        <span>Vol <span className="text-ivory-light font-medium">{formatCurrency(market.volume24h)}</span></span>
        <span>Liq <span className="text-ivory-light font-medium">{formatCurrency(market.liquidity)}</span></span>
      </div>
    </Section>
  );
}

// ============================================================================
// LEGAL ENTITY SECTION
// ============================================================================

function LegalSection({ entity }: { entity?: LegalEntity | null }) {
  if (!entity || (!entity.companyName && !entity.isRegistered)) {
    return (
      <Section title="Legal Entity" icon={Building2} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Building2 size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No legal entity found</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">Company info not discovered</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Legal Entity" icon={Building2} accentColor={entity.isRegistered ? '#22c55e' : '#6b7280'}>
      <div className="space-y-0">
        {entity.companyName && <DataItem label="Company Name" value={entity.companyName} />}
        {entity.jurisdiction && <DataItem label="Jurisdiction" value={entity.jurisdiction} />}
        <DataItem
          label="Registration Status"
          value={
            entity.isRegistered ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <Badge variant="default">Unverified</Badge>
            )
          }
        />
      </div>
      {entity.registrationDetails && (
        <p className="mt-3 text-xs text-ivory-light/50 p-2 bg-ivory-light/[0.02] border-l-2 border-larp-green/30">
          {entity.registrationDetails}
        </p>
      )}
    </Section>
  );
}

// ============================================================================
// AFFILIATIONS SECTION
// ============================================================================

function AffiliationsSection({ affiliations }: { affiliations?: Affiliation[] | null }) {
  if (!affiliations || affiliations.length === 0) {
    return (
      <Section title="Affiliations" icon={Award} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Award size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No affiliations found</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">No councils, VCs, or accelerators</p>
        </div>
      </Section>
    );
  }

  const typeColors: Record<string, string> = {
    council: 'text-blue-400',
    accelerator: 'text-larp-yellow',
    vc: 'text-larp-green',
    exchange: 'text-purple-400',
    regulatory: 'text-cyan-400',
    other: 'text-ivory-light/50',
  };

  return (
    <Section title="Affiliations" icon={Award} accentColor="#8b5cf6">
      <div className="flex flex-wrap gap-2">
        {affiliations.map((aff, idx) => (
          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-ivory-light/[0.02] border border-ivory-light/5">
            <span className={`text-xs font-mono ${typeColors[aff.type] || typeColors.other}`}>
              {aff.type.toUpperCase()}
            </span>
            <span className="text-sm text-ivory-light">{aff.name}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// TOKENOMICS SECTION
// ============================================================================

function TokenomicsSection({ tokenomics }: { tokenomics?: Tokenomics | null }) {
  if (!tokenomics) {
    return (
      <Section title="Tokenomics" icon={Coins} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Coins size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No tokenomics data</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">Supply info not available</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Tokenomics" icon={Coins} accentColor="#f59e0b">
      <div className="space-y-0">
        {tokenomics.totalSupply && (
          <DataItem label="Total Supply" value={formatSupply(tokenomics.totalSupply)} />
        )}
        {tokenomics.circulatingSupply && (
          <DataItem label="Circulating Supply" value={formatSupply(tokenomics.circulatingSupply)} />
        )}
        <DataItem
          label="Deflationary"
          value={
            tokenomics.isDeflationary ? (
              <span className="flex items-center gap-1 text-danger-orange">
                <Flame size={12} /> Yes
              </span>
            ) : (
              'No'
            )
          }
        />
        {tokenomics.vestingSchedule && (
          <DataItem label="Vesting" value={tokenomics.vestingSchedule} mono={false} />
        )}
      </div>
      {tokenomics.burnMechanism && (
        <div className="mt-3 p-2 bg-danger-orange/5 border-l-2 border-danger-orange/30">
          <div className="flex items-center gap-1 text-xs text-danger-orange mb-1">
            <Flame size={10} /> Burn Mechanism
          </div>
          <p className="text-xs text-ivory-light/60">{tokenomics.burnMechanism}</p>
        </div>
      )}
    </Section>
  );
}

// ============================================================================
// LIQUIDITY SECTION
// ============================================================================

function LiquiditySection({ liquidity }: { liquidity?: LiquidityInfo | null }) {
  if (!liquidity) {
    return (
      <Section title="Liquidity" icon={DollarSign} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <DollarSign size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No liquidity data</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">DEX pool not found</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Liquidity" icon={DollarSign} accentColor={liquidity.liquidityLocked ? '#22c55e' : '#f97316'}>
      <div className="space-y-0">
        {liquidity.primaryDex && <DataItem label="Primary DEX" value={liquidity.primaryDex} />}
        {liquidity.poolType && <DataItem label="Pool Type" value={liquidity.poolType} />}
        {liquidity.liquidityUsd && (
          <DataItem
            label="Liquidity"
            value={
              <span style={{
                color: liquidity.liquidityUsd > 100000 ? '#22c55e' :
                       liquidity.liquidityUsd < 10000 ? '#dc2626' : undefined
              }}>
                {formatCurrency(liquidity.liquidityUsd)}
              </span>
            }
          />
        )}
        <DataItem
          label="Lock Status"
          value={
            liquidity.liquidityLocked ? (
              <span className="flex items-center gap-1 text-larp-green">
                <Lock size={12} /> Locked
              </span>
            ) : (
              <span className="flex items-center gap-1 text-danger-orange">
                <Unlock size={12} /> Unlocked
              </span>
            )
          }
        />
        {liquidity.lockDuration && (
          <DataItem label="Lock Duration" value={liquidity.lockDuration} />
        )}
      </div>
    </Section>
  );
}

// ============================================================================
// ROADMAP SECTION
// ============================================================================

function RoadmapSection({ roadmap }: { roadmap?: RoadmapMilestone[] | null }) {
  if (!roadmap || roadmap.length === 0) {
    return (
      <Section title="Roadmap" icon={Target} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Target size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No roadmap found</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">Project milestones not available</p>
        </div>
      </Section>
    );
  }

  const statusIcons = {
    completed: <CheckCircle2 size={14} className="text-larp-green" />,
    'in-progress': <CircleDot size={14} className="text-larp-yellow" />,
    planned: <Circle size={14} className="text-ivory-light/30" />,
  };

  return (
    <Section title="Roadmap" icon={Target} accentColor="#06b6d4">
      <div className="space-y-2">
        {roadmap.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-2 bg-ivory-light/[0.02] border border-ivory-light/5">
            <div className="mt-0.5">{statusIcons[item.status]}</div>
            <div className="flex-1">
              <div className="text-sm text-ivory-light">{item.milestone}</div>
              {item.targetDate && (
                <div className="text-xs text-ivory-light/40 flex items-center gap-1 mt-0.5">
                  <Calendar size={10} /> {item.targetDate}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// AUDIT SECTION
// ============================================================================

function AuditSection({ audit }: { audit?: AuditInfo | null }) {
  const auditColor = audit?.auditStatus === 'completed' ? '#22c55e' :
                     audit?.auditStatus === 'pending' ? '#f59e0b' : '#dc2626';
  return (
    <Section title="Security Audit" icon={FileSearch} accentColor={auditColor}>
      {audit?.hasAudit || audit?.auditStatus === 'pending' ? (
        <div className="space-y-0">
          <DataItem
            label="Status"
            value={
              audit.auditStatus === 'completed' ? (
                <Badge variant="success">Audited</Badge>
              ) : (
                <Badge variant="warning">Pending</Badge>
              )
            }
          />
          {audit.auditor && <DataItem label="Auditor" value={audit.auditor} />}
          {audit.auditDate && <DataItem label="Date" value={audit.auditDate} />}
          {audit.auditUrl && (
            <DataItem label="Report" value="View Report" link={audit.auditUrl} />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-larp-red/5 border border-larp-red/10">
          <AlertTriangle size={18} className="text-larp-red shrink-0" />
          <div>
            <div className="text-sm text-larp-red font-medium">No Security Audit</div>
            <div className="text-xs text-ivory-light/40">Unaudited contracts carry higher risk</div>
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================================================
// TECH STACK SECTION
// ============================================================================

function TechStackSection({ techStack }: { techStack?: TechStack | null }) {
  if (!techStack) {
    return (
      <Section title="Tech Stack" icon={Cpu} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Cpu size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No tech stack info</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">Technical details not available</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Tech Stack" icon={Cpu} accentColor={techStack.zkTech ? '#a855f7' : '#6366f1'}>
      <div className="space-y-0">
        {techStack.blockchain && <DataItem label="Blockchain" value={techStack.blockchain} />}
        {techStack.zkTech && (
          <DataItem label="ZK Technology" value={<span className="text-purple-400">{techStack.zkTech}</span>} />
        )}
        <DataItem
          label="Offline Capability"
          value={
            techStack.offlineCapability ? (
              <span className="flex items-center gap-1 text-larp-green">
                <Wifi size={12} /> Yes
              </span>
            ) : (
              <span className="flex items-center gap-1 text-ivory-light/40">
                <WifiOff size={12} /> No
              </span>
            )
          }
        />
      </div>
      {techStack.hardwareProducts && techStack.hardwareProducts.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-ivory-light/40 mb-2 flex items-center gap-1">
            <HardDrive size={10} /> Hardware Products
          </div>
          <div className="flex flex-wrap gap-1">
            {techStack.hardwareProducts.map((product, idx) => (
              <Badge key={idx}>{product}</Badge>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================================================
// KEY FINDINGS SECTION
// ============================================================================

function KeyFindingsSection({ findings }: { findings?: string[] | null }) {
  if (!findings || findings.length === 0) {
    return (
      <Section title="Key Findings" icon={Eye} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Eye size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No key findings</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">AI analysis pending</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Key Findings" icon={Eye} accentColor="#f97316">
      <ul className="space-y-2">
        {findings.map((finding, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-ivory-light/70">
            <span className="text-danger-orange mt-1">•</span>
            {finding}
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ============================================================================
// SECURITY INTEL SECTION (RugCheck-style)
// ============================================================================

function SecurityIntelSection({ security }: { security?: SecurityIntel | null }) {
  const hasData = !!security;
  const hasRisks = security?.risks && security.risks.length > 0;
  const allSafe = hasData && !security.mintAuthorityEnabled && !security.freezeAuthorityEnabled && security.lpLocked && !hasRisks;

  if (!hasData) {
    return (
      <Section title="Security Intel" icon={Shield} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <ShieldX size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No security data available</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">Rescan to gather RugCheck data</p>
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Security Intel"
      icon={allSafe ? ShieldCheck : ShieldAlert}
      accentColor={allSafe ? '#22c55e' : '#f97316'}
    >
      {/* Security Status Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={`flex items-center gap-2 p-2 border ${!security.mintAuthorityEnabled ? 'border-larp-green/20 bg-larp-green/5' : 'border-larp-red/20 bg-larp-red/5'}`}>
          {!security.mintAuthorityEnabled ? (
            <Lock size={14} className="text-larp-green" />
          ) : (
            <Unlock size={14} className="text-larp-red" />
          )}
          <div>
            <div className="text-[10px] text-ivory-light/40 uppercase">Mint Authority</div>
            <div className={`text-xs font-mono ${!security.mintAuthorityEnabled ? 'text-larp-green' : 'text-larp-red'}`}>
              {security.mintAuthorityEnabled ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-2 border ${!security.freezeAuthorityEnabled ? 'border-larp-green/20 bg-larp-green/5' : 'border-larp-red/20 bg-larp-red/5'}`}>
          {!security.freezeAuthorityEnabled ? (
            <ShieldCheck size={14} className="text-larp-green" />
          ) : (
            <Snowflake size={14} className="text-larp-red" />
          )}
          <div>
            <div className="text-[10px] text-ivory-light/40 uppercase">Freeze Authority</div>
            <div className={`text-xs font-mono ${!security.freezeAuthorityEnabled ? 'text-larp-green' : 'text-larp-red'}`}>
              {security.freezeAuthorityEnabled ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-2 border ${security.lpLocked ? 'border-larp-green/20 bg-larp-green/5' : 'border-larp-yellow/20 bg-larp-yellow/5'}`}>
          {security.lpLocked ? (
            <Lock size={14} className="text-larp-green" />
          ) : (
            <Unlock size={14} className="text-larp-yellow" />
          )}
          <div>
            <div className="text-[10px] text-ivory-light/40 uppercase">LP Status</div>
            <div className={`text-xs font-mono ${security.lpLocked ? 'text-larp-green' : 'text-larp-yellow'}`}>
              {security.lpLocked ? `LOCKED${security.lpLockedPercent ? ` (${security.lpLockedPercent}%)` : ''}` : 'UNLOCKED'}
            </div>
          </div>
        </div>

        {security.holdersCount && (
          <div className="flex items-center gap-2 p-2 border border-ivory-light/10 bg-ivory-light/[0.02]">
            <Users size={14} className="text-ivory-light/50" />
            <div>
              <div className="text-[10px] text-ivory-light/40 uppercase">Holders</div>
              <div className="text-xs font-mono text-ivory-light">
                {formatNumber(security.holdersCount)}
                {security.top10HoldersPercent && (
                  <span className="text-ivory-light/40 ml-1">(top 10: {security.top10HoldersPercent}%)</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Domain Intel */}
      {(security.domainAgeDays || security.domainRegistrar) && (
        <div className="border-t border-ivory-light/10 pt-3 mt-3">
          <div className="text-xs text-ivory-light/40 mb-2 flex items-center gap-1">
            <Globe size={10} /> Domain Intel
          </div>
          <div className="space-y-0">
            {security.domainAgeDays !== undefined && (
              <DataItem
                label="Domain Age"
                value={
                  <span style={{ color: security.domainAgeDays > 365 ? '#22c55e' : security.domainAgeDays < 30 ? '#dc2626' : undefined }}>
                    {security.domainAgeDays} days
                  </span>
                }
              />
            )}
            {security.domainRegistrar && (
              <DataItem label="Registrar" value={security.domainRegistrar} />
            )}
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {hasRisks && (
        <div className="mt-3 p-3 bg-larp-red/5 border border-larp-red/20">
          <div className="flex items-center gap-2 text-xs text-larp-red font-medium mb-2">
            <AlertOctagon size={12} />
            RISK FLAGS DETECTED
          </div>
          <ul className="space-y-1">
            {security.risks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-ivory-light/60">
                <XCircle size={10} className="text-larp-red mt-0.5 shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}

// ============================================================================
// WEBSITE INTEL SECTION
// ============================================================================

function WebsiteIntelSection({ intel, websiteUrl }: { intel?: Project['websiteIntel']; websiteUrl?: string }) {
  if (!intel) {
    return (
      <Section title="Website Intel" icon={Globe} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Globe size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No website data available</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">Website not analyzed yet</p>
        </div>
      </Section>
    );
  }

  const qualityColors: Record<string, string> = {
    professional: '#22c55e',
    basic: '#6b7280',
    suspicious: '#dc2626',
    unknown: '#6b7280',
  };

  const checkItems = [
    { key: 'isLive', label: 'Website Live', value: intel.isLive },
    { key: 'hasDocumentation', label: 'Documentation', value: intel.hasDocumentation },
    { key: 'hasRoadmap', label: 'Roadmap Page', value: intel.hasRoadmap },
    { key: 'hasTokenomics', label: 'Tokenomics Page', value: intel.hasTokenomics },
    { key: 'hasTeamPage', label: 'Team Page', value: intel.hasTeamPage },
    { key: 'hasAuditInfo', label: 'Audit Info', value: intel.hasAuditInfo },
  ];

  return (
    <Section
      title="Website Intel"
      icon={Globe}
      accentColor={qualityColors[intel.websiteQuality] || '#6b7280'}
      action={
        websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ivory-light/30 hover:text-danger-orange transition-colors flex items-center gap-1"
          >
            Visit Site <ExternalLink size={10} />
          </a>
        )
      }
    >
      {/* Quality Score */}
      <div className="flex items-center justify-between mb-4 p-2 bg-ivory-light/[0.02] border border-ivory-light/10">
        <div>
          <div className="text-[10px] text-ivory-light/40 uppercase">Website Quality</div>
          <div className="text-sm font-mono font-medium capitalize" style={{ color: qualityColors[intel.websiteQuality] }}>
            {intel.websiteQuality}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-ivory-light/40 uppercase">Score</div>
          <div className="text-sm font-mono font-bold" style={{ color: qualityColors[intel.websiteQuality] }}>
            {intel.qualityScore}/100
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        {checkItems.map((item) => (
          <div key={item.key} className="flex items-center gap-2 py-1">
            {item.value ? (
              <CheckCircle2 size={12} className="text-larp-green" />
            ) : (
              <XCircle size={12} className="text-ivory-light/20" />
            )}
            <span className={`text-xs ${item.value ? 'text-ivory-light/70' : 'text-ivory-light/30'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Trust Indicators */}
      {intel.trustIndicators && intel.trustIndicators.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-larp-green/70 mb-1 flex items-center gap-1">
            <ThumbsUp size={10} /> Trust Indicators
          </div>
          <div className="flex flex-wrap gap-1">
            {intel.trustIndicators.map((indicator, idx) => (
              <Badge key={idx} variant="success">{indicator}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {intel.redFlags && intel.redFlags.length > 0 && (
        <div className="p-2 bg-larp-red/5 border border-larp-red/20">
          <div className="text-xs text-larp-red/70 mb-1 flex items-center gap-1">
            <AlertTriangle size={10} /> Red Flags
          </div>
          <div className="flex flex-wrap gap-1">
            {intel.redFlags.map((flag, idx) => (
              <Badge key={idx} variant="danger">{flag}</Badge>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}

// ============================================================================
// TRUST SIGNALS SECTION (Positive + Negative Indicators)
// ============================================================================

function TrustSignalsSection({ project }: { project: Project }) {
  const pos = project.positiveIndicators;
  const neg = project.negativeIndicators;

  if (!pos && !neg) {
    return (
      <Section title="Trust Signals" icon={Shield} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Shield size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No trust signals analyzed</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">AI analysis not yet complete</p>
        </div>
      </Section>
    );
  }

  // Build positive signals list
  const positiveSignals: Array<{ label: string; detail?: string | null }> = [];
  if (pos) {
    if (pos.isDoxxed) positiveSignals.push({ label: 'Team Doxxed', detail: pos.doxxedDetails });
    if (pos.hasActiveGithub) positiveSignals.push({ label: 'Active GitHub', detail: pos.githubActivity });
    if (pos.hasRealProduct) positiveSignals.push({ label: 'Real Product', detail: pos.productDetails });
    if (pos.hasConsistentHistory) positiveSignals.push({ label: 'Consistent History' });
    if (pos.hasOrganicEngagement) positiveSignals.push({ label: 'Organic Engagement' });
    if (pos.hasCredibleBackers) positiveSignals.push({ label: 'Credible Backers', detail: pos.backersDetails });
    if (pos.accountAgeDays > 365) positiveSignals.push({ label: `Account Age: ${Math.floor(pos.accountAgeDays / 365)}+ years` });
  }

  // Build negative signals list
  const negativeSignals: Array<{ label: string; detail?: string | null; severity: 'high' | 'medium' | 'low' }> = [];
  if (neg) {
    if (neg.hasScamAllegations) negativeSignals.push({ label: 'Scam Allegations', detail: neg.scamDetails, severity: 'high' });
    if (neg.hasRugHistory) negativeSignals.push({ label: 'Rug History', detail: neg.rugDetails, severity: 'high' });
    if (neg.isAnonymousTeam) negativeSignals.push({ label: 'Anonymous Team', severity: 'medium' });
    if (neg.hasSuspiciousFollowers) negativeSignals.push({ label: 'Suspicious Followers', detail: neg.suspiciousDetails, severity: 'medium' });
    if (neg.hasPreviousRebrand) negativeSignals.push({ label: 'Previous Rebrand', detail: neg.rebrandDetails, severity: 'low' });
    if (neg.hasHypeLanguage) negativeSignals.push({ label: 'Hype Language', severity: 'low' });
    if (neg.hasAggressivePromotion) negativeSignals.push({ label: 'Aggressive Promotion', detail: neg.promotionDetails, severity: 'low' });
    if (neg.noPublicAudit) negativeSignals.push({ label: 'No Public Audit', severity: 'medium' });
    if (neg.lowLiquidity) negativeSignals.push({ label: 'Low Liquidity', severity: 'medium' });
    if (neg.unverifiedLegalEntity) negativeSignals.push({ label: 'Unverified Legal Entity', severity: 'low' });
  }

  if (positiveSignals.length === 0 && negativeSignals.length === 0) return null;

  return (
    <Section
      title="Trust Signals"
      icon={Shield}
      accentColor={negativeSignals.some(s => s.severity === 'high') ? '#dc2626' : positiveSignals.length > negativeSignals.length ? '#22c55e' : '#f97316'}
    >
      <div className="space-y-4">
        {/* Positive Signals */}
        {positiveSignals.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs text-larp-green mb-2">
              <ThumbsUp size={12} />
              <span className="font-medium">Positive Signals ({positiveSignals.length})</span>
            </div>
            <div className="space-y-1">
              {positiveSignals.map((signal, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-larp-green/5 border border-larp-green/10">
                  <CheckCircle2 size={12} className="text-larp-green mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-ivory-light">{signal.label}</span>
                    {signal.detail && (
                      <p className="text-[10px] text-ivory-light/50 mt-0.5">{signal.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative Signals */}
        {negativeSignals.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs text-larp-red mb-2">
              <ThumbsDown size={12} />
              <span className="font-medium">Risk Signals ({negativeSignals.length})</span>
            </div>
            <div className="space-y-1">
              {negativeSignals.map((signal, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-2 border ${
                    signal.severity === 'high'
                      ? 'bg-larp-red/10 border-larp-red/30'
                      : signal.severity === 'medium'
                      ? 'bg-larp-yellow/5 border-larp-yellow/20'
                      : 'bg-ivory-light/[0.02] border-ivory-light/10'
                  }`}
                >
                  <XCircle
                    size={12}
                    className={`mt-0.5 shrink-0 ${
                      signal.severity === 'high' ? 'text-larp-red' : signal.severity === 'medium' ? 'text-larp-yellow' : 'text-ivory-light/40'
                    }`}
                  />
                  <div>
                    <span className={`text-xs ${signal.severity === 'high' ? 'text-larp-red' : 'text-ivory-light'}`}>
                      {signal.label}
                    </span>
                    {signal.detail && (
                      <p className="text-[10px] text-ivory-light/50 mt-0.5">{signal.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ============================================================================
// CONTROVERSIES SECTION
// ============================================================================

function ControversiesSection({ controversies }: { controversies?: string[] | null }) {
  // Only show placeholder if there are no controversies - this is actually good!
  if (!controversies || controversies.length === 0) {
    return (
      <Section title="Controversies" icon={AlertOctagon} accentColor="#22c55e">
        <div className="p-3 bg-larp-green/5 border border-larp-green/20 text-center">
          <CheckCircle2 size={18} className="mx-auto mb-1 text-larp-green" />
          <p className="text-xs text-larp-green font-mono">No controversies found</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Controversies" icon={AlertOctagon} accentColor="#dc2626">
      <div className="space-y-2">
        {controversies.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 p-2 bg-larp-red/5 border border-larp-red/10">
            <AlertTriangle size={12} className="text-larp-red mt-0.5 shrink-0" />
            <span className="text-xs text-ivory-light/70">{item}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ============================================================================
// SHIPPING HISTORY SECTION (Timeline)
// ============================================================================

function ShippingHistorySection({ history }: { history?: ShippingMilestone[] | null }) {
  if (!history || history.length === 0) {
    return (
      <Section title="Shipping History" icon={Package} accentColor="#6b7280">
        <div className="p-4 border border-dashed border-ivory-light/10 text-center">
          <Package size={24} className="mx-auto mb-2 text-ivory-light/20" />
          <p className="text-xs text-ivory-light/30 font-mono">No shipping history</p>
          <p className="text-[10px] text-ivory-light/20 mt-1">No releases or milestones tracked</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Shipping History" icon={Package} accentColor="#06b6d4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[5px] top-3 bottom-3 w-px bg-ivory-light/10" />

        <div className="space-y-3">
          {history.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 relative">
              {/* Timeline dot */}
              <div className="w-[11px] h-[11px] rounded-full bg-cyan-500 border-2 border-slate-dark shrink-0 z-10" />

              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-cyan-400">{item.date}</span>
                  {item.evidenceUrl && (
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ivory-light/30 hover:text-ivory-light/60 transition-colors"
                    >
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="text-sm text-ivory-light">{item.milestone}</div>
                {item.details && (
                  <p className="text-xs text-ivory-light/50 mt-1">{item.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ============================================================================
// LOADING / NOT FOUND STATES
// ============================================================================

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-danger-orange" />
        <span className="font-mono text-xs text-ivory-light/40 tracking-wider">Loading...</span>
      </div>
    </div>
  );
}

function NotFoundState() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="font-mono text-6xl text-ivory-light/10 mb-2">404</div>
      <div className="font-mono text-sm text-ivory-light/40 mb-6">Project not found</div>
      <button
        onClick={() => router.push('/terminal')}
        className="font-mono text-xs text-danger-orange hover:text-danger-orange/80 transition-colors"
      >
        ← Back to Terminal
      </button>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (projectId) fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setIsLoading(true);
      let res = await fetch(`/api/projects/${projectId}`);

      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/projects?q=${encodeURIComponent(projectId)}`);
        const data = await res.json();
        if (data.projects && data.projects.length > 0) {
          setProject(data.projects[0]);
          return;
        }
        setProject(null);
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch project');
      const data = await res.json();
      setProject(data.project || data);
    } catch (err) {
      console.error('[ProjectPage] Failed to fetch:', err);
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescan = async () => {
    if (!project?.xHandle) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/xintel/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: project.xHandle, force: true }),
      });
      if (res.ok) setTimeout(fetchProject, 2000);
    } catch (err) {
      console.error('[ProjectPage] Rescan failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShare = async () => {
    if (!project) return;
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: project.name, url });
    else navigator.clipboard.writeText(url);
  };

  if (isLoading) return <LoadingState />;
  if (!project) return <NotFoundState />;

  const score = project.trustScore?.score ?? 50;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-dark">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-ivory-light/5">
        <button
          onClick={() => router.push('/terminal')}
          className="flex items-center gap-2 text-sm text-ivory-light/50 hover:text-ivory-light transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-ivory-light/50 border border-ivory-light/10 hover:border-ivory-light/20 hover:text-ivory-light transition-colors"
          >
            <Share2 size={12} />
            Share
          </button>
          <button
            onClick={handleRescan}
            disabled={isRefreshing || !project.xHandle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-danger-orange text-black font-medium disabled:opacity-50 hover:bg-danger-orange/90 transition-colors"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Rescan
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Project Header */}
          <div className="flex gap-6 mb-8 pb-8 border-b border-ivory-light/10">
            {/* Left: Avatar + Info */}
            <div className="flex gap-4 flex-1">
              <div className="shrink-0">
                <div className="rounded-lg overflow-hidden border border-ivory-light/10">
                  {project.avatarUrl ? (
                    <Image src={project.avatarUrl} alt={project.name} width={72} height={72} />
                  ) : project.tokenAddress ? (
                    <ContractAvatar address={project.tokenAddress} size={72} bgColor="transparent" />
                  ) : (
                    <ContractAvatar address={project.id || project.name} size={72} bgColor="transparent" />
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl text-ivory-light font-bold">{project.name}</h1>
                  {project.ticker && (
                    <span className="font-mono text-lg text-danger-orange">${project.ticker}</span>
                  )}
                </div>

                {/* Links - Show all, gray out unavailable */}
                <div className="flex items-center gap-3 mb-3 text-sm flex-wrap">
                  {project.xHandle ? (
                    <a
                      href={`https://x.com/${project.xHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ivory-light/50 hover:text-ivory-light transition-colors"
                    >
                      <Twitter size={14} />
                      @{project.xHandle}
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-ivory-light/20 cursor-not-allowed">
                      <Twitter size={14} />
                      X/Twitter
                    </span>
                  )}

                  {project.websiteUrl ? (
                    <a
                      href={project.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ivory-light/50 hover:text-ivory-light transition-colors"
                    >
                      <Globe size={14} />
                      Website
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-ivory-light/20 cursor-not-allowed">
                      <Globe size={14} />
                      Website
                    </span>
                  )}

                  {project.githubUrl ? (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ivory-light/50 hover:text-ivory-light transition-colors"
                    >
                      <GithubIcon size={14} />
                      GitHub
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-ivory-light/20 cursor-not-allowed">
                      <GithubIcon size={14} />
                      GitHub
                    </span>
                  )}

                  {project.discordUrl ? (
                    <a
                      href={project.discordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ivory-light/50 hover:text-ivory-light transition-colors"
                    >
                      <MessageCircle size={14} />
                      Discord
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-ivory-light/20 cursor-not-allowed">
                      <MessageCircle size={14} />
                      Discord
                    </span>
                  )}

                  {project.telegramUrl ? (
                    <a
                      href={project.telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ivory-light/50 hover:text-ivory-light transition-colors"
                    >
                      <Send size={14} />
                      Telegram
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-ivory-light/20 cursor-not-allowed">
                      <Send size={14} />
                      Telegram
                    </span>
                  )}
                </div>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                )}

                {/* Description */}
                {(project.theStory || project.description || project.aiSummary) && (
                  <ExpandableSummary text={project.theStory || project.description || project.aiSummary || ''} />
                )}
              </div>
            </div>

            {/* Right: Trust Score */}
            <div className="shrink-0 w-40 text-center">
              <TrustScoreRing score={score} />
              <div className="mt-3 text-xs text-ivory-light/30">
                Last scan: {formatDate(project.lastScanAt)}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Core Data */}
            <div>
              <SecurityIntelSection security={project.securityIntel} />
              <MarketSection project={project} />
              <TokenomicsSection tokenomics={project.tokenomics} />
              <LiquiditySection liquidity={project.liquidity} />
              <GitHubSection project={project} />
              <TeamSection project={project} />
            </div>

            {/* Right Column - Trust & Intel */}
            <div>
              <TrustSignalsSection project={project} />
              <WebsiteIntelSection intel={project.websiteIntel} websiteUrl={project.websiteUrl} />
              <AuditSection audit={project.audit} />
              <LegalSection entity={project.legalEntity} />
              <AffiliationsSection affiliations={project.affiliations} />
              <TechStackSection techStack={project.techStack} />
              <RoadmapSection roadmap={project.roadmap} />
              <ShippingHistorySection history={project.shippingHistory} />
              <ControversiesSection controversies={project.controversies} />
              <KeyFindingsSection findings={project.keyFindings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
