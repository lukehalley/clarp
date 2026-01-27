# ADR 002: CLARP Token Staking Program

## Status
Proposed

## Date
2026-01-27

## Context

CLARP token is live on Bags.fm (Solana):
- **Address**: `GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS`
- **DEX**: Bags.fm (Meteora DBC)
- **Creator Revenue**: 1% of all trading volume

We need a staking mechanism to:
1. Gate premium features behind token holdings
2. Create lock-up incentives (reduce sell pressure)
3. Reward loyal holders
4. Drive token utility and demand

---

## Decision

Build a custom Anchor staking program on Solana with tier-based access.

### Why Custom vs Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **Custom Anchor** | Full control, no fees, deep integration | Dev time required |
| Smithii no-code | Fast launch | 0.008 SOL/stake fee, external dependency |
| Soft staking (DB) | Simplest | Centralized, trust required |

**Choice: Custom Anchor** - Best long-term option for a production app with token utility at its core.

---

## Technical Specification

### Program Architecture

```
clarp-staking/
├── programs/
│   └── clarp-staking/
│       ├── src/
│       │   ├── lib.rs           # Program entrypoint
│       │   ├── instructions/
│       │   │   ├── initialize.rs
│       │   │   ├── stake.rs
│       │   │   ├── unstake.rs
│       │   │   └── claim_rewards.rs
│       │   ├── state/
│       │   │   ├── config.rs
│       │   │   └── stake_account.rs
│       │   └── errors.rs
│       └── Cargo.toml
├── tests/
│   └── clarp-staking.ts
├── Anchor.toml
└── package.json
```

### Account Structures

```rust
// Program config (PDA)
#[account]
pub struct StakingConfig {
    pub authority: Pubkey,           // Admin who can update config
    pub clarp_mint: Pubkey,          // CLARP token mint
    pub reward_mint: Pubkey,         // Reward token (CLARP or SOL)
    pub vault: Pubkey,               // Token vault PDA
    pub total_staked: u64,           // Total CLARP staked
    pub reward_rate: u64,            // Rewards per second per token
    pub min_stake_duration: i64,     // Minimum lock time (seconds)
    pub bump: u8,
}

// User stake account (PDA per user)
#[account]
pub struct StakeAccount {
    pub owner: Pubkey,               // User wallet
    pub amount: u64,                 // Staked amount
    pub staked_at: i64,              // Unix timestamp
    pub last_claim_at: i64,          // Last reward claim
    pub unlock_at: i64,              // When tokens can be withdrawn
    pub tier: u8,                    // Computed tier (0-3)
    pub bump: u8,
}
```

### Tier Thresholds

```rust
pub const TIER_FREE: u64 = 0;
pub const TIER_BASIC: u64 = 10_000 * 1_000_000;      // 10K CLARP (6 decimals)
pub const TIER_PRO: u64 = 100_000 * 1_000_000;       // 100K CLARP
pub const TIER_WHALE: u64 = 1_000_000 * 1_000_000;   // 1M CLARP

pub fn compute_tier(amount: u64) -> u8 {
    if amount >= TIER_WHALE { 3 }
    else if amount >= TIER_PRO { 2 }
    else if amount >= TIER_BASIC { 1 }
    else { 0 }
}
```

### Instructions

#### 1. Initialize

```rust
pub fn initialize(
    ctx: Context<Initialize>,
    reward_rate: u64,
    min_stake_duration: i64,
) -> Result<()>
```

Creates the staking config and vault. Called once by admin.

#### 2. Stake

```rust
pub fn stake(
    ctx: Context<Stake>,
    amount: u64,
    lock_duration: i64,  // Optional: longer lock = bonus rewards
) -> Result<()>
```

- Transfers CLARP from user to vault
- Creates/updates stake account
- Computes tier
- Sets unlock timestamp

#### 3. Unstake

```rust
pub fn unstake(
    ctx: Context<Unstake>,
    amount: u64,
) -> Result<()>
```

- Checks unlock time has passed
- Transfers CLARP from vault to user
- Updates stake account
- Recomputes tier

#### 4. Claim Rewards

```rust
pub fn claim_rewards(
    ctx: Context<ClaimRewards>,
) -> Result<()>
```

- Calculates pending rewards based on staked amount and time
- Transfers reward tokens to user
- Updates last_claim_at

### Reward Calculation

```rust
pub fn calculate_rewards(stake: &StakeAccount, config: &StakingConfig, now: i64) -> u64 {
    let duration = now - stake.last_claim_at;
    let base_reward = stake.amount * config.reward_rate * duration as u64 / 1_000_000_000;

    // Tier multiplier
    let multiplier = match stake.tier {
        3 => 150,  // Whale: 1.5x
        2 => 125,  // Pro: 1.25x
        1 => 110,  // Basic: 1.1x
        _ => 100,  // Free: 1x
    };

    base_reward * multiplier / 100
}
```

---

## Integration with CLARP App

### Backend: Check User Tier

```typescript
// lib/solana/staking.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';

const STAKING_PROGRAM_ID = new PublicKey('...');
const CLARP_MINT = new PublicKey('GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS');

export async function getUserTier(wallet: PublicKey): Promise<number> {
  const connection = new Connection(process.env.SOLANA_RPC_URL!);

  // Derive stake account PDA
  const [stakeAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('stake'), wallet.toBuffer()],
    STAKING_PROGRAM_ID
  );

  try {
    const account = await program.account.stakeAccount.fetch(stakeAccount);
    return account.tier;
  } catch {
    // No stake account = free tier
    // Check wallet balance as fallback
    const balance = await getTokenBalance(connection, wallet, CLARP_MINT);
    return computeTierFromBalance(balance);
  }
}

export type Tier = 'free' | 'basic' | 'pro' | 'whale';

export function tierToString(tier: number): Tier {
  switch (tier) {
    case 3: return 'whale';
    case 2: return 'pro';
    case 1: return 'basic';
    default: return 'free';
  }
}
```

### API: Gate Scans by Tier

```typescript
// app/api/xintel/scan/route.ts
import { getUserTier, tierToString } from '@/lib/solana/staking';

const TIER_LIMITS = {
  free: { dailyScans: 3, freshScans: false },
  basic: { dailyScans: 10, freshScans: true },
  pro: { dailyScans: Infinity, freshScans: true },
  whale: { dailyScans: Infinity, freshScans: true, priority: true },
};

export async function POST(req: Request) {
  const { handle, wallet } = await req.json();

  // Get user tier
  const tierNum = wallet ? await getUserTier(new PublicKey(wallet)) : 0;
  const tier = tierToString(tierNum);
  const limits = TIER_LIMITS[tier];

  // Check daily limit
  const todayScans = await getDailyScans(wallet);
  if (todayScans >= limits.dailyScans) {
    return Response.json(
      { error: 'Daily scan limit reached', tier, upgrade: true },
      { status: 429 }
    );
  }

  // Check if fresh scan allowed
  const cached = await getCachedReport(handle);
  if (cached && !limits.freshScans) {
    return Response.json({ report: cached, cached: true, tier });
  }

  // Process scan...
}
```

### Frontend: Show Tier Status

```tsx
// components/TierBadge.tsx
export function TierBadge({ tier }: { tier: Tier }) {
  const config = {
    free: { label: 'Free', color: 'gray', icon: '👤' },
    basic: { label: 'Basic', color: 'blue', icon: '⭐' },
    pro: { label: 'Pro', color: 'purple', icon: '💎' },
    whale: { label: 'Whale', color: 'gold', icon: '🐋' },
  };

  const { label, color, icon } = config[tier];

  return (
    <span className={`tier-badge tier-${color}`}>
      {icon} {label}
    </span>
  );
}
```

---

## Deployment Plan

### Phase 1: Development (1-2 weeks)
1. Set up Anchor project
2. Write staking program
3. Write tests
4. Deploy to devnet
5. Test with CLARP on devnet

### Phase 2: Audit & Mainnet (1 week)
1. Self-audit / peer review
2. Deploy to mainnet
3. Initialize config with CLARP mint
4. Fund reward vault

### Phase 3: Integration (1 week)
1. Add staking lib to CLARP app
2. Implement tier checks in API
3. Build staking UI
4. Add tier badges to dashboard

### Phase 4: Launch
1. Announce staking
2. Seed initial rewards
3. Monitor usage

---

## Reward Tokenomics

### Option A: CLARP Rewards (Inflationary)
- Mint new CLARP as rewards
- Requires mint authority
- Risk: Dilution

### Option B: CLARP from Treasury (Deflationary)
- Use creator fees (1% of volume) to fund rewards
- No new tokens minted
- Sustainable if volume > rewards

### Option C: SOL Rewards
- Pay stakers in SOL
- Funded from app revenue
- Simple, no token dilution

**Recommendation: Option B** - Use Bags.fm creator fees to fund CLARP rewards. At $500+/day in creator fees, this is sustainable.

---

## Security Considerations

1. **Reentrancy**: Use Anchor's built-in protections
2. **Integer overflow**: Use checked math
3. **Authority checks**: Validate signer on all instructions
4. **PDA validation**: Verify all PDAs derive correctly
5. **Time manipulation**: Use reasonable tolerances for unlock times

---

## Costs

| Item | Cost |
|------|------|
| Devnet testing | Free |
| Mainnet deploy | ~0.5 SOL (~$125) |
| Account rent | ~0.002 SOL per stake account |
| Transactions | ~0.000005 SOL per tx |

---

## Success Metrics

1. **Staking TVL**: Target 10% of circulating supply staked in 30 days
2. **Tier distribution**: Healthy spread across tiers
3. **Scan volume**: Increase in scans from token-gated users
4. **Churn reduction**: Lower sell pressure from locked tokens

---

## Files to Create

```
clarp/
├── programs/                    # New: Anchor staking program
│   └── clarp-staking/
├── lib/solana/
│   └── staking.ts              # New: Staking client
├── components/
│   ├── TierBadge.tsx           # New: Tier display
│   └── StakingPanel.tsx        # New: Stake/unstake UI
├── app/terminal/staking/
│   └── page.tsx                # New: Staking dashboard
└── docs/adr/
    └── 002-clarp-staking-program.md  # This document
```

---

## References

- [Anchor Book](https://book.anchor-lang.com/)
- [SPL Token Program](https://spl.solana.com/token)
- [Solana Cookbook - Staking](https://solanacookbook.com/references/staking.html)
- [CLARP Token (DexScreener)](https://dexscreener.com/solana/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS)
