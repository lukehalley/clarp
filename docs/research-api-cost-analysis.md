# Research API Cost Analysis

Comparing current Grok-only approach vs hybrid multi-source approach.

## Current Setup: Grok Only

### Pricing (grok-4-1-fast)
| Component | Cost |
|-----------|------|
| Input tokens | $0.20 / 1M tokens |
| Output tokens | $0.50 / 1M tokens |
| Cached input | $0.05 / 1M tokens |
| x_search calls | $2.50 / 1K calls |
| web_search calls | $5.00 / 1K calls |

### Per-Scan Cost Estimate (Current)
| Step | Tokens/Calls | Cost |
|------|--------------|------|
| Classification | ~500 in, ~200 out, 1 x_search | $0.003 |
| Full Analysis | ~2K in, ~3K out, 2-5 searches | $0.015 |
| **Total per scan** | | **~$0.02** |

### Monthly Estimate (Current)
| Usage Level | Scans/month | Cost |
|-------------|-------------|------|
| Light | 100 | $2 |
| Medium | 1,000 | $20 |
| Heavy | 10,000 | $200 |

---

## Proposed: Hybrid Multi-Source

### Option A: Grok + Perplexity (Recommended)

**Perplexity Sonar Deep Research Pricing:**
| Component | Cost |
|-----------|------|
| Input tokens | $2.00 / 1M tokens |
| Output tokens | $8.00 / 1M tokens |
| Citation tokens | $2.00 / 1M tokens |
| Search queries | $5.00 / 1K queries |
| Reasoning tokens | $3.00 / 1M tokens |

**Per-Scan Cost (Hybrid):**
| Step | Provider | Est. Cost |
|------|----------|-----------|
| Classification | Grok | $0.003 |
| Factual Research (team, company, funding) | Perplexity | $0.40 |
| Social Analysis (X sentiment) | Grok | $0.015 |
| **Total per scan** | | **~$0.42** |

**Why 20x more expensive but worth it:**
- Perplexity provides **95% citation accuracy** (verifiable sources)
- References **50 sources** per query vs Grok's 0 citations
- Deep research mode does multi-step retrieval
- Grok still handles X-specific analysis (its strength)

### Option B: Grok + Free APIs Only (Current + Enhanced)

Already using:
- GitHub API (free, 5K/hr with token)
- DexScreener API (free)
- Twitter Syndication (free, for avatars)

**Could add:**
| API | Cost | Data |
|-----|------|------|
| CertiK Leaderboard | FREE | Security scores, audit status |
| DefiLlama | FREE | TVL, protocol data |
| CoinGecko | FREE (limited) | Market data |
| Messari | FREE (limited) | Project profiles |

**Per-Scan Cost (Enhanced Free):**
~$0.02 (same as current, just more data sources)

---

## Cost Comparison Table

| Approach | Per Scan | 1K Scans/mo | Quality |
|----------|----------|-------------|---------|
| Grok Only (current) | $0.02 | $20 | Medium - no citations |
| Grok + Free APIs | $0.02 | $20 | Medium+ - more data points |
| Grok + Perplexity | $0.42 | $420 | High - cited, verified |
| Perplexity Only | $0.40 | $400 | High - but no X integration |

---

## Recommendation

### Phase 1: Quick Win (Now)
Add free API integrations:
- CertiK Security Leaderboard (audit data)
- DefiLlama (TVL, protocol metrics)
- Messari free tier (project profiles)

**Cost: $0** | **Effort: Low**

### Phase 2: Premium Tier (Later)
For paid users, add Perplexity deep research:
- Use for initial "deep dive" on new projects
- Cache results aggressively (24-48hr TTL)
- Only 1 Perplexity call per project, not per scan

**Amortized cost with caching:**
- 1 Perplexity call = $0.40
- Cached for 100 user views = $0.004/view

### Phase 3: Enterprise
- Direct integrations with Nansen, Arkham
- Custom CertiK API access
- Real-time on-chain monitoring

---

## Implementation Priority

1. **CertiK scraper** - Free, huge value (security scores)
2. **DefiLlama integration** - Free, TVL data
3. **Perplexity for deep research** - Paid premium feature
4. **Disable Grok search tools** - Test training-data mode (already built)

---

## Sources
- [Perplexity Pricing](https://docs.perplexity.ai/getting-started/pricing)
- [Grok API Pricing](https://docs.x.ai/docs/models)
- [CertiK Leaderboard](https://skynet.certik.com/leaderboards/security)
