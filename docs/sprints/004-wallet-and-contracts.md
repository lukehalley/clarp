# Sprint 004: Wallet Integration & Smart Contracts

## Overview

**Goal**: Complete end-to-end token utility implementation:
1. Wallet connection with Supabase Web3 auth (done)
2. Token balance checking and tier gating
3. Automated revenue distribution (buy-back & burn)
4. Optional: Staking program for advanced features

**Token**: CLARP (`GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS`)
**Chain**: Solana Mainnet
**DEX**: Bags.fm (Meteora DBC)

---

## Current State

### Completed
- [x] Wallet adapter setup (Phantom, Solflare)
- [x] Supabase Web3 authentication
- [x] ConnectWallet component with dropdown
- [x] Auto sign-in on wallet connect
- [x] Disconnect handling with spam prevention
- [x] Hydration-safe rendering

### Pending
- [ ] Dedicated RPC endpoint
- [ ] Token balance fetching
- [ ] Tier calculation and gating
- [ ] Rate limiting by tier
- [ ] Revenue distribution cron
- [ ] Buy-back & burn automation
- [ ] (Optional) Staking program

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLARP WALLET & TOKEN SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         FRONTEND (Next.js)                            │   │
│  │                                                                       │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                 │   │
│  │  │  Wallet     │   │   Auth      │   │   Token     │                 │   │
│  │  │  Provider   │──▶│  Context    │──▶│   Gate      │                 │   │
│  │  │  (Solana)   │   │ (Supabase)  │   │  (Balance)  │                 │   │
│  │  └─────────────┘   └─────────────┘   └──────┬──────┘                 │   │
│  │                                              │                        │   │
│  │                                              ▼                        │   │
│  │  ┌───────────────────────────────────────────────────────────────┐   │   │
│  │  │                    ConnectWallet Component                     │   │   │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │   │   │
│  │  │  │ Connect │  │ Balance │  │  Tier   │  │ Upgrade Prompt  │   │   │   │
│  │  │  │ Button  │  │ Display │  │  Badge  │  │ (if applicable) │   │   │   │
│  │  │  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘   │   │   │
│  │  └───────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                          BACKEND (API Routes)                         │   │
│  │                                                                       │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                 │   │
│  │  │  /api/user  │   │ /api/xintel │   │ /api/cron   │                 │   │
│  │  │   /tier     │   │   /scan     │   │ /distribute │                 │   │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                 │   │
│  │         │                 │                 │                         │   │
│  │         ▼                 ▼                 ▼                         │   │
│  │  ┌─────────────────────────────────────────────────────────────┐     │   │
│  │  │                      Solana RPC                              │     │   │
│  │  │  • Token balance queries                                     │     │   │
│  │  │  • Jupiter swaps (for buy-back)                             │     │   │
│  │  │  • Token burns                                               │     │   │
│  │  └─────────────────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         DATABASE (Supabase)                           │   │
│  │                                                                       │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                 │   │
│  │  │   users     │   │ scan_usage  │   │  revenue_   │                 │   │
│  │  │  (wallet,   │   │  (limits,   │   │distributions│                 │   │
│  │  │   tier)     │   │   counts)   │   │  (logs)     │                 │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      AUTOMATED FLYWHEEL (Cron)                        │   │
│  │                                                                       │   │
│  │  Bags.fm Trading ──▶ 1% Creator Fee ──▶ Daily Distribution           │   │
│  │                                              │                        │   │
│  │                           ┌──────────────────┼──────────────────┐     │   │
│  │                           ▼                  ▼                  ▼     │   │
│  │                     ┌──────────┐      ┌──────────┐      ┌──────────┐ │   │
│  │                     │   50%    │      │   30%    │      │   20%    │ │   │
│  │                     │  PROFIT  │      │   OPS    │      │   BURN   │ │   │
│  │                     └──────────┘      └──────────┘      └──────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Infrastructure Fixes (Priority: High)

### 1.1 Dedicated RPC Endpoint

**Problem**: Using rate-limited public RPC
**Solution**: Add Helius/QuickNode RPC

**File**: `contexts/WalletProvider.tsx`

```typescript
'use client';

import { useMemo, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  // Use dedicated RPC for production, fallback to public
  const endpoint = useMemo(() => {
    const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (customRpc) return customRpc;
    console.warn('[Wallet] Using public RPC - consider adding NEXT_PUBLIC_SOLANA_RPC_URL');
    return clusterApiUrl('mainnet-beta');
  }, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
```

**Environment Variable**:
```env
# .env.local
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

**RPC Provider Options**:
| Provider | Free Tier | Cost |
|----------|-----------|------|
| Helius | 100K req/mo | $0 |
| QuickNode | 10M credits | $0 |
| Alchemy | 300M CU/mo | $0 |
| Triton | 50K req/mo | $0 |

---

### 1.2 Server-Side RPC Connection

**File**: `lib/solana/connection.ts`

```typescript
import { Connection, clusterApiUrl } from '@solana/web3.js';

let connectionInstance: Connection | null = null;

export function getConnection(): Connection {
  if (!connectionInstance) {
    const rpcUrl = process.env.SOLANA_RPC_URL ||
                   process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
                   clusterApiUrl('mainnet-beta');

    connectionInstance = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return connectionInstance;
}
```

---

## Phase 2: Token Gate Implementation (Priority: High)

### 2.1 Token Balance Hook

**File**: `hooks/useTokenBalance.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';

const CLARP_MINT = new PublicKey('GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS');
const CLARP_DECIMALS = 6;

export interface TokenBalanceState {
  balance: number | null;
  balanceRaw: bigint | null;
  balanceFormatted: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTokenBalance(): TokenBalanceState {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceRaw, setBalanceRaw] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(null);
      setBalanceRaw(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ata = await getAssociatedTokenAddress(CLARP_MINT, publicKey);
      const account = await getAccount(connection, ata);

      const rawBalance = account.amount;
      const formattedBalance = Number(rawBalance) / Math.pow(10, CLARP_DECIMALS);

      setBalanceRaw(rawBalance);
      setBalance(formattedBalance);
    } catch (err) {
      if (err instanceof TokenAccountNotFoundError) {
        // User has no CLARP token account = 0 balance
        setBalance(0);
        setBalanceRaw(BigInt(0));
      } else {
        console.error('[useTokenBalance] Error:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey, connected]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh every 30 seconds when connected
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [connected, fetchBalance]);

  return {
    balance,
    balanceRaw,
    balanceFormatted: balance !== null ? balance.toLocaleString() : '—',
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
```

### 2.2 Tier Calculation Hook

**File**: `hooks/useUserTier.ts`

```typescript
'use client';

import { useMemo } from 'react';
import { useTokenBalance } from './useTokenBalance';

export const TIER_THRESHOLDS = {
  free: 0,
  holder: 1_000,        // 1K CLARP
  power: 10_000,        // 10K CLARP
  whale: 100_000,       // 100K CLARP
} as const;

export type Tier = keyof typeof TIER_THRESHOLDS;

export interface TierInfo {
  tier: Tier;
  balance: number;
  balanceFormatted: string;
  nextTier: Tier | null;
  tokensToNextTier: number | null;
  percentToNextTier: number;
  isLoading: boolean;
}

export interface TierLimits {
  dailyScans: number;
  freshScansAllowed: boolean;
  priorityQueue: boolean;
  apiAccess: boolean;
  bulkScans: boolean;
  exportReports: boolean;
  historyDays: number;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    dailyScans: 3,
    freshScansAllowed: false,
    priorityQueue: false,
    apiAccess: false,
    bulkScans: false,
    exportReports: false,
    historyDays: 7,
  },
  holder: {
    dailyScans: 10,
    freshScansAllowed: true,
    priorityQueue: false,
    apiAccess: false,
    bulkScans: false,
    exportReports: true,
    historyDays: 30,
  },
  power: {
    dailyScans: Infinity,
    freshScansAllowed: true,
    priorityQueue: false,
    apiAccess: true,
    bulkScans: false,
    exportReports: true,
    historyDays: 90,
  },
  whale: {
    dailyScans: Infinity,
    freshScansAllowed: true,
    priorityQueue: true,
    apiAccess: true,
    bulkScans: true,
    exportReports: true,
    historyDays: Infinity,
  },
};

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
      percentToNextTier = Math.min(100, Math.max(0, (progress / range) * 100));
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
```

### 2.3 Server-Side Tier Check

**File**: `lib/solana/token-gate.ts`

```typescript
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { getConnection } from './connection';

const CLARP_MINT = new PublicKey('GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS');
const CLARP_DECIMALS = 6;

export const TIER_THRESHOLDS = {
  free: 0,
  holder: 1_000,
  power: 10_000,
  whale: 100_000,
} as const;

export type Tier = keyof typeof TIER_THRESHOLDS;

export async function getWalletBalance(wallet: string): Promise<number> {
  const connection = getConnection();
  const walletPubkey = new PublicKey(wallet);

  try {
    const ata = await getAssociatedTokenAddress(CLARP_MINT, walletPubkey);
    const account = await getAccount(connection, ata);
    return Number(account.amount) / Math.pow(10, CLARP_DECIMALS);
  } catch {
    return 0;
  }
}

export function computeTier(balance: number): Tier {
  if (balance >= TIER_THRESHOLDS.whale) return 'whale';
  if (balance >= TIER_THRESHOLDS.power) return 'power';
  if (balance >= TIER_THRESHOLDS.holder) return 'holder';
  return 'free';
}

export async function getUserTier(wallet: string): Promise<{
  tier: Tier;
  balance: number;
}> {
  const balance = await getWalletBalance(wallet);
  const tier = computeTier(balance);
  return { tier, balance };
}
```

---

## Phase 3: UI Components (Priority: High)

### 3.1 Tier Badge Component

**File**: `components/TierBadge.tsx`

```typescript
'use client';

import { Tier } from '@/hooks/useUserTier';

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string; icon: string }> = {
  free: {
    label: 'Free',
    color: 'text-gray-400',
    bg: 'bg-gray-500/20 border-gray-500/30',
    icon: '👤'
  },
  holder: {
    label: 'Holder',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20 border-blue-500/30',
    icon: '⭐'
  },
  power: {
    label: 'Power',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20 border-purple-500/30',
    icon: '💎'
  },
  whale: {
    label: 'Whale',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20 border-amber-500/30',
    icon: '🐋'
  },
};

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
  showLabel = true
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
```

### 3.2 Balance Display Component

**File**: `components/BalanceDisplay.tsx`

```typescript
'use client';

import { useTokenBalance } from '@/hooks/useTokenBalance';
import { RefreshCw } from 'lucide-react';

interface BalanceDisplayProps {
  compact?: boolean;
}

export function BalanceDisplay({ compact = false }: BalanceDisplayProps) {
  const { balance, balanceFormatted, isLoading, refetch } = useTokenBalance();

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
        <p className="font-mono text-[10px] text-ivory-light/40">CLARP BALANCE</p>
        <p className="font-mono text-sm text-larp-green font-bold">
          {isLoading ? '...' : balanceFormatted}
        </p>
      </div>
      <button
        onClick={() => refetch()}
        disabled={isLoading}
        className="p-1 text-ivory-light/40 hover:text-ivory-light transition-colors disabled:opacity-50"
        title="Refresh balance"
      >
        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
```

### 3.3 Upgrade Prompt Component

**File**: `components/UpgradePrompt.tsx`

```typescript
'use client';

import { useUserTier, TIER_THRESHOLDS, Tier } from '@/hooks/useUserTier';
import { TierBadge } from './TierBadge';
import { ExternalLink } from 'lucide-react';

interface UpgradePromptProps {
  requiredTier?: Tier;
  feature?: string;
  compact?: boolean;
}

const BAGS_FM_URL = 'https://bags.fm/token/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS';

export function UpgradePrompt({
  requiredTier,
  feature,
  compact = false
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
  if (!nextTier) return null;

  const targetTier = requiredTier || nextTier;
  const tokensNeeded = requiredTier
    ? TIER_THRESHOLDS[requiredTier]
    : tokensToNextTier;

  if (compact) {
    return (
      <a
        href={BAGS_FM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-mono text-purple-400 hover:text-purple-300 transition-colors"
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
        <div className="flex-1">
          <p className="text-sm text-ivory-light/70">
            {feature ? `${feature} requires` : 'Upgrade to unlock more features'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <TierBadge tier={targetTier} />
            <span className="text-xs font-mono text-ivory-light/50">
              {tokensNeeded?.toLocaleString()} CLARP needed
            </span>
          </div>

          {/* Progress bar */}
          {!requiredTier && (
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
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-mono font-bold rounded transition-colors"
        >
          <span>BUY CLARP</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
```

### 3.4 Updated ConnectWallet Component

**File**: `components/ConnectWallet.tsx` (additions)

```typescript
// Add to existing ConnectWallet.tsx

import { useUserTier } from '@/hooks/useUserTier';
import { TierBadge } from './TierBadge';
import { BalanceDisplay } from './BalanceDisplay';

// Inside the connected state dropdown, add:

{/* Balance and Tier */}
<div className="p-3 border-b border-ivory-light/10">
  <div className="flex items-center justify-between">
    <BalanceDisplay />
    <TierBadge tier={tierInfo.tier} size="sm" />
  </div>
</div>
```

---

## Phase 4: Rate Limiting (Priority: High)

### 4.1 Database Schema

**File**: `supabase/migrations/004_token_gate.sql`

```sql
-- Scan usage tracking for rate limiting
CREATE TABLE IF NOT EXISTS scan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT,  -- NULL for anonymous users
  ip_hash TEXT, -- Hashed IP for anonymous rate limiting
  handle TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient daily count queries
CREATE INDEX idx_scan_usage_wallet_date
ON scan_usage (wallet, created_at);

CREATE INDEX idx_scan_usage_ip_date
ON scan_usage (ip_hash, created_at);

-- User tier cache (reduces RPC calls)
CREATE TABLE IF NOT EXISTS user_tier_cache (
  wallet TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  balance BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE scan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tier_cache ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON scan_usage
  FOR ALL USING (true);

CREATE POLICY "Service role full access" ON user_tier_cache
  FOR ALL USING (true);
```

### 4.2 Rate Limiter Service

**File**: `lib/services/rate-limiter.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { getUserTier, Tier } from '@/lib/solana/token-gate';
import { TIER_LIMITS } from '@/hooks/useUserTier';
import crypto from 'crypto';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  tier: Tier;
  reason?: string;
}

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.IP_HASH_SALT || 'clarp').digest('hex').slice(0, 16);
}

function getStartOfDay(): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function getEndOfDay(): Date {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

export async function checkRateLimit(
  wallet: string | null,
  ip: string
): Promise<RateLimitResult> {
  const supabase = await createClient();

  // Get user tier
  let tier: Tier = 'free';
  if (wallet) {
    const tierInfo = await getUserTier(wallet);
    tier = tierInfo.tier;
  }

  const limits = TIER_LIMITS[tier];

  // Unlimited tiers always pass
  if (limits.dailyScans === Infinity) {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
      resetAt: getEndOfDay(),
      tier,
    };
  }

  // Count today's scans
  const startOfDay = getStartOfDay();
  const identifier = wallet || hashIP(ip);
  const identifierColumn = wallet ? 'wallet' : 'ip_hash';

  const { count, error } = await supabase
    .from('scan_usage')
    .select('*', { count: 'exact', head: true })
    .eq(identifierColumn, identifier)
    .gte('created_at', startOfDay.toISOString());

  if (error) {
    console.error('[RateLimiter] Error:', error);
    // Fail open - allow the request but log the error
    return {
      allowed: true,
      remaining: limits.dailyScans,
      limit: limits.dailyScans,
      resetAt: getEndOfDay(),
      tier,
      reason: 'Rate limit check failed, allowing request',
    };
  }

  const used = count || 0;
  const remaining = Math.max(0, limits.dailyScans - used);

  return {
    allowed: remaining > 0,
    remaining,
    limit: limits.dailyScans,
    resetAt: getEndOfDay(),
    tier,
    reason: remaining === 0 ? `Daily limit of ${limits.dailyScans} scans reached` : undefined,
  };
}

export async function recordScanUsage(
  wallet: string | null,
  ip: string,
  handle: string,
  tier: Tier,
  cached: boolean
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('scan_usage').insert({
    wallet,
    ip_hash: wallet ? null : hashIP(ip),
    handle,
    tier,
    cached,
  });
}
```

### 4.3 Update Scan API Route

**File**: `app/api/xintel/scan/route.ts` (modifications)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, recordScanUsage } from '@/lib/services/rate-limiter';
import { TIER_LIMITS } from '@/hooks/useUserTier';

export async function POST(req: NextRequest) {
  const { handle, wallet, force } = await req.json();

  // Get client IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // Check rate limit
  const rateLimit = await checkRateLimit(wallet, ip);

  if (!rateLimit.allowed) {
    return NextResponse.json({
      error: 'Rate limit exceeded',
      tier: rateLimit.tier,
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt.toISOString(),
      upgrade: rateLimit.tier !== 'whale',
    }, { status: 429 });
  }

  const limits = TIER_LIMITS[rateLimit.tier];

  // Check if fresh scan is allowed
  if (force && !limits.freshScansAllowed) {
    // Check for cached version
    const cached = await getCachedReport(handle);
    if (cached) {
      await recordScanUsage(wallet, ip, handle, rateLimit.tier, true);
      return NextResponse.json({
        report: cached,
        cached: true,
        tier: rateLimit.tier,
        remaining: rateLimit.remaining - 1,
        message: 'Fresh scans require Holder tier. Showing cached report.',
      });
    }
  }

  // Proceed with scan...
  // ... existing scan logic ...

  // Record usage after successful scan
  await recordScanUsage(wallet, ip, handle, rateLimit.tier, false);

  return NextResponse.json({
    report: result,
    cached: false,
    tier: rateLimit.tier,
    remaining: rateLimit.remaining - 1,
  });
}
```

---

## Phase 5: Revenue Distribution (Priority: Medium)

### 5.1 Configuration

**File**: `lib/config/tokenomics.ts`

```typescript
import { PublicKey } from '@solana/web3.js';

export const CLARP_MINT = new PublicKey('GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS');

export const WALLETS = {
  // Where Bags.fm creator fees accumulate
  creator: new PublicKey(process.env.CREATOR_WALLET_PUBKEY!),
  // Your personal profit wallet
  profit: new PublicKey(process.env.PROFIT_WALLET_PUBKEY!),
  // Operations treasury for API costs
  operations: new PublicKey(process.env.OPS_WALLET_PUBKEY!),
};

export const REVENUE_SPLIT = {
  profit: 0.50,      // 50% to your wallet
  operations: 0.30,  // 30% to ops treasury
  burn: 0.20,        // 20% buy & burn
};

// Minimum SOL balance to trigger distribution
export const MIN_DISTRIBUTION_SOL = 0.1;
```

### 5.2 Jupiter Swap Service

**File**: `lib/solana/jupiter.ts`

```typescript
import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
}

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
}

export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 100
): Promise<SwapQuote> {
  const response = await fetch(
    `${JUPITER_API}/quote?` +
    `inputMint=${inputMint}&` +
    `outputMint=${outputMint}&` +
    `amount=${amount}&` +
    `slippageBps=${slippageBps}`
  );

  if (!response.ok) {
    throw new Error(`Jupiter quote failed: ${response.statusText}`);
  }

  return response.json();
}

export async function executeSwap(
  connection: Connection,
  payer: Keypair,
  quote: SwapQuote
): Promise<SwapResult> {
  // Get swap transaction
  const swapResponse = await fetch(`${JUPITER_API}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: payer.publicKey.toString(),
      wrapAndUnwrapSol: true,
    }),
  });

  if (!swapResponse.ok) {
    throw new Error(`Jupiter swap failed: ${swapResponse.statusText}`);
  }

  const { swapTransaction } = await swapResponse.json();

  // Deserialize and sign
  const txBuf = Buffer.from(swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([payer]);

  // Send and confirm
  const signature = await connection.sendTransaction(tx, {
    maxRetries: 3,
  });

  await connection.confirmTransaction(signature, 'confirmed');

  return {
    signature,
    inputAmount: parseInt(quote.inAmount),
    outputAmount: parseInt(quote.outAmount),
  };
}

export async function swapSolToClarp(
  connection: Connection,
  payer: Keypair,
  lamports: number,
  clarpMint: string
): Promise<SwapResult> {
  const quote = await getSwapQuote(SOL_MINT, clarpMint, lamports);
  return executeSwap(connection, payer, quote);
}
```

### 5.3 Burn Service

**File**: `lib/solana/burn.ts`

```typescript
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { CLARP_MINT } from '@/lib/config/tokenomics';

export interface BurnResult {
  signature: string;
  amount: number;
}

export async function burnClarp(
  connection: Connection,
  payer: Keypair,
  amount: number
): Promise<BurnResult> {
  const ata = await getAssociatedTokenAddress(CLARP_MINT, payer.publicKey);

  const tx = new Transaction().add(
    createBurnInstruction(
      ata,
      CLARP_MINT,
      payer.publicKey,
      BigInt(amount)
    )
  );

  const signature = await connection.sendTransaction(tx, [payer]);
  await connection.confirmTransaction(signature, 'confirmed');

  return { signature, amount };
}
```

### 5.4 Distribution Cron

**File**: `app/api/cron/distribute/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { WALLETS, REVENUE_SPLIT, MIN_DISTRIBUTION_SOL, CLARP_MINT } from '@/lib/config/tokenomics';
import { swapSolToClarp } from '@/lib/solana/jupiter';
import { burnClarp } from '@/lib/solana/burn';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connection = new Connection(process.env.SOLANA_RPC_URL!);

  try {
    // Check creator wallet balance
    const balance = await connection.getBalance(WALLETS.creator);
    const balanceSOL = balance / LAMPORTS_PER_SOL;

    console.log(`[Distribute] Creator balance: ${balanceSOL} SOL`);

    if (balanceSOL < MIN_DISTRIBUTION_SOL) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Balance ${balanceSOL.toFixed(4)} SOL below minimum ${MIN_DISTRIBUTION_SOL} SOL`,
      });
    }

    // Load keypair
    const creatorKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.CREATOR_WALLET_PRIVATE_KEY!)
    );

    // Calculate distributions (leave 0.01 SOL for rent)
    const distributable = balance - (0.01 * LAMPORTS_PER_SOL);

    const amounts = {
      profit: Math.floor(distributable * REVENUE_SPLIT.profit),
      operations: Math.floor(distributable * REVENUE_SPLIT.operations),
      burn: Math.floor(distributable * REVENUE_SPLIT.burn),
    };

    // Build distribution transaction
    const tx = new Transaction();

    tx.add(SystemProgram.transfer({
      fromPubkey: WALLETS.creator,
      toPubkey: WALLETS.profit,
      lamports: amounts.profit,
    }));

    tx.add(SystemProgram.transfer({
      fromPubkey: WALLETS.creator,
      toPubkey: WALLETS.operations,
      lamports: amounts.operations,
    }));

    // Send distribution
    const distSig = await connection.sendTransaction(tx, [creatorKeypair]);
    await connection.confirmTransaction(distSig, 'confirmed');

    console.log(`[Distribute] Distribution tx: ${distSig}`);

    // Execute buy & burn
    let burnResult = { signature: '', amount: 0, clarpBurned: 0 };

    try {
      // Swap SOL to CLARP
      const swapResult = await swapSolToClarp(
        connection,
        creatorKeypair,
        amounts.burn,
        CLARP_MINT.toString()
      );

      // Burn the CLARP
      const burn = await burnClarp(
        connection,
        creatorKeypair,
        swapResult.outputAmount
      );

      burnResult = {
        signature: burn.signature,
        amount: amounts.burn,
        clarpBurned: swapResult.outputAmount,
      };

      console.log(`[Distribute] Burned ${swapResult.outputAmount} CLARP`);
    } catch (err) {
      console.error('[Distribute] Burn failed:', err);
      // Continue even if burn fails - distribution already happened
    }

    // Log to database
    const supabase = await createClient();
    await supabase.from('revenue_distributions').insert({
      total_sol: balanceSOL,
      profit_sol: amounts.profit / LAMPORTS_PER_SOL,
      operations_sol: amounts.operations / LAMPORTS_PER_SOL,
      burn_sol: amounts.burn / LAMPORTS_PER_SOL,
      distribution_tx: distSig,
      burn_tx: burnResult.signature || null,
      clarp_burned: burnResult.clarpBurned || null,
    });

    return NextResponse.json({
      success: true,
      distributed: {
        totalSOL: balanceSOL,
        profit: amounts.profit / LAMPORTS_PER_SOL,
        operations: amounts.operations / LAMPORTS_PER_SOL,
        burn: amounts.burn / LAMPORTS_PER_SOL,
      },
      burn: burnResult.clarpBurned > 0 ? {
        clarpBurned: burnResult.clarpBurned,
        signature: burnResult.signature,
      } : null,
      transactions: {
        distribution: distSig,
        burn: burnResult.signature || null,
      },
    });

  } catch (error) {
    console.error('[Distribute] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

### 5.5 Vercel Cron Configuration

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/distribute",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## Phase 6: (Optional) Staking Program

> Full staking program implementation is documented in [ADR 002](../adr/002-clarp-staking-program.md).
> This is a future enhancement for advanced token utility.

### Summary

The staking program would add:
- Lock-up periods for enhanced rewards
- Tier multipliers for stakers
- On-chain tier verification
- Permissionless reward distribution

**Estimated effort**: 2-3 weeks
**Prerequisite**: Phases 1-5 complete and stable

---

## Environment Variables

```env
# .env.local

# Solana RPC (get free key from Helius/QuickNode)
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx

# Wallet addresses (public keys)
CREATOR_WALLET_PUBKEY=xxx
PROFIT_WALLET_PUBKEY=xxx
OPS_WALLET_PUBKEY=xxx

# Creator wallet private key (base58, for cron distribution)
CREATOR_WALLET_PRIVATE_KEY=xxx

# Cron authentication
CRON_SECRET=xxx

# Rate limiting
IP_HASH_SALT=xxx

# Existing Supabase vars...
```

---

## Database Migrations

Run in order:
1. `004_token_gate.sql` - Scan usage and tier cache tables
2. `005_revenue_distributions.sql` - Distribution logs

**File**: `supabase/migrations/005_revenue_distributions.sql`

```sql
-- Revenue distribution logs
CREATE TABLE IF NOT EXISTS revenue_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_sol DECIMAL(18, 9) NOT NULL,
  profit_sol DECIMAL(18, 9) NOT NULL,
  operations_sol DECIMAL(18, 9) NOT NULL,
  burn_sol DECIMAL(18, 9) NOT NULL,
  distribution_tx TEXT NOT NULL,
  burn_tx TEXT,
  clarp_burned BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Burn history for analytics
CREATE TABLE IF NOT EXISTS burn_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount BIGINT NOT NULL,
  sol_value DECIMAL(18, 9) NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE revenue_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE burn_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON revenue_distributions FOR ALL USING (true);
CREATE POLICY "Service role only" ON burn_history FOR ALL USING (true);
```

---

## Testing Checklist

### Phase 1: Infrastructure
- [ ] Dedicated RPC endpoint configured
- [ ] Connection works on client and server
- [ ] No rate limit errors

### Phase 2: Token Gate
- [ ] Balance fetches correctly
- [ ] Tier calculates correctly
- [ ] Server-side tier check works

### Phase 3: UI
- [ ] TierBadge displays all tiers
- [ ] BalanceDisplay shows correct balance
- [ ] UpgradePrompt shows for non-whale
- [ ] ConnectWallet shows tier and balance

### Phase 4: Rate Limiting
- [ ] Free users limited to 3 scans/day
- [ ] Holders limited to 10 scans/day
- [ ] Power/Whale unlimited
- [ ] Anonymous users rate limited by IP
- [ ] Rate limit resets at midnight UTC

### Phase 5: Revenue Distribution
- [ ] Cron triggers daily
- [ ] SOL distributed correctly
- [ ] Jupiter swap executes
- [ ] CLARP burned
- [ ] Logs saved to database

---

## Deployment Sequence

1. **Environment**: Add all new env vars to Vercel
2. **Database**: Run migrations 004, 005
3. **Phase 1**: Deploy RPC fix
4. **Phase 2-3**: Deploy token gate + UI
5. **Phase 4**: Deploy rate limiting
6. **Phase 5**: Deploy distribution cron
7. **Monitor**: Watch first distribution cycle
8. **Verify**: Check burn transactions on Solscan

---

## Success Metrics

| Metric | Target (30 days) |
|--------|------------------|
| Unique wallets connected | 500+ |
| Holders (1K+ CLARP) | 100+ |
| Daily scans | 500+ |
| CLARP burned | 1M+ tokens |
| Revenue distributed | $5,000+ |
| Profit taken | $2,500+ |

---

## File Manifest

### New Files
```
lib/solana/
├── connection.ts
├── token-gate.ts
├── jupiter.ts
└── burn.ts

lib/config/
└── tokenomics.ts

lib/services/
└── rate-limiter.ts

hooks/
├── useTokenBalance.ts
└── useUserTier.ts

components/
├── TierBadge.tsx
├── BalanceDisplay.tsx
└── UpgradePrompt.tsx

app/api/cron/
└── distribute/route.ts

supabase/migrations/
├── 004_token_gate.sql
└── 005_revenue_distributions.sql
```

### Modified Files
```
contexts/WalletProvider.tsx  (RPC endpoint)
components/ConnectWallet.tsx (tier + balance)
app/api/xintel/scan/route.ts (rate limiting)
vercel.json (cron config)
```
