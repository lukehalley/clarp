-- Sprint 006: Tokenomics & Fee Distribution
-- Database schema for revenue tracking and burns

-- ============================================================================
-- CLEANUP EXISTING (in case of partial migration)
-- ============================================================================
DROP VIEW IF EXISTS tokenomics_stats;
DROP TABLE IF EXISTS burn_transactions CASCADE;
DROP TABLE IF EXISTS revenue_distributions CASCADE;

-- ============================================================================
-- REVENUE DISTRIBUTIONS TABLE
-- Tracks daily fee distributions from Bags.fm creator fees
-- ============================================================================

CREATE TABLE revenue_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Total claimed from Bags creator wallet
  total_claimed DECIMAL(20, 9) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SOL',

  -- Distribution amounts (based on 50/30/20 split)
  profit_amount DECIMAL(20, 9) NOT NULL,
  ops_amount DECIMAL(20, 9) NOT NULL,
  burn_amount DECIMAL(20, 9) NOT NULL,

  -- Transaction signatures
  claim_tx_signature TEXT,
  profit_tx_signature TEXT,
  ops_tx_signature TEXT,
  burn_tx_signature TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Metadata
  processed_at TIMESTAMPTZ
);

-- Index for querying recent distributions
CREATE INDEX idx_revenue_distributions_created_at ON revenue_distributions(created_at DESC);
CREATE INDEX idx_revenue_distributions_status ON revenue_distributions(status);

-- ============================================================================
-- BURN TRANSACTIONS TABLE
-- Tracks individual CLARP burn transactions
-- ============================================================================

CREATE TABLE burn_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Transaction details
  signature TEXT NOT NULL UNIQUE,

  -- Amounts
  clarp_amount DECIMAL(20, 9) NOT NULL,  -- CLARP tokens burned
  sol_spent DECIMAL(20, 9) NOT NULL,     -- SOL used to buy CLARP

  -- Price at time of burn
  price_per_clarp DECIMAL(20, 12),

  -- Link to distribution (if from automated distribution)
  distribution_id UUID REFERENCES revenue_distributions(id),

  -- Status
  confirmed BOOLEAN NOT NULL DEFAULT false,
  block_time BIGINT
);

-- Indexes
CREATE INDEX idx_burn_transactions_created_at ON burn_transactions(created_at DESC);
CREATE INDEX idx_burn_transactions_distribution_id ON burn_transactions(distribution_id);

-- ============================================================================
-- TOKENOMICS STATS VIEW
-- Aggregated stats for dashboard
-- ============================================================================

CREATE OR REPLACE VIEW tokenomics_stats AS
SELECT
  -- Total claimed
  COALESCE(SUM(total_claimed) FILTER (WHERE status = 'completed'), 0) as total_claimed_sol,

  -- Total distributed
  COALESCE(SUM(profit_amount) FILTER (WHERE status = 'completed'), 0) as total_profit_sol,
  COALESCE(SUM(ops_amount) FILTER (WHERE status = 'completed'), 0) as total_ops_sol,
  COALESCE(SUM(burn_amount) FILTER (WHERE status = 'completed'), 0) as total_burn_sol,

  -- Distribution counts
  COUNT(*) FILTER (WHERE status = 'completed') as completed_distributions,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_distributions,

  -- Burn stats from burn_transactions
  (SELECT COALESCE(SUM(clarp_amount), 0) FROM burn_transactions WHERE confirmed = true) as total_clarp_burned,
  (SELECT COUNT(*) FROM burn_transactions WHERE confirmed = true) as total_burn_count,

  -- Last distribution
  MAX(created_at) FILTER (WHERE status = 'completed') as last_distribution_at
FROM revenue_distributions;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE revenue_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE burn_transactions ENABLE ROW LEVEL SECURITY;

-- Public read access for transparency
CREATE POLICY "Allow public read on revenue_distributions" ON revenue_distributions
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on burn_transactions" ON burn_transactions
  FOR SELECT USING (true);

-- Service role insert/update
CREATE POLICY "Allow service insert on revenue_distributions" ON revenue_distributions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update on revenue_distributions" ON revenue_distributions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow service insert on burn_transactions" ON burn_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service update on burn_transactions" ON burn_transactions
  FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE revenue_distributions IS 'Daily revenue distributions from Bags.fm creator fees';
COMMENT ON TABLE burn_transactions IS 'CLARP token burn transaction history';
COMMENT ON VIEW tokenomics_stats IS 'Aggregated tokenomics statistics for dashboard';
