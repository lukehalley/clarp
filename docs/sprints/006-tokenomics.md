# Sprint 006: Tokenomics & Fee Distribution

## Status: ✅ COMPLETED

## Overview

**Goal**: Implement automated tokenomics with daily fee distribution and burns.

**Token**: CLARP (`GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS`)
**Chain**: Solana Mainnet
**DEX**: Bags.fm (Meteora DBC)

---

## Revenue Flow

1. User buys/sells $CLARP on Bags.fm
2. 1% creator fee collected
3. Daily distribution: 50% profit / 30% ops / 20% burn

## Revenue Split

| Category | Percentage | Destination |
|----------|------------|-------------|
| Profit | 50% | Team operations + development |
| Operations | 30% | API costs, hosting, infrastructure |
| Burn | 20% | Auto-buy CLARP on Bags → burn address |

---

## What We're Building

### Phase 1: Fee Distribution Cron

- Daily automated distribution
- Claims fees from Bags creator wallet
- Splits to profit/ops/burn wallets
- Executes burn via swap + send to burn address
- Logs all transactions to database

### Phase 2: Burn Dashboard

- Real-time transparency of all distributions
- Lifetime fees collected
- Total CLARP burned
- Recent burn transactions (clickable to Solscan)
- Revenue split visualization

---

## Marketing Assets Created

### Thread: Tokenomics Announcement

**Location**: `marketing-assets/tokenomics/threads/tokenomics-burn.txt`

Key points:
1. Token-gated access (100K CLARP required)
2. 1% creator fee on Bags trades
3. 50/30/20 revenue split
4. Daily automated burns
5. Full transparency via dashboard

### Promo Image

**Location**: `marketing-assets/tokenomics/tokenomics-burn-promo.png`

- Shows flywheel diagram
- Revenue split visualization
- CLARP branding

---

## Implementation Checklist

### Phase 1: Distribution Service
- [x] Create `lib/tokenomics/distribution.ts`
- [x] Implement Bags API fee claiming
- [ ] Set up distribution wallets (manual: add env vars)
- [x] Create cron endpoint `/api/cron/distribute`
- [x] Add Supabase logging

### Phase 2: Dashboard
- [x] Create database schema (revenue_distributions, burn_transactions)
- [x] Build `/api/tokenomics` endpoint
- [x] Build TokenomicsDashboard component
- [x] Add to terminal UI
- [x] Auto-refresh every 5 minutes

---

## Timeline

| Phase | Status | Notes |
|-------|--------|-------|
| Wallet Gate | ✅ Done | Sprint 005 |
| Tokenomics Design | ✅ Done | This sprint |
| Marketing Assets | ✅ Done | Thread + image |
| Distribution Service | ✅ Done | `lib/tokenomics/distribution.ts` |
| Burn Dashboard | ✅ Done | `components/tokenomics/Dashboard.tsx` |
