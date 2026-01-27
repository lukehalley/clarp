-- Token Gate: Rate Limiting & Revenue Distribution
-- Sprint 004: Wallet Integration & Smart Contracts

-- ============================================================================
-- SCAN USAGE TRACKING
-- ============================================================================

-- Track scan usage for rate limiting
CREATE TABLE IF NOT EXISTS scan_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT,              -- NULL for anonymous users
  ip_hash TEXT,             -- Hashed IP for anonymous rate limiting
  handle TEXT NOT NULL,     -- Twitter handle scanned
  tier TEXT NOT NULL DEFAULT 'free',
  cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient daily count queries by wallet
CREATE INDEX IF NOT EXISTS idx_scan_usage_wallet_date
ON scan_usage (wallet, created_at)
WHERE wallet IS NOT NULL;

-- Index for efficient daily count queries by IP
CREATE INDEX IF NOT EXISTS idx_scan_usage_ip_date
ON scan_usage (ip_hash, created_at)
WHERE ip_hash IS NOT NULL;

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_scan_usage_created
ON scan_usage (created_at);

-- ============================================================================
-- USER TIER CACHE
-- ============================================================================

-- Cache user tiers to reduce RPC calls
CREATE TABLE IF NOT EXISTS user_tier_cache (
  wallet TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  balance BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REVENUE DISTRIBUTIONS
-- ============================================================================

-- Log revenue distributions for transparency
CREATE TABLE IF NOT EXISTS revenue_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_sol DECIMAL(18, 9) NOT NULL,
  profit_sol DECIMAL(18, 9) NOT NULL,
  operations_sol DECIMAL(18, 9) NOT NULL,
  burn_sol DECIMAL(18, 9) NOT NULL,
  distribution_tx TEXT NOT NULL,
  burn_tx TEXT,
  clarp_burned BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BURN HISTORY
-- ============================================================================

-- Track all CLARP burns for analytics
CREATE TABLE IF NOT EXISTS burn_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount BIGINT NOT NULL,
  sol_value DECIMAL(18, 9) NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE scan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tier_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE burn_history ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by API routes)
CREATE POLICY "Service role full access on scan_usage"
ON scan_usage FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on user_tier_cache"
ON user_tier_cache FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on revenue_distributions"
ON revenue_distributions FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on burn_history"
ON burn_history FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get daily scan count for a wallet or IP
CREATE OR REPLACE FUNCTION get_daily_scan_count(
  p_wallet TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM scan_usage
  WHERE created_at >= CURRENT_DATE
    AND (
      (p_wallet IS NOT NULL AND wallet = p_wallet)
      OR (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash)
    );

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;
