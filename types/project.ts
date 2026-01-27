// CLARP Terminal - Project Types
// "Trustpilot + Google Maps + Rugchecker for crypto"

// ============================================================================
// TRUST SYSTEM
// ============================================================================

export type TrustTier = 'verified' | 'trusted' | 'neutral' | 'caution' | 'avoid';

export interface TrustScore {
  score: number; // 0-100 (100 = most trusted)
  tier: TrustTier;
  confidence: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

export function getTrustTier(score: number): TrustTier {
  if (score >= 85) return 'verified';
  if (score >= 70) return 'trusted';
  if (score >= 50) return 'neutral';
  if (score >= 30) return 'caution';
  return 'avoid';
}

export function getTrustTierColor(tier: TrustTier): string {
  switch (tier) {
    case 'verified': return '#22c55e';
    case 'trusted': return '#84cc16';
    case 'neutral': return '#6b7280';
    case 'caution': return '#f97316';
    case 'avoid': return '#dc2626';
  }
}

export function getTrustTierLabel(tier: TrustTier): string {
  switch (tier) {
    case 'verified': return 'Verified';
    case 'trusted': return 'Trusted';
    case 'neutral': return 'Neutral';
    case 'caution': return 'Caution';
    case 'avoid': return 'Avoid';
  }
}

// ============================================================================
// OSINT-ENHANCED TYPES
// ============================================================================

export interface LegalEntity {
  companyName?: string | null;
  jurisdiction?: string | null;   // e.g., "Texas, USA"
  isRegistered: boolean;
  registrationDetails?: string | null;
}

export interface Affiliation {
  name: string;                   // e.g., "Texas Blockchain Council"
  type: 'council' | 'accelerator' | 'vc' | 'exchange' | 'regulatory' | 'other';
  details?: string;
}

export interface Tokenomics {
  totalSupply?: number | string | null;
  circulatingSupply?: number | string | null;
  burnMechanism?: string | null;  // e.g., "0.1-2% per transaction"
  burnRate?: string | null;
  isDeflationary: boolean;
  vestingSchedule?: string | null;
}

export interface LiquidityInfo {
  primaryDex?: string | null;     // e.g., "Meteora", "Raydium", "Jupiter"
  poolType?: string | null;       // e.g., "DAMM v2", "DLMM"
  liquidityUsd?: number | null;
  liquidityLocked: boolean;
  lockDuration?: string | null;
}

export interface RoadmapMilestone {
  milestone: string;
  targetDate?: string;
  status: 'completed' | 'in-progress' | 'planned';
}

export interface AuditInfo {
  hasAudit: boolean;
  auditor?: string | null;        // e.g., "CertiK", "Trail of Bits"
  auditDate?: string | null;
  auditUrl?: string | null;
  auditStatus: 'none' | 'pending' | 'completed';
}

export interface TechStack {
  blockchain: string;             // e.g., "solana", "ethereum", "multi-chain"
  zkTech?: string | null;         // e.g., "Groth16 zk-SNARKs", "PLONK"
  offlineCapability: boolean;
  hardwareProducts?: string[];    // e.g., ["NFC tags", "RISC-V hardware wallet"]
}

export interface ShippingMilestone {
  date: string;
  milestone: string;
  details?: string;
  evidenceUrl?: string;
}

export interface SecurityIntel {
  // RugCheck-style data
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  lpLocked: boolean;
  lpLockedPercent?: number;
  risks: string[];
  holdersCount?: number;
  top10HoldersPercent?: number;
  // Domain WHOIS
  domainAgeDays?: number;
  domainRegistrar?: string;
}

// ============================================================================
// PROJECT ENTITY - The unified view
// ============================================================================

export interface Project {
  id: string;

  // Display
  name: string;
  description?: string;
  avatarUrl?: string;
  tags: string[];

  // Multi-platform identifiers (any can be null)
  xHandle?: string;           // @JupiterExchange
  githubUrl?: string;         // https://github.com/jup-ag
  websiteUrl?: string;        // https://jup.ag
  tokenAddress?: string;      // Solana contract address
  ticker?: string;            // $JUP
  discordUrl?: string;        // Discord server link
  telegramUrl?: string;       // Telegram group link

  // Trust metrics
  trustScore: TrustScore;

  // Team (embedded, discovered from scans)
  team: TeamMember[];

  // Market data (if token exists)
  marketData?: {
    price: number;
    priceChange24h: number;
    marketCap?: number;
    volume24h?: number;
    liquidity?: number;
  };

  // GitHub intelligence (from API)
  githubIntel?: {
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    lastCommitDate?: string;
    lastCommitMessage?: string;
    commitsLast30d: number;
    commitsLast90d: number;
    contributorsCount: number;
    topContributors?: Array<{
      login: string;
      avatarUrl: string;
      contributions: number;
    }>;
    primaryLanguage?: string;
    license?: string;
    isArchived: boolean;
    healthScore: number;
    healthFactors: string[];
  };

  // Website intelligence
  websiteIntel?: {
    isLive: boolean;
    lastChecked: Date;
    hasDocumentation: boolean;
    hasRoadmap: boolean;
    hasTokenomics: boolean;
    hasTeamPage: boolean;
    hasAuditInfo: boolean;
    redFlags: string[];
    trustIndicators: string[];
    websiteQuality: 'professional' | 'basic' | 'suspicious' | 'unknown';
    qualityScore: number;
  };

  // Social metrics (from X)
  socialMetrics?: {
    followers?: number;
    engagement?: number;
    postsPerWeek?: number;
  };

  // AI-generated summary
  aiSummary?: string;

  // ==========================================================================
  // OSINT-ENHANCED FIELDS (from Grok analysis)
  // ==========================================================================

  // Legal Entity & Corporate Structure
  legalEntity?: LegalEntity;

  // Industry Affiliations (councils, accelerators, VCs)
  affiliations?: Affiliation[];

  // Token Economics
  tokenomics?: Tokenomics;

  // Liquidity Information
  liquidity?: LiquidityInfo;

  // Project Roadmap
  roadmap?: RoadmapMilestone[];

  // Security Audit Status
  audit?: AuditInfo;

  // Technical Architecture
  techStack?: TechStack;

  // Security Intel (RugCheck-style data)
  securityIntel?: SecurityIntel;

  // Shipping History (what they've actually built/released)
  shippingHistory?: ShippingMilestone[];

  // Positive Trust Indicators
  positiveIndicators?: {
    isDoxxed: boolean;
    doxxedDetails?: string | null;
    hasActiveGithub: boolean;
    githubActivity?: string | null;
    hasRealProduct: boolean;
    productDetails?: string | null;
    accountAgeDays: number;
    hasConsistentHistory: boolean;
    hasOrganicEngagement: boolean;
    hasCredibleBackers: boolean;
    backersDetails?: string | null;
  };

  // Negative Risk Indicators
  negativeIndicators?: {
    hasScamAllegations: boolean;
    scamDetails?: string | null;
    hasRugHistory: boolean;
    rugDetails?: string | null;
    isAnonymousTeam: boolean;
    hasHypeLanguage: boolean;
    hypeExamples?: string[];
    hasSuspiciousFollowers: boolean;
    suspiciousDetails?: string | null;
    hasPreviousRebrand: boolean;
    rebrandDetails?: string | null;
    hasAggressivePromotion: boolean;
    promotionDetails?: string | null;
    noPublicAudit?: boolean;
    lowLiquidity?: boolean;
    unverifiedLegalEntity?: boolean;
  };

  // Key Findings from analysis
  keyFindings?: string[];

  // Controversies
  controversies?: string[];

  // The Story (narrative summary from Grok)
  theStory?: string;

  // Scan metadata
  lastScanAt: Date;
  createdAt: Date;
}

export interface TeamMember {
  handle: string;           // X handle (without @)
  displayName?: string;
  realName?: string;        // Actual name if doxxed (e.g., "Hayden Porter")
  role?: string;            // "Founder", "Lead Dev", "CTO", etc.
  trustScore?: number;      // Individual trust score
  avatarUrl?: string;
  isDoxxed?: boolean;
  previousEmployers?: string[];   // e.g., ["MetaMask", "USAA", "Twitter"]
  linkedIn?: string | null;
}

// ============================================================================
// SCAN TYPES
// ============================================================================

export type ScanStatus =
  | 'queued'
  | 'discovering'    // AI finding connections
  | 'analyzing'      // Deep analysis
  | 'enriching'      // Token data, GitHub, etc.
  | 'complete'
  | 'failed'
  | 'cached';

export interface ScanJob {
  id: string;
  query: string;          // What user searched for
  queryType: 'handle' | 'ticker' | 'address' | 'name';
  status: ScanStatus;
  progress: number;       // 0-100
  statusMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;

  // Discovered project (populated on completion)
  projectId?: string;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface SearchRequest {
  query: string;      // Could be @handle, $ticker, address, or name
  force?: boolean;    // Force rescan
}

export interface SearchResult {
  project: Project;
  cached: boolean;
  scanJobId?: string;
}

// ============================================================================
// FEED TYPES
// ============================================================================

export type FeedItemType =
  | 'new_project'     // Just scanned
  | 'trust_change'    // Score changed significantly
  | 'team_update'     // New team member discovered
  | 'shipping'        // GitHub activity
  | 'warning';        // Trust dropped below threshold

export interface FeedItem {
  id: string;
  type: FeedItemType;
  project: Project;
  timestamp: Date;
  headline: string;
  detail?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Parse any user input and determine what type it is
 */
export function parseQuery(input: string): { type: 'handle' | 'ticker' | 'address' | 'name'; value: string } {
  const trimmed = input.trim();

  // X handle: @something or just something that looks like a handle
  if (trimmed.startsWith('@')) {
    return { type: 'handle', value: trimmed.slice(1).toLowerCase() };
  }

  // Ticker: $SOMETHING
  if (trimmed.startsWith('$')) {
    return { type: 'ticker', value: trimmed.slice(1).toUpperCase() };
  }

  // Solana address: base58, 32-44 chars
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
    return { type: 'address', value: trimmed };
  }

  // EVM address: 0x + 40 hex chars
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return { type: 'address', value: trimmed.toLowerCase() };
  }

  // Default: treat as name/search term
  return { type: 'name', value: trimmed };
}

/**
 * Format handle for display
 */
export function formatHandle(handle: string): string {
  return handle.startsWith('@') ? handle : `@${handle}`;
}
