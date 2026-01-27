'use client';

// Upgrade Prompt Component
// Shows upgrade CTA when user is below required tier

import { useUserTier } from '@/hooks/useUserTier';
import { TierBadge } from './TierBadge';
import { TIER_THRESHOLDS, BAGS_FM_URL, Tier } from '@/lib/config/tokenomics';
import { ExternalLink } from 'lucide-react';

interface UpgradePromptProps {
  requiredTier?: Tier;
  feature?: string;
  compact?: boolean;
}

export function UpgradePrompt({
  requiredTier,
  feature,
  compact = false,
}: UpgradePromptProps) {
  const { tier, nextTier, tokensToNextTier, percentToNextTier } = useUserTier();

  // If user has required tier, don't show
  if (requiredTier) {
    const tiers: Tier[] = ['free', 'holder', 'power', 'whale'];
    if (tiers.indexOf(tier) >= tiers.indexOf(requiredTier)) {
      return null;
    }
  }

  // If at max tier, don't show
  if (!nextTier && !requiredTier) return null;

  const targetTier = requiredTier || nextTier!;
  const tokensNeeded = requiredTier
    ? Math.max(0, TIER_THRESHOLDS[requiredTier] - (tokensToNextTier ? TIER_THRESHOLDS[nextTier!] - tokensToNextTier : 0))
    : tokensToNextTier;

  if (compact) {
    return (
      <a
        href={BAGS_FM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors"
      >
        <span>Upgrade to</span>
        <TierBadge tier={targetTier} size="sm" />
        <ExternalLink size={10} />
      </a>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ivory-light/70">
            {feature ? `${feature} requires` : 'Upgrade to unlock more features'}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <TierBadge tier={targetTier} />
            {tokensNeeded && tokensNeeded > 0 && (
              <span className="text-xs font-mono text-ivory-light/50">
                {tokensNeeded.toLocaleString()} CLARP needed
              </span>
            )}
          </div>

          {/* Progress bar - only show when upgrading to next tier */}
          {!requiredTier && nextTier && (
            <div className="mt-3">
              <div className="h-1 bg-ivory-light/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${percentToNextTier}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-ivory-light/40 mt-1">
                {percentToNextTier.toFixed(0)}% to {nextTier}
              </p>
            </div>
          )}
        </div>

        <a
          href={BAGS_FM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-mono font-bold rounded transition-colors"
        >
          <span>BUY</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
