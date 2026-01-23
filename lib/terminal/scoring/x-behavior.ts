import type { ModuleScore, Evidence, EvidenceType, EvidenceSeverity } from '@/types/terminal';

interface XBehaviorData {
  engagementRate?: number; // 0-100, higher is more suspicious if too high
  avgLikesPerTweet?: number;
  avgRetweetsPerTweet?: number;
  followerGrowthRate?: number; // % per week
  burstPattern?: boolean; // sudden activity spikes
  shillClusterSize?: number; // number of coordinated accounts
  suspiciousRetweeters?: number;
  followersToFollowingRatio?: number;
  recentActivitySpike?: boolean;
}

const MODULE_WEIGHT = 0.25;

/**
 * Narrative Manipulation Risk Module
 * Analyzes engagement anomalies, burst patterns, shill clusters
 */
export function calculateXBehaviorScore(data: XBehaviorData): ModuleScore {
  const evidence: Evidence[] = [];
  let score = 0;

  // Engagement anomaly scoring (0-25 points)
  if (data.engagementRate !== undefined) {
    if (data.engagementRate > 50) {
      score += 25;
      evidence.push(createEvidence(
        'engagement_anomaly',
        'critical',
        `Abnormally high engagement rate (${data.engagementRate}%) - likely bot activity`,
        'https://x.com/'
      ));
    } else if (data.engagementRate > 30) {
      score += 15;
      evidence.push(createEvidence(
        'engagement_anomaly',
        'warning',
        `Suspicious engagement rate (${data.engagementRate}%) - above normal range`,
        'https://x.com/'
      ));
    } else if (data.engagementRate < 1 && data.avgLikesPerTweet && data.avgLikesPerTweet > 100) {
      score += 20;
      evidence.push(createEvidence(
        'engagement_anomaly',
        'warning',
        'Low engagement rate with high like count - possible bought engagement',
        'https://x.com/'
      ));
    }
  }

  // Burst pattern scoring (0-20 points)
  if (data.burstPattern === true) {
    score += 20;
    evidence.push(createEvidence(
      'burst_pattern',
      'warning',
      'Detected burst posting pattern - sudden activity spikes',
      'https://x.com/'
    ));
  }

  // Shill cluster scoring (0-30 points)
  if (data.shillClusterSize !== undefined) {
    if (data.shillClusterSize > 20) {
      score += 30;
      evidence.push(createEvidence(
        'shill_cluster',
        'critical',
        `Large shill cluster detected (${data.shillClusterSize} coordinated accounts)`,
        'https://x.com/'
      ));
    } else if (data.shillClusterSize > 10) {
      score += 20;
      evidence.push(createEvidence(
        'shill_cluster',
        'warning',
        `Shill cluster detected (${data.shillClusterSize} coordinated accounts)`,
        'https://x.com/'
      ));
    } else if (data.shillClusterSize > 5) {
      score += 10;
      evidence.push(createEvidence(
        'shill_cluster',
        'info',
        `Small shill cluster detected (${data.shillClusterSize} accounts)`,
        'https://x.com/'
      ));
    }
  }

  // Follower spike scoring (0-15 points)
  if (data.followerGrowthRate !== undefined && data.followerGrowthRate > 50) {
    score += 15;
    evidence.push(createEvidence(
      'follower_spike',
      'warning',
      `Rapid follower growth (${data.followerGrowthRate}% per week) - possible bought followers`,
      'https://x.com/'
    ));
  } else if (data.followerGrowthRate !== undefined && data.followerGrowthRate > 25) {
    score += 8;
    evidence.push(createEvidence(
      'follower_spike',
      'info',
      `High follower growth rate (${data.followerGrowthRate}% per week)`,
      'https://x.com/'
    ));
  }

  // Suspicious retweeters (0-10 points)
  if (data.suspiciousRetweeters !== undefined && data.suspiciousRetweeters > 30) {
    score += 10;
    evidence.push(createEvidence(
      'shill_cluster',
      'info',
      `${data.suspiciousRetweeters}% of retweeters have suspicious profiles`,
      'https://x.com/'
    ));
  }

  // Recent activity spike (bonus points)
  if (data.recentActivitySpike === true) {
    score += 5;
    evidence.push(createEvidence(
      'burst_pattern',
      'info',
      'Recent spike in activity detected',
      'https://x.com/'
    ));
  }

  return {
    name: 'Narrative Manipulation Risk',
    score: Math.min(100, score),
    weight: MODULE_WEIGHT,
    evidence,
  };
}

function createEvidence(
  type: EvidenceType,
  severity: EvidenceSeverity,
  summary: string,
  url: string
): Evidence {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    severity,
    timestamp: new Date(),
    url,
    summary,
  };
}
