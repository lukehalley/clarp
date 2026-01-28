'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ScanProgressIndicator from '@/components/terminal/ScanProgressIndicator';
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
  Clock,
  Building2,
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
  GitCommit,
  Eye,
  CircleDot,
  Globe,
  MessageCircle,
  Send,
  Package,
  Snowflake,
  UserX,
  ThumbsUp,
  ThumbsDown,
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
// ICONS
// ============================================================================

function GithubIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

// ============================================================================
// DESIGN SYSTEM COMPONENTS
// ============================================================================

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-slate-dark border border-ivory-light/10 ${className}`}>
      {children}
    </div>
  );
}

type TabId = 'overview' | 'security' | 'market' | 'intel' | 'development';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'market', label: 'Market', icon: BarChart3 },
  { id: 'intel', label: 'Intel', icon: Globe },
  { id: 'development', label: 'Development', icon: GithubIcon },
];

function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
      <div className="flex items-center gap-1 p-1 bg-ivory-light/[0.02] border border-ivory-light/10 min-w-max sm:min-w-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-mono transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-danger-orange text-black'
                  : 'text-ivory-light/50 hover:text-ivory-light hover:bg-ivory-light/5'
              }`}
            >
              <Icon size={14} />
              <span className="text-[11px] sm:text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CardHeader({
  title,
  icon: Icon,
  accentColor = '#f97316',
  action,
}: {
  title: string;
  icon: React.ElementType;
  accentColor?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-ivory-light/5">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: accentColor }} />
        <h3 className="text-xs font-mono uppercase tracking-wider text-ivory-light/70">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

function Badge({
  children,
  variant = 'default',
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

function DataRow({
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
    <div className="flex items-center justify-between py-2 group border-b border-ivory-light/5 last:border-0">
      <span className="text-xs text-ivory-light/40">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} text-xs text-ivory-light ${link ? 'group-hover:text-danger-orange transition-colors' : ''}`}>
        {value}
        {link && <ExternalLink size={9} className="inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </span>
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="block hover:bg-ivory-light/[0.02] transition-colors">
        {content}
      </a>
    );
  }

  return content;
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 text-center">
      <Icon size={24} className="mx-auto mb-2 text-ivory-light/15" />
      <p className="text-xs text-ivory-light/30 font-mono">{title}</p>
      <p className="text-[10px] text-ivory-light/20 mt-1">{description}</p>
    </div>
  );
}

// ============================================================================
// EXPANDABLE SUMMARY
// ============================================================================

function ExpandableSummary({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = text.length > 250;

  return (
    <div>
      <p className={`text-sm text-ivory-light/60 leading-relaxed ${!isExpanded && needsTruncation ? 'line-clamp-3' : ''}`}>
        {text}
      </p>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 flex items-center gap-1 text-xs text-danger-orange/70 hover:text-danger-orange transition-colors"
        >
          {isExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// SECURITY INTEL SECTION
// ============================================================================

function SecurityIntelSection({ security }: { security?: SecurityIntel | null }) {
  const hasData = !!security;
  const hasRisks = security?.risks && security.risks.length > 0;
  const allSafe = hasData && !security.mintAuthorityEnabled && !security.freezeAuthorityEnabled && security.lpLocked && !hasRisks;

  if (!hasData) {
    return (
      <Card>
        <CardHeader title="Security Intel" icon={Shield} accentColor="#6b7280" />
        <EmptyState
          icon={ShieldX}
          title="No security data available"
          description="Rescan to gather RugCheck data"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Security Intel"
        icon={allSafe ? ShieldCheck : ShieldAlert}
        accentColor={allSafe ? '#22c55e' : '#f97316'}
      />
      <CardBody className="space-y-4">
        {/* Security Status Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
          <div className={`flex items-center gap-2 p-3 border ${!security.mintAuthorityEnabled ? 'border-larp-green/20 bg-larp-green/5' : 'border-larp-red/20 bg-larp-red/5'}`}>
            {!security.mintAuthorityEnabled ? (
              <Lock size={14} className="text-larp-green shrink-0" />
            ) : (
              <Unlock size={14} className="text-larp-red shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-ivory-light/40 uppercase">Mint</div>
              <div className={`text-xs font-mono truncate ${!security.mintAuthorityEnabled ? 'text-larp-green' : 'text-larp-red'}`}>
                {security.mintAuthorityEnabled ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-3 border ${!security.freezeAuthorityEnabled ? 'border-larp-green/20 bg-larp-green/5' : 'border-larp-red/20 bg-larp-red/5'}`}>
            {!security.freezeAuthorityEnabled ? (
              <ShieldCheck size={14} className="text-larp-green shrink-0" />
            ) : (
              <Snowflake size={14} className="text-larp-red shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-ivory-light/40 uppercase">Freeze</div>
              <div className={`text-xs font-mono truncate ${!security.freezeAuthorityEnabled ? 'text-larp-green' : 'text-larp-red'}`}>
                {security.freezeAuthorityEnabled ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-3 border ${security.lpLocked ? 'border-larp-green/20 bg-larp-green/5' : 'border-larp-yellow/20 bg-larp-yellow/5'}`}>
            {security.lpLocked ? (
              <Lock size={14} className="text-larp-green shrink-0" />
            ) : (
              <Unlock size={14} className="text-larp-yellow shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-[10px] text-ivory-light/40 uppercase">LP Status</div>
              <div className={`text-xs font-mono truncate ${security.lpLocked ? 'text-larp-green' : 'text-larp-yellow'}`}>
                {security.lpLocked ? `LOCKED${security.lpLockedPercent ? ` ${security.lpLockedPercent}%` : ''}` : 'UNLOCKED'}
              </div>
            </div>
          </div>

          {security.holdersCount && (
            <div className="flex items-center gap-2 p-3 border border-ivory-light/10 bg-ivory-light/[0.02]">
              <Users size={14} className="text-ivory-light/50 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-ivory-light/40 uppercase">Holders</div>
                <div className="text-xs font-mono text-ivory-light truncate">
                  {formatNumber(security.holdersCount)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Domain Intel */}
        {(security.domainAgeDays !== undefined || security.domainRegistrar) && (
          <div className="border-t border-ivory-light/5 pt-4">
            <div className="text-[10px] text-ivory-light/40 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Globe size={10} /> Domain Intel
            </div>
            {security.domainAgeDays !== undefined && (
              <DataRow
                label="Domain Age"
                value={
                  <span style={{ color: security.domainAgeDays > 365 ? '#22c55e' : security.domainAgeDays < 30 ? '#dc2626' : undefined }}>
                    {security.domainAgeDays} days
                  </span>
                }
              />
            )}
            {security.domainRegistrar && (
              <DataRow label="Registrar" value={security.domainRegistrar} />
            )}
          </div>
        )}

        {/* Risk Flags */}
        {hasRisks && (
          <div className="p-3 bg-larp-red/5 border border-larp-red/20">
            <div className="flex items-center gap-2 text-xs text-larp-red font-medium mb-2">
              <AlertOctagon size={12} />
              RISK FLAGS DETECTED
            </div>
            <ul className="space-y-1.5">
              {security.risks.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-ivory-light/60">
                  <XCircle size={10} className="text-larp-red mt-0.5 shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// MARKET DATA SECTION
// ============================================================================

function MarketSection({ project }: { project: Project }) {
  const market = project.marketData;

  if (!market) {
    return (
      <Card>
        <CardHeader title="Market Data" icon={BarChart3} accentColor="#6b7280" />
        <EmptyState
          icon={BarChart3}
          title="No market data available"
          description={project.tokenAddress ? 'Token not found on DEX' : 'No token address'}
        />
      </Card>
    );
  }

  const priceUp = (market.priceChange24h ?? 0) >= 0;

  return (
    <Card>
      <CardHeader
        title="Market Data"
        icon={BarChart3}
        accentColor={priceUp ? '#22c55e' : '#dc2626'}
        action={
          project.tokenAddress && (
            <a
              href={`https://dexscreener.com/solana/${project.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-ivory-light/30 hover:text-danger-orange transition-colors flex items-center gap-1"
            >
              DexScreener <ExternalLink size={10} />
            </a>
          )
        }
      />
      <CardBody>
        {/* Price Hero */}
        <div className="mb-4 pb-4 border-b border-ivory-light/5">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-mono text-ivory-light font-bold">{formatPrice(market.price)}</span>
            <span className={`flex items-center gap-0.5 text-sm font-mono ${priceUp ? 'text-larp-green' : 'text-larp-red'}`}>
              {priceUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {priceUp ? '+' : ''}{market.priceChange24h?.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-0">
          <DataRow label="Market Cap" value={formatCurrency(market.marketCap)} />
          <DataRow label="24h Volume" value={formatCurrency(market.volume24h)} />
          <DataRow label="Liquidity" value={formatCurrency(market.liquidity)} />
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// TOKENOMICS SECTION
// ============================================================================

function TokenomicsSection({ tokenomics }: { tokenomics?: Tokenomics | null }) {
  if (!tokenomics) {
    return (
      <Card>
        <CardHeader title="Tokenomics" icon={Coins} accentColor="#6b7280" />
        <EmptyState
          icon={Coins}
          title="No tokenomics data"
          description="Supply info not available"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Tokenomics" icon={Coins} accentColor="#f59e0b" />
      <CardBody>
        <div className="space-y-0">
          {tokenomics.totalSupply && (
            <DataRow label="Total Supply" value={formatSupply(tokenomics.totalSupply)} />
          )}
          {tokenomics.circulatingSupply && (
            <DataRow label="Circulating" value={formatSupply(tokenomics.circulatingSupply)} />
          )}
          <DataRow
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
            <DataRow label="Vesting" value={tokenomics.vestingSchedule} mono={false} />
          )}
        </div>
        {tokenomics.burnMechanism && (
          <div className="mt-4 p-3 bg-danger-orange/5 border-l-2 border-danger-orange/30">
            <div className="flex items-center gap-1 text-xs text-danger-orange mb-1">
              <Flame size={10} /> Burn Mechanism
            </div>
            <p className="text-xs text-ivory-light/60">{tokenomics.burnMechanism}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// LIQUIDITY SECTION
// ============================================================================

function LiquiditySection({ liquidity }: { liquidity?: LiquidityInfo | null }) {
  if (!liquidity) {
    return (
      <Card>
        <CardHeader title="Liquidity" icon={DollarSign} accentColor="#6b7280" />
        <EmptyState
          icon={DollarSign}
          title="No liquidity data"
          description="DEX pool not found"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Liquidity" icon={DollarSign} accentColor={liquidity.liquidityLocked ? '#22c55e' : '#f97316'} />
      <CardBody>
        <div className="space-y-0">
          {liquidity.primaryDex && <DataRow label="Primary DEX" value={liquidity.primaryDex} />}
          {liquidity.poolType && <DataRow label="Pool Type" value={liquidity.poolType} />}
          {liquidity.liquidityUsd && (
            <DataRow
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
          <DataRow
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
            <DataRow label="Lock Duration" value={liquidity.lockDuration} />
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// AUDIT SECTION
// ============================================================================

function AuditSection({ audit }: { audit?: AuditInfo | null }) {
  const auditColor = audit?.auditStatus === 'completed' ? '#22c55e' :
                     audit?.auditStatus === 'pending' ? '#f59e0b' : '#dc2626';
  return (
    <Card>
      <CardHeader title="Security Audit" icon={FileSearch} accentColor={auditColor} />
      <CardBody>
        {audit?.hasAudit || audit?.auditStatus === 'pending' ? (
          <div className="space-y-0">
            <DataRow
              label="Status"
              value={
                audit.auditStatus === 'completed' ? (
                  <Badge variant="success">Audited</Badge>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )
              }
            />
            {audit.auditor && <DataRow label="Auditor" value={audit.auditor} />}
            {audit.auditDate && <DataRow label="Date" value={audit.auditDate} />}
            {audit.auditUrl && (
              <DataRow label="Report" value="View Report" link={audit.auditUrl} />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-larp-red/5 border border-larp-red/10">
            <AlertTriangle size={20} className="text-larp-red shrink-0" />
            <div>
              <div className="text-sm text-larp-red font-medium">No Security Audit</div>
              <div className="text-xs text-ivory-light/40">Unaudited contracts carry higher risk</div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// TECH STACK SECTION
// ============================================================================

function TechStackSection({ techStack }: { techStack?: TechStack | null }) {
  if (!techStack) {
    return (
      <Card>
        <CardHeader title="Tech Stack" icon={Cpu} accentColor="#6b7280" />
        <EmptyState
          icon={Cpu}
          title="No tech stack info"
          description="Technical details not available"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Tech Stack" icon={Cpu} accentColor={techStack.zkTech ? '#a855f7' : '#6366f1'} />
      <CardBody>
        <div className="space-y-0">
          {techStack.blockchain && <DataRow label="Blockchain" value={techStack.blockchain} />}
          {techStack.zkTech && (
            <DataRow label="ZK Technology" value={<span className="text-purple-400">{techStack.zkTech}</span>} />
          )}
          <DataRow
            label="Offline Capable"
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
          <div className="mt-4 pt-4 border-t border-ivory-light/5">
            <div className="text-[10px] text-ivory-light/40 uppercase tracking-wider mb-2 flex items-center gap-1">
              <HardDrive size={10} /> Hardware Products
            </div>
            <div className="flex flex-wrap gap-1">
              {techStack.hardwareProducts.map((product, idx) => (
                <Badge key={idx}>{product}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// LEGAL ENTITY SECTION
// ============================================================================

function LegalSection({ entity }: { entity?: LegalEntity | null }) {
  if (!entity || (!entity.companyName && !entity.isRegistered)) {
    return (
      <Card>
        <CardHeader title="Legal Entity" icon={Building2} accentColor="#6b7280" />
        <EmptyState
          icon={Building2}
          title="No legal entity found"
          description="Company info not discovered"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Legal Entity" icon={Building2} accentColor={entity.isRegistered ? '#22c55e' : '#6b7280'} />
      <CardBody>
        <div className="space-y-0">
          {entity.companyName && <DataRow label="Company" value={entity.companyName} />}
          {entity.jurisdiction && <DataRow label="Jurisdiction" value={entity.jurisdiction} />}
          <DataRow
            label="Status"
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
          <p className="mt-4 text-xs text-ivory-light/50 p-3 bg-ivory-light/[0.02] border-l-2 border-larp-green/30">
            {entity.registrationDetails}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// AFFILIATIONS SECTION
// ============================================================================

function AffiliationsSection({ affiliations }: { affiliations?: Affiliation[] | null }) {
  if (!affiliations || affiliations.length === 0) {
    return (
      <Card>
        <CardHeader title="Affiliations" icon={Award} accentColor="#6b7280" />
        <EmptyState
          icon={Award}
          title="No affiliations found"
          description="No councils, VCs, or accelerators"
        />
      </Card>
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
    <Card>
      <CardHeader title="Affiliations" icon={Award} accentColor="#8b5cf6" />
      <CardBody>
        <div className="space-y-2">
          {affiliations.map((aff, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 bg-ivory-light/[0.02] border border-ivory-light/5">
              <span className={`text-[10px] font-mono uppercase ${typeColors[aff.type] || typeColors.other}`}>
                {aff.type}
              </span>
              <span className="text-sm text-ivory-light">{aff.name}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// GITHUB INTEL SECTION
// ============================================================================

function GitHubSection({ project }: { project: Project }) {
  const intel = project.githubIntel;

  if (!intel) {
    return (
      <Card>
        <CardHeader title="Development" icon={GithubIcon} accentColor="#6b7280" />
        <EmptyState
          icon={GithubIcon}
          title="No GitHub data available"
          description={project.githubUrl ? 'GitHub not analyzed yet' : 'No GitHub linked'}
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Development"
        icon={GithubIcon}
        accentColor="#22c55e"
        action={
          project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-ivory-light/30 hover:text-larp-green transition-colors flex items-center gap-1"
            >
              GitHub <ExternalLink size={10} />
            </a>
          )
        }
      />
      <CardBody>
        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-ivory-light/5 flex-wrap">
          <span className="flex items-center gap-1 text-xs">
            <Star size={12} className="text-larp-yellow" />
            <span className="font-mono text-ivory-light">{formatNumber(intel.stars)}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-ivory-light/60">
            <GitFork size={12} />
            <span>{formatNumber(intel.forks)}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-ivory-light/60">
            <Users size={12} />
            <span>{intel.contributorsCount}</span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            <GitCommit size={12} className="text-larp-green" />
            <span className="text-larp-green">{intel.commitsLast30d}</span>
            <span className="text-ivory-light/40">in 30d</span>
          </span>
        </div>

        <div className="space-y-0">
          {intel.primaryLanguage && <DataRow label="Language" value={intel.primaryLanguage} />}
          {intel.license && <DataRow label="License" value={intel.license} />}
          {intel.lastCommitDate && <DataRow label="Last Commit" value={formatDate(intel.lastCommitDate)} />}
          <DataRow
            label="Health Score"
            value={
              <span style={{ color: intel.healthScore >= 70 ? '#22c55e' : intel.healthScore >= 50 ? '#f97316' : '#dc2626' }}>
                {intel.healthScore}/100
              </span>
            }
          />
        </div>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// TEAM SECTION
// ============================================================================

function TeamSection({ project }: { project: Project }) {
  const team = project.team || [];

  if (team.length === 0) {
    return (
      <Card>
        <CardHeader title="Team" icon={Users} accentColor="#6b7280" />
        <EmptyState
          icon={UserX}
          title="No team members identified"
          description="Team not discovered or anonymous"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Team" icon={Users} accentColor="#3b82f6" />
      <CardBody className="space-y-2">
        {team.map((member, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-ivory-light/[0.02] border border-ivory-light/5">
            {member.avatarUrl ? (
              <Image src={member.avatarUrl} alt={member.displayName || member.handle} width={36} height={36} className="rounded" />
            ) : (
              <div className="w-9 h-9 rounded bg-ivory-light/10 flex items-center justify-center shrink-0">
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
                  Ex: {member.previousEmployers.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
            {member.handle && (
              <a
                href={`https://x.com/${member.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory-light/30 hover:text-ivory-light/60 transition-colors shrink-0"
              >
                <Twitter size={14} />
              </a>
            )}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// ROADMAP SECTION
// ============================================================================

function RoadmapSection({ roadmap }: { roadmap?: RoadmapMilestone[] | null }) {
  if (!roadmap || roadmap.length === 0) {
    return (
      <Card>
        <CardHeader title="Roadmap" icon={Target} accentColor="#6b7280" />
        <EmptyState
          icon={Target}
          title="No roadmap found"
          description="Project milestones not available"
        />
      </Card>
    );
  }

  const statusIcons = {
    completed: <CheckCircle2 size={14} className="text-larp-green" />,
    'in-progress': <CircleDot size={14} className="text-larp-yellow" />,
    planned: <Circle size={14} className="text-ivory-light/30" />,
  };

  return (
    <Card>
      <CardHeader title="Roadmap" icon={Target} accentColor="#06b6d4" />
      <CardBody className="space-y-2">
        {roadmap.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-ivory-light/[0.02] border border-ivory-light/5">
            <div className="mt-0.5 shrink-0">{statusIcons[item.status]}</div>
            <div className="min-w-0">
              <div className="text-sm text-ivory-light">{item.milestone}</div>
              {item.targetDate && (
                <div className="text-xs text-ivory-light/40 flex items-center gap-1 mt-1">
                  <Calendar size={10} /> {item.targetDate}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// SHIPPING HISTORY SECTION
// ============================================================================

function ShippingHistorySection({ history }: { history?: ShippingMilestone[] | null }) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader title="Shipping History" icon={Package} accentColor="#6b7280" />
        <EmptyState
          icon={Package}
          title="No shipping history"
          description="No releases or milestones tracked"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Shipping History" icon={Package} accentColor="#06b6d4" />
      <CardBody>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[5px] top-3 bottom-3 w-px bg-ivory-light/10" />

          <div className="space-y-4">
            {history.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 relative">
                {/* Timeline dot */}
                <div className="w-[11px] h-[11px] rounded-full bg-cyan-500 border-2 border-slate-dark shrink-0 z-10" />

                <div className="flex-1 min-w-0">
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
      </CardBody>
    </Card>
  );
}

// ============================================================================
// KEY FINDINGS SECTION
// ============================================================================

function KeyFindingsSection({ findings }: { findings?: string[] | null }) {
  if (!findings || findings.length === 0) {
    return (
      <Card>
        <CardHeader title="Key Findings" icon={Eye} accentColor="#6b7280" />
        <EmptyState
          icon={Eye}
          title="No key findings"
          description="AI analysis pending"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Key Findings" icon={Eye} accentColor="#f97316" />
      <CardBody>
        <ul className="space-y-2">
          {findings.map((finding, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-ivory-light/70">
              <span className="text-danger-orange mt-0.5 shrink-0">•</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

// ============================================================================
// WEBSITE INTEL SECTION
// ============================================================================

function WebsiteIntelSection({ intel, websiteUrl }: { intel?: Project['websiteIntel']; websiteUrl?: string }) {
  if (!intel) {
    return (
      <Card>
        <CardHeader title="Website Intel" icon={Globe} accentColor="#6b7280" />
        <EmptyState
          icon={Globe}
          title="No website data available"
          description="Website not analyzed yet"
        />
      </Card>
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
    <Card>
      <CardHeader
        title="Website Intel"
        icon={Globe}
        accentColor={qualityColors[intel.websiteQuality] || '#6b7280'}
        action={
          websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-ivory-light/30 hover:text-danger-orange transition-colors flex items-center gap-1"
            >
              Visit <ExternalLink size={10} />
            </a>
          )
        }
      />
      <CardBody>
        {/* Quality Score */}
        <div className="flex items-center justify-between mb-4 p-3 bg-ivory-light/[0.02] border border-ivory-light/10">
          <div>
            <div className="text-[10px] text-ivory-light/40 uppercase">Quality</div>
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

        {/* Checklist */}
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-1 mb-4">
          {checkItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2 py-1.5">
              {item.value ? (
                <CheckCircle2 size={12} className="text-larp-green shrink-0" />
              ) : (
                <XCircle size={12} className="text-ivory-light/20 shrink-0" />
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
            <div className="text-[10px] text-larp-green/70 mb-2 flex items-center gap-1 uppercase tracking-wider">
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
          <div className="p-3 bg-larp-red/5 border border-larp-red/20">
            <div className="text-[10px] text-larp-red/70 mb-2 flex items-center gap-1 uppercase tracking-wider">
              <AlertTriangle size={10} /> Red Flags
            </div>
            <div className="flex flex-wrap gap-1">
              {intel.redFlags.map((flag, idx) => (
                <Badge key={idx} variant="danger">{flag}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ============================================================================
// TRUST SIGNALS SECTION
// ============================================================================

function TrustSignalsSection({ project }: { project: Project }) {
  const pos = project.positiveIndicators;
  const neg = project.negativeIndicators;

  if (!pos && !neg) {
    return (
      <Card>
        <CardHeader title="Trust Signals" icon={Shield} accentColor="#6b7280" />
        <EmptyState
          icon={Shield}
          title="No trust signals analyzed"
          description="AI analysis not yet complete"
        />
      </Card>
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
    <Card>
      <CardHeader
        title="Trust Signals"
        icon={Shield}
        accentColor={negativeSignals.some(s => s.severity === 'high') ? '#dc2626' : positiveSignals.length > negativeSignals.length ? '#22c55e' : '#f97316'}
      />
      <CardBody className="space-y-4">
        {/* Positive Signals */}
        {positiveSignals.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs text-larp-green mb-2">
              <ThumbsUp size={12} />
              <span className="font-medium">Positive ({positiveSignals.length})</span>
            </div>
            <div className="space-y-1.5">
              {positiveSignals.map((signal, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-larp-green/5 border border-larp-green/10">
                  <CheckCircle2 size={12} className="text-larp-green mt-0.5 shrink-0" />
                  <div className="min-w-0">
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
            <div className="space-y-1.5">
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
                  <div className="min-w-0">
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
      </CardBody>
    </Card>
  );
}

// ============================================================================
// CONTROVERSIES SECTION
// ============================================================================

function ControversiesSection({ controversies }: { controversies?: string[] | null }) {
  if (!controversies || controversies.length === 0) {
    return (
      <Card>
        <CardHeader title="Controversies" icon={AlertOctagon} accentColor="#22c55e" />
        <CardBody>
          <div className="p-4 bg-larp-green/5 border border-larp-green/20 text-center">
            <CheckCircle2 size={20} className="mx-auto mb-1 text-larp-green" />
            <p className="text-xs text-larp-green font-mono">No controversies found</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Controversies" icon={AlertOctagon} accentColor="#dc2626" />
      <CardBody className="space-y-2">
        {controversies.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 p-3 bg-larp-red/5 border border-larp-red/10">
            <AlertTriangle size={12} className="text-larp-red mt-0.5 shrink-0" />
            <span className="text-xs text-ivory-light/70">{item}</span>
          </div>
        ))}
      </CardBody>
    </Card>
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
        Back to Terminal
      </button>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function ProjectPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const scanJobId = searchParams.get('scanJob');

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

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
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-ivory-light/5 gap-2">
        <button
          onClick={() => router.push('/terminal')}
          className="flex items-center gap-1.5 sm:gap-2 text-sm text-ivory-light/50 hover:text-ivory-light transition-colors shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="font-mono text-xs hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs text-ivory-light/50 border border-ivory-light/10 hover:border-ivory-light/20 hover:text-ivory-light transition-colors"
          >
            <Share2 size={12} />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={handleRescan}
            disabled={isRefreshing || !project.xHandle}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs bg-danger-orange text-black font-mono font-medium disabled:opacity-50 hover:bg-danger-orange/90 transition-colors"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden xs:inline">Rescan</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Project Header - Always visible */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
            {/* Avatar + Trust Score Row on Mobile */}
            <div className="flex items-start gap-4 sm:block">
              <div className="shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-ivory-light/10">
                  {project.avatarUrl ? (
                    <Image src={project.avatarUrl} alt={project.name} width={64} height={64} className="w-full h-full object-cover" />
                  ) : project.tokenAddress ? (
                    <ContractAvatar address={project.tokenAddress} size={64} bgColor="transparent" />
                  ) : (
                    <ContractAvatar address={project.id || project.name} size={64} bgColor="transparent" />
                  )}
                </div>
              </div>
              {/* Trust Score - visible on mobile only next to avatar */}
              <div className="sm:hidden flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg text-ivory-light font-bold truncate">{project.name}</h1>
                  {project.ticker && (
                    <span className="font-mono text-sm text-danger-orange shrink-0">${project.ticker}</span>
                  )}
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 border"
                  style={{
                    borderColor: getTrustColor(score) + '40',
                    backgroundColor: getTrustColor(score) + '10',
                  }}
                >
                  <span className="font-mono text-sm font-bold" style={{ color: getTrustColor(score) }}>
                    {score}
                  </span>
                  <span className="text-[10px] font-mono uppercase" style={{ color: getTrustColor(score) }}>
                    {getTrustLabel(score)}
                  </span>
                </div>
              </div>
            </div>

            {/* Info - Desktop layout */}
            <div className="flex-1 min-w-0">
              {/* Desktop: Name + Ticker + Score on same line */}
              <div className="hidden sm:flex items-center gap-3 mb-1">
                <h1 className="text-xl text-ivory-light font-bold truncate">{project.name}</h1>
                {project.ticker && (
                  <span className="font-mono text-base text-danger-orange shrink-0">${project.ticker}</span>
                )}
                {/* Inline Trust Score */}
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 border ml-auto shrink-0"
                  style={{
                    borderColor: getTrustColor(score) + '40',
                    backgroundColor: getTrustColor(score) + '10',
                  }}
                >
                  <span className="font-mono text-sm font-bold" style={{ color: getTrustColor(score) }}>
                    {score}
                  </span>
                  <span className="text-[10px] font-mono uppercase" style={{ color: getTrustColor(score) }}>
                    {getTrustLabel(score)}
                  </span>
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                {project.xHandle && (
                  <a
                    href={`https://x.com/${project.xHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-ivory-light/50 hover:text-ivory-light transition-colors"
                  >
                    <Twitter size={12} />
                    <span className="hidden xs:inline">@</span>{project.xHandle}
                  </a>
                )}
                {project.websiteUrl && (
                  <a
                    href={project.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-ivory-light/50 hover:text-ivory-light transition-colors"
                  >
                    <Globe size={12} />
                    <span className="hidden xs:inline">Website</span>
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-ivory-light/50 hover:text-ivory-light transition-colors"
                  >
                    <GithubIcon size={12} />
                    <span className="hidden xs:inline">GitHub</span>
                  </a>
                )}
                {project.discordUrl && (
                  <a
                    href={project.discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-ivory-light/50 hover:text-ivory-light transition-colors"
                  >
                    <MessageCircle size={12} />
                    <span className="hidden xs:inline">Discord</span>
                  </a>
                )}
                {project.telegramUrl && (
                  <a
                    href={project.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-ivory-light/50 hover:text-ivory-light transition-colors"
                  >
                    <Send size={12} />
                    <span className="hidden xs:inline">Telegram</span>
                  </a>
                )}
                <span className="text-[10px] text-ivory-light/30 flex items-center gap-1 sm:ml-auto">
                  <Clock size={10} />
                  <span className="hidden xs:inline">{formatDate(project.lastScanAt)}</span>
                  <span className="xs:hidden">{new Date(project.lastScanAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* The Story / Description */}
                  {(project.theStory || project.description || project.aiSummary) && (
                    <Card>
                      <CardHeader title="About" icon={Eye} accentColor="#f97316" />
                      <CardBody>
                        <p className="text-sm text-ivory-light/70 leading-relaxed">
                          {project.theStory || project.description || project.aiSummary}
                        </p>
                      </CardBody>
                    </Card>
                  )}
                  <KeyFindingsSection findings={project.keyFindings} />
                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <Card>
                      <CardHeader title="Tags" icon={Target} accentColor="#6b7280" />
                      <CardBody>
                        <div className="flex flex-wrap gap-1.5">
                          {project.tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
                <div className="space-y-6">
                  <TrustSignalsSection project={project} />
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <SecurityIntelSection security={project.securityIntel} />
                  <AuditSection audit={project.audit} />
                </div>
                <div className="space-y-6">
                  <ControversiesSection controversies={project.controversies} />
                </div>
              </div>
            )}

            {/* Market Tab */}
            {activeTab === 'market' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <MarketSection project={project} />
                  <LiquiditySection liquidity={project.liquidity} />
                </div>
                <div className="space-y-6">
                  <TokenomicsSection tokenomics={project.tokenomics} />
                  <TechStackSection techStack={project.techStack} />
                </div>
              </div>
            )}

            {/* Intel Tab */}
            {activeTab === 'intel' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <WebsiteIntelSection intel={project.websiteIntel} websiteUrl={project.websiteUrl} />
                  <LegalSection entity={project.legalEntity} />
                </div>
                <div className="space-y-6">
                  <AffiliationsSection affiliations={project.affiliations} />
                </div>
              </div>
            )}

            {/* Development Tab */}
            {activeTab === 'development' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <GitHubSection project={project} />
                  <TeamSection project={project} />
                </div>
                <div className="space-y-6">
                  <RoadmapSection roadmap={project.roadmap} />
                  <ShippingHistorySection history={project.shippingHistory} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scan Progress Indicator - shows when AI analysis is running in background */}
      <ScanProgressIndicator
        scanJobId={scanJobId}
        onComplete={() => {
          // Refresh project data when scan completes
          fetchProject();
          // Remove scanJob from URL
          router.replace(`/terminal/project/${projectId}`, { scroll: false });
        }}
        onDismiss={() => {
          // Remove scanJob from URL when user dismisses
          router.replace(`/terminal/project/${projectId}`, { scroll: false });
        }}
      />
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProjectPageContent />
    </Suspense>
  );
}
