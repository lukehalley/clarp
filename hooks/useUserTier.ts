'use client';

// User Tier Hook
// Calculates user tier based on CLARP balance

import { useMemo } from 'react';
import { useTokenBalance } from './useTokenBalance';
import { TIER_THRESHOLDS, TIER_LIMITS, Tier, TierLimits } from '@/lib/config/tokenomics';

export interface TierInfo {
  tier: Tier;
  balance: number;
  balanceFormatted: string;
  nextTier: Tier | null;
  tokensToNextTier: number | null;
  percentToNextTier: number;
  isLoading: boolean;
}

function computeTier(balance: number): Tier {
  if (balance >= TIER_THRESHOLDS.whale) return 'whale';
  if (balance >= TIER_THRESHOLDS.power) return 'power';
  if (balance >= TIER_THRESHOLDS.holder) return 'holder';
  return 'free';
}

export function useUserTier(): TierInfo {
  const { balance, balanceFormatted, isLoading } = useTokenBalance();

  return useMemo(() => {
    const actualBalance = balance ?? 0;
    const tier = computeTier(actualBalance);

    const tiers: Tier[] = ['free', 'holder', 'power', 'whale'];
    const currentIndex = tiers.indexOf(tier);
    const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;

    let tokensToNextTier: number | null = null;
    let percentToNextTier = 100;

    if (nextTier) {
      tokensToNextTier = TIER_THRESHOLDS[nextTier] - actualBalance;
      const currentThreshold = TIER_THRESHOLDS[tier];
      const nextThreshold = TIER_THRESHOLDS[nextTier];
      const range = nextThreshold - currentThreshold;
      const progress = actualBalance - currentThreshold;
      percentToNextTier = range > 0 ? Math.min(100, Math.max(0, (progress / range) * 100)) : 0;
    }

    return {
      tier,
      balance: actualBalance,
      balanceFormatted,
      nextTier,
      tokensToNextTier: tokensToNextTier ? Math.ceil(tokensToNextTier) : null,
      percentToNextTier,
      isLoading,
    };
  }, [balance, balanceFormatted, isLoading]);
}

export function useTierLimits(): TierLimits & { tier: Tier; isLoading: boolean } {
  const { tier, isLoading } = useUserTier();
  return {
    ...TIER_LIMITS[tier],
    tier,
    isLoading,
  };
}

// Re-export types for convenience
export { TIER_THRESHOLDS, TIER_LIMITS, type Tier, type TierLimits } from '@/lib/config/tokenomics';
