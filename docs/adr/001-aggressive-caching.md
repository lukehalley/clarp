# ADR 001: Aggressive Caching for X Intel Profile Scans

## Status
Accepted

## Date
2026-01-27

## Context

X Intel profile scans use Grok's x_search and web_search tools to analyze Twitter/X profiles for crypto scam risk. Each scan costs approximately **$0.03-0.04** broken down as:

- 3-4 X searches × $0.005 = $0.015-0.02
- ~15K tokens × model rate = $0.01-0.02

### Cost Analysis

| Approach | Cost per scan | 100 scans | 1000 scans |
|----------|--------------|-----------|------------|
| No caching | $0.035 | $3.50 | $35.00 |
| 6hr cache (previous) | ~$0.02 | ~$2.00 | ~$20.00 |
| 24hr cache (new) | ~$0.007 | ~$0.70 | ~$7.00 |

Assumptions for cached costs:
- Popular accounts scanned multiple times per day
- ~80% cache hit rate with 24hr TTL vs ~50% with 6hr TTL

### Alternatives Considered

1. **X API Direct** - $200/mo minimum, only makes sense at 5000+ scans/month
2. **Third-party scrapers** - Similar cost to Grok, more complexity
3. **User OAuth login** - Free tier can't read other users' tweets
4. **Browser extension** - Good long-term option, high dev effort
5. **Aggressive caching** - Quickest win, ~50-80% cost reduction

## Decision

Increase cache TTL from 6 hours to 24 hours for X Intel profile scan results.

### Implementation

1. **In-memory cache**: `CACHE_TTL_MS = 24 * 60 * 60 * 1000` (24 hours)
2. **Supabase cache**: `xintel_reports.expires_at` set to 24 hours from scan time
3. **Force refresh**: Users can bypass cache with `force: true` parameter

### Trade-offs

**Pros:**
- ~50-80% cost reduction for repeated scans
- Faster response for cached profiles
- Reduced API rate limit pressure

**Cons:**
- Stale data for up to 24 hours
- May miss new scam allegations posted within cache window
- Users may not see latest tweets

### Mitigation

- Users can force refresh if they need fresh data
- UI shows cache age so users know data freshness
- For high-risk profiles, consider shorter TTL in future

## Files Changed

- `lib/terminal/xintel/scan-service.ts` - Updated `CACHE_TTL_MS` to 24 hours

## Future Considerations

1. **Tiered caching**: Shorter TTL for high-risk profiles, longer for trusted accounts
2. **Incremental updates**: Only fetch new tweets since last scan
3. **Community cache**: Share scan results across all users (with privacy controls)
4. **Browser extension**: Offload data collection to client-side
