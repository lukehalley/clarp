# Sprint 1: CLARP Terminal MVP

**Status:** COMPLETE
**Completed:** 2026-01-23
**Ralph Loop Iterations:** 1

---

## Overview

Built the complete CLARP Terminal MVP - a crypto trust intelligence platform that helps users avoid rugs and LARPs before they ape.

---

## Deliverables

### 1. TypeScript Types (`types/terminal.ts`)
- [x] Chain type (solana, ethereum, base, arbitrum)
- [x] Project interface
- [x] Profile interface
- [x] LarpScore interface with confidence/riskLevel
- [x] ScoreBreakdown with 4 modules
- [x] ModuleScore interface
- [x] Evidence interface with severity levels
- [x] EvidenceType union (16 types)
- [x] WatchlistItem interface
- [x] AlertRule interface
- [x] AlertRuleType union (6 types)
- [x] AlertChannel type
- [x] Alert interface
- [x] EntityType union (5 types)
- [x] ResolvedEntity interface
- [x] SearchResult interface

### 2. Routing Structure (`app/terminal/`)
- [x] `layout.tsx` - Terminal layout with nav
- [x] `page.tsx` - Dashboard (risk spikes, trending, watchlist summary)
- [x] `search/page.tsx` - Search results
- [x] `project/[id]/page.tsx` - Project detail with score + risk cards
- [x] `profile/[handle]/page.tsx` - X profile analysis
- [x] `watchlist/page.tsx` - User watchlist
- [x] `alerts/page.tsx` - Alert management
- [x] `report/[id]/page.tsx` - Public shareable report

### 3. Terminal Layout (`components/terminal/TerminalLayout.tsx`)
- [x] Dark mode default (slate-dark background)
- [x] Top nav: Dashboard, Projects, Profiles, Watchlist, Alerts
- [x] Global search bar in header
- [x] Mobile responsive with hamburger menu
- [x] Matches existing brutalist design aesthetic

### 4. Base Components (`components/terminal/`)
- [x] ScoreDisplay - LARP score visualization with color coding
- [x] RiskCard - Expandable module card with evidence
- [x] EvidenceItem - Single evidence bullet with severity icon
- [x] SearchInput - Global search with autocomplete
- [x] ProjectCard - Project summary card
- [x] AlertRuleForm - Create/edit alert rules

### 5. Entity Resolution (`lib/terminal/entity-resolver.ts`)
- [x] Ticker resolution (starts with $ or known pattern)
- [x] Contract resolution (Solana 32-44 base58, EVM 0x + 40 hex)
- [x] X Handle resolution (starts with @ or x.com/twitter.com URL)
- [x] Domain resolution (contains . with valid TLD)
- [x] ENS resolution (ends with .eth)

### 6. Scoring Engine (`lib/terminal/scoring/`)
- [x] `identity.ts` - Team & Identity Risk
- [x] `x-behavior.ts` - Narrative Manipulation Risk
- [x] `wallet.ts` - Wallet Behavior Risk
- [x] `liquidity.ts` - Token & Liquidity Risk
- [x] `calculate-score.ts` - Weighted combination with top tags

### 7. API Routes (`app/api/terminal/`)
- [x] `search/route.ts` - POST with query, returns results
- [x] `project/[id]/route.ts` - GET project + full LarpScore
- [x] `profile/[handle]/route.ts` - GET profile + score + badges
- [x] `watchlist/route.ts` - GET/POST/DELETE for watchlist
- [x] `alerts/route.ts` - CRUD for alert rules

### 8. Dashboard Page (`app/terminal/page.tsx`)
- [x] Risk Spikes (24h) - Projects with biggest score increase
- [x] Trending + Risky - High mention velocity + rising red flags
- [x] Your Watchlist Summary (if items exist)
- [x] Recent Alerts stream

### 9. Project Page (`app/terminal/project/[id]/page.tsx`)
- [x] Header with name, ticker, chain, contract
- [x] LARP Score (large) + confidence + risk level
- [x] Top 3-6 risk tags
- [x] Actions: Watch, Create Alert, Share Report
- [x] 4 Risk Breakdown cards with evidence
- [x] Live signals feed

### 10. Profile Page (`app/terminal/profile/[handle]/page.tsx`)
- [x] X profile header (handle, display name, bio, followers)
- [x] Profile LARP Score + confidence
- [x] Behavior badges (account age, follower anomaly, engagement quality)
- [x] Trust timeline (major changes with timestamps)
- [x] Amplifier list (top retweeters / shill ring)
- [x] Related projects (most-linked tickers)

### 11. Watchlist Page (`app/terminal/watchlist/page.tsx`)
- [x] Table/grid of watched projects
- [x] Columns: Name, Score, 24h Delta, Top Tag, Last Updated
- [x] Filters: chain, score range
- [x] Bulk actions: Remove
- [x] Persistence via localStorage

### 12. Alerts Page (`app/terminal/alerts/page.tsx`)
- [x] Create Alert section with project selector
- [x] Choose rule type (6 types)
- [x] Set threshold (where applicable)
- [x] Select channels
- [x] Active Rules list with toggle/delete
- [x] Alert History with payload details

### 13. Report Page (`app/terminal/report/[id]/page.tsx`)
- [x] Clean, screenshot-friendly design
- [x] LARP Score prominently displayed
- [x] Top 3-5 red flags with evidence
- [x] "Last updated" timestamp
- [x] Disclaimer: "Not financial advice"
- [x] OG meta tags for X cards
- [x] Stable URL: `/terminal/report/{projectId}`

### 14. Mock Data (`lib/terminal/mock-data.ts`)
- [x] 10 sample projects (mix of chains, risk levels)
- [x] 10 sample profiles (mix of behaviors)
- [x] Sample evidence items for each module
- [x] Pre-calculated scores

### 15. Tests (`__tests__/terminal/`)
- [x] `entity-resolver.test.ts` - All entity type resolution
- [x] `scoring.test.ts` - Module scores and combined calculation
- [x] `types.test.ts` - Type validation
- [x] `mock-data.test.ts` - Mock data consistency

---

## Verification Results

```
npm run build   ✓ Passes (17+ routes compiled)
npm run lint    ✓ Passes (0 errors, 7 warnings)
npm run test    ✓ Passes (97 tests, 4 suites)
```

---

## Files Created/Modified

### New Files (Terminal MVP)
- `types/terminal.ts` - 350+ lines of TypeScript types
- `lib/terminal/entity-resolver.ts` - Entity resolution logic
- `lib/terminal/mock-data.ts` - Comprehensive mock data
- `lib/terminal/scoring/identity.ts` - Identity risk module
- `lib/terminal/scoring/x-behavior.ts` - X behavior risk module
- `lib/terminal/scoring/wallet.ts` - Wallet behavior risk module
- `lib/terminal/scoring/liquidity.ts` - Liquidity risk module
- `lib/terminal/scoring/calculate-score.ts` - Combined scoring
- `app/terminal/layout.tsx` - Terminal layout
- `app/terminal/page.tsx` - Dashboard
- `app/terminal/search/page.tsx` - Search results
- `app/terminal/project/[id]/page.tsx` - Project detail
- `app/terminal/profile/[handle]/page.tsx` - Profile analysis
- `app/terminal/watchlist/page.tsx` - Watchlist management
- `app/terminal/alerts/page.tsx` - Alert management
- `app/terminal/report/[id]/page.tsx` - Public report
- `app/terminal/report/[id]/ReportContent.tsx` - Report client component
- `app/api/terminal/search/route.ts` - Search API
- `app/api/terminal/project/[id]/route.ts` - Project API
- `app/api/terminal/profile/[handle]/route.ts` - Profile API
- `app/api/terminal/watchlist/route.ts` - Watchlist API
- `app/api/terminal/alerts/route.ts` - Alerts API
- `components/terminal/TerminalLayout.tsx` - Layout component
- `components/terminal/ScoreDisplay.tsx` - Score visualization
- `components/terminal/RiskCard.tsx` - Risk card component
- `components/terminal/EvidenceItem.tsx` - Evidence bullet
- `components/terminal/SearchInput.tsx` - Search component
- `components/terminal/ProjectCard.tsx` - Project card
- `components/terminal/AlertRuleForm.tsx` - Alert form
- `__tests__/terminal/entity-resolver.test.ts` - Entity tests
- `__tests__/terminal/scoring.test.ts` - Scoring tests
- `__tests__/terminal/types.test.ts` - Type tests
- `__tests__/terminal/mock-data.test.ts` - Mock data tests

### Modified Files (Lint Fixes)
- `package.json` - Fixed lint script for flat config
- `eslint.config.mjs` - Added varsIgnorePattern
- `app/page.tsx` - Removed unused imports
- `app/roadmap/page.tsx` - Removed unused import
- `components/DocsSection.tsx` - Removed unused import
- `components/ProductCard.tsx` - Removed unused import
- `components/FullscreenTerminal.tsx` - Fixed regex
- `lib/github.ts` - Fixed regex escapes

---

## Completion Promise

```
<promise>CLARP_TERMINAL_COMPLETE</promise>
```

---

## Next Steps (Future Sprints)

- [ ] Real API integrations (replace mock data)
- [ ] Email/Telegram alert delivery
- [ ] User authentication
- [ ] Historical score tracking
- [ ] Advanced search filters
- [ ] Batch project analysis
- [ ] KOL tracking integration
