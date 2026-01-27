// Unified Terminal - TypeScript Types
// Positive-first discovery for KOLs, Devs, Projects, and Tokens

import { Chain } from './terminal';

// ============================================================================
// ENTITY TYPES - The four pillars of crypto discovery
// ============================================================================

export type EntityCategory = 'kol' | 'dev' | 'project' | 'token';

export const ENTITY_CATEGORY_LABELS: Record<EntityCategory, string> = {
  kol: 'KOL',
  dev: 'Builder',
  project: 'Project',
  token: 'Token',
};

export const ENTITY_CATEGORY_DESCRIPTIONS: Record<EntityCategory, string> = {
  kol: 'Key Opinion Leader - Influencers who call tokens',
  dev: 'Builder - Developers shipping real code',
  project: 'Protocol or platform being built',
  token: 'Tradeable token/coin',
};

// ============================================================================
// TRUST SCORE - Positive-first (high = good, low = risky)
// ============================================================================

export type TrustTier = 'verified' | 'trusted' | 'neutral' | 'caution' | 'warning' | 'danger';

export interface TrustScore {
  score: number; // 0-100 (100 = most trusted, 0 = avoid)
  tier: TrustTier;
  confidence: 'low' | 'medium' | 'high';
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated: Date;
}

export function getTrustTier(score: number): TrustTier {
  if (score >= 90) return 'verified';
  if (score >= 75) return 'trusted';
  if (score >= 55) return 'neutral';
  if (score >= 40) return 'caution';
  if (score >= 20) return 'warning';
  return 'danger';
}

export function getTrustTierLabel(tier: TrustTier): string {
  switch (tier) {
    case 'verified': return 'Verified';
    case 'trusted': return 'Trusted';
    case 'neutral': return 'Neutral';
    case 'caution': return 'Caution';
    case 'warning': return 'Warning';
    case 'danger': return 'Danger';
  }
}

export function getTrustTierColor(tier: TrustTier): string {
  switch (tier) {
    case 'verified': return '#22c55e'; // green
    case 'trusted': return '#84cc16'; // lime
    case 'neutral': return '#6b7280'; // gray
    case 'caution': return '#eab308'; // yellow
    case 'warning': return '#f97316'; // orange
    case 'danger': return '#dc2626'; // red
  }
}

// ============================================================================
// CALL TRACK RECORD - For KOLs
// ============================================================================

export interface CallOutcome {
  tokenTicker: string;
  tokenName?: string;
  callDate: Date;
  callPrice: number;
  peakPrice: number;
  currentPrice: number;
  peakMultiple: number; // e.g., 5.2x
  currentMultiple: number;
  outcome: 'moon' | 'profit' | 'break_even' | 'loss' | 'rug';
  evidenceTweetId: string;
}

export interface CallTrackRecord {
  totalCalls: number;
  winRate: number; // 0-100
  avgReturn: number; // percentage
  avgPeakMultiple: number;
  rugsPromoted: number;
  recentCalls: CallOutcome[];
  bestCall?: CallOutcome;
  worstCall?: CallOutcome;
}

export function getCallOutcomeColor(outcome: CallOutcome['outcome']): string {
  switch (outcome) {
    case 'moon': return '#22c55e';
    case 'profit': return '#84cc16';
    case 'break_even': return '#6b7280';
    case 'loss': return '#f97316';
    case 'rug': return '#dc2626';
  }
}

// ============================================================================
// VOUCH NETWORK - Trust graph
// ============================================================================

export interface Vouch {
  fromHandle: string;
  fromCategory: EntityCategory;
  fromTrustScore: number;
  timestamp: Date;
  context?: string; // "worked together", "verified their code", etc.
  weight: number; // 0-1, based on voucher's trust
}

export interface VouchNetwork {
  incomingVouches: Vouch[];
  outgoingVouches: Vouch[];
  vouchScore: number; // weighted sum of incoming vouches
  topVouchers: { handle: string; score: number }[];
}

// ============================================================================
// UNIFIED ENTITY - Base for all entity types
// ============================================================================

export interface UnifiedEntity {
  id: string;
  category: EntityCategory;
  handle: string; // @handle for people, ticker for tokens
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  trustScore: TrustScore;
  vouchNetwork: VouchNetwork;
  tags: string[];
  lastScanAt: Date;
  chain?: Chain;
}

// ============================================================================
// KOL - Key Opinion Leader
// ============================================================================

export interface KOLEntity extends UnifiedEntity {
  category: 'kol';
  followers: number;
  accountAgeDays: number;
  callTrackRecord: CallTrackRecord;
  topInteractions: { handle: string; category: EntityCategory }[];
  recentActivity: {
    postsPerWeek: number;
    engagementRate: number;
    shillFrequency: number; // 0-100
  };
}

// ============================================================================
// DEV - Builder/Developer
// ============================================================================

export interface DevEntity extends UnifiedEntity {
  category: 'dev';
  followers: number;
  githubHandle?: string;
  projects: { name: string; role: string; status: 'active' | 'shipped' | 'abandoned' }[];
  commitActivity: {
    totalCommits?: number;
    recentCommits30d?: number;
    languages?: string[];
  };
  shippedProducts: number;
  abandonedProducts: number;
}

// ============================================================================
// PROJECT - Protocol/Platform
// ============================================================================

export interface ProjectEntity extends UnifiedEntity {
  category: 'project';
  ticker?: string;
  website?: string;
  tvl?: number;
  users24h?: number;
  team: { handle: string; role: string }[];
  status: 'building' | 'launched' | 'stale' | 'abandoned';
  linkedToken?: string; // token ID if exists
  techStack?: string[];
}

// ============================================================================
// TOKEN - Tradeable Asset
// ============================================================================

export interface TokenEntity extends UnifiedEntity {
  category: 'token';
  ticker: string;
  tokenAddress: string;
  price: number;
  priceChange24h: number;
  marketCap?: number;
  volume24h?: number;
  liquidity?: number;
  holders?: number;
  topHolderConcentration?: number; // top 10 holders %
  linkedProject?: string; // project ID if exists
  promoters: { handle: string; callDate: Date; outcome?: CallOutcome['outcome'] }[];
  dexScreenerUrl?: string;
}

// ============================================================================
// FEED ITEMS - For discovery feed
// ============================================================================

export type FeedItemType =
  | 'new_verified' // Someone just got verified status
  | 'rising_trust' // Trust score rising fast
  | 'hot_call' // KOL made a call that's pumping
  | 'shipping' // Dev shipped something
  | 'warning' // Trust score dropped significantly
  | 'rug_detected' // Token rugged
  | 'vouch_received'; // Notable vouch

export interface FeedItem {
  id: string;
  type: FeedItemType;
  entityId: string;
  entity: UnifiedEntity;
  timestamp: Date;
  headline: string;
  detail?: string;
  metrics?: Record<string, number | string>;
}

export function getFeedTypeIcon(type: FeedItemType): string {
  switch (type) {
    case 'new_verified': return '✓';
    case 'rising_trust': return '↑';
    case 'hot_call': return '🔥';
    case 'shipping': return '🚀';
    case 'warning': return '⚠';
    case 'rug_detected': return '💀';
    case 'vouch_received': return '🤝';
  }
}

export function getFeedTypeColor(type: FeedItemType): string {
  switch (type) {
    case 'new_verified': return '#22c55e';
    case 'rising_trust': return '#84cc16';
    case 'hot_call': return '#f97316';
    case 'shipping': return '#3b82f6';
    case 'warning': return '#eab308';
    case 'rug_detected': return '#dc2626';
    case 'vouch_received': return '#9B59B6';
  }
}

// ============================================================================
// AI OVERVIEW - Generated summary
// ============================================================================

export interface AIOverview {
  entityId: string;
  summary: string; // 2-3 sentences
  verdict: 'bullish' | 'neutral' | 'bearish' | 'avoid';
  keyPoints: string[]; // 3-5 bullet points
  riskFlags: string[];
  positiveSignals: string[];
  generatedAt: Date;
  confidence: 'low' | 'medium' | 'high';
}

// ============================================================================
// LEADERBOARDS - For feed sections
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  entity: UnifiedEntity;
  metric: number;
  change24h?: number;
}

export interface Leaderboard {
  title: string;
  category: EntityCategory;
  metric: string;
  entries: LeaderboardEntry[];
  updatedAt: Date;
}
