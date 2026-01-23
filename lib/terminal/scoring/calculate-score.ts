import type { LarpScore, ScoreBreakdown, ModuleScore, ConfidenceLevel, RiskLevel } from '@/types/terminal';
import { calculateIdentityScore } from './identity';
import { calculateXBehaviorScore } from './x-behavior';
import { calculateWalletScore } from './wallet';
import { calculateLiquidityScore } from './liquidity';

interface ScoringInput {
  identity?: Parameters<typeof calculateIdentityScore>[0];
  xBehavior?: Parameters<typeof calculateXBehaviorScore>[0];
  wallet?: Parameters<typeof calculateWalletScore>[0];
  liquidity?: Parameters<typeof calculateLiquidityScore>[0];
}

/**
 * Calculate combined LARP score from all modules
 */
export function calculateLarpScore(input: ScoringInput): LarpScore {
  // Calculate individual module scores
  const identity = input.identity
    ? calculateIdentityScore(input.identity)
    : createEmptyModule('Team & Identity Risk', 0.25);

  const xBehavior = input.xBehavior
    ? calculateXBehaviorScore(input.xBehavior)
    : createEmptyModule('Narrative Manipulation Risk', 0.25);

  const wallet = input.wallet
    ? calculateWalletScore(input.wallet)
    : createEmptyModule('Wallet Behavior Risk', 0.25);

  const liquidity = input.liquidity
    ? calculateLiquidityScore(input.liquidity)
    : createEmptyModule('Token & Liquidity Risk', 0.25);

  const breakdown: ScoreBreakdown = {
    identity,
    xBehavior,
    wallet,
    liquidity,
  };

  // Calculate weighted total score
  const totalScore = Math.round(
    identity.score * identity.weight +
    xBehavior.score * xBehavior.weight +
    wallet.score * wallet.weight +
    liquidity.score * liquidity.weight
  );

  // Determine confidence based on available data
  const confidence = calculateConfidence(input);

  // Determine risk level
  const riskLevel = calculateRiskLevel(totalScore);

  // Generate top tags from highest-scoring factors
  const topTags = generateTopTags(breakdown);

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    confidence,
    riskLevel,
    topTags,
    breakdown,
    lastUpdated: new Date(),
  };
}

/**
 * Create an empty module score
 */
function createEmptyModule(name: string, weight: number): ModuleScore {
  return {
    name,
    score: 0,
    weight,
    evidence: [],
  };
}

/**
 * Calculate confidence level based on available data
 */
function calculateConfidence(input: ScoringInput): ConfidenceLevel {
  let dataPoints = 0;
  let maxDataPoints = 0;

  // Count identity data points
  if (input.identity) {
    maxDataPoints += 7;
    if (input.identity.xAccountAge !== undefined) dataPoints++;
    if (input.identity.domainAge !== undefined) dataPoints++;
    if (input.identity.hasVerifiedLinks !== undefined) dataPoints++;
    if (input.identity.linksConsistent !== undefined) dataPoints++;
    if (input.identity.hasWebsite !== undefined) dataPoints++;
    if (input.identity.hasGithub !== undefined) dataPoints++;
    if (input.identity.teamAnonymous !== undefined) dataPoints++;
  }

  // Count X behavior data points
  if (input.xBehavior) {
    maxDataPoints += 6;
    if (input.xBehavior.engagementRate !== undefined) dataPoints++;
    if (input.xBehavior.followerGrowthRate !== undefined) dataPoints++;
    if (input.xBehavior.burstPattern !== undefined) dataPoints++;
    if (input.xBehavior.shillClusterSize !== undefined) dataPoints++;
    if (input.xBehavior.suspiciousRetweeters !== undefined) dataPoints++;
    if (input.xBehavior.followersToFollowingRatio !== undefined) dataPoints++;
  }

  // Count wallet data points
  if (input.wallet) {
    maxDataPoints += 6;
    if (input.wallet.deployerAge !== undefined) dataPoints++;
    if (input.wallet.freshWalletFunding !== undefined) dataPoints++;
    if (input.wallet.cexDepositsDetected !== undefined) dataPoints++;
    if (input.wallet.suspiciousFlows !== undefined) dataPoints++;
    if (input.wallet.knownRugWalletConnection !== undefined) dataPoints++;
    if (input.wallet.teamWalletActivity !== undefined) dataPoints++;
  }

  // Count liquidity data points
  if (input.liquidity) {
    maxDataPoints += 6;
    if (input.liquidity.lpLocked !== undefined) dataPoints++;
    if (input.liquidity.holderConcentration !== undefined) dataPoints++;
    if (input.liquidity.topHolderPercent !== undefined) dataPoints++;
    if (input.liquidity.liquidityDepth !== undefined) dataPoints++;
    if (input.liquidity.lpRemovalPercent !== undefined) dataPoints++;
    if (input.liquidity.unlockSchedule !== undefined) dataPoints++;
  }

  if (maxDataPoints === 0) return 'low';

  const ratio = dataPoints / maxDataPoints;

  if (ratio >= 0.7) return 'high';
  if (ratio >= 0.4) return 'medium';
  return 'low';
}

/**
 * Calculate risk level from score
 */
function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * Generate top risk tags from module breakdown
 */
function generateTopTags(breakdown: ScoreBreakdown): string[] {
  const tags: { tag: string; score: number }[] = [];

  // Collect all evidence and generate tags
  const modules = [breakdown.identity, breakdown.xBehavior, breakdown.wallet, breakdown.liquidity];

  for (const module of modules) {
    for (const evidence of module.evidence) {
      if (evidence.severity === 'critical') {
        tags.push({ tag: getTagFromEvidence(evidence.type), score: 3 });
      } else if (evidence.severity === 'warning') {
        tags.push({ tag: getTagFromEvidence(evidence.type), score: 2 });
      }
    }
  }

  // Sort by score (importance) and deduplicate
  const uniqueTags = [...new Map(
    tags.sort((a, b) => b.score - a.score).map(t => [t.tag, t])
  ).values()];

  return uniqueTags.slice(0, 6).map(t => t.tag);
}

/**
 * Convert evidence type to human-readable tag
 */
function getTagFromEvidence(type: string): string {
  const tagMap: Record<string, string> = {
    account_age: 'New Account',
    domain_age: 'New Domain',
    verified_links: 'Unverified Links',
    consistency: 'Inconsistent Info',
    engagement_anomaly: 'Bot Activity',
    burst_pattern: 'Burst Pattern',
    shill_cluster: 'Shill Cluster',
    follower_spike: 'Follower Spike',
    fresh_wallet: 'Fresh Wallet',
    suspicious_flow: 'Suspicious Flow',
    cex_deposit: 'CEX Deposit',
    lp_change: 'LP Risk',
    holder_concentration: 'Whale Heavy',
    unlock_schedule: 'Unlock Risk',
    link_change: 'Link Changed',
    bio_change: 'Bio Changed',
  };

  return tagMap[type] || type;
}

/**
 * Re-export module calculators for direct use
 */
export { calculateIdentityScore } from './identity';
export { calculateXBehaviorScore } from './x-behavior';
export { calculateWalletScore } from './wallet';
export { calculateLiquidityScore } from './liquidity';
