# Remotion Animation Prompt for $CLARP

## Project Overview

**$CLARP** is the "First Autonomous Trust Pilot" - a crypto project and KOL reputation scanner that uses polymarket odds + on-chain receipts to detect rug signals before you ape. The satirical vaporware branding is the hook; the product is real.

**Core Product:** CLARP Terminal - Risk scanning for crypto projects and X/Twitter profiles
**Tech Stack:** Next.js 16, React 19, TypeScript, TailwindCSS
**Unique Angle:** 100% of fees go to charity (AI safety research)
**Target Audience:** Crypto degens, traders, researchers who need trust signals

**The "Wow" Moment:** Real rug detection that actually works, wrapped in self-aware satire

---

## Initial Setup

- **Composition size:** 1280x1000px
- **Duration:** 35-40 seconds at 30fps
- **Window style:** macOS terminal with dark theme (Clarp palette)
- **Empty prompt at start

---

## Visual Design Requirements

### Window & Background (From Design Guide)

| Element | Value | Notes |
|---------|-------|-------|
| Desktop Background | `#0a0a0a` | Near-black |
| Window Background | `#141413` | Slate Dark |
| Window Title Bar | `linear-gradient(180deg, #1e1e1c 0%, #141413 100%)` | Subtle gradient |
| Window Border | `#3D3D3A` | Slate Medium |
| Traffic Lights | Standard macOS (red, yellow, green circles) | |

### Text Colors (From Design Guide)

| Element | Hex | Usage |
|---------|-----|-------|
| Primary Text | `#FAF9F5` | Ivory Light - main terminal output |
| Prompt Symbol | `#D97757` | Clay/Terracotta - `$` and cursor |
| Accent Highlight | `#C6613F` | Accent Orange - emphasis |
| Secondary/Muted | `#5E5D59` | Slate Light - secondary text |
| Success | `#2ECC71` | Success Green - checkmarks, low risk |
| Warning | `#FFD93D` | Warning Yellow - medium risk |
| Error/Danger | `#E74C3C` | Error Red - high risk, failures |
| LARP Purple | `#9B59B6` | Purple - satirical badges |

### Typography

```css
/* Terminal/Code */
font-family: "JetBrains Mono", "SF Mono", monospace;
font-size: 14px;
line-height: 1.6;
font-weight: 400;

/* Display Text */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
font-weight: 600;
```

### Effects

| Effect | Value |
|--------|-------|
| Window Shadow | `0 20px 60px rgba(0,0,0,0.6)` |
| Cursor | 2px wide, `#D97757`, 0.7s blink |
| Border Radius | 8px (window) |
| Padding | 16px (terminal content) |

### Animation Timing

| Action | Duration |
|--------|----------|
| Typing speed | 40-60ms per character |
| Command execution delay | 200-400ms |
| Output line reveal | 80ms stagger |
| Easing | `cubic-bezier(0.4, 0.0, 0.2, 1)` |
| Window entrance | `spring({ damping: 15, stiffness: 100 })` |

---

## Animation Sequence

### Scene 1: Window Entrance (0-2s)

**Visual:** macOS terminal window scales up with spring physics on `#0a0a0a` desktop.

**Terminal State:**
```
~/clarp ❯ _
```

**Animation:** Window fades in, spring scale, blinking cursor appears after 500ms.

---

### Scene 2: The Problem (2-7s)

**User types:**
```
~/clarp ❯ clarp scan @crypto_kol_47
```

**After 400ms delay, output appears line by line:**

```
⏺ Scanning @crypto_kol_47...

  fetching 800 posts...
  extracting entities...
  analyzing behavior patterns...
  building evidence pack...

```

**Colors:**
- `⏺` in `#D97757` (terracotta)
- Status lines in `#5E5D59` (muted)
- Ellipsis animates

---

### Scene 3: The Report (7-14s)

**Output continues with report header:**

```
  ┌─────────────────────────────────────────────────────┐
  │  @crypto_kol_47                                     │
  │  "🚀 Full time degen | Not financial advice"        │
  │  ─────────────────────────────────────────────────  │
  │                                                     │
  │  CLARP SCORE:  23/100  ████░░░░░░░░░░  HIGH RISK   │
  │                                                     │
  └─────────────────────────────────────────────────────┘
```

**Animation:**
- Box draws in with ASCII borders
- Score fills left to right, stops at 23
- "HIGH RISK" pulses in `#E74C3C` (error red)

**Key Findings appear:**

```
  ▸ Serial shill: 14 unrelated tokens in 30 days
  ▸ Backlash density: 47 callout posts detected
  ▸ Hype merchant: 89% posts contain "100x" language
```

**Colors:**
- `▸` in `#D97757` (terracotta)
- Findings text in `#FAF9F5` (ivory)
- Numbers highlighted in `#E74C3C` (error red)

---

### Scene 4: Evidence (14-20s)

**New section appears:**

```
  ─── EVIDENCE ───────────────────────────────────────

  SHILLED TOKENS:
  │ $RUGCOIN    → promoted 12x → price: -98%
  │ $SCAMTOKEN  → promoted 8x  → price: -100%
  │ $VAPORCOIN  → promoted 6x  → price: delisted

  BACKLASH:
  │ @whale_watcher: "exit liquidity machine"
  │ @rugged_vic: "promoted 3 rugs this month"
  │ @crypto_sleuth: "dev wallet connected"
```

**Colors:**
- Token names in `#9B59B6` (LARP purple)
- Negative prices in `#E74C3C` (error red)
- Quote handles in `#5E5D59` (muted)
- Quote text in `#FAF9F5` (ivory)

---

### Scene 5: The Flip - Scan a Legit Project (20-27s)

**New command:**

```
~/clarp ❯ clarp scan $CLARP
```

**Output:**

```
⏺ Scanning $CLARP protocol...

  ┌─────────────────────────────────────────────────────┐
  │  $CLARP                                             │
  │  First Autonomous Trust Pilot                       │
  │  ─────────────────────────────────────────────────  │
  │                                                     │
  │  CLARP SCORE:  94/100  ████████████████  VERIFIED  │
  │                                                     │
  └─────────────────────────────────────────────────────┘

  ▸ 100% of fees donated to charity
  ▸ All donations on-chain verifiable
  ▸ No team token allocation
```

**Colors:**
- Score bar fills in `#2ECC71` (success green)
- "VERIFIED" badge in `#2ECC71`
- Checkmarks appear next to each finding

---

### Scene 6: Charity Proof (27-33s)

**Output continues:**

```
  ─── DONATION RECEIPTS ──────────────────────────────

  ✓ 4Kx7...8fGn  →  0.5 SOL   →  2025-01-15
  ✓ 7Hd2...9aLk  →  1.2 SOL   →  2025-01-20
  ✓ 2Mf8...4bQr  →  0.8 SOL   →  2025-01-22

  total donated: 2.5 SOL

  [ click any tx to verify on solscan ]
```

**Colors:**
- `✓` in `#2ECC71` (success green)
- Transaction hashes in `#5E5D59` (muted)
- Amounts in `#2ECC71` (success green)
- Dates in `#5E5D59` (muted)

---

### Scene 7: The Tagline (33-40s)

**Terminal fades to 30% opacity, centered text appears:**

```
$CLARP

polymarket odds + on-chain receipts

the first tool that spots LARPs.

clarp.lukehalley.com
```

**Animation:**
- "$CLARP" in `#D97757` (terracotta), 36px, weight 600
- Tagline in `#FAF9F5` (ivory), 18px, weight 400
- "spots LARPs" - "LARPs" briefly glitches/flickers
- "clarp.lukehalley.com" in `#5E5D59` (slate light), 14px
- Subtle terracotta glow around logo

---

## Technical Specifications

```typescript
// Composition config
export const clarpConfig = {
  width: 1280,
  height: 1000,
  fps: 30,
  durationInFrames: 1200, // 40 seconds
};

// Color palette from Design Guide
export const colors = {
  desktop: '#0a0a0a',
  windowBg: '#141413',
  titleBar: '#1e1e1c',
  border: '#3D3D3A',

  // Primary
  ivoryLight: '#FAF9F5',
  terracotta: '#D97757',
  accentOrange: '#C6613F',
  slateMedium: '#3D3D3A',
  slateLight: '#5E5D59',

  // Semantic
  success: '#2ECC71',
  warning: '#FFD93D',
  error: '#E74C3C',
  larpPurple: '#9B59B6',
};

// Typography
export const fonts = {
  mono: '"JetBrains Mono", "SF Mono", monospace',
  display: '-apple-system, BlinkMacSystemFont, sans-serif',
};
```

### Key Remotion Functions

- `spring()` for window entrance
- `interpolate()` for score bars, opacity transitions
- `useCurrentFrame()` for typing animations
- Custom `TypingText` component with per-character reveal
- `Sequence` components for scene timing

### Sound Design

| Event | Sound |
|-------|-------|
| Typing | Soft mechanical keyboard clicks |
| Command enter | Deeper return key sound |
| High risk reveal | Low warning tone |
| Success/Verified | Bright chime |
| Final reveal | Subtle whoosh |

---

## Export Settings

- **Format:** H.264 / MP4
- **Quality:** High (CRF 18)
- **Resolution:** 1280x1000px
- **Frame Rate:** 30fps
- **Duration:** 40 seconds

---

## Optional Extensions

1. **Glitch effects** on "LARP" text when revealing tagline
2. **Risk score counter** that counts up rapidly for bad KOL, counts smoothly for good project
3. **Easter egg** - brief "ngmi" flash for the bad scan
4. **Mascot cameo** - small Clarp creature peeks in corner at end

---

*This prompt provides complete specifications for implementing the $CLARP promotional animation in Remotion, showcasing the real product: a trust pilot that detects crypto rugs and shady KOLs.*
