# Token Analysis System

Comprehensive OSINT-based analysis for **any Solana token**, regardless of where it was launched or trades.

## Overview

The CLARP Terminal provides deep, truthful analysis for any token entered. Our scan quality is our product.

```
User enters CA → Entity Resolver → OSINT Collection → AI Analysis → Key Findings
                      ↓
              DexScreener, RugCheck, Birdeye, CoinGecko
```

## Data Sources

| Source | Data Retrieved | API |
|--------|---------------|-----|
| **DexScreener** | Price, market cap, liquidity, DEX/pool, trading pairs | `api.dexscreener.com` |
| **RugCheck** | Security score, holder distribution, LP lock, insiders | `api.rugcheck.xyz` |
| **Birdeye** | Holder count, trading activity, volume | `public-api.birdeye.so` |
| **CoinGecko** | Listing status (legitimacy signal) | `api.coingecko.com` |
| **Jupiter** | Price verification | `price.jup.ag` |

## Launchpad Detection

Tokens are identified from 9 supported launchpads:

### Address Pattern Detection
```typescript
// lib/terminal/osint/launchpad-intel.ts
detectLaunchpad(tokenAddress: string): LaunchpadType
```

| Launchpad | Detection Method | Example |
|-----------|-----------------|---------|
| Pump.fun | Address ends with `pump` | `...VNEdpump` |
| Bags.fm | Address ends with `BAGS` | `...W6BAGS` |

### DexScreener dexId Detection
```typescript
// lib/terminal/xintel/tokenLookup.ts
detectLaunchpadFromDex(dexId: string, tokenAddress?: string): LaunchpadType
```

| Launchpad | dexId Contains |
|-----------|---------------|
| Moonshot | `moonshot`, `moonit` |
| Raydium LaunchLab | `launchlab` |
| Meteora DBC | `meteora` + `dbc` |
| LetsBonk | `bonk`, `letsbonk` |
| Boop.fun | `boop` |
| Sugar | `sugar` |

## Graduation Detection

For bonding curve tokens (Pump.fun, Moonshot, etc.), we detect whether they've graduated:

```typescript
// lib/terminal/xintel/tokenLookup.ts
checkGraduationStatus(dexId: string, tokenAddress?: string): boolean | undefined
```

| Status | Condition |
|--------|-----------|
| **Graduated** | dexId = `pumpswap` (post-March 2025) |
| **Graduated** | dexId = `raydium` + pump.fun token (pre-March 2025) |
| **Not Graduated** | dexId = `pumpfun` (still on bonding curve) |
| **Not Graduated** | dexId = `moonshot` (still on bonding curve) |

### Pump.fun Token Lifecycle

```
1. Bonding Curve (dexId: "pumpfun")
   └── 800M tokens sold via bonding curve
   └── Price increases with demand

2. Graduation (~$69k market cap / 100% bonding)
   └── Bonding curve completes
   └── Liquidity migrates automatically

3. Post-Graduation
   ├── After March 2025: PumpSwap (dexId: "pumpswap")
   └── Before March 2025: Raydium (dexId: "raydium")
```

## Key Findings

The system generates comprehensive findings for any token:

```typescript
// lib/terminal/xintel/scan-service.ts (lines 1585-1714)
```

### Finding Categories

#### 1. Critical Security Flags (shown first)
```
⚠️ FLAGGED AS RUG PULL
Mint authority active - unlimited supply risk
Freeze authority active - tokens can be frozen
```

#### 2. Holder Concentration (from RugCheck)
```
Top 10 holders control 65% of supply
Largest holder owns 25% of supply
```

#### 3. Insider Detection
```
25 insider network accounts detected
Creator still holds 15% of supply
```

#### 4. Liquidity Status
```
Liquidity not locked - can be pulled
LP locked ✓
```

#### 5. Trading Venue
```
Trading on Raydium ($50K liquidity)
Launched on Pump.fun: Graduated to PumpSwap
Launched on Moonshot: Still on bonding curve
```

#### 6. Token Age
```
New token: created today
New token: created 3 days ago
Token age: 2 weeks old
```

#### 7. Holder Count
```
Low holder count: 85 wallets
Large holder base: 15K+ wallets
```

#### 8. Positive Signals
```
Established domain: 18+ months old
Strong GitHub presence: 500 stars
Listed on CoinGecko ✓
```

#### 9. RugCheck Score
```
RugCheck: 8/10 (Good) ✓
RugCheck: 4/10 (Warn) ⚠️
RugCheck: 2/10 (Danger) 🚨
```

## DEX Type Detection

```typescript
// lib/terminal/xintel/tokenLookup.ts
normalizeDexType(dexId: string): TokenData['dexType']
```

| dexType | Description |
|---------|-------------|
| `raydium` | Raydium AMM/CLMM/CPMM |
| `orca` | Orca Whirlpools |
| `meteora` | Meteora DLMM/Dynamic Pools |
| `jupiter` | Jupiter native pools |
| `pumpswap` | Graduated pump.fun tokens |
| `pump_fun` | Pump.fun bonding curve |
| `moonshot` | Moonshot by DexScreener |

## Market Cap Accuracy

We prefer `marketCap` over `fdv` (Fully Diluted Valuation):

```typescript
// FDV assumes all tokens are in circulation (often 2x+ inflated)
const marketCapValue = parseFloat(pair.marketCap || pair.fdv || '0');
```

## File Structure

```
lib/terminal/
├── osint/
│   ├── launchpad-intel.ts    # Launchpad detection & metadata
│   ├── market-intel.ts       # Jupiter, Birdeye, CoinGecko
│   └── rugcheck-intel.ts     # Security analysis
├── xintel/
│   ├── tokenLookup.ts        # DexScreener integration
│   └── scan-service.ts       # Orchestration & key findings
└── entity-resolver.ts        # Input detection & OSINT collection
```

## Adding New Launchpads

1. Add to `LaunchpadType` union in `launchpad-intel.ts`
2. Add detection logic to `detectLaunchpadFromDexId()`
3. Add URL generator to `getLaunchpadUrl()`
4. Add display name to `getLaunchpadDisplayName()`
5. Update `detectLaunchpadFromDex()` in `tokenLookup.ts`

## Testing

Test with tokens from different platforms:

```bash
# Pump.fun graduated token
curl "https://api.dexscreener.com/latest/dex/search?q=pumpswap"

# Raydium token
curl "https://api.dexscreener.com/latest/dex/tokens/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr"

# RugCheck report
curl "https://api.rugcheck.xyz/v1/tokens/{address}/report"
```

## References

- [DexScreener API](https://docs.dexscreener.com/api/reference)
- [RugCheck](https://rugcheck.xyz)
- [Birdeye API](https://docs.birdeye.so)
- [Pump.fun Lifecycle](https://docs.bitquery.io/docs/blockchain/Solana/Pumpfun/pump-fun-to-pump-swap/)
