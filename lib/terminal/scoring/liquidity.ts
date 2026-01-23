import type { ModuleScore, Evidence, EvidenceType, EvidenceSeverity } from '@/types/terminal';

interface LiquidityData {
  lpLocked?: boolean;
  lpLockDuration?: number; // days
  lpRemovalPercent?: number; // % of LP removed recently
  holderConcentration?: number; // % held by top 10 wallets
  topHolderPercent?: number; // % held by largest holder
  unlockSchedule?: { date: Date; percent: number }[];
  liquidityDepth?: 'deep' | 'shallow' | 'critical';
  recentLPChanges?: number; // number of LP changes in last 24h
}

const MODULE_WEIGHT = 0.25;

/**
 * Token & Liquidity Risk Module
 * Analyzes LP changes, holder concentration, unlock schedules
 */
export function calculateLiquidityScore(data: LiquidityData): ModuleScore {
  const evidence: Evidence[] = [];
  let score = 0;

  // LP locked scoring (0-30 points)
  if (data.lpLocked === false) {
    score += 30;
    evidence.push(createEvidence(
      'lp_change',
      'critical',
      'Liquidity pool is NOT locked - can be rugged at any time',
      'https://dexscreener.com/'
    ));
  } else if (data.lpLocked === true && data.lpLockDuration !== undefined) {
    if (data.lpLockDuration < 30) {
      score += 20;
      evidence.push(createEvidence(
        'lp_change',
        'warning',
        `LP locked for only ${data.lpLockDuration} days - short lock period`,
        'https://dexscreener.com/'
      ));
    } else if (data.lpLockDuration < 90) {
      score += 10;
      evidence.push(createEvidence(
        'lp_change',
        'info',
        `LP locked for ${data.lpLockDuration} days`,
        'https://dexscreener.com/'
      ));
    }
  }

  // LP removal scoring (0-25 points)
  if (data.lpRemovalPercent !== undefined && data.lpRemovalPercent > 30) {
    score += 25;
    evidence.push(createEvidence(
      'lp_change',
      'critical',
      `${data.lpRemovalPercent}% of LP removed recently - potential rug in progress`,
      'https://dexscreener.com/'
    ));
  } else if (data.lpRemovalPercent !== undefined && data.lpRemovalPercent > 10) {
    score += 15;
    evidence.push(createEvidence(
      'lp_change',
      'warning',
      `${data.lpRemovalPercent}% of LP removed recently`,
      'https://dexscreener.com/'
    ));
  }

  // Holder concentration (0-20 points)
  if (data.holderConcentration !== undefined) {
    if (data.holderConcentration > 80) {
      score += 20;
      evidence.push(createEvidence(
        'holder_concentration',
        'critical',
        `Top 10 wallets hold ${data.holderConcentration}% - extreme concentration`,
        'https://solscan.io/'
      ));
    } else if (data.holderConcentration > 60) {
      score += 12;
      evidence.push(createEvidence(
        'holder_concentration',
        'warning',
        `Top 10 wallets hold ${data.holderConcentration}% - high concentration`,
        'https://solscan.io/'
      ));
    } else if (data.holderConcentration > 40) {
      score += 5;
      evidence.push(createEvidence(
        'holder_concentration',
        'info',
        `Top 10 wallets hold ${data.holderConcentration}%`,
        'https://solscan.io/'
      ));
    }
  }

  // Top holder scoring (0-15 points)
  if (data.topHolderPercent !== undefined && data.topHolderPercent > 30) {
    score += 15;
    evidence.push(createEvidence(
      'holder_concentration',
      'warning',
      `Single wallet holds ${data.topHolderPercent}% of supply`,
      'https://solscan.io/'
    ));
  } else if (data.topHolderPercent !== undefined && data.topHolderPercent > 15) {
    score += 8;
    evidence.push(createEvidence(
      'holder_concentration',
      'info',
      `Largest holder has ${data.topHolderPercent}% of supply`,
      'https://solscan.io/'
    ));
  }

  // Unlock schedule scoring (0-15 points)
  if (data.unlockSchedule && data.unlockSchedule.length > 0) {
    const upcomingUnlocks = data.unlockSchedule.filter(
      u => u.date.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
    );
    const upcomingPercent = upcomingUnlocks.reduce((sum, u) => sum + u.percent, 0);

    if (upcomingPercent > 20) {
      score += 15;
      evidence.push(createEvidence(
        'unlock_schedule',
        'warning',
        `${upcomingPercent}% of tokens unlocking within 30 days`,
        ''
      ));
    } else if (upcomingPercent > 10) {
      score += 8;
      evidence.push(createEvidence(
        'unlock_schedule',
        'info',
        `${upcomingPercent}% of tokens unlocking within 30 days`,
        ''
      ));
    }
  }

  // Liquidity depth (0-10 points)
  if (data.liquidityDepth === 'critical') {
    score += 10;
    evidence.push(createEvidence(
      'lp_change',
      'warning',
      'Very shallow liquidity - high slippage risk',
      'https://dexscreener.com/'
    ));
  } else if (data.liquidityDepth === 'shallow') {
    score += 5;
    evidence.push(createEvidence(
      'lp_change',
      'info',
      'Shallow liquidity pool',
      'https://dexscreener.com/'
    ));
  }

  // Recent LP changes (0-10 points)
  if (data.recentLPChanges !== undefined && data.recentLPChanges > 5) {
    score += 10;
    evidence.push(createEvidence(
      'lp_change',
      'warning',
      `${data.recentLPChanges} LP changes in last 24h - unusual activity`,
      'https://dexscreener.com/'
    ));
  }

  return {
    name: 'Token & Liquidity Risk',
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
