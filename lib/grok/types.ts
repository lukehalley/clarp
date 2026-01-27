// Grok Analysis Types
// Types for xAI Grok API responses and analysis results

// ============================================================================
// LEGACY ANALYSIS RESULT TYPES (kept for transformer compatibility)
// ============================================================================

/**
 * Legacy complete analysis result from Grok
 * @deprecated Use GrokAnalysisResult from Responses API section instead
 */
export interface GrokLegacyAnalysisResult {
  profile: GrokProfileAnalysis;
  behavior: GrokBehaviorAnalysis;
  shilling: GrokShillingAnalysis;
  network: GrokNetworkAnalysis;
  keyFindings: GrokKeyFinding[];
  overallScore: number; // 0-100, higher = more trustworthy
  riskLevel: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium' | 'high';
  disclaimer: string;
}

/**
 * Profile-level analysis
 */
export interface GrokProfileAnalysis {
  isAnonymous: boolean;
  accountAgeRisk: 'low' | 'medium' | 'high';
  bioAnalysis: {
    hasHypeLanguage: boolean;
    hasCryptoFocus: boolean;
    hasWarningFlags: boolean;
    keywords: string[];
  };
  activityPattern: 'normal' | 'suspicious' | 'bot-like';
}

/**
 * Behavior analysis from tweets
 */
export interface GrokBehaviorAnalysis {
  toxicity: {
    score: number; // 0-100
    examples: GrokTweetExample[];
  };
  vulgarity: {
    score: number;
    examples: GrokTweetExample[];
  };
  hype: {
    score: number;
    keywords: string[];
    examples: GrokTweetExample[];
  };
  aggression: {
    score: number;
    targetPatterns: string[];
    examples: GrokTweetExample[];
  };
  consistency: {
    score: number; // higher = more consistent (good)
    topicDrift: number;
    contradictions: GrokContradiction[];
  };
  spamBurst: {
    detected: boolean;
    burstPeriods: GrokBurstPeriod[];
  };
}

/**
 * Shilling/promotion analysis
 */
export interface GrokShillingAnalysis {
  isSerialShiller: boolean;
  shillIntensity: number; // 0-100
  promotedEntities: GrokPromotedEntity[];
  promotionPatterns: string[];
}

/**
 * Network/interaction analysis
 */
export interface GrokNetworkAnalysis {
  suspiciousInteractions: GrokSuspiciousInteraction[];
  engagementPatterns: {
    replyRatio: number;
    retweetRatio: number;
    avgEngagementRate: number;
    suspiciousPatterns: string[];
  };
  botLikelihood: number; // 0-100
}

/**
 * Key finding from analysis
 */
export interface GrokKeyFinding {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  tweetIds: string[];
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface GrokTweetExample {
  tweetId: string;
  text: string;
  timestamp: string;
  confidence: number;
}

export interface GrokContradiction {
  claim1: GrokTweetExample;
  claim2: GrokTweetExample;
  description: string;
}

export interface GrokBurstPeriod {
  start: string;
  end: string;
  tweetCount: number;
  averageInterval: number; // seconds
}

export interface GrokPromotedEntity {
  name: string;
  ticker?: string;
  mentionCount: number;
  promoIntensity: number; // 0-100
  firstMention: string;
  lastMention: string;
  exampleTweetIds: string[];
}

export interface GrokSuspiciousInteraction {
  handle: string;
  interactionCount: number;
  suspicionReason: string;
}

// ============================================================================
// BACKLASH ANALYSIS
// ============================================================================

export interface GrokBacklashAnalysis {
  events: GrokBacklashEvent[];
  totalMentions: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
}

export interface GrokBacklashEvent {
  category: 'scam_allegation' | 'rug_accusation' | 'fraud_claim' | 'warning' | 'criticism';
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  sources: GrokBacklashSource[];
  tweetIds: string[];
  date: string;
}

export interface GrokBacklashSource {
  handle: string;
  followers?: number;
  tweetId: string;
  excerpt: string;
}

// ============================================================================
// EVIDENCE CLASSIFICATION
// ============================================================================

export type GrokEvidenceLabel =
  | 'shill'
  | 'backlash'
  | 'toxic'
  | 'hype'
  | 'contradiction'
  | 'suspicious'
  | 'neutral';

export interface GrokClassifiedTweet {
  tweetId: string;
  text: string;
  timestamp: string;
  label: GrokEvidenceLabel;
  confidence: number;
  reasoning?: string;
}

// ============================================================================
// RESPONSES API TYPES (for grok-4-1-fast with Agent Tools)
// ============================================================================

/**
 * Response from Grok Responses API
 */
export interface GrokResponsesApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  output?: GrokOutput[];
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    server_side_tool_usage_details?: {
      x_search_calls?: number;
      web_search_calls?: number;
    };
  };
}

/**
 * Output item from Responses API
 */
export type GrokOutput = GrokTextOutput | GrokToolUseOutput;

/**
 * Text message output
 */
export interface GrokTextOutput {
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
    annotations?: GrokAnnotation[];
  }>;
}

/**
 * Tool use output
 */
export interface GrokToolUseOutput {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * URL citation annotation
 */
export interface GrokAnnotation {
  type: 'url_citation';
  url: string;
  title?: string;
  start_index?: number;
  end_index?: number;
}

// ============================================================================
// ANALYSIS RESULT (from Responses API with live X search)
// ============================================================================

/**
 * Team member information (OSINT-enhanced)
 */
export interface TeamMember {
  name: string;
  realName?: string;              // Actual name if doxxed (e.g., "Hayden Porter")
  role?: string;
  xHandle?: string;
  isDoxxed?: boolean;
  previousEmployers?: string[];   // e.g., ["MetaMask", "USAA", "Twitter"]
  linkedIn?: string | null;
}

/**
 * Legal entity information
 */
export interface LegalEntity {
  companyName?: string | null;
  jurisdiction?: string | null;   // e.g., "Texas, USA"
  isRegistered: boolean;
  registrationDetails?: string | null;
}

/**
 * Industry affiliation
 */
export interface Affiliation {
  name: string;                   // e.g., "Texas Blockchain Council"
  type: 'council' | 'accelerator' | 'vc' | 'exchange' | 'regulatory' | 'other';
  details?: string;
}

/**
 * Token economics information
 */
export interface Tokenomics {
  totalSupply?: number | string | null;
  circulatingSupply?: number | string | null;
  burnMechanism?: string | null;  // e.g., "0.1-2% per transaction"
  burnRate?: string | null;
  isDeflationary: boolean;
  vestingSchedule?: string | null;
}

/**
 * Liquidity information
 */
export interface LiquidityInfo {
  primaryDex?: string | null;     // e.g., "Meteora", "Raydium", "Jupiter"
  poolType?: string | null;       // e.g., "DAMM v2", "DLMM"
  liquidityUsd?: number | null;
  liquidityLocked: boolean;
  lockDuration?: string | null;
}

/**
 * Roadmap milestone
 */
export interface RoadmapMilestone {
  milestone: string;
  targetDate?: string;
  status: 'completed' | 'in-progress' | 'planned';
}

/**
 * Audit information
 */
export interface AuditInfo {
  hasAudit: boolean;
  auditor?: string | null;        // e.g., "CertiK", "Trail of Bits"
  auditDate?: string | null;
  auditUrl?: string | null;
  auditStatus: 'none' | 'pending' | 'completed';
}

/**
 * Tech stack information
 */
export interface TechStack {
  blockchain: string;             // e.g., "solana", "ethereum", "multi-chain"
  smartContractLanguage?: string; // e.g., "Rust", "Solidity", "Move"
  zkTech?: string | null;         // e.g., "Groth16 zk-SNARKs", "PLONK"
  offlineCapability: boolean;
  hardwareProducts?: string[];    // e.g., ["NFC tags", "RISC-V hardware wallet"]
  keyTechnologies?: string[];     // e.g., ["React Native", "gRPC", "Redis"]
}

/**
 * Funding round information
 */
export interface FundingRound {
  round: 'seed' | 'series-a' | 'series-b' | 'public' | 'grant' | 'other';
  amount?: string | null;
  date?: string | null;
  investors?: string[];
  valuation?: string | null;
}

/**
 * Competitor analysis
 */
export interface CompetitorAnalysis {
  directCompetitors?: string[];
  uniqueValue?: string;
  marketPosition?: 'leader' | 'challenger' | 'niche' | 'new-entrant' | 'unknown';
}

/**
 * Community metrics
 */
export interface CommunityMetrics {
  discordMembers?: number | null;
  telegramMembers?: number | null;
  discordActivity?: 'active' | 'moderate' | 'dead' | 'unknown';
  sentiment?: 'positive' | 'mixed' | 'negative' | 'unknown';
}

/**
 * Positive trust indicators - these INCREASE the score
 */
export interface PositiveIndicators {
  isDoxxed: boolean;
  doxxedDetails?: string | null;
  hasActiveGithub: boolean;
  githubUrl?: string | null;
  githubActivity?: string | null;
  hasRealProduct: boolean;
  productDetails?: string | null;
  accountAgeDays: number;
  hasConsistentHistory: boolean;
  hasOrganicEngagement: boolean;
  hasCredibleBackers: boolean;
  backersDetails?: string | null;
  teamMembers: TeamMember[];
}

/**
 * Negative risk indicators - these DECREASE the score (OSINT-enhanced)
 */
export interface NegativeIndicators {
  hasScamAllegations: boolean;
  scamDetails?: string | null;
  hasRugHistory: boolean;
  rugDetails?: string | null;
  isAnonymousTeam: boolean;
  hasHypeLanguage: boolean;
  hypeExamples: string[];
  hasSuspiciousFollowers: boolean;
  suspiciousDetails?: string | null;
  hasPreviousRebrand: boolean;
  rebrandDetails?: string | null;
  hasAggressivePromotion: boolean;
  promotionDetails?: string | null;
  // OSINT-enhanced fields
  noPublicAudit?: boolean;        // No third-party security audit
  lowLiquidity?: boolean;         // Liquidity below safe threshold
  unverifiedLegalEntity?: boolean; // Claims company but can't verify
}

/**
 * Evidence item from Grok analysis with actual tweet content
 */
export interface GrokEvidenceItem {
  date?: string;
  tweetExcerpt: string;
  tweetUrl: string;
  label: 'shill' | 'backlash' | 'toxic' | 'hype' | 'neutral' | 'positive' | 'promotion' | 'controversy' | 'claim' | 'scam_warning' | 'milestone';
  relevance: string;
}

/**
 * Timeline period from Grok analysis
 */
export interface GrokTimelinePeriod {
  period: string;
  activity: string;
  promotedProjects: string[];
  notableEvents: string[];
  sentiment: string;
}

/**
 * Promotion history item from Grok analysis
 */
export interface GrokPromotionHistoryItem {
  project: string;
  ticker?: string;
  role?: string;
  period?: string;
  firstMention?: string;
  lastMention?: string;
  mentionCount?: number;
  claims?: string[];
  outcome?: string;
  evidenceUrls?: string[];
}

/**
 * Top interaction from Grok analysis - who they engage with most
 */
export interface GrokTopInteraction {
  handle: string;
  relationship: 'collaborator' | 'promoter' | 'critic' | 'friend' | 'unknown';
  interactionCount: number;
  context?: string;
}

/**
 * Reputation data from Grok analysis
 */
export interface GrokReputation {
  supporters: Array<{ who: string; what: string; url: string }>;
  critics: Array<{ who: string; accusation: string; url: string }>;
  controversies: Array<{ date: string; summary: string; resolution: string }>;
}

/**
 * Verdict from Grok analysis
 */
export interface GrokVerdict {
  trustLevel: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium' | 'high';
  summary: string;
}

/**
 * Analysis result from Grok with live X data (OSINT-enhanced)
 */
export interface GrokAnalysisResult {
  handle: string;
  postsAnalyzed?: number;
  profile: {
    handle: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    verified: boolean;
    followers?: number;
    following?: number;
    createdAt?: string;
    xUrl?: string;
  };
  // Structured indicators for scoring
  positiveIndicators: PositiveIndicators;
  negativeIndicators: NegativeIndicators;
  // Project details
  github?: string | null;
  website?: string | null;
  contract?: {
    address: string;
    chain: string;
    ticker?: string;
  } | null;
  // OSINT-enhanced fields
  legalEntity?: LegalEntity;
  affiliations?: Affiliation[];
  tokenomics?: Tokenomics;
  liquidity?: LiquidityInfo;
  roadmap?: RoadmapMilestone[];
  audit?: AuditInfo;
  techStack?: TechStack;
  // Shipping history (what they've actually built/released)
  shippingHistory?: Array<{
    date: string;
    milestone: string;
    details?: string;
    evidenceUrl?: string;
  }>;
  // Deep analysis fields (available when search tools disabled)
  fundingHistory?: FundingRound[];
  competitorAnalysis?: CompetitorAnalysis;
  communityMetrics?: CommunityMetrics;
  // Findings
  controversies: string[];
  keyFindings: string[];
  evidence?: GrokEvidenceItem[];
  overallAssessment?: string;
  // Rich analysis data (from hybrid prompt)
  theStory?: string;
  timeline?: GrokTimelinePeriod[];
  promotionHistory?: GrokPromotionHistoryItem[];
  topInteractions?: GrokTopInteraction[];
  reputation?: GrokReputation;
  verdict?: GrokVerdict;
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high';
  confidence: 'low' | 'medium' | 'high';
  // Metadata
  rawAnalysis: string;
  citations: Array<{ url: string; title?: string }>;
  tokensUsed?: number;
  searchesPerformed?: number;
}

// ============================================================================
// LEGACY TYPES (kept for compatibility)
// ============================================================================

export interface GrokAnalysisRequest {
  handle: string;
  tweets: GrokTweetInput[];
  mentionTweets?: GrokTweetInput[];
  profile: GrokProfileInput;
}

export interface GrokTweetInput {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    cashtags?: { tag: string }[];
    hashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { expanded_url: string }[];
  };
  referenced_tweets?: { type: string; id: string }[];
}

export interface GrokProfileInput {
  username: string;
  name: string;
  bio?: string;
  created_at?: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  verified: boolean;
}

// ============================================================================
// CLASSIFICATION RESULT (for pre-scan)
// ============================================================================

/**
 * Result from quick classification pre-scan
 * Used to determine if we should do a full scan and what type
 */
export interface GrokClassificationResult {
  handle: string;
  isCryptoRelated: boolean;
  entityType: 'person' | 'project' | 'company' | 'unknown';
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  tokensUsed?: number;
}

// ============================================================================
// CLIENT OPTIONS
// ============================================================================

export interface GrokClientOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export const GROK_MODELS = {
  // Recommended for live X search (supports server-side tools)
  GROK_4_1_FAST: 'grok-4-1-fast',
  GROK_4_1: 'grok-4-1',
  // Legacy models (no live X search support)
  GROK_3: 'grok-3',
  GROK_2: 'grok-2-latest',
  GROK_2_VISION: 'grok-2-vision-latest',
} as const;

export type GrokModel = (typeof GROK_MODELS)[keyof typeof GROK_MODELS];
