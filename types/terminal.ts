// CLARP Terminal - TypeScript Types

// ============================================================================
// CHAINS
// ============================================================================

export type Chain = 'solana' | 'ethereum' | 'base' | 'arbitrum';

export const CHAIN_INFO: Record<Chain, { name: string; shortName: string; color: string }> = {
  solana: { name: 'Solana', shortName: 'SOL', color: '#9945FF' },
  ethereum: { name: 'Ethereum', shortName: 'ETH', color: '#627EEA' },
  base: { name: 'Base', shortName: 'BASE', color: '#0052FF' },
  arbitrum: { name: 'Arbitrum', shortName: 'ARB', color: '#28A0F0' },
};

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  ticker?: string;
  chain: Chain;
  contract?: string;
  website?: string;
  xHandle?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  xHandle: string;
  displayName?: string;
  bio?: string;
  followers: number;
  following: number;
  accountAgeDays: number;
  verified: boolean;
  createdAt: Date;
}

// ============================================================================
// SCORING
// ============================================================================

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface LarpScore {
  score: number; // 0-100 (higher = riskier)
  confidence: ConfidenceLevel;
  riskLevel: RiskLevel;
  topTags: string[]; // max 6
  breakdown: ScoreBreakdown;
  lastUpdated: Date;
}

export interface ScoreBreakdown {
  identity: ModuleScore;
  xBehavior: ModuleScore;
  wallet: ModuleScore;
  liquidity: ModuleScore;
}

export type ModuleName = 'identity' | 'xBehavior' | 'wallet' | 'liquidity';

export interface ModuleScore {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  severity: EvidenceSeverity;
  timestamp: Date;
  url: string;
  summary: string;
}

export type EvidenceSeverity = 'info' | 'warning' | 'critical';

export type EvidenceType =
  // Identity signals
  | 'account_age'
  | 'domain_age'
  | 'verified_links'
  | 'consistency'
  // X behavior signals
  | 'engagement_anomaly'
  | 'burst_pattern'
  | 'shill_cluster'
  | 'follower_spike'
  // Wallet signals
  | 'fresh_wallet'
  | 'suspicious_flow'
  | 'cex_deposit'
  // Liquidity signals
  | 'lp_change'
  | 'holder_concentration'
  | 'unlock_schedule'
  // Change detection
  | 'link_change'
  | 'bio_change';

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  account_age: 'Account Age',
  domain_age: 'Domain Age',
  verified_links: 'Verified Links',
  consistency: 'Consistency',
  engagement_anomaly: 'Engagement Anomaly',
  burst_pattern: 'Burst Pattern',
  shill_cluster: 'Shill Cluster',
  follower_spike: 'Follower Spike',
  fresh_wallet: 'Fresh Wallet',
  suspicious_flow: 'Suspicious Flow',
  cex_deposit: 'CEX Deposit',
  lp_change: 'LP Change',
  holder_concentration: 'Holder Concentration',
  unlock_schedule: 'Unlock Schedule',
  link_change: 'Link Change',
  bio_change: 'Bio Change',
};

// ============================================================================
// WATCHLIST
// ============================================================================

export interface WatchlistItem {
  projectId: string;
  project: Project;
  score: LarpScore;
  addedAt: Date;
  scoreDelta24h: number;
}

// ============================================================================
// ALERTS
// ============================================================================

export type AlertRuleType =
  | 'score_change'
  | 'wallet_cex'
  | 'lp_change'
  | 'shill_cluster'
  | 'engagement_spike'
  | 'link_change';

export const ALERT_RULE_TYPE_LABELS: Record<AlertRuleType, string> = {
  score_change: 'LARP Score Change',
  wallet_cex: 'Team Wallet → CEX',
  lp_change: 'Liquidity/LP Change',
  shill_cluster: 'New Shill Cluster',
  engagement_spike: 'Engagement Spike',
  link_change: 'Official Link Change',
};

export const ALERT_RULE_TYPE_DESCRIPTIONS: Record<AlertRuleType, string> = {
  score_change: 'Alert when LARP score increases/decreases by threshold',
  wallet_cex: 'Alert when team wallet deposits to CEX',
  lp_change: 'Alert when LP is removed/added beyond threshold',
  shill_cluster: 'Alert when new amplifier cluster detected',
  engagement_spike: 'Alert when anomalous engagement spike detected',
  link_change: 'Alert when website or X bio link changes',
};

export type AlertChannel = 'email' | 'telegram' | 'webhook';

export const ALERT_CHANNEL_LABELS: Record<AlertChannel, string> = {
  email: 'Email',
  telegram: 'Telegram',
  webhook: 'Webhook',
};

export interface AlertRule {
  id: string;
  projectId: string;
  type: AlertRuleType;
  threshold?: number;
  enabled: boolean;
  channels: AlertChannel[];
  createdAt: Date;
}

export interface AlertPayload {
  before: unknown;
  after: unknown;
  evidence: Evidence[];
  timestamp: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  projectId: string;
  type: AlertRuleType;
  payload: AlertPayload;
  read: boolean;
  createdAt: Date;
}

// ============================================================================
// SEARCH & ENTITY RESOLUTION
// ============================================================================

export type EntityType = 'ticker' | 'contract' | 'x_handle' | 'domain' | 'ens';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  ticker: 'Token Ticker',
  contract: 'Contract Address',
  x_handle: 'X Handle',
  domain: 'Website Domain',
  ens: 'ENS Name',
};

export interface ResolvedEntity {
  type: EntityType;
  value: string;
  normalized: string;
  chain?: Chain;
}

export interface SearchResult {
  entity: ResolvedEntity;
  project?: Project;
  profile?: Profile;
  score?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface SearchResponse {
  results: SearchResult[];
  suggestions: string[];
}

export interface ProjectResponse {
  project: Project;
  score: LarpScore;
}

export interface ProfileResponse {
  profile: Profile;
  score: LarpScore;
  badges: ProfileBadge[];
  timeline: TimelineEvent[];
  amplifiers: Amplifier[];
  relatedProjects: Project[];
}

export interface ProfileBadge {
  id: string;
  label: string;
  description: string;
  severity: EvidenceSeverity;
}

export interface TimelineEvent {
  id: string;
  type: EvidenceType | 'created' | 'verified';
  timestamp: Date;
  description: string;
  url?: string;
}

export interface Amplifier {
  handle: string;
  displayName?: string;
  followers: number;
  retweetCount: number;
  suspiciousScore: number; // 0-100
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// SCORE UTILITIES
// ============================================================================

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#7f1d1d'; // dark red
  if (score >= 70) return '#dc2626'; // red
  if (score >= 50) return '#f97316'; // orange
  if (score >= 30) return '#eab308'; // yellow
  return '#22c55e'; // green
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Confirmed LARP';
  if (score >= 70) return 'Highly Suspicious';
  if (score >= 50) return 'Yellow Flags';
  if (score >= 30) return 'Probably Fine';
  return 'Appears Legitimate';
}

export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return '#dc2626';
    case 'high': return '#f97316';
    case 'medium': return '#eab308';
    case 'low': return '#22c55e';
  }
}

export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high': return 'High Confidence';
    case 'medium': return 'Medium Confidence';
    case 'low': return 'Low Confidence';
  }
}

export function getSeverityColor(severity: EvidenceSeverity): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'warning': return '#f97316';
    case 'info': return '#6b7280';
  }
}
