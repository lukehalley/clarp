'use client';

// Balance Display Component
// Shows CLARP token balance with refresh button

import { useTokenBalance } from '@/hooks/useTokenBalance';
import { RefreshCw } from 'lucide-react';

interface BalanceDisplayProps {
  compact?: boolean;
  showRefresh?: boolean;
}

export function BalanceDisplay({ compact = false, showRefresh = true }: BalanceDisplayProps) {
  const { balance, balanceFormatted, isLoading, refetch } = useTokenBalance();

  // Don't render if no balance data and not loading
  if (balance === null && !isLoading) {
    return null;
  }

  if (compact) {
    return (
      <span className="font-mono text-xs text-larp-green">
        {isLoading ? '...' : `${balanceFormatted} CLARP`}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <p className="font-mono text-[10px] text-ivory-light/40 uppercase tracking-wider">
          CLARP Balance
        </p>
        <p className="font-mono text-sm text-larp-green font-bold">
          {isLoading ? '...' : balanceFormatted}
        </p>
      </div>
      {showRefresh && (
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-1 text-ivory-light/40 hover:text-ivory-light transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
}
