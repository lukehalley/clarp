# Sprint 005: Bags Hackathon

## Overview

**Goal**: Win up to $1M in grants by demonstrating deep Bags API integration
**Deadline**: 2 weeks
**Team**: Solo + Claude (AI pair programming)

**Token**: CLARP (`GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS`)
**Chain**: Solana Mainnet
**DEX**: Bags.fm (Meteora DBC)

---

## The Pitch

> CLARP is the trust infrastructure layer for the Bags ecosystem. We detect rugpulls before retail loses money—and our entire tokenomics flywheel runs on Bags infrastructure.

**Core value prop**: CLARP makes Bags the safest place to trade memecoins.

---

## Priority Features (Must Ship)

| Priority | Feature | Bags API Used | Status |
|----------|---------|---------------|--------|
| P0 | Trust scores for Bags tokens | Analytics API | [x] |
| P0 | Tokenomics dashboard (burns, fees) | Analytics + Fee Claiming | [x] |
| P1 | Embedded swap widget | Swap API | [x] |
| P1 | Bags API key setup | - | [ ] Manual |

**If time crunch**: Ship Trust scores + Dashboard. Swap widget is P1.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLARP × BAGS INTEGRATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      BAGS TOKEN SCANNER                               │   │
│  │                                                                       │   │
│  │  User pastes Bags token address                                       │   │
│  │          ↓                                                            │   │
│  │  Detect launchpad (bags_fm suffix check)                             │   │
│  │          ↓                                                            │   │
│  │  Fetch token metadata (Bags API / scrape)                            │   │
│  │          ↓                                                            │   │
│  │  Run CLARP OSINT pipeline (GitHub, X, domain, etc.)                  │   │
│  │          ↓                                                            │   │
│  │  Generate Trust Score (0-100)                                         │   │
│  │          ↓                                                            │   │
│  │  Display with evidence links                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    TOKENOMICS DASHBOARD                               │   │
│  │                                                                       │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                 │   │
│  │  │   Creator   │   │    Burn     │   │   Revenue   │                 │   │
│  │  │    Fees     │   │   History   │   │    Split    │                 │   │
│  │  │  Collected  │   │   & Total   │   │  50/30/20   │                 │   │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                 │   │
│  │         │                 │                 │                         │   │
│  │         └─────────────────┴─────────────────┘                         │   │
│  │                          │                                            │   │
│  │                          ▼                                            │   │
│  │              Bags Analytics API + On-chain Data                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    EMBEDDED SWAP WIDGET                               │   │
│  │                                                                       │   │
│  │  User needs more scans → "Buy $CLARP" button                         │   │
│  │          ↓                                                            │   │
│  │  Bags Swap API: getQuote(SOL → CLARP)                                │   │
│  │          ↓                                                            │   │
│  │  Display quote with price impact                                      │   │
│  │          ↓                                                            │   │
│  │  Bags Swap API: createSwap()                                         │   │
│  │          ↓                                                            │   │
│  │  User signs transaction                                               │   │
│  │          ↓                                                            │   │
│  │  Tier auto-upgrades on balance change                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Week 1: Core Features

### Day 1-2: Setup & API Access

#### Task 1.1: Register for Bags API

1. Go to https://dev.bags.fm
2. Create account, generate API key
3. Add to `.env.local`:

```bash
BAGS_API_KEY=your_api_key_here
BAGS_API_URL=https://public-api-v2.bags.fm/api/v1
```

#### Task 1.2: Create Bags API Client

**File**: `lib/bags/client.ts`

```typescript
/**
 * Bags API Client
 * Docs: https://docs.bags.fm
 */

const BAGS_API_URL = process.env.BAGS_API_URL || 'https://public-api-v2.bags.fm/api/v1';
const BAGS_API_KEY = process.env.BAGS_API_KEY;

interface BagsApiResponse<T> {
  success: boolean;
  response?: T;
  error?: string;
}

async function bagsRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<BagsApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(BAGS_API_KEY && { 'x-api-key': BAGS_API_KEY }),
    ...options.headers,
  };

  const response = await fetch(`${BAGS_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` };
  }

  return response.json();
}

// ============================================================================
// TOKEN INFO
// ============================================================================

export interface TokenCreator {
  address: string;
  provider?: string;
}

export async function getTokenCreator(tokenAddress: string): Promise<TokenCreator | null> {
  const result = await bagsRequest<TokenCreator>(`/token/${tokenAddress}/creator`);
  return result.success ? result.response! : null;
}

export interface LifetimeFees {
  tokenAddress: string;
  totalFees: number;
  currency: string;
}

export async function getLifetimeFees(tokenAddress: string): Promise<LifetimeFees | null> {
  const result = await bagsRequest<LifetimeFees>(`/token/${tokenAddress}/fees`);
  return result.success ? result.response! : null;
}

// ============================================================================
// SWAPS
// ============================================================================

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  slippage: number;
}

export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: string
): Promise<SwapQuote | null> {
  const result = await bagsRequest<SwapQuote>('/swap/quote', {
    method: 'POST',
    body: JSON.stringify({ inputMint, outputMint, amount }),
  });
  return result.success ? result.response! : null;
}

export interface SwapTransaction {
  transaction: string; // Base64 encoded
  blockhash: string;
}

export async function createSwapTransaction(
  quote: SwapQuote,
  userWallet: string
): Promise<SwapTransaction | null> {
  const result = await bagsRequest<SwapTransaction>('/swap/transaction', {
    method: 'POST',
    body: JSON.stringify({ ...quote, userWallet }),
  });
  return result.success ? result.response! : null;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface ClaimablePosition {
  tokenAddress: string;
  claimableAmount: number;
  currency: string;
  lastClaimed?: string;
}

export async function getClaimablePositions(wallet: string): Promise<ClaimablePosition[]> {
  const result = await bagsRequest<ClaimablePosition[]>(`/claims/${wallet}/positions`);
  return result.success ? result.response! : [];
}

export interface ClaimStats {
  totalClaimed: number;
  totalUnclaimed: number;
  currency: string;
}

export async function getClaimStats(wallet: string): Promise<ClaimStats | null> {
  const result = await bagsRequest<ClaimStats>(`/claims/${wallet}/stats`);
  return result.success ? result.response! : null;
}

// ============================================================================
// FEE SHARING
// ============================================================================

export interface FeeShareConfig {
  splits: Array<{
    wallet: string;
    share: number; // 0-1
  }>;
}

export async function configureFeeSharing(
  tokenAddress: string,
  config: FeeShareConfig
): Promise<boolean> {
  const result = await bagsRequest(`/fee-sharing/${tokenAddress}/configure`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return result.success;
}

export async function createClaimTransaction(
  wallet: string,
  tokenAddress: string
): Promise<SwapTransaction | null> {
  const result = await bagsRequest<SwapTransaction>('/claims/transaction', {
    method: 'POST',
    body: JSON.stringify({ wallet, tokenAddress }),
  });
  return result.success ? result.response! : null;
}
```

---

### Day 3-4: Trust Scores for Bags Tokens

#### Task 2.1: Bags Token Detection Enhancement

**File**: `lib/terminal/osint/launchpad-intel.ts`

Update existing `fetchBagsFmToken` to use official Bags API:

```typescript
import { getTokenCreator, getLifetimeFees } from '@/lib/bags/client';

export async function fetchBagsFmToken(tokenAddress: string): Promise<LaunchpadTokenInfo> {
  const result: LaunchpadTokenInfo = {
    address: tokenAddress,
    launchpad: 'bags_fm',
    launchpadUrl: `https://bags.fm/${tokenAddress}`,
    isAccessible: false,
    fetchedAt: new Date(),
  };

  try {
    // Use official Bags API for creator info
    const creator = await getTokenCreator(tokenAddress);
    if (creator) {
      result.creator = creator.address;
      result.isAccessible = true;
    }

    // Get lifetime fees (shows token activity)
    const fees = await getLifetimeFees(tokenAddress);
    if (fees) {
      result.lifetimeFees = fees.totalFees;
    }

    // Fall back to scraping for metadata not in API
    const scraped = await scrapeBagsFmPage(tokenAddress, result);
    return { ...result, ...scraped };

  } catch (error) {
    console.error(`[LaunchpadIntel] Error fetching Bags.fm token:`, error);
    return await scrapeBagsFmPage(tokenAddress, result);
  }
}
```

#### Task 2.2: Hybrid Scan Mode

**File**: `lib/bags/scanner.ts`

```typescript
/**
 * Bags Token Scanner
 * Hybrid mode: Auto-scan popular tokens, on-demand for others
 */

import { detectLaunchpad } from '@/lib/terminal/osint/launchpad-intel';
import { getLifetimeFees } from '@/lib/bags/client';

const VOLUME_THRESHOLD = 10000; // $10K lifetime fees = "popular"

export async function shouldAutoScan(tokenAddress: string): Promise<boolean> {
  // Only auto-scan Bags tokens
  if (detectLaunchpad(tokenAddress) !== 'bags_fm') {
    return false;
  }

  // Check if token has significant volume
  const fees = await getLifetimeFees(tokenAddress);
  if (!fees) return false;

  return fees.totalFees >= VOLUME_THRESHOLD;
}

export interface BagsTokenWithScore {
  address: string;
  name?: string;
  symbol?: string;
  trustScore?: number;
  lifetimeFees?: number;
  scannedAt?: Date;
}

// Cache for scanned Bags tokens
const scanCache = new Map<string, BagsTokenWithScore>();

export async function getBagsTokenScore(tokenAddress: string): Promise<BagsTokenWithScore | null> {
  // Check cache first (24h TTL)
  const cached = scanCache.get(tokenAddress);
  if (cached && cached.scannedAt) {
    const age = Date.now() - cached.scannedAt.getTime();
    if (age < 24 * 60 * 60 * 1000) {
      return cached;
    }
  }

  // Fetch and scan
  // This will be called by the OSINT pipeline
  return null; // Implemented in scan-service
}
```

---

### Day 5-7: Tokenomics Dashboard

#### Task 3.1: Dashboard API Route

**File**: `app/api/tokenomics/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { getClaimStats, getLifetimeFees } from '@/lib/bags/client';
import { CLARP_MINT, REVENUE_SPLIT } from '@/lib/config/tokenomics';

const CREATOR_WALLET = process.env.CLARP_CREATOR_WALLET!;
const BURN_WALLET = process.env.CLARP_BURN_WALLET!;
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

export async function GET() {
  try {
    // Get lifetime fees from Bags API
    const fees = await getLifetimeFees(CLARP_MINT.toBase58());

    // Get claim stats
    const claimStats = await getClaimStats(CREATOR_WALLET);

    // Get burn history from on-chain
    // This queries the burn wallet's transaction history
    const burnHistory = await getBurnHistory();

    return NextResponse.json({
      success: true,
      data: {
        lifetimeFees: fees?.totalFees || 0,
        claimed: claimStats?.totalClaimed || 0,
        unclaimed: claimStats?.totalUnclaimed || 0,
        revenueSplit: REVENUE_SPLIT,
        burns: {
          total: burnHistory.totalBurned,
          transactions: burnHistory.recent,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Tokenomics API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tokenomics' }, { status: 500 });
  }
}

interface BurnHistory {
  totalBurned: number;
  recent: Array<{
    signature: string;
    amount: number;
    timestamp: number;
  }>;
}

async function getBurnHistory(): Promise<BurnHistory> {
  // Query burn transactions from Solana
  // Burn = transfer to burn address (11111111111111111111111111111111)
  // or use SPL token burn instruction

  try {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(BURN_WALLET),
      { limit: 50 }
    );

    // Parse transactions to extract burn amounts
    // This is simplified - full implementation would parse each tx

    return {
      totalBurned: 0, // Calculate from all burns
      recent: signatures.slice(0, 10).map(sig => ({
        signature: sig.signature,
        amount: 0, // Parse from tx
        timestamp: sig.blockTime || 0,
      })),
    };
  } catch (error) {
    console.error('[BurnHistory] Error:', error);
    return { totalBurned: 0, recent: [] };
  }
}
```

#### Task 3.2: Dashboard UI Component

**File**: `components/tokenomics/Dashboard.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { PieChart, Flame, DollarSign, TrendingUp, ExternalLink } from 'lucide-react';

interface TokenomicsData {
  lifetimeFees: number;
  claimed: number;
  unclaimed: number;
  revenueSplit: {
    profit: number;
    operations: number;
    burn: number;
  };
  burns: {
    total: number;
    transactions: Array<{
      signature: string;
      amount: number;
      timestamp: number;
    }>;
  };
  lastUpdated: string;
}

export default function TokenomicsDashboard() {
  const [data, setData] = useState<TokenomicsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokenomics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTokenomics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTokenomics() {
    try {
      const res = await fetch('/api/tokenomics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch tokenomics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-slate-800 rounded-lg h-64" />;
  }

  if (!data) {
    return <div className="text-red-400">Failed to load tokenomics</div>;
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <PieChart className="w-5 h-5 text-cyan-400" />
          CLARP Tokenomics
        </h2>
        <span className="text-xs text-slate-500">
          Updated {new Date(data.lastUpdated).toLocaleTimeString()}
        </span>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Lifetime Fees"
          value={`$${data.lifetimeFees.toLocaleString()}`}
          color="text-green-400"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Unclaimed"
          value={`$${data.unclaimed.toLocaleString()}`}
          color="text-yellow-400"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Total Burned"
          value={`${data.burns.total.toLocaleString()} CLARP`}
          color="text-orange-400"
        />
      </div>

      {/* Revenue Split Visualization */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-400">Revenue Split</h3>
        <div className="flex h-4 rounded-full overflow-hidden">
          <div
            className="bg-green-500"
            style={{ width: `${data.revenueSplit.profit * 100}%` }}
            title={`Profit: ${data.revenueSplit.profit * 100}%`}
          />
          <div
            className="bg-blue-500"
            style={{ width: `${data.revenueSplit.operations * 100}%` }}
            title={`Operations: ${data.revenueSplit.operations * 100}%`}
          />
          <div
            className="bg-orange-500"
            style={{ width: `${data.revenueSplit.burn * 100}%` }}
            title={`Burn: ${data.revenueSplit.burn * 100}%`}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Profit 50%
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            Ops 30%
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            Burn 20%
          </span>
        </div>
      </div>

      {/* Recent Burns */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-400">Recent Burns</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {data.burns.transactions.length === 0 ? (
            <p className="text-slate-500 text-sm">No burns yet</p>
          ) : (
            data.burns.transactions.map((burn) => (
              <a
                key={burn.signature}
                href={`https://solscan.io/tx/${burn.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-sm hover:bg-slate-800 p-1 rounded"
              >
                <span className="text-orange-400">
                  {burn.amount.toLocaleString()} CLARP
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  {new Date(burn.timestamp * 1000).toLocaleDateString()}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Powered by Bags */}
      <div className="pt-4 border-t border-slate-700">
        <a
          href="https://bags.fm"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1"
        >
          Powered by Bags.fm
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className={`flex items-center gap-2 ${color} mb-1`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  );
}
```

---

## Week 2: Polish & Submission

### Day 8-10: Embedded Swap Widget (P1)

#### Task 4.1: Swap Component

**File**: `components/swap/BagsSwap.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction } from '@solana/web3.js';
import { ArrowDown, Loader2, ExternalLink } from 'lucide-react';
import { getSwapQuote, createSwapTransaction } from '@/lib/bags/client';
import { CLARP_MINT } from '@/lib/config/tokenomics';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface BagsSwapProps {
  onSuccess?: () => void;
  suggestedAmount?: number; // SOL amount to reach next tier
}

export default function BagsSwap({ onSuccess, suggestedAmount }: BagsSwapProps) {
  const { publicKey, signTransaction } = useWallet();
  const [amount, setAmount] = useState(suggestedAmount?.toString() || '0.1');
  const [quote, setQuote] = useState<{
    outputAmount: string;
    priceImpact: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  async function fetchQuote() {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    setError(null);

    try {
      const quoteResult = await getSwapQuote(
        SOL_MINT,
        CLARP_MINT.toBase58(),
        (parseFloat(amount) * 1e9).toString() // Convert to lamports
      );

      if (quoteResult) {
        setQuote({
          outputAmount: (parseInt(quoteResult.outputAmount) / 1e9).toFixed(2),
          priceImpact: quoteResult.priceImpact,
        });
      } else {
        setError('Failed to get quote');
      }
    } catch (err) {
      setError('Failed to fetch quote');
    } finally {
      setLoading(false);
    }
  }

  async function executeSwap() {
    if (!publicKey || !signTransaction || !quote) return;

    setLoading(true);
    setError(null);

    try {
      // Get swap transaction from Bags API
      const swapTx = await createSwapTransaction(
        {
          inputMint: SOL_MINT,
          outputMint: CLARP_MINT.toBase58(),
          inputAmount: (parseFloat(amount) * 1e9).toString(),
          outputAmount: quote.outputAmount,
          priceImpact: quote.priceImpact,
          slippage: 0.5,
        },
        publicKey.toBase58()
      );

      if (!swapTx) {
        throw new Error('Failed to create swap transaction');
      }

      // Deserialize and sign
      const transaction = Transaction.from(Buffer.from(swapTx.transaction, 'base64'));
      const signed = await signTransaction(transaction);

      // Submit
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);
      const signature = await connection.sendRawTransaction(signed.serialize());

      // Wait for confirmation
      await connection.confirmTransaction(signature);

      setTxSignature(signature);
      onSuccess?.();

    } catch (err: any) {
      setError(err.message || 'Swap failed');
    } finally {
      setLoading(false);
    }
  }

  if (txSignature) {
    return (
      <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 text-center">
        <p className="text-green-400 font-medium mb-2">Swap successful!</p>
        <a
          href={`https://solscan.io/tx/${txSignature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-green-300 hover:underline flex items-center justify-center gap-1"
        >
          View transaction <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-bold text-white">Buy $CLARP</h3>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm text-slate-400">You pay</label>
        <div className="flex items-center bg-slate-800 rounded-lg p-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={fetchQuote}
            className="flex-1 bg-transparent text-white text-lg outline-none"
            placeholder="0.0"
            min="0"
            step="0.1"
          />
          <span className="text-slate-400 font-medium">SOL</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <ArrowDown className="w-5 h-5 text-slate-500" />
      </div>

      {/* Output */}
      <div className="space-y-2">
        <label className="text-sm text-slate-400">You receive</label>
        <div className="flex items-center bg-slate-800 rounded-lg p-3">
          <span className="flex-1 text-white text-lg">
            {quote ? quote.outputAmount : '—'}
          </span>
          <span className="text-cyan-400 font-medium">CLARP</span>
        </div>
        {quote && quote.priceImpact > 1 && (
          <p className="text-xs text-yellow-400">
            Price impact: {quote.priceImpact.toFixed(2)}%
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Swap Button */}
      <button
        onClick={quote ? executeSwap : fetchQuote}
        disabled={loading || !publicKey}
        className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700
                   text-white font-bold py-3 rounded-lg transition-colors
                   flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {quote ? 'Swapping...' : 'Getting quote...'}
          </>
        ) : quote ? (
          'Swap'
        ) : (
          'Get Quote'
        )}
      </button>

      {/* Powered by Bags */}
      <p className="text-xs text-slate-500 text-center">
        Powered by Bags.fm
      </p>
    </div>
  );
}
```

---

### Day 11-12: Integration & Testing

#### Task 5.1: Add Dashboard to Terminal

**File**: Update `app/terminal/page.tsx` to include tokenomics dashboard

#### Task 5.2: Integration Tests

```bash
# Test Bags API connection
curl -X GET "https://public-api-v2.bags.fm/api/v1/token/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS/fees" \
  -H "x-api-key: YOUR_API_KEY"

# Test swap quote
curl -X POST "https://public-api-v2.bags.fm/api/v1/swap/quote" \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"inputMint":"So11111111111111111111111111111111111111112","outputMint":"GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS","amount":"100000000"}'
```

---

### Day 13-14: Polish & Submit

#### Task 6.1: Demo Recording

Record a 2-3 minute demo showing:
1. Scanning a Bags token → Trust score displayed
2. Tokenomics dashboard with live data
3. Embedded swap flow (if completed)
4. The value proposition: "CLARP makes Bags safer"

#### Task 6.2: Final Application

**Project Description** (for form):

> CLARP is the trust infrastructure layer for the Bags ecosystem. We detect rugpulls, scams, and vaporware before retail loses money—combining OSINT (GitHub, X, domains, Telegram) with AI analysis to generate trust scores with evidence.
>
> **Deep Bags API Integration:**
>
> 1. **Trust Layer** — Every Bags token gets a CLARP trust score via hybrid scanning (auto-scan popular tokens, on-demand for others). Makes Bags the safest place to trade.
>
> 2. **Tokenomics Dashboard** — Real-time display of Bags creator fees, distributions, and burns using Analytics + Fee Claiming APIs. Full transparency.
>
> 3. **Embedded Swap** — Users buy $CLARP without leaving the terminal via Bags Swap API. Frictionless tier upgrades.
>
> 4. **Automated Flywheel** — Fee Sharing API configures 50/30/20 split (profit/ops/burn). Fee Claiming API powers daily distributions. Self-sustaining tokenomics running entirely on Bags infrastructure.
>
> **Revenue Model:** 1% creator fees from $CLARP trading → automated distribution → deflationary burns. Users hold CLARP for more scans, driving volume, driving fees, driving burns.
>
> **Vision:** CLARP + Bags = the first DEX where you can trade memecoins with confidence.

---

## Checklist

### Week 1
- [ ] Register at dev.bags.fm, get API key (manual)
- [x] Create Bags API client (`lib/bags/client.ts`)
- [x] Update launchpad-intel.ts to use Bags API
- [x] Build hybrid scanner for Bags tokens (`lib/bags/scanner.ts`)
- [x] Create `/api/tokenomics` endpoint
- [x] Build TokenomicsDashboard component
- [x] Integrate dashboard into terminal

### Week 2
- [x] Build BagsSwap component (`components/swap/BagsSwap.tsx`)
- [x] Integrate swap into WalletGate (UpgradePrompt)
- [ ] Write integration tests
- [ ] Record demo video (manual)
- [ ] Submit application (manual)
- [ ] Prepare for follow-up questions (manual)

---

## Environment Variables

```bash
# .env.local additions
BAGS_API_KEY=your_bags_api_key
BAGS_API_URL=https://public-api-v2.bags.fm/api/v1

# Existing (ensure these are set)
NEXT_PUBLIC_SOLANA_RPC_URL=https://your-rpc-url
CLARP_CREATOR_WALLET=your_creator_wallet
CLARP_BURN_WALLET=your_burn_wallet
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Bags API endpoints differ from docs | Test early, adapt client as needed |
| Rate limits (1000/hr) | Implement caching, batch requests |
| 2-week deadline tight | Priority is Trust + Dashboard, swap is P1 |
| Solo dev capacity | Lean on Claude for pair programming |

---

## Success Metrics

- [ ] Application submitted before deadline (manual)
- [x] All 3 features implemented and working
- [x] Clear narrative: "CLARP = trust layer for Bags"
- [x] Code is clean, documented, production-ready
