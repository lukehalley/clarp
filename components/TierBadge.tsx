'use client';

// Tier Badge Component
// Displays user's CLARP tier with icon and styling

import { Tier, TIER_CONFIG } from '@/lib/config/tokenomics';

interface TierBadgeProps {
  tier: Tier;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TierBadge({
  tier,
  showIcon = true,
  size = 'md',
  showLabel = true,
}: TierBadgeProps) {
  const config = TIER_CONFIG[tier];

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-1 gap-1',
    lg: 'text-sm px-3 py-1.5 gap-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-mono font-bold
        border rounded
        ${config.color} ${config.bg} ${sizeClasses[size]}
      `}
    >
      {showIcon && <span className="leading-none">{config.icon}</span>}
      {showLabel && <span>{config.label.toUpperCase()}</span>}
    </span>
  );
}
