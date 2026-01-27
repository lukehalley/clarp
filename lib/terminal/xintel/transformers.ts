// Transformers for Grok analysis to XIntel report
// Converts Grok's JSON response to our internal types

import type { GrokAnalysisResult, GrokEvidenceItem } from '@/lib/grok/types';
import type { XIntelReport, XIntelEvidence, ShilledEntity, BacklashEvent, KeyFinding, BacklashCategory, BacklashSeverity, XIntelEvidenceLabel } from '@/types/xintel';
import { lookupToken } from './tokenLookup';

/**
 * Convert Grok's analysis response to an XIntel report
 */
export function grokAnalysisToReport(analysis: GrokAnalysisResult): XIntelReport {
  const reportId = `report_${analysis.handle}_${Date.now()}`;

  // Build evidence array from Grok's findings
  const evidence: XIntelEvidence[] = [];

  // Convert evidence items from Grok
  if (analysis.evidence) {
    analysis.evidence.forEach((item, idx) => {
      evidence.push({
        id: `ev_${idx}`,
        tweetId: extractTweetId(item.tweetUrl) || `unknown_${idx}`,
        timestamp: item.date ? new Date(item.date) : new Date(),
        excerpt: item.tweetExcerpt || 'Evidence detected',
        label: mapGrokLabelToXIntel(item.label),
        url: item.tweetUrl || '',
        confidence: 0.8,
      });
    });
  }

  // Build shilled entities from promotion history
  const shilledEntities: ShilledEntity[] = [];
  if (analysis.promotionHistory) {
    analysis.promotionHistory.forEach((promo, idx) => {
      shilledEntities.push({
        id: `shilled_${idx}`,
        entityName: promo.project || 'Unknown',
        ticker: promo.ticker,
        mentionCount: promo.mentionCount || 1,
        promoCount: promo.mentionCount || 1,
        firstSeen: promo.firstMention ? new Date(promo.firstMention) : new Date(),
        lastSeen: promo.lastMention ? new Date(promo.lastMention) : new Date(),
        promoIntensity: 50,
        evidenceIds: [],
      });
    });
  }

  // Build backlash events from controversies
  const backlashEvents: BacklashEvent[] = [];
  if (analysis.controversies && analysis.controversies.length > 0) {
    analysis.controversies.forEach((controversy, idx) => {
      backlashEvents.push({
        id: `backlash_${idx}`,
        category: 'criticism' as BacklashCategory,
        severity: 'medium' as BacklashSeverity,
        startDate: new Date(),
        sources: [],
        evidenceIds: [],
        summary: controversy,
      });
    });
  }

  // Build key findings
  const keyFindings: KeyFinding[] = [];
  if (analysis.keyFindings) {
    analysis.keyFindings.forEach((finding, idx) => {
      keyFindings.push({
        id: `kf_${idx}`,
        title: 'Key Finding',
        description: finding,
        severity: 'info',
        evidenceIds: [],
      });
    });
  }

  // Calculate risk score based on indicators
  const riskScore = calculateRiskScore(analysis);

  return {
    id: reportId,
    profile: {
      handle: analysis.handle,
      displayName: analysis.profile?.displayName,
      bio: analysis.profile?.bio,
      verified: analysis.profile?.verified || false,
      followers: analysis.profile?.followers,
      following: analysis.profile?.following,
      createdAt: analysis.profile?.createdAt ? new Date(analysis.profile.createdAt) : undefined,
      languagesDetected: ['en'],
      profileImageUrl: undefined,
    },
    score: {
      overall: riskScore,
      riskLevel: riskScore >= 75 ? 'low' : riskScore >= 45 ? 'medium' : 'high',
      factors: [],
      confidence: analysis.confidence || 'medium',
    },
    keyFindings,
    shilledEntities,
    backlashEvents,
    behaviorMetrics: {
      toxicity: { score: 0, examples: [] },
      vulgarity: { score: 0, examples: [] },
      hype: { score: analysis.negativeIndicators?.hasHypeLanguage ? 60 : 0, examples: [], keywords: analysis.negativeIndicators?.hypeExamples || [] },
      aggression: { score: 0, examples: [], targetPatterns: [] },
      consistency: { score: 80, topicDrift: 0, contradictions: [] },
      spamBurst: { detected: false, burstPeriods: [] },
    },
    networkMetrics: {
      topInteractions: (analysis.topInteractions || []).map(i => ({
        handle: i.handle,
        interactionCount: i.interactionCount,
        interactionType: 'mention' as const,
      })),
      mentionList: [],
      engagementHeuristics: {
        replyRatio: 0,
        retweetRatio: 0,
        avgEngagementRate: 0,
        suspiciousPatterns: [],
      },
    },
    linkedEntities: [],
    evidence,
    scanTime: new Date(),
    postsAnalyzed: analysis.postsAnalyzed || 0,
    cached: false,
    disclaimer: `AI-powered analysis by Grok. Tokens used: ${analysis.tokensUsed || 0}. This is not financial advice.`,
  };
}

/**
 * Enrich shilled entities with token market data from DexScreener
 */
export async function enrichShilledEntitiesWithTokenData(report: XIntelReport): Promise<XIntelReport> {
  const enrichedEntities = await Promise.all(
    report.shilledEntities.map(async (entity) => {
      if (!entity.ticker) return entity;

      try {
        const result = await lookupToken(entity.ticker);
        if (result.found && result.token) {
          const tokenData = result.token;
          return {
            ...entity,
            tokenData: {
              tokenAddress: tokenData.address,
              poolAddress: tokenData.poolAddress,
              priceUsd: tokenData.priceUsd,
              priceChange5m: tokenData.priceChange5m,
              priceChange1h: tokenData.priceChange1h,
              priceChange6h: tokenData.priceChange6h,
              priceChange24h: tokenData.priceChange24h,
              volume24h: tokenData.volume24h,
              liquidity: tokenData.liquidity,
              marketCap: tokenData.marketCap,
              dexType: tokenData.dexType as 'raydium' | 'meteora' | 'orca' | 'pump_fun' | 'unknown',
              buys24h: tokenData.buys24h,
              sells24h: tokenData.sells24h,
              imageUrl: tokenData.imageUrl,
              pairCreatedAt: tokenData.pairCreatedAt,
              dexScreenerUrl: `https://dexscreener.com/solana/${tokenData.address}`,
            },
          };
        }
      } catch (err) {
        console.warn(`[Transformers] Failed to enrich ${entity.ticker}:`, err);
      }
      return entity;
    })
  );

  return {
    ...report,
    shilledEntities: enrichedEntities,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateRiskScore(analysis: GrokAnalysisResult): number {
  // Start at 50 (neutral) and adjust based on indicators
  let score = 50;

  const neg = analysis.negativeIndicators;
  const pos = analysis.positiveIndicators;

  // ==========================================================================
  // NEGATIVE INDICATORS (deductions)
  // ==========================================================================
  if (neg) {
    if (neg.hasScamAllegations) score -= 25;
    if (neg.hasRugHistory) score -= 30;
    if (neg.isAnonymousTeam) score -= 10;
    if (neg.hasHypeLanguage) score -= 5;
    if (neg.hasSuspiciousFollowers) score -= 10;
    if (neg.hasPreviousRebrand) score -= 5;
    if (neg.hasAggressivePromotion) score -= 10;
    // OSINT-enhanced negatives
    if (neg.noPublicAudit) score -= 5;
    if (neg.lowLiquidity) score -= 10;
    if (neg.unverifiedLegalEntity) score -= 5;
  }

  // ==========================================================================
  // POSITIVE INDICATORS (bonuses)
  // ==========================================================================
  if (pos) {
    if (pos.isDoxxed) score += 15;
    if (pos.hasActiveGithub) score += 10;
    if (pos.hasRealProduct) score += 15;
    if (pos.hasConsistentHistory) score += 5;
    if (pos.hasOrganicEngagement) score += 5;
    if (pos.hasCredibleBackers) score += 10;

    // Account age bonus (up to 10 points)
    if (pos.accountAgeDays > 0) {
      score += Math.min(pos.accountAgeDays / 100, 10);
    }

    // Team member quality bonus
    if (pos.teamMembers && pos.teamMembers.length > 0) {
      const doxxedMembers = pos.teamMembers.filter(m => m.isDoxxed);
      const membersWithHistory = pos.teamMembers.filter(m =>
        m.previousEmployers && m.previousEmployers.length > 0
      );
      if (doxxedMembers.length > 0) score += 5;
      if (membersWithHistory.length > 0) score += 10; // Credible employment history
    }
  }

  // ==========================================================================
  // OSINT-ENHANCED SCORING
  // ==========================================================================

  // Legal entity bonus (registered company)
  if (analysis.legalEntity?.isRegistered) {
    score += 10;
  }

  // Affiliations bonus (council/accelerator membership)
  if (analysis.affiliations && analysis.affiliations.length > 0) {
    const credibleAffiliations = analysis.affiliations.filter(a =>
      ['council', 'accelerator', 'vc'].includes(a.type)
    );
    score += Math.min(credibleAffiliations.length * 5, 15); // Up to 15 points
  }

  // Audit bonus/penalty
  if (analysis.audit) {
    if (analysis.audit.auditStatus === 'completed') score += 15;
    else if (analysis.audit.auditStatus === 'pending') score += 5;
    else if (!analysis.audit.hasAudit) score -= 5;
  }

  // Liquidity assessment
  if (analysis.liquidity) {
    if (analysis.liquidity.liquidityLocked) score += 10;
    if (analysis.liquidity.liquidityUsd && analysis.liquidity.liquidityUsd > 100000) {
      score += 5; // Good liquidity
    } else if (analysis.liquidity.liquidityUsd && analysis.liquidity.liquidityUsd < 10000) {
      score -= 10; // Low liquidity risk
    }
  }

  // Roadmap completeness
  if (analysis.roadmap && analysis.roadmap.length > 0) {
    const completedMilestones = analysis.roadmap.filter(m => m.status === 'completed');
    if (completedMilestones.length > 0) score += 5; // Shipping history
  }

  // Risk level adjustments
  if (analysis.riskLevel === 'high') score -= 10;
  if (analysis.riskLevel === 'low') score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function extractTweetId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

function mapGrokLabelToXIntel(label: GrokEvidenceItem['label']): XIntelEvidenceLabel {
  switch (label) {
    case 'shill':
    case 'promotion':
      return 'shill';
    case 'backlash':
    case 'controversy':
    case 'scam_warning':
      return 'backlash';
    case 'toxic':
      return 'toxic';
    case 'hype':
    case 'claim':
      return 'hype';
    case 'positive':
    case 'neutral':
    case 'milestone':
    default:
      return 'neutral';
  }
}
