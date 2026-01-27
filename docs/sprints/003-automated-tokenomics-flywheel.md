# Sprint 003: Automated Tokenomics Flywheel

## Overview

**Goal**: Implement a fully automated, zero-touch tokenomics system that:
1. Gates premium features behind CLARP token holdings
2. Auto-distributes creator revenue (profit, burns, rewards)
3. Creates sustainable deflationary pressure
4. Generates passive income for the operator

**Token**: CLARP (`GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS`)
**DEX**: Bags.fm (Meteora DBC)
**Revenue Source**: 1% creator fee on all trading volume

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLARP AUTOMATED FLYWHEEL                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────┐                                                         │
│  │  Bags.fm   │                                                         │
│  │  Trading   │                                                         │
│  └─────┬──────┘                                                         │
│        │ 1% creator fee (automatic)                                     │
│        ▼                                                                │
│  ┌─────────────────┐                                                    │
│  │ Creator Wallet  │ ◄── SOL accumulates here automatically             │
│  │ (Revenue Pool)  │                                                    │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           │ Daily cron (Vercel)                                         │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │                    REVENUE DISTRIBUTOR                       │        │
│  │  ┌──────────┬──────────┬──────────┬──────────┐              │        │
│  │  │   50%    │   30%    │   15%    │    5%    │              │        │
│  │  │  PROFIT  │   OPS    │   BURN   │ REWARDS  │              │        │
│  │  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘              │        │
│  └───────┼──────────┼──────────┼──────────┼────────────────────┘        │
│          │          │          │          │                             │
│          ▼          ▼          ▼          ▼                             │
│  ┌───────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐                       │
│  │  Owner    │ │   Ops   │ │ Jupiter│ │ Rewards │                       │
│  │  Wallet   │ │ Treasury│ │ Swap → │ │  Pool   │                       │
│  │  (SOL)    │ │  (SOL)  │ │ Burn   │ │ (CLARP) │                       │
│  └───────────┘ └─────────┘ └────────┘ └─────────┘                       │
│                                                                         │
│  ════════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌────────────┐      ┌─────────────┐      ┌─────────────┐               │
│  │   User     │ ───▶ │  Connect    │ ───▶ │  Check Tier │               │
│  │  Wallet    │      │   Wallet    │      │  (Balance)  │               │
│  └────────────┘      └─────────────┘      └──────┬──────┘               │
│                                                  │                      │
│                    ┌─────────────────────────────┼─────────────────┐    │
│                    ▼              ▼              ▼              ▼       │
│              ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│              │   FREE   │  │  HOLDER  │  │  POWER   │  │  WHALE   │    │
│              │  0 CLARP │  │ 1K CLARP │  │10K CLARP │  │100K CLARP│    │
│              │ 3 cached │  │ 10 scans │  │ Unlimited│  │ Priority │    │
│              └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Revenue Split Configuration

| Allocation | Percentage | Purpose | Destination |
|------------|------------|---------|-------------|
| **Profit** | 50% | Operator income | Owner wallet (SOL) |
| **Operations** | 30% | API costs, hosting | Ops treasury (SOL) |
| **Burn** | 15% | Buy CLARP & burn | Burn address |
| **Rewards** | 5% | Future staking rewards | Rewards pool (CLARP) |

### Projected Revenue (at current ~$50K daily volume)

| Metric | Daily | Monthly | Yearly |
|--------|-------|---------|--------|
| Trading Volume | $50,000 | $1.5M | $18M |
| Creator Fee (1%) | $500 | $15,000 | $180,000 |
| **Your Profit (50%)** | **$250** | **$7,500** | **$90,000** |
| Operations (30%) | $150 | $4,500 | $54,000 |
| Burn Value (15%) | $75 | $2,250 | $27,000 |
| Rewards (5%) | $25 | $750 | $9,000 |

---

## Tier System

### Thresholds

```typescript
export const TIER_THRESHOLDS = {
  free: 0,
  holder: 1_000,      // 1K CLARP
  power: 10_000,      // 10K CLARP
  whale: 100_000,     // 100K CLARP
} as const;
```

### Benefits Matrix

| Feature | Free | Holder | Power | Whale |
|---------|------|--------|-------|-------|
| Daily scan limit | 3 | 10 | Unlimited | Unlimited |
| Cached reports | Yes | Yes | Yes | Yes |
| Fresh scans | No | Yes | Yes | Yes |
| Priority queue | No | No | No | Yes |
| API access | No | No | Yes | Yes |
| Bulk scans | No | No | No | Yes |
| Export reports | No | Yes | Yes | Yes |
| Historical data | 7 days | 30 days | 90 days | Unlimited |

---

## Implementation Tasks

### Phase 1: Token Gate (Priority: High)

#### 1.1 Token Balance Checker

**File**: `lib/solana/token-gate.ts`

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

const CLARP_MINT = new PublicKey('GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS');
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export const TIER_THRESHOLDS = {
  free: 0,
  holder: 1_000 * 1e6,      // 1K CLARP (6 decimals)
  power: 10_000 * 1e6,      // 10K CLARP
  whale: 100_000 * 1e6,     // 100K CLARP
} as const;

export type Tier = keyof typeof TIER_THRESHOLDS;

export interface TierInfo {
  tier: Tier;
  balance: number;
  balanceFormatted: string;
  nextTier: Tier | null;
  tokensToNextTier: number | null;
}

export async function getTokenBalance(wallet: string): Promise<number> {
  const connection = new Connection(SOLANA_RPC);
  const walletPubkey = new PublicKey(wallet);

  try {
    const ata = await getAssociatedTokenAddress(CLARP_MINT, walletPubkey);
    const account = await getAccount(connection, ata);
    return Number(account.amount);
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

export async function getUserTierInfo(wallet: string): Promise<TierInfo> {
  const balance = await getTokenBalance(wallet);
  const tier = computeTier(balance);

  const tiers: Tier[] = ['free', 'holder', 'power', 'whale'];
  const currentIndex = tiers.indexOf(tier);
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  const tokensToNextTier = nextTier
    ? (TIER_THRESHOLDS[nextTier] - balance) / 1e6
    : null;

  return {
    tier,
    balance,
    balanceFormatted: (balance / 1e6).toLocaleString(),
    nextTier,
    tokensToNextTier: tokensToNextTier ? Math.ceil(tokensToNextTier) : null,
  };
}
```

#### 1.2 Tier Limits Configuration

**File**: `lib/solana/tier-limits.ts`

```typescript
import { Tier } from './token-gate';

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
```

#### 1.3 Scan Rate Limiter

**File**: `lib/solana/rate-limiter.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { Tier } from './token-gate';
import { TIER_LIMITS } from './tier-limits';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  tier: Tier;
  reason?: string;
}

export async function checkScanRateLimit(
  wallet: string | null,
  tier: Tier
): Promise<RateLimitResult> {
  const supabase = await createClient();
  const limits = TIER_LIMITS[tier];

  // Unlimited tiers always pass
  if (limits.dailyScans === Infinity) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: getEndOfDay(),
      tier,
    };
  }

  // Get today's scan count
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const identifier = wallet || 'anonymous';

  const { count } = await supabase
    .from('scan_usage')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .gte('created_at', startOfDay.toISOString());

  const used = count || 0;
  const remaining = Math.max(0, limits.dailyScans - used);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt: getEndOfDay(),
    tier,
    reason: remaining === 0 ? `Daily limit of ${limits.dailyScans} scans reached` : undefined,
  };
}

export async function recordScanUsage(
  wallet: string | null,
  handle: string
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('scan_usage').insert({
    identifier: wallet || 'anonymous',
    handle,
    created_at: new Date().toISOString(),
  });
}

function getEndOfDay(): Date {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
}
```

#### 1.4 Update Scan API Route

**File**: `app/api/xintel/scan/route.ts` (modifications)

```typescript
import { getUserTierInfo } from '@/lib/solana/token-gate';
import { TIER_LIMITS } from '@/lib/solana/tier-limits';
import { checkScanRateLimit, recordScanUsage } from '@/lib/solana/rate-limiter';

export async function POST(req: Request) {
  const { handle, wallet, force } = await req.json();

  // Get user tier
  const tierInfo = wallet
    ? await getUserTierInfo(wallet)
    : { tier: 'free' as const, balance: 0 };

  const limits = TIER_LIMITS[tierInfo.tier];

  // Check rate limit
  const rateLimit = await checkScanRateLimit(wallet, tierInfo.tier);
  if (!rateLimit.allowed) {
    return Response.json({
      error: 'Rate limit exceeded',
      ...rateLimit,
      upgrade: {
        nextTier: tierInfo.nextTier,
        tokensNeeded: tierInfo.tokensToNextTier,
      },
    }, { status: 429 });
  }

  // Check if fresh scan is requested but not allowed
  if (force && !limits.freshScansAllowed) {
    // Return cached version instead
    const cached = await getCachedReport(handle);
    if (cached) {
      return Response.json({
        report: cached,
        cached: true,
        tier: tierInfo.tier,
        message: 'Fresh scans require Holder tier or above',
      });
    }
  }

  // Record usage
  await recordScanUsage(wallet, handle);

  // Proceed with scan...
}
```

---

### Phase 2: Revenue Distributor Cron

#### 2.1 Cron Configuration

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/distribute-revenue",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### 2.2 Distribution Endpoint

**File**: `app/api/cron/distribute-revenue/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

// Configuration
const REVENUE_SPLIT = {
  profit: 0.50,      // 50% to owner
  operations: 0.30,  // 30% to ops treasury
  burn: 0.15,        // 15% buy & burn
  rewards: 0.05,     // 5% to rewards pool
};

const WALLETS = {
  creator: new PublicKey(process.env.CREATOR_WALLET!),      // Where fees accumulate
  profit: new PublicKey(process.env.PROFIT_WALLET!),        // Your personal wallet
  operations: new PublicKey(process.env.OPS_WALLET!),       // Ops treasury
  rewards: new PublicKey(process.env.REWARDS_WALLET!),      // Rewards pool
};

const MIN_DISTRIBUTION_SOL = 0.1; // Minimum 0.1 SOL to trigger distribution

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL!);

    // Get creator wallet balance
    const balance = await connection.getBalance(WALLETS.creator);
    const balanceSOL = balance / LAMPORTS_PER_SOL;

    console.log(`[Revenue] Creator wallet balance: ${balanceSOL} SOL`);

    if (balanceSOL < MIN_DISTRIBUTION_SOL) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Balance ${balanceSOL} SOL below minimum ${MIN_DISTRIBUTION_SOL} SOL`,
      });
    }

    // Calculate distributions (leave 0.01 SOL for rent)
    const distributableLamports = balance - (0.01 * LAMPORTS_PER_SOL);

    const distributions = {
      profit: Math.floor(distributableLamports * REVENUE_SPLIT.profit),
      operations: Math.floor(distributableLamports * REVENUE_SPLIT.operations),
      burn: Math.floor(distributableLamports * REVENUE_SPLIT.burn),
      rewards: Math.floor(distributableLamports * REVENUE_SPLIT.rewards),
    };

    // Load creator wallet keypair
    const creatorKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.CREATOR_WALLET_PRIVATE_KEY!)
    );

    // Build transaction
    const tx = new Transaction();

    // Transfer to profit wallet
    tx.add(SystemProgram.transfer({
      fromPubkey: WALLETS.creator,
      toPubkey: WALLETS.profit,
      lamports: distributions.profit,
    }));

    // Transfer to operations wallet
    tx.add(SystemProgram.transfer({
      fromPubkey: WALLETS.creator,
      toPubkey: WALLETS.operations,
      lamports: distributions.operations,
    }));

    // Transfer to rewards wallet
    tx.add(SystemProgram.transfer({
      fromPubkey: WALLETS.creator,
      toPubkey: WALLETS.rewards,
      lamports: distributions.rewards,
    }));

    // Send transaction
    const signature = await connection.sendTransaction(tx, [creatorKeypair]);
    await connection.confirmTransaction(signature);

    console.log(`[Revenue] Distribution tx: ${signature}`);

    // Execute buy & burn with the burn allocation
    const burnResult = await executeBuyAndBurn(
      connection,
      creatorKeypair,
      distributions.burn
    );

    // Log to database
    await logDistribution({
      timestamp: new Date().toISOString(),
      totalSOL: balanceSOL,
      distributions: {
        profit: distributions.profit / LAMPORTS_PER_SOL,
        operations: distributions.operations / LAMPORTS_PER_SOL,
        burn: distributions.burn / LAMPORTS_PER_SOL,
        rewards: distributions.rewards / LAMPORTS_PER_SOL,
      },
      distributionTx: signature,
      burnTx: burnResult.signature,
      clarpBurned: burnResult.amount,
    });

    return NextResponse.json({
      success: true,
      distributed: {
        totalSOL: balanceSOL,
        profit: distributions.profit / LAMPORTS_PER_SOL,
        operations: distributions.operations / LAMPORTS_PER_SOL,
        burn: distributions.burn / LAMPORTS_PER_SOL,
        rewards: distributions.rewards / LAMPORTS_PER_SOL,
      },
      transactions: {
        distribution: signature,
        burn: burnResult.signature,
      },
      clarpBurned: burnResult.amount,
    });

  } catch (error) {
    console.error('[Revenue] Distribution failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function executeBuyAndBurn(
  connection: Connection,
  payer: Keypair,
  lamports: number
): Promise<{ signature: string; amount: number }> {
  // TODO: Implement Jupiter swap to CLARP and burn
  // For now, return placeholder
  return {
    signature: 'placeholder',
    amount: 0,
  };
}

async function logDistribution(data: Record<string, unknown>): Promise<void> {
  // Log to Supabase
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  await supabase.from('revenue_distributions').insert({
    ...data,
    created_at: new Date().toISOString(),
  });
}
```

#### 2.3 Jupiter Swap Integration

**File**: `lib/solana/jupiter-swap.ts`

```typescript
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const CLARP_MINT = 'GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
}

export async function swapSolToClarp(
  connection: Connection,
  payer: Keypair,
  lamports: number
): Promise<SwapResult> {
  // Get quote
  const quoteResponse = await fetch(
    `${JUPITER_API}/quote?inputMint=${SOL_MINT}&outputMint=${CLARP_MINT}&amount=${lamports}&slippageBps=100`
  );
  const quote = await quoteResponse.json();

  if (!quote || quote.error) {
    throw new Error(`Jupiter quote failed: ${quote?.error || 'Unknown error'}`);
  }

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

  const swapData = await swapResponse.json();

  if (!swapData.swapTransaction) {
    throw new Error('Failed to get swap transaction');
  }

  // Deserialize and sign transaction
  const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  transaction.sign([payer]);

  // Send transaction
  const signature = await connection.sendTransaction(transaction);
  await connection.confirmTransaction(signature);

  return {
    signature,
    inputAmount: lamports,
    outputAmount: parseInt(quote.outAmount),
  };
}
```

#### 2.4 Token Burn Function

**File**: `lib/solana/burn.ts`

```typescript
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

const CLARP_MINT = new PublicKey('GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS');

export async function burnClarp(
  connection: Connection,
  payer: Keypair,
  amount: number
): Promise<string> {
  const ata = await getAssociatedTokenAddress(CLARP_MINT, payer.publicKey);

  const tx = new Transaction().add(
    createBurnInstruction(
      ata,           // Token account to burn from
      CLARP_MINT,    // Mint
      payer.publicKey, // Owner
      amount         // Amount to burn
    )
  );

  const signature = await connection.sendTransaction(tx, [payer]);
  await connection.confirmTransaction(signature);

  return signature;
}
```

---

### Phase 3: Database Schema

#### 3.1 Supabase Migrations

**File**: `supabase/migrations/003_tokenomics.sql`

```sql
-- Scan usage tracking
CREATE TABLE IF NOT EXISTS scan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,  -- wallet address or 'anonymous'
  handle TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scan_usage_identifier_date
ON scan_usage (identifier, created_at);

-- Revenue distribution logs
CREATE TABLE IF NOT EXISTS revenue_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  total_sol DECIMAL(18, 9) NOT NULL,
  profit_sol DECIMAL(18, 9) NOT NULL,
  operations_sol DECIMAL(18, 9) NOT NULL,
  burn_sol DECIMAL(18, 9) NOT NULL,
  rewards_sol DECIMAL(18, 9) NOT NULL,
  distribution_tx TEXT NOT NULL,
  burn_tx TEXT,
  clarp_burned BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Burn history
CREATE TABLE IF NOT EXISTS burn_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount BIGINT NOT NULL,
  sol_value DECIMAL(18, 9) NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tier cache (optional, for faster lookups)
CREATE TABLE IF NOT EXISTS user_tiers (
  wallet TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  balance BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE scan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE burn_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tiers ENABLE ROW LEVEL SECURITY;

-- Admin-only access for sensitive tables
CREATE POLICY "Admin only" ON revenue_distributions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin only" ON burn_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

---

### Phase 4: Frontend Components

#### 4.1 Tier Badge Component

**File**: `components/TierBadge.tsx`

```tsx
import { Tier } from '@/lib/solana/token-gate';

const TIER_CONFIG = {
  free: { label: 'Free', color: 'bg-gray-500', icon: '👤' },
  holder: { label: 'Holder', color: 'bg-blue-500', icon: '⭐' },
  power: { label: 'Power', color: 'bg-purple-500', icon: '💎' },
  whale: { label: 'Whale', color: 'bg-amber-500', icon: '🐋' },
};

interface TierBadgeProps {
  tier: Tier;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, showIcon = true, size = 'md' }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${config.color} text-white font-medium ${sizeClasses[size]}`}>
      {showIcon && <span>{config.icon}</span>}
      {config.label}
    </span>
  );
}
```

#### 4.2 Upgrade Prompt Component

**File**: `components/UpgradePrompt.tsx`

```tsx
import { TierInfo } from '@/lib/solana/token-gate';
import { TierBadge } from './TierBadge';

interface UpgradePromptProps {
  tierInfo: TierInfo;
  reason?: string;
}

export function UpgradePrompt({ tierInfo, reason }: UpgradePromptProps) {
  if (!tierInfo.nextTier) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-300">
            {reason || 'Upgrade to unlock more features'}
          </p>
          <p className="text-lg font-bold text-white mt-1">
            Get <TierBadge tier={tierInfo.nextTier} size="sm" /> with{' '}
            <span className="text-purple-400">
              {tierInfo.tokensToNextTier?.toLocaleString()} more CLARP
            </span>
          </p>
        </div>
        <a
          href={`https://bags.fm/token/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
        >
          Buy CLARP
        </a>
      </div>
    </div>
  );
}
```

#### 4.3 Rate Limit Display

**File**: `components/RateLimitStatus.tsx`

```tsx
import { RateLimitResult } from '@/lib/solana/rate-limiter';

interface RateLimitStatusProps {
  rateLimit: RateLimitResult;
}

export function RateLimitStatus({ rateLimit }: RateLimitStatusProps) {
  const isUnlimited = rateLimit.remaining === Infinity;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span>Scans today:</span>
      {isUnlimited ? (
        <span className="text-green-400">Unlimited</span>
      ) : (
        <span className={rateLimit.remaining <= 1 ? 'text-red-400' : 'text-white'}>
          {rateLimit.remaining} remaining
        </span>
      )}
    </div>
  );
}
```

---

## Environment Variables

Add to `.env.local`:

```env
# Solana RPC
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Wallet addresses
CREATOR_WALLET=<your-creator-wallet-pubkey>
PROFIT_WALLET=<your-personal-wallet-pubkey>
OPS_WALLET=<operations-treasury-pubkey>
REWARDS_WALLET=<rewards-pool-pubkey>

# Private key for automated transactions (base58 encoded)
CREATOR_WALLET_PRIVATE_KEY=<base58-private-key>

# Cron authentication
CRON_SECRET=<random-secret-string>
```

---

## Testing Checklist

### Token Gate
- [ ] Free user gets 3 scans/day
- [ ] Holder (1K+ CLARP) gets 10 scans/day
- [ ] Power (10K+ CLARP) gets unlimited scans
- [ ] Whale (100K+ CLARP) gets priority queue
- [ ] Fresh scans blocked for free tier
- [ ] Rate limit resets at midnight UTC

### Revenue Distribution
- [ ] Cron triggers daily at midnight
- [ ] Correct split: 50/30/15/5
- [ ] Jupiter swap executes successfully
- [ ] CLARP burn transaction confirms
- [ ] Distribution logged to database

### Frontend
- [ ] Tier badge displays correctly
- [ ] Upgrade prompt shows when limited
- [ ] Rate limit status accurate
- [ ] Buy CLARP link works

---

## Deployment Sequence

1. **Database**: Run migration `003_tokenomics.sql`
2. **Environment**: Add all new env vars to Vercel
3. **Backend**: Deploy token gate + rate limiter
4. **Cron**: Deploy revenue distributor
5. **Frontend**: Deploy tier components
6. **Test**: Run full flow on mainnet with small amounts
7. **Monitor**: Watch first few distributions

---

## Success Metrics

| Metric | Target (30 days) |
|--------|------------------|
| Active holders (1K+ CLARP) | 100+ |
| Daily scans | 500+ |
| CLARP burned | 1M+ tokens |
| Revenue distributed | $5,000+ |
| Profit taken | $2,500+ |

---

## Future Enhancements

1. **Staking contract** - Lock tokens for boosted rewards
2. **Referral system** - Earn CLARP for bringing users
3. **API keys** - Per-request pricing for integrations
4. **Leaderboard** - Top scanners get rewards
5. **Governance** - Token holders vote on tier thresholds
