# Sprint 005: Wallet Gate & Token Requirement

## Status: ✅ IMPLEMENTED (Core) | 🔄 EVOLVING (Thresholds)

## Overview

**Goal**: Require wallet connection and minimum CLARP balance to access the terminal.

**Token**: CLARP (`GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS`)
**Current Min Balance**: 100,000 CLARP (Whale tier)
**Future**: Thresholds will increase as we ship alpha features

---

## What's Implemented

### WalletGate Component ✅

**File**: `components/auth/WalletGate.tsx`

- Token-gated access wrapper
- Blurred preview for unauthenticated users
- Connect wallet prompt
- Insufficient balance handling with "Buy on Bags" CTA
- Free scan option for new users (1 scan ever, stored in localStorage)
- Balance checking via `useTokenBalance` hook

### Token Balance Hook ✅

**File**: `hooks/useTokenBalance.ts`

- Fetches CLARP balance from wallet
- Calculates user tier
- Auto-refreshes every 30 seconds
- Handles token account not found gracefully

### Applied To

- `/terminal/project/[id]` - Project detail pages
- `/terminal/scan` - Scan pages
- More pages being gated as we roll out

---

## Current Threshold Strategy

| Phase | Required Balance | Rationale |
|-------|------------------|-----------|
| **Now** | 100K CLARP | Early alpha - reward early believers |
| **Soon** | Higher for new features | New tools gated at higher thresholds |
| **Future** | Dynamic per-feature | Different features = different requirements |

### Why 100K?

1. **Sustainability** - Scanner costs money (AI, OSINT, on-chain data)
2. **No Subscriptions** - Hold tokens, not pay monthly
3. **Aligned Incentives** - Users are holders, holders are users
4. **Spam Prevention** - High threshold = serious users only

---

## Free Scan (One-Time)

New users without wallets can try 1 free scan:

1. Click "Try 1 Free Scan" on gate
2. Enter token address
3. Get redirected to `/terminal/scan?address=...`
4. Stored in localStorage as used
5. After viewing results, hard gate to connect wallet

---

## Next Steps

- [ ] Increase threshold for new alpha features
- [ ] Add tier badges to UI showing user's access level
- [ ] Consider grace period if balance drops below threshold
- [ ] Add scan history gating (longer history = higher tier)

---

## Files

| File | Purpose |
|------|---------|
| `components/auth/WalletGate.tsx` | Gate wrapper component |
| `hooks/useTokenBalance.ts` | Balance fetching hook |
| `lib/config/tokenomics.ts` | Tier thresholds & config |
| `app/terminal/project/[id]/page.tsx` | Example gated page |
