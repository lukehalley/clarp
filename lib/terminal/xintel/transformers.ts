// Data Transformers
// Convert Grok analysis responses to app-internal XIntel types

import type {
  GrokAnalysisResult,
} from '@/lib/grok/types';
import type {
  XIntelReport,
  XIntelProfile,
  XIntelEvidence,
  ReputationScore,
  ScoreFactor,
  KeyFinding,
  BehaviorMetrics,
  NetworkMetrics,
  LinkedEntity,
  ShilledEntity,
  TokenMarketData,
} from '@/types/xintel';
import { lookupToken } from './tokenLookup';
import {
  isSupabaseAvailable,
  getCachedTokens,
  cacheToken,
  type TokenCacheRow,
} from '@/lib/supabase/client';

// ============================================================================
// GROK ANALYSIS → XINTEL REPORT (Simplified for Responses API)
// ============================================================================

/**
 * Transform Grok analysis result (from Responses API with x_search) to XIntel report
 * This is the primary transformer for the simplified Grok-only approach
 */
export function grokAnalysisToReport(analysis: GrokAnalysisResult): XIntelReport {
  // Build profile from Grok analysis - ensure handle has no @ prefix
  const rawHandle = analysis.handle || analysis.profile.handle || '';
  const cleanHandle = rawHandle.replace(/^@/, '');

  const profile: XIntelProfile = {
    handle: cleanHandle,
    displayName: analysis.profile.displayName,
    bio: analysis.profile.bio,
    verified: analysis.profile.verified,
    followers: analysis.profile.followers,
    following: analysis.profile.following,
    createdAt: analysis.profile.createdAt ? new Date(analysis.profile.createdAt) : undefined,
    languagesDetected: ['en'],
    profileImageUrl: undefined,
    bannerUrl: undefined,
  };

  // Build reputation score from analysis
  const score = buildScoreFromAnalysis(analysis);

  // Transform key findings - include theStory as a finding if available
  const keyFindings: KeyFinding[] = analysis.keyFindings.map((finding, i) => ({
    id: `kf_${i}`,
    title: extractFindingTitle(finding),
    description: finding,
    severity: determineSeverity(finding, analysis.riskLevel),
    evidenceIds: [],
  }));

  // Add theStory as the first key finding if available
  if (analysis.theStory) {
    keyFindings.unshift({
      id: 'kf_story',
      title: 'Profile Summary',
      description: analysis.theStory,
      severity: 'info',
      evidenceIds: [],
    });
  }

  // Build linked entities from analysis
  const linkedEntities: LinkedEntity[] = [];

  if (analysis.github) {
    linkedEntities.push({
      id: 'le_github',
      type: 'github',
      value: analysis.github,
      confidence: 'high',
      evidenceIds: [],
      firstSeen: new Date(),
      lastSeen: new Date(),
      mentionCount: 1,
    });
  }

  if (analysis.website) {
    linkedEntities.push({
      id: 'le_website',
      type: 'domain',
      value: analysis.website,
      confidence: 'high',
      evidenceIds: [],
      firstSeen: new Date(),
      lastSeen: new Date(),
      mentionCount: 1,
    });
  }

  if (analysis.contract) {
    linkedEntities.push({
      id: 'le_contract',
      type: 'domain',
      value: `${analysis.contract.chain}:${analysis.contract.address}`,
      confidence: 'high',
      evidenceIds: [],
      firstSeen: new Date(),
      lastSeen: new Date(),
      mentionCount: 1,
    });
  }

  // Build evidence from Grok's evidence array (preferred) or fall back to citations
  let evidence: XIntelEvidence[];

  if (analysis.evidence && analysis.evidence.length > 0) {
    // Use the new evidence format with actual tweet excerpts
    evidence = analysis.evidence.map((ev, i) => ({
      id: `ev_${i}`,
      tweetId: extractTweetIdFromUrl(ev.tweetUrl) || `ev_${i}`,
      timestamp: new Date(),
      excerpt: ev.tweetExcerpt,
      label: mapGrokLabelToEvidence(ev.label),
      url: ev.tweetUrl,
      confidence: 0.85,
    }));
  } else {
    // Fall back to citations (less informative)
    evidence = analysis.citations.map((citation, i) => ({
      id: `ev_citation_${i}`,
      tweetId: extractTweetIdFromUrl(citation.url) || `citation_${i}`,
      timestamp: new Date(),
      excerpt: citation.title || citation.url,
      label: 'neutral' as const,
      url: citation.url,
      confidence: 0.8,
    }));
  }

  // Build default behavior and network metrics
  const behaviorMetrics = buildDefaultBehaviorMetrics(analysis);
  const networkMetrics = buildDefaultNetworkMetrics(analysis);

  return {
    id: `report_${analysis.handle}_${Date.now()}`,
    profile,
    score,
    keyFindings,
    shilledEntities: (analysis.promotionHistory || []).map((promo, i) => ({
      id: `se_${i}`,
      entityName: promo.project,
      ticker: promo.ticker,
      mentionCount: promo.evidenceUrls?.length || 1,
      promoCount: promo.evidenceUrls?.length || 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      promoIntensity: promo.outcome === 'rugged' ? 90 : promo.outcome === 'failed' ? 70 : 50,
      evidenceIds: promo.evidenceUrls?.map((_, j) => `ev_promo_${i}_${j}`) || [],
    })),
    backlashEvents: [
      // From reputation.controversies (more detailed)
      ...(analysis.reputation?.controversies || []).map((controversy, i) => ({
        id: `be_rep_${i}`,
        category: 'criticism' as const,
        severity: analysis.riskLevel === 'high' ? 'high' as const : 'medium' as const,
        startDate: controversy.date ? new Date(controversy.date) : new Date(),
        endDate: undefined,
        sources: analysis.reputation?.critics?.map(c => ({
          handle: c.who,
          displayName: undefined,
          followers: undefined,
        })) || [],
        evidenceIds: [],
        summary: `${controversy.summary}${controversy.resolution ? ` (${controversy.resolution})` : ''}`,
      })),
      // From simple controversies array (fallback)
      ...analysis.controversies.map((controversy, i) => ({
        id: `be_${i}`,
        category: 'criticism' as const,
        severity: analysis.riskLevel === 'high' ? 'high' as const : 'medium' as const,
        startDate: new Date(),
        endDate: undefined,
        sources: [],
        evidenceIds: [],
        summary: controversy,
      })),
    ],
    behaviorMetrics,
    networkMetrics,
    linkedEntities,
    evidence,
    scanTime: new Date(),
    postsAnalyzed: analysis.postsAnalyzed || analysis.evidence?.length || analysis.citations.length || 10,
    cached: false,
    disclaimer: `AI-powered analysis using Grok with live X search. ${analysis.tokensUsed ? `Tokens used: ${analysis.tokensUsed}.` : ''} This is not financial advice.`,
  };
}

// ============================================================================
// HELPER FUNCTIONS FOR SIMPLIFIED TRANSFORMER
// ============================================================================

function buildScoreFromAnalysis(analysis: GrokAnalysisResult): ReputationScore {
  const pos = analysis.positiveIndicators;
  const neg = analysis.negativeIndicators;

  // ============================================================================
  // CALCULATE SCORE FROM EVIDENCE-BASED INDICATORS
  // Use verdict.trustLevel if available (1-10 scale -> 0-100)
  // Otherwise calculate from indicators
  // ============================================================================

  let score: number;

  if (analysis.verdict?.trustLevel !== undefined) {
    // Use Grok's trust assessment (1-10 scale -> 0-100)
    score = analysis.verdict.trustLevel * 10;
  } else {
    // Fall back to calculated score
    score = 50;

    // POSITIVE FACTORS (add points) - reward legitimate actors
    if (pos.isDoxxed) score += 20;                    // Doxxed team is major trust signal
    if (pos.hasActiveGithub) score += 15;             // Active development = real project
    if (pos.hasRealProduct) score += 10;              // Shipped product = not vaporware
    if (pos.accountAgeDays > 365) score += 10;        // 1+ year account = established
    else if (pos.accountAgeDays > 180) score += 5;    // 6+ months = somewhat established
    if (pos.hasConsistentHistory) score += 5;         // Consistent messaging
    if (pos.hasOrganicEngagement) score += 5;         // Real engagement
    if (pos.hasCredibleBackers) score += 10;          // Known backers
    if (analysis.profile.verified) score += 5;        // Verified account

    // NEGATIVE FACTORS (subtract points) - penalize red flags
    if (neg.hasScamAllegations) score -= 30;          // Scam allegations = serious
    if (neg.hasRugHistory) score -= 40;               // Rug history = disqualifying
    if (neg.isAnonymousTeam && !pos.isDoxxed) score -= 10; // Anonymous = some concern
    if (neg.hasHypeLanguage) score -= 5;              // Hype language = minor concern
    if (neg.hasSuspiciousFollowers) score -= 10;      // Fake followers
    if (neg.hasPreviousRebrand) score -= 5;           // Rebrand = some concern
    if (neg.hasAggressivePromotion) score -= 10;      // Aggressive promo = concerning
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine risk level from score
  let riskLevel: 'low' | 'medium' | 'high';
  if (score >= 70) riskLevel = 'low';
  else if (score >= 40) riskLevel = 'medium';
  else riskLevel = 'high';

  // Build detailed factors for UI display
  const factors: ScoreFactor[] = [
    {
      type: 'serial_shill',
      points: neg.hasAggressivePromotion ? 15 : neg.hasHypeLanguage ? 5 : 0,
      maxPoints: 25,
      description: neg.hasAggressivePromotion
        ? 'Aggressive promotional patterns detected'
        : neg.hasHypeLanguage
          ? 'Some hype language in posts'
          : 'No concerning promotional patterns',
      evidenceIds: [],
    },
    {
      type: 'backlash_density',
      points: neg.hasScamAllegations ? 25 : neg.hasRugHistory ? 25 : analysis.controversies.length * 5,
      maxPoints: 25,
      description: neg.hasScamAllegations
        ? `Scam allegations: ${neg.scamDetails || 'See analysis'}`
        : neg.hasRugHistory
          ? `Rug history: ${neg.rugDetails || 'See analysis'}`
          : analysis.controversies.length > 0
            ? `${analysis.controversies.length} concerns found`
            : 'No significant backlash detected',
      evidenceIds: [],
    },
    {
      type: 'toxic_vulgar',
      points: 0,
      maxPoints: 15,
      description: pos.isDoxxed
        ? `✓ Doxxed: ${pos.doxxedDetails || 'Identity known'}`
        : neg.isAnonymousTeam
          ? 'Anonymous team'
          : 'Team status unknown',
      evidenceIds: [],
    },
    {
      type: 'hype_merchant',
      points: neg.hasHypeLanguage ? 10 : 0,
      maxPoints: 15,
      description: pos.hasActiveGithub
        ? `✓ Active GitHub: ${pos.githubActivity || analysis.github}`
        : pos.hasRealProduct
          ? `✓ Real product: ${pos.productDetails || 'Verified'}`
          : neg.hasHypeLanguage
            ? 'Hype language without verified product'
            : 'Promotional language analysis',
      evidenceIds: [],
    },
    {
      type: 'consistency',
      points: neg.hasPreviousRebrand ? 8 : 0,
      maxPoints: 10,
      description: neg.hasPreviousRebrand
        ? `Rebranded: ${neg.rebrandDetails || 'Previous identity changed'}`
        : pos.hasConsistentHistory
          ? '✓ Consistent history'
          : 'No rebrand detected',
      evidenceIds: [],
    },
    {
      type: 'engagement_suspicion',
      points: neg.hasSuspiciousFollowers ? 10 : 0,
      maxPoints: 10,
      description: neg.hasSuspiciousFollowers
        ? `Suspicious followers: ${neg.suspiciousDetails || 'Potential bot activity'}`
        : pos.hasOrganicEngagement
          ? '✓ Organic engagement'
          : `Account age: ${pos.accountAgeDays} days`,
      evidenceIds: [],
    },
  ];

  return {
    overall: score,
    riskLevel,
    factors,
    confidence: analysis.confidence,
  };
}

function extractFindingTitle(finding: string): string {
  // Extract title from markdown-style finding (e.g., "1. **Title** description")
  const match = finding.match(/\*\*([^*]+)\*\*/);
  if (match) return match[1];

  // Otherwise use first few words
  const words = finding.split(' ').slice(0, 5);
  return words.join(' ') + (finding.split(' ').length > 5 ? '...' : '');
}

function determineSeverity(finding: string, riskLevel: string): 'info' | 'warning' | 'critical' {
  const lowerFinding = finding.toLowerCase();

  if (lowerFinding.includes('scam') || lowerFinding.includes('rug') || lowerFinding.includes('fraud')) {
    return 'critical';
  }

  if (lowerFinding.includes('warning') || lowerFinding.includes('concern') || lowerFinding.includes('suspicious')) {
    return 'warning';
  }

  if (riskLevel === 'high') return 'warning';

  return 'info';
}

function extractTweetIdFromUrl(url: string): string | undefined {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : undefined;
}

function mapGrokLabelToEvidence(
  label: string
): XIntelEvidence['label'] {
  // Map Grok's labels to our evidence label type
  const labelMap: Record<string, XIntelEvidence['label']> = {
    shill: 'shill',
    backlash: 'backlash',
    toxic: 'toxic',
    hype: 'hype',
    positive: 'neutral',
    promotion: 'shill',
    controversy: 'backlash',
    claim: 'neutral',
    scam_warning: 'backlash',
    milestone: 'neutral',
  };
  return labelMap[label] || 'neutral';
}

function buildDefaultBehaviorMetrics(analysis: GrokAnalysisResult): BehaviorMetrics {
  const neg = analysis.negativeIndicators;

  return {
    toxicity: { score: 0, examples: [] },
    vulgarity: { score: 0, examples: [] },
    hype: {
      score: neg.hasHypeLanguage ? 60 : neg.hasAggressivePromotion ? 40 : 10,
      examples: neg.hypeExamples.map((text, i) => ({
        excerpt: text,
        tweetId: `hype_${i}`,
        timestamp: new Date(),
      })),
      keywords: neg.hypeExamples.length > 0 ? ['promotional'] : [],
    },
    aggression: { score: 0, examples: [], targetPatterns: [] },
    consistency: {
      score: neg.hasPreviousRebrand ? 40 : 80,
      topicDrift: 0,
      contradictions: [],
    },
    spamBurst: { detected: false, burstPeriods: [] },
  };
}

function buildDefaultNetworkMetrics(analysis: GrokAnalysisResult): NetworkMetrics {
  const pos = analysis.positiveIndicators;
  const neg = analysis.negativeIndicators;

  // Build top interactions from Grok's topInteractions (preferred) or fall back to team members
  let topInteractions: NetworkMetrics['topInteractions'] = [];

  if (analysis.topInteractions && analysis.topInteractions.length > 0) {
    // Use Grok's analysis of who they interact with most
    topInteractions = analysis.topInteractions.map(interaction => ({
      handle: interaction.handle.replace(/^@/, ''),
      displayName: undefined,
      followers: undefined,
      interactionCount: interaction.interactionCount,
      interactionType: interaction.relationship === 'collaborator' ? 'mention' as const
        : interaction.relationship === 'promoter' ? 'retweet' as const
        : 'reply' as const,
    }));
  } else {
    // Fall back to team members
    topInteractions = pos.teamMembers
      .filter(m => m.xHandle)
      .map(member => ({
        handle: member.xHandle || member.name,
        displayName: member.name,
        followers: undefined,
        interactionCount: 1,
        interactionType: 'mention' as const,
      }));
  }

  const suspiciousPatterns: string[] = [];
  if (neg.hasSuspiciousFollowers) {
    suspiciousPatterns.push(neg.suspiciousDetails || 'Suspicious follower patterns detected');
  }

  // Build mention list from top interactions
  const mentionList = topInteractions.map(i => i.handle);

  return {
    topInteractions,
    mentionList,
    engagementHeuristics: {
      replyRatio: 0.3,
      retweetRatio: 0.2,
      avgEngagementRate: pos.hasOrganicEngagement ? 0.05 : 0.01,
      suspiciousPatterns,
    },
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export function calculateAccountAgeDays(createdAt: string | Date): number {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function isNewAccount(createdAt: string | Date, thresholdDays: number = 90): boolean {
  return calculateAccountAgeDays(createdAt) < thresholdDays;
}

// ============================================================================
// TOKEN DATA ENRICHMENT
// ============================================================================

/**
 * Enrich shilled entities with token market data from DexScreener
 * Uses Supabase cache for ticker -> address mappings to avoid repeated lookups
 * This should be called server-side (in the API route)
 */
export async function enrichShilledEntitiesWithTokenData(
  report: XIntelReport
): Promise<XIntelReport> {
  if (!report.shilledEntities || report.shilledEntities.length === 0) {
    return report;
  }

  // Collect all tickers to look up
  const tickers = report.shilledEntities
    .map(e => e.ticker || e.entityName)
    .filter((t): t is string => !!t);

  // Step 1: Check Supabase cache for known tickers
  let cachedTokens = new Map<string, TokenCacheRow>();
  if (isSupabaseAvailable() && tickers.length > 0) {
    cachedTokens = await getCachedTokens(tickers);
    console.log(`[TokenEnrich] Found ${cachedTokens.size}/${tickers.length} tokens in cache`);
  }

  // Step 2: Enrich each entity
  const enrichedEntities: ShilledEntity[] = await Promise.all(
    report.shilledEntities.map(async (entity) => {
      const searchQuery = entity.ticker || entity.entityName;
      if (!searchQuery) return entity;

      const normalizedTicker = searchQuery.replace(/^\$/, '').toUpperCase();

      try {
        // Check if we have this token cached
        const cached = cachedTokens.get(normalizedTicker);

        if (cached) {
          // We have the address cached - fetch live data by address
          console.log(`[TokenEnrich] Using cached address for $${normalizedTicker}: ${cached.token_address}`);
          const result = await lookupToken(cached.token_address);

          if (result.found && result.token) {
            return {
              ...entity,
              tokenData: mapTokenToMarketData(result.token),
            };
          }

          // Fallback: use cached metadata without live prices
          return {
            ...entity,
            tokenData: {
              tokenAddress: cached.token_address,
              poolAddress: cached.pool_address || undefined,
              priceUsd: 0,
              imageUrl: cached.image_url || undefined,
              dexType: (cached.dex_type as TokenMarketData['dexType']) || undefined,
              dexScreenerUrl: `https://dexscreener.com/solana/${cached.token_address}`,
            },
          };
        }

        // Not in cache - search DexScreener (strip $ prefix as it breaks DexScreener search)
        const cleanQuery = searchQuery.replace(/^\$/, '');
        const result = await lookupToken(cleanQuery);

        if (result.found && result.token) {
          // Cache this token for future lookups
          if (isSupabaseAvailable()) {
            cacheToken({
              ticker: normalizedTicker,
              tokenAddress: result.token.address,
              poolAddress: result.token.poolAddress,
              name: result.token.name,
              symbol: result.token.symbol,
              imageUrl: result.token.imageUrl,
              dexType: result.token.dexType,
            }).catch(err => console.error('[TokenEnrich] Failed to cache token:', err));
          }

          return {
            ...entity,
            tokenData: mapTokenToMarketData(result.token),
          };
        }
      } catch (error) {
        console.error(`[TokenEnrich] Failed to lookup token for ${searchQuery}:`, error);
      }

      return entity;
    })
  );

  return {
    ...report,
    shilledEntities: enrichedEntities,
  };
}

/**
 * Helper to map TokenData to TokenMarketData
 */
function mapTokenToMarketData(token: {
  address: string;
  poolAddress: string;
  priceUsd: number;
  priceChange5m?: number;
  priceChange1h?: number;
  priceChange6h?: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  dexType: string;
  buys24h?: number;
  sells24h?: number;
  imageUrl?: string;
  pairCreatedAt?: number;
}): TokenMarketData {
  return {
    tokenAddress: token.address,
    poolAddress: token.poolAddress,
    priceUsd: token.priceUsd,
    priceChange5m: token.priceChange5m,
    priceChange1h: token.priceChange1h,
    priceChange6h: token.priceChange6h,
    priceChange24h: token.priceChange24h,
    volume24h: token.volume24h,
    liquidity: token.liquidity,
    marketCap: token.marketCap,
    dexType: token.dexType as TokenMarketData['dexType'],
    buys24h: token.buys24h,
    sells24h: token.sells24h,
    imageUrl: token.imageUrl,
    pairCreatedAt: token.pairCreatedAt,
    dexScreenerUrl: `https://dexscreener.com/solana/${token.address}`,
  };
}

/**
 * Look up token data for a single shilled entity
 * Uses cache if available
 */
export async function lookupTokenForEntity(
  entity: ShilledEntity
): Promise<ShilledEntity> {
  const searchQuery = entity.ticker || entity.entityName;

  if (!searchQuery) {
    return entity;
  }

  try {
    const result = await lookupToken(searchQuery);

    if (result.found && result.token) {
      // Cache this token for future lookups
      if (isSupabaseAvailable() && entity.ticker) {
        const normalizedTicker = entity.ticker.replace(/^\$/, '').toUpperCase();
        cacheToken({
          ticker: normalizedTicker,
          tokenAddress: result.token.address,
          poolAddress: result.token.poolAddress,
          name: result.token.name,
          symbol: result.token.symbol,
          imageUrl: result.token.imageUrl,
          dexType: result.token.dexType,
        }).catch(err => console.error('[TokenEnrich] Failed to cache token:', err));
      }

      return {
        ...entity,
        tokenData: mapTokenToMarketData(result.token),
      };
    }
  } catch (error) {
    console.error(`Failed to lookup token for ${searchQuery}:`, error);
  }

  return entity;
}
