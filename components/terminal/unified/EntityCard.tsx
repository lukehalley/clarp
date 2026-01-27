'use client';

import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Minus, CheckCircle, AlertTriangle, TrendingUp, Code, Sparkles, Coins } from 'lucide-react';
import type { EntityCategory, TrustTier, UnifiedEntity, KOLEntity, DevEntity, ProjectEntity, TokenEntity } from '@/types/unified-terminal';
import { getTrustTierColor, getTrustTierLabel } from '@/types/unified-terminal';

interface EntityCardProps {
  entity: UnifiedEntity | KOLEntity | DevEntity | ProjectEntity | TokenEntity;
  compact?: boolean;
  showMetrics?: boolean;
}

const CATEGORY_ICONS: Record<EntityCategory, React.ReactNode> = {
  kol: <TrendingUp size={8} />,
  dev: <Code size={8} />,
  project: <Sparkles size={8} />,
  token: <Coins size={8} />,
};

const CATEGORY_COLORS: Record<EntityCategory, string> = {
  kol: 'bg-larp-purple/20 text-larp-purple border-larp-purple/30',
  dev: 'bg-larp-green/20 text-larp-green border-larp-green/30',
  project: 'bg-danger-orange/20 text-danger-orange border-danger-orange/30',
  token: 'bg-larp-yellow/20 text-larp-yellow border-larp-yellow/30',
};

function TrustBadge({ tier, score }: { tier: TrustTier; score: number }) {
  const color = getTrustTierColor(tier);
  const isGood = tier === 'verified' || tier === 'trusted';

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] font-bold border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}50`,
        color: color
      }}
    >
      {isGood ? <CheckCircle size={8} /> : tier === 'danger' || tier === 'warning' ? <AlertTriangle size={8} /> : null}
      <span>{score}</span>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'rising' | 'stable' | 'falling' }) {
  if (trend === 'rising') {
    return <ArrowUpRight size={10} className="text-larp-green" />;
  }
  if (trend === 'falling') {
    return <ArrowDownRight size={10} className="text-larp-red" />;
  }
  return <Minus size={8} className="text-ivory-light/30" />;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

export default function EntityCard({ entity, compact, showMetrics = true }: EntityCardProps) {
  const href = `/terminal/${entity.category}/${entity.handle}`;

  // Type guards for entity-specific data
  const isKOL = (e: UnifiedEntity): e is KOLEntity => e.category === 'kol';
  const isDev = (e: UnifiedEntity): e is DevEntity => e.category === 'dev';
  const isProject = (e: UnifiedEntity): e is ProjectEntity => e.category === 'project';
  const isToken = (e: UnifiedEntity): e is TokenEntity => e.category === 'token';

  if (compact) {
    return (
      <Link
        href={href}
        className="flex items-center gap-2 p-1.5 bg-ivory-light/5 border border-ivory-light/10 hover:border-danger-orange/50 hover:bg-ivory-light/10 transition-all group"
      >
        {/* Avatar or icon */}
        <div className="w-6 h-6 bg-slate-medium flex items-center justify-center shrink-0">
          {entity.avatarUrl ? (
            <img src={entity.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-ivory-light/50 font-mono text-[10px]">
              {entity.handle.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name & handle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-ivory-light truncate">
              {entity.displayName || entity.handle}
            </span>
            <TrendIndicator trend={entity.trustScore.trend} />
          </div>
          <span className="font-mono text-[9px] text-ivory-light/40">
            {entity.category === 'token' ? entity.handle : `@${entity.handle}`}
          </span>
        </div>

        {/* Trust score */}
        <TrustBadge tier={entity.trustScore.tier} score={entity.trustScore.score} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="block p-2 bg-ivory-light/5 border border-ivory-light/10 hover:border-danger-orange/50 hover:bg-ivory-light/10 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-1.5">
        {/* Avatar */}
        <div className="w-8 h-8 bg-slate-medium flex items-center justify-center shrink-0">
          {entity.avatarUrl ? (
            <img src={entity.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-ivory-light/50 font-mono text-xs">
              {entity.handle.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name & category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-xs font-bold text-ivory-light truncate group-hover:text-danger-orange transition-colors">
              {entity.displayName || entity.handle}
            </span>
            <TrendIndicator trend={entity.trustScore.trend} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-ivory-light/40">
              {entity.category === 'token' ? entity.handle : `@${entity.handle}`}
            </span>
            <span className={`flex items-center gap-0.5 px-1 py-0.5 text-[8px] font-mono font-bold border ${CATEGORY_COLORS[entity.category]}`}>
              {CATEGORY_ICONS[entity.category]}
              {entity.category.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Trust score */}
        <TrustBadge tier={entity.trustScore.tier} score={entity.trustScore.score} />
      </div>

      {/* Metrics - entity-specific */}
      {showMetrics && (
        <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-ivory-light/10">
          {isKOL(entity) && (
            <>
              <Metric label="FOLLOWERS" value={formatNumber(entity.followers)} />
              <Metric label="WIN RATE" value={`${entity.callTrackRecord.winRate}%`} positive={entity.callTrackRecord.winRate > 50} />
              <Metric label="CALLS" value={entity.callTrackRecord.totalCalls.toString()} />
            </>
          )}
          {isDev(entity) && (
            <>
              <Metric label="SHIPPED" value={entity.shippedProducts.toString()} positive />
              <Metric label="PROJECTS" value={entity.projects.length.toString()} />
              <Metric label="VOUCHES" value={entity.vouchNetwork.incomingVouches.length.toString()} />
            </>
          )}
          {isProject(entity) && (
            <>
              <Metric label="STATUS" value={entity.status.toUpperCase()} positive={entity.status === 'launched'} />
              <Metric label="TEAM" value={entity.team.length.toString()} />
              <Metric label="TVL" value={entity.tvl ? `$${formatNumber(entity.tvl)}` : '-'} />
            </>
          )}
          {isToken(entity) && (
            <>
              <Metric label="PRICE" value={`$${entity.price.toFixed(6)}`} />
              <Metric
                label="24H"
                value={formatPercent(entity.priceChange24h)}
                positive={entity.priceChange24h > 0}
                negative={entity.priceChange24h < 0}
              />
              <Metric label="MCAP" value={entity.marketCap ? `$${formatNumber(entity.marketCap)}` : '-'} />
            </>
          )}
        </div>
      )}

      {/* Tags */}
      {entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {entity.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-1 py-0.5 text-[8px] font-mono text-ivory-light/50 bg-ivory-light/5 border border-ivory-light/10">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function Metric({
  label,
  value,
  positive,
  negative
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-[8px] font-mono text-ivory-light/40">{label}</div>
      <div className={`text-[10px] font-mono font-bold ${
        positive ? 'text-larp-green' : negative ? 'text-larp-red' : 'text-ivory-light'
      }`}>
        {value}
      </div>
    </div>
  );
}
