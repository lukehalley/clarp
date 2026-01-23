# CLARP Terminal - Complete Build

## Context

You are building CLARP Terminal - a crypto trust intelligence platform that helps users avoid rugs and LARPs before they ape.

**Read these files first:**
- `research/product/CLARP_Terminal_PRD_GTM_v1.md` - Full PRD with all requirements
- `research/product/PROJECT_CONCEPT.md` - Product positioning and LARP score system
- `app/page.tsx` - Current homepage (reference for styling/design tokens)
- `app/roadmap/page.tsx` - Roadmap page (reference for component patterns)
- `tailwind.config.ts` - Design tokens and colors

**Frontend Design:** Use the `frontend-design` skill for all UI components, pages, and styling work. Invoke it with the Skill tool: `skill: "frontend-design"`. This ensures distinctive, production-grade interfaces that avoid generic AI aesthetics.

**Current state:** Landing page and roadmap exist. Terminal functionality does not exist yet.

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind CSS

---

## Goal

Build a complete CLARP Terminal MVP with: Search, Project Pages, Profile Pages, Watchlist, Alerts, and Shareable Reports.

---

## Requirements

### 1. TypeScript Types (`types/terminal.ts`)

Create comprehensive types:

```typescript
// Chains
type Chain = 'solana' | 'ethereum' | 'base' | 'arbitrum';

// Core entities
interface Project {
  id: string;
  name: string;
  ticker?: string;
  chain: Chain;
  contract?: string;
  website?: string;
  xHandle?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Profile {
  id: string;
  xHandle: string;
  displayName?: string;
  bio?: string;
  followers: number;
  following: number;
  accountAgeDays: number;
  verified: boolean;
  createdAt: Date;
}

// Scoring
interface LarpScore {
  score: number; // 0-100 (higher = riskier)
  confidence: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topTags: string[]; // max 6
  breakdown: ScoreBreakdown;
  lastUpdated: Date;
}

interface ScoreBreakdown {
  identity: ModuleScore;
  xBehavior: ModuleScore;
  wallet: ModuleScore;
  liquidity: ModuleScore;
}

interface ModuleScore {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  evidence: Evidence[];
}

interface Evidence {
  id: string;
  type: EvidenceType;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  url: string;
  summary: string;
}

type EvidenceType =
  | 'account_age' | 'domain_age' | 'verified_links' | 'consistency'
  | 'engagement_anomaly' | 'burst_pattern' | 'shill_cluster' | 'follower_spike'
  | 'fresh_wallet' | 'suspicious_flow' | 'cex_deposit'
  | 'lp_change' | 'holder_concentration' | 'unlock_schedule'
  | 'link_change' | 'bio_change';

// Watchlist
interface WatchlistItem {
  projectId: string;
  project: Project;
  score: LarpScore;
  addedAt: Date;
  scoreDelta24h: number;
}

// Alerts
interface AlertRule {
  id: string;
  projectId: string;
  type: AlertRuleType;
  threshold?: number;
  enabled: boolean;
  channels: AlertChannel[];
  createdAt: Date;
}

type AlertRuleType =
  | 'score_change' | 'wallet_cex' | 'lp_change'
  | 'shill_cluster' | 'engagement_spike' | 'link_change';

type AlertChannel = 'email' | 'telegram' | 'webhook';

interface Alert {
  id: string;
  ruleId: string;
  projectId: string;
  type: AlertRuleType;
  payload: {
    before: any;
    after: any;
    evidence: Evidence[];
    timestamp: Date;
  };
  read: boolean;
  createdAt: Date;
}

// Search
type EntityType = 'ticker' | 'contract' | 'x_handle' | 'domain' | 'ens';

interface ResolvedEntity {
  type: EntityType;
  value: string;
  normalized: string;
  chain?: Chain;
}

interface SearchResult {
  entity: ResolvedEntity;
  project?: Project;
  profile?: Profile;
  score?: number;
}
```

---

### 2. Routing Structure

Create all pages under `app/terminal/`:

```
app/terminal/
├── layout.tsx            # Terminal layout with nav
├── page.tsx              # Dashboard (risk spikes, trending, watchlist summary)
├── search/page.tsx       # Search results
├── project/[id]/page.tsx # Project detail with score + risk cards
├── profile/[handle]/page.tsx # X profile analysis
├── watchlist/page.tsx    # User watchlist
├── alerts/page.tsx       # Alert management
└── report/[id]/page.tsx  # Public shareable report
```

---

### 3. Terminal Layout (`components/terminal/TerminalLayout.tsx`)

- Dark mode default (slate-dark background)
- Top nav: Dashboard, Projects, Profiles, Watchlist, Alerts
- Global search bar in header
- Mobile responsive with hamburger menu
- Match existing brutalist design aesthetic

---

### 4. Base Components (`components/terminal/`)

**ScoreDisplay** - LARP score visualization
- Large number (0-100)
- Color coded: 0-29 green, 30-49 yellow, 50-69 orange, 70-89 red, 90-100 dark red
- Confidence indicator
- Risk level badge

**RiskCard** - Expandable module card
- Module name and icon
- Score contribution bar
- Evidence list (collapsible)
- Each evidence item links to source

**EvidenceItem** - Single evidence bullet
- Severity icon (info/warning/critical)
- Summary text
- Timestamp
- Clickable link to source

**SearchInput** - Global search
- Autocomplete dropdown
- Entity type icons
- Debounced (300ms)
- Recent searches

**ProjectCard** - Project summary card
- Name, ticker, chain badge
- LARP score
- Top risk tag
- Last updated

**AlertRuleForm** - Create/edit alert rules
- Rule type selector
- Threshold input (where applicable)
- Channel selection (email/telegram/webhook)

---

### 5. Entity Resolution (`lib/terminal/entity-resolver.ts`)

Resolve search input to entity type:
- **Ticker**: Starts with `$` or known pattern
- **Contract**: Solana (32-44 base58) or EVM (0x + 40 hex)
- **X Handle**: Starts with `@` or x.com/twitter.com URL
- **Domain**: Contains `.` with valid TLD
- **ENS**: Ends with `.eth`

---

### 6. Scoring Engine (`lib/terminal/scoring/`)

Create modular scoring system:

**identity.ts** - Team & Identity Risk
- Account age (X, domain)
- Verified links check
- Consistency between sources

**x-behavior.ts** - Narrative Manipulation Risk
- Engagement anomalies
- Burst patterns
- Suspicious amplification / shill clusters

**wallet.ts** - Wallet Behavior Risk
- Fresh wallet funding patterns
- Suspicious flows
- CEX deposits from team wallets

**liquidity.ts** - Token & Liquidity Risk
- LP changes
- Holder concentration
- Unlock schedules

**calculate-score.ts** - Combine modules
- Weighted sum of module scores
- Generate top tags from highest-scoring factors
- Return LarpScore object

---

### 7. API Routes (`app/api/terminal/`)

**search/route.ts**
- POST with `{ query: string }`
- Returns `{ results: SearchResult[], suggestions: string[] }`
- Rate limit: 10/min per IP

**project/[id]/route.ts**
- GET returns project + full LarpScore
- Cache 5-15 minutes

**profile/[handle]/route.ts**
- GET returns profile + score + behavior badges

**watchlist/route.ts**
- GET: list user's watchlist
- POST: add to watchlist
- DELETE: remove from watchlist
- Uses localStorage for MVP (no auth)

**alerts/route.ts**
- CRUD for alert rules
- GET /alerts/history for triggered alerts

---

### 8. Dashboard Page (`app/terminal/page.tsx`)

Above the fold:
- **Risk Spikes (24h)**: Projects with biggest score increase
- **Trending + Risky**: High mention velocity + rising red flags
- **Your Watchlist Summary** (if items exist)
- **Recent Alerts** stream

---

### 9. Project Page (`app/terminal/project/[id]/page.tsx`)

**Header (above the fold):**
- Project name, ticker, chain, contract (truncated + copy)
- LARP Score (large) + confidence + risk level
- Top 3-6 risk tags
- Actions: Watch, Create Alert, Share Report

**Risk Breakdown (4 cards):**
- Team & Identity Risk
- Token & Liquidity Risk
- Narrative Manipulation Risk
- Wallet Behavior Risk

Each card shows:
- Score contribution (0-100)
- 3-7 evidence bullets with timestamps
- Expandable for details
- Links to source (tweet/tx/domain)

**Right sidebar:**
- Live signals feed (recent changes)
- "Last updated" with refresh button

---

### 10. Profile Page (`app/terminal/profile/[handle]/page.tsx`)

- X profile header (handle, display name, bio, followers)
- Profile LARP Score + confidence
- Behavior badges (account age, follower anomaly, engagement quality)
- Trust timeline (major changes with timestamps)
- Amplifier list (top retweeters / shill ring)
- Related projects (most-linked tickers)

---

### 11. Watchlist Page (`app/terminal/watchlist/page.tsx`)

- Table/grid of watched projects
- Columns: Name, Score, 24h Delta, Top Tag, Last Updated
- Filters: chain, score range, delta range
- Bulk actions: Set alerts, Remove
- Persistence via localStorage

---

### 12. Alerts Page (`app/terminal/alerts/page.tsx`)

**Create Alert section:**
- Select project (from watchlist or search)
- Choose rule type (6 types from PRD)
- Set threshold (where applicable)
- Select channels

**Active Rules list:**
- Toggle enable/disable
- Edit/delete

**Alert History:**
- Triggered alerts with payload
- Before/after values
- Evidence links
- Mark as read

---

### 13. Report Page (`app/terminal/report/[id]/page.tsx`)

Public shareable page:
- Clean, screenshot-friendly design
- LARP Score prominently displayed
- Top 3-5 red flags with evidence
- "Last updated" timestamp
- Disclaimer: "Not financial advice"
- OG meta tags for X cards
- Stable URL: `/terminal/report/{projectId}`

---

### 14. Mock Data (`lib/terminal/mock-data.ts`)

Create realistic mock data for development:
- 10 sample projects (mix of chains, risk levels)
- 10 sample profiles (mix of behaviors)
- Sample evidence items for each module
- Pre-calculated scores

---

### 15. Tests

Create tests in `__tests__/terminal/`:

```typescript
// entity-resolver.test.ts
- Resolves tickers ($CLARP, CLARP)
- Resolves Solana addresses
- Resolves EVM addresses
- Resolves X handles (@user, x.com/user)
- Resolves domains
- Resolves ENS
- Handles edge cases (empty, whitespace, mixed case)

// scoring.test.ts
- Each module returns valid score 0-100
- Combined score respects weights
- Evidence is generated correctly
- Edge cases (missing data, zeros)

// components.test.ts
- ScoreDisplay renders correct color for score ranges
- RiskCard expands/collapses
- SearchInput debounces correctly
- ProjectCard displays all fields

// pages.test.ts
- Dashboard renders without errors
- Project page renders with mock data
- Profile page renders with mock data
- Report page has correct OG tags
```

---

## Verification

Run after EVERY iteration:

```bash
npm run build   # Must pass with no type errors
npm run lint    # Must pass
npm run test    # All tests must pass
```

Manual checks:
1. `/terminal` - Dashboard renders with mock data
2. Search works for all entity types
3. `/terminal/project/[id]` - Shows score + all 4 risk cards
4. `/terminal/profile/[handle]` - Shows profile analysis
5. `/terminal/watchlist` - Add/remove works, persists on refresh
6. `/terminal/report/[id]` - Public page renders, OG tags present

---

## If Stuck (after 30+ iterations)

1. Create `ralphs/blockers.md` documenting:
   - What specific requirement is failing
   - What was attempted
   - Error messages or test failures
   - Suggested alternative approaches

2. Prioritize core functionality:
   - Search + Project page are most critical
   - Watchlist/Alerts can be simplified
   - Reports can be basic

3. Simplify if needed:
   - Use more mock data instead of real APIs
   - Reduce number of evidence types
   - Skip complex animations

---

## Completion Criteria

ALL of the following must be true:

- [ ] All TypeScript types compile without errors
- [ ] All routes are accessible and render
- [ ] Terminal layout with nav works on desktop and mobile
- [ ] Search resolves all 5 entity types correctly
- [ ] Scoring engine calculates scores with 4 modules
- [ ] Project page shows score + 4 risk cards with evidence
- [ ] Profile page shows X analysis with behavior badges
- [ ] Watchlist persists to localStorage, CRUD works
- [ ] Alert rules can be created (delivery can be mocked)
- [ ] Report page is public, has OG tags
- [ ] All tests pass (minimum 20 test cases)
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

---

## Run Command

```bash
/ralph-loop "$(cat ralphs/CLARP_TERMINAL_RALPH.md)" --max-iterations 100 --completion-promise "CLARP_TERMINAL_COMPLETE"
```

---

When ALL completion criteria are met:

<promise>CLARP_TERMINAL_COMPLETE</promise>
