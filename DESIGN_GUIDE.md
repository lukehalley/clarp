# Clarp - Design Guide

## Brand Overview

**Clarp ($CLARP)** satirizes the AI agent LARP meta by being a "coding assistant that exclusively generates vaporware."

---

### The "Clarp" Character
The official Clarp mascot is a pixel art creature called "Clarp":
- Simple 4-legged boxy body
- Two dark rectangular eyes
- Terracotta/clay color
- Minimal, cute, memorable
- Retro game aesthetic

### Official $CLARP Mascot: "Clarp Void"

**File:** `/images/clarp-void.svg`

The official $CLARP mascot is an inverted design - a terracotta background with the creature cut out as a black void. This represents:
- **Emptiness** - The void where shipped products should be
- **Inverse** - Everything is backwards in LARP land
- **Negative space** - What remains when you remove the substance
- **The shape of promises** - You can see where the product *should* be

The void Clarp is the perfect mascot for a project that ships nothing - you can literally see through it.

```
┌─────────────────────────────────┐
│  ████████████████████████████   │
│  ████████▀▀▀▀▀▀▀▀▀▀████████    │
│  ████▀▀              ▀▀████    │
│  ██▀▀   ██        ██   ▀▀██    │
│  ██▀▀   ██        ██   ▀▀██    │
│  ████████████████████████████   │
│  ████  ▀▀██  ▀▀██  ▀▀██  ████   │
│  ████    ██    ██    ██  ████   │
│  ████████████████████████████   │
└─────────────────────────────────┘
        clarp-void.svg
```

**Archived variants:** See `/images/old/` for 90+ alternative Clarp variations including melting, glitch, outline, and satirical versions.

---

## Logo Generation

### Tool: oh-my-logo
Generate Clarp style ASCII art logos with:

```bash
# Install/run with npx
npx oh-my-logo "YOUR TEXT" --palette-colors '["#D97757", "#C6613F"]' --filled

# Stacked multi-line
npx oh-my-logo "CLARP" --palette-colors '["#D97757", "#C6613F", "#5E5D59"]' --filled

# Chrome style (minimal shadows)
npx oh-my-logo "CLARP" --palette-colors '["#D97757", "#FAF9F5"]' --filled --block-font chrome
```

See `/logos/` folder for generated assets.

### Generated Logos

| File | Content |
|------|---------|
| `logo-full.txt` | "CLARP" full horizontal |
| `logo-stacked.txt` | Stacked version |
| `logo-ticker.txt` | "$CLARP" ticker |
| `logo-clarp-chrome.txt` | Minimal "CLARP" |

---

## Color Palette

### Primary Colors (Anthropic-derived, corrupted)

| Color | Hex | Usage | Notes |
|-------|-----|-------|-------|
| **Ivory Light** | `#FAF9F5` | Background | Anthropic's signature cream |
| **Slate Dark** | `#141413` | Primary text | Near-black |
| **Clay/Terracotta** | `#D97757` | Accent/CTA | Anthropic's signature orange-coral |
| **Accent Orange** | `#C6613F` | Highlights | Deeper accent |

### Secondary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Ivory Medium** | `#F0EEE6` | Secondary backgrounds |
| **Ivory Dark** | `#E8E6DC` | Cards, containers |
| **Slate Light** | `#5E5D59` | Secondary text |
| **Slate Medium** | `#3D3D3A` | Tertiary text |
| **Cloud Medium** | `#B0AEA5` | Muted elements |
| **Cloud Light** | `#D1CFC5` | Borders |

### "LARP" Accent Colors (Satirical additions)

| Color | Hex | Usage |
|-------|-----|-------|
| **Warning Yellow** | `#FFD93D` | "Under construction" elements |
| **Error Red** | `#E74C3C` | "Feature not found" |
| **Success Green** | `#2ECC71` | "Roadmap completed" (ironic) |
| **LARP Purple** | `#9B59B6` | "Revolutionary tech" badges |

---

## Typography

### Font Stack (Anthropic authentic)

```css
/* Display Sans */
font-family: "Anthropic Sans", Arial, sans-serif;

/* Display Serif */
font-family: "Anthropic Serif", Georgia, sans-serif;

/* Monospace (Terminal) */
font-family: "JetBrains Mono", "Anthropic Mono", monospace;
```

### For Web (Fallbacks)

```css
/* Primary - Clean Sans */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Terminal/Code */
font-family: "JetBrains Mono", "SF Mono", "Fira Code", Consolas, monospace;

/* Serif Accent */
font-family: Georgia, "Times New Roman", serif;
```

### Type Scale

| Style | Size | Weight | Use |
|-------|------|--------|-----|
| Display XL | 3rem (48px) | 600 | Hero headlines |
| Display L | 2rem (32px) | 600 | Section headers |
| Display M | 1.5rem (24px) | 500 | Card titles |
| Body | 1rem (16px) | 400 | Paragraph text |
| Detail | 0.875rem (14px) | 400 | Captions, labels |
| Mono | 0.875rem (14px) | 400 | Code, terminal |

---

## Logo Concepts

### Primary Logo: "Corrupted Clarp"

The Clarp icon (sparkle/asterisk shape) but:
- Glitched/pixelated edges
- One arm "broken" or "under construction"
- Optional: caution tape across it

### Text Treatments

```
┌─────────────────────────────────────┐
│  CLARP                              │
│  ░░░░░░░░░░░░░░░░░░░                │
│  "I'll build your infrastructure"   │
│  (I won't)                          │
└─────────────────────────────────────┘
```

### Logo Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| **Full** | Icon + "Clarp" | Website, docs |
| **Icon Only** | Corrupted Clarp sparkle | Avatar, favicon |
| **Terminal** | ASCII art version | CLI output, tweets |
| **Badge** | "$CLARP" in terminal style | Price displays |

---

## Visual Language

### The Aesthetic: "Corporate Vaporwave meets Developer Tools"

**Combines:**
1. Anthropic's clean, premium feel
2. Terminal/CLI aesthetics
3. "Under construction" 90s web vibes
4. Satirical corporate polish

### Key Visual Elements

| Element | Treatment |
|---------|-----------|
| **Code blocks** | Real-looking but with "// TODO" comments everywhere |
| **Progress bars** | Always stuck at 99% |
| **Loading states** | "Loading revolutionary features..." (never completes) |
| **Buttons** | "Coming Soon" instead of "Get Started" |
| **Badges** | "Verified Vaporware", "Certified LARP" |
| **Terminal prompts** | `$ clarp generate --roadmap` |

### Iconography Style

```
✓ Checkmarks (but crossed out)
⚠ Warning triangles (everywhere)
🚧 Construction barriers
📋 Clipboards with roadmaps
💨 Vapor/smoke effects
⌛ Eternal loading
```

---

## UI Components

### Cards

```
┌────────────────────────────────────┐
│  REVOLUTIONARY FEATURE             │
│  ════════════════════              │
│                                    │
│  [████████████░░░░░░░░] 73%        │
│                                    │
│  Status: Coming Soon™              │
│  ETA: Q∞ 2025                      │
│                                    │
│  [ VIEW ROADMAP ]  [ WISHLIST ]    │
└────────────────────────────────────┘
```

### Terminal Blocks

```css
.terminal {
  background: #141413;
  color: #FAF9F5;
  font-family: "JetBrains Mono", monospace;
  border-radius: 8px;
  padding: 16px;
}

.terminal-prompt::before {
  content: "$ ";
  color: #D97757;
}
```

### Buttons

| State | Style |
|-------|-------|
| Primary | Slate dark bg, ivory text |
| Secondary | Transparent, slate border |
| Disabled | "Coming Soon" - always disabled look |
| Hover | Clay/terracotta accent |

---

## Content Voice

### Tone: Deadpan satirical

- Speaks like an overconfident tech founder
- Uses corporate buzzwords ironically
- Self-aware about building nothing
- Never breaks character

### Example Copy

| Context | Real AI Agents | Clarp |
|---------|-----------------|-------------------|
| Hero | "Code faster with AI" | "Build nothing faster with AI" |
| CTA | "Get Started" | "Get Started (Coming Soon)" |
| Feature | "Understands your codebase" | "Understands your roadmap" |
| Error | "Something went wrong" | "Feature not implemented (as designed)" |

### Taglines

- "I'll build your revolutionary infrastructure (I won't)"
- "Now shipping nothing to production"
- "Your AI that ships roadmaps, not code"
- "AI agents, but for vibes"

---

## Social Media Templates

### Twitter/X Header

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     CLARP                                           │
│     ═══════════════════                             │
│                                                     │
│     The AI coding assistant that                    │
│     exclusively generates vaporware                 │
│                                                     │
│     $CLARP                                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Tweet Format

```
[terminal prompt]
$ clarp generate --project

[output]
✓ Created landing page
✓ Generated roadmap
✓ Added "coming soon" badge
✗ Wrote actual code

$CLARP
```

### Profile Picture

- Glitched/corrupted Clarp icon
- Terminal green or clay orange accent
- Clean circle crop

---

## Website Structure

### Hero Section

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  $ clarp --help                                     │
│                                                     │
│  CLARP                                              │
│  ═══════════════════                                │
│                                                     │
│  The AI coding assistant that exclusively           │
│  generates vaporware.                               │
│                                                     │
│  [ VIEW ROADMAP ]    [ COMING SOON ]                │
│                                                     │
│  CA: [contract address]                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Features Section

Grid of "products" that don't exist:
- Clarp Terminal
- LARPscan
- Clarp x402
- LARP Academy

### Documentation Section

Professional-looking docs for non-existent features (satirical ZAUTH-style)

---

## Animation Guidelines

### Micro-interactions

| Element | Animation |
|---------|-----------|
| Loading bars | Progress up to 99%, then reset |
| Buttons | Slight shake on "Coming Soon" hover |
| Terminal | Typing effect for fake outputs |
| Badges | Subtle glitch/flicker |

### Page Transitions

- Terminal-style: content "types" in
- Glitch effects on navigation
- Progress bar that never completes

---

## Asset Checklist

### Required for Launch

- [ ] Logo (SVG, PNG)
- [ ] Profile picture (400x400)
- [ ] Twitter banner (1500x500)
- [ ] Website favicon
- [ ] OG image (1200x630)
- [ ] Terminal mockup images

### Nice to Have

- [ ] Animated logo (GIF/Lottie)
- [ ] Tweet templates (Figma)
- [ ] Meme templates
- [ ] Badge/sticker designs

---

## Reference Links

### AI Agent Landing Pages (for parody accuracy)
- ai16z.ai
- virtuals.io
- typical crypto "infrastructure" projects

### Inspiration
- Terminal aesthetics
- 90s "under construction" web
- Corporate satire (The Onion style)
- Developer tool landing pages

---

*This guide ensures Clarp looks premium enough to be taken seriously while being obviously satirical to anyone who reads the copy.*
