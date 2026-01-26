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
 * Team member information
 */
export interface TeamMember {
  name: string;
  role?: string;
  xHandle?: string;
  isDoxxed?: boolean;
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
 * Negative risk indicators - these DECREASE the score
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
}

/**
 * Analysis result from Grok with live X data
 */
export interface GrokAnalysisResult {
  handle: string;
  profile: {
    handle: string;
    displayName?: string;
    bio?: string;
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
  } | null;
  // Findings
  controversies: string[];
  keyFindings: string[];
  overallAssessment?: string;
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
