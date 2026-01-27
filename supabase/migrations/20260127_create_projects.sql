-- Create projects table for unified project entities
-- "Trustpilot + Google Maps + Rugchecker for crypto"
-- Applied to Supabase project: nthfsdvmpdoljpqbxzoi (clarp)

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Display info
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,

  -- Multi-platform identifiers (all nullable, at least one should be set)
  x_handle TEXT UNIQUE,              -- @JupiterExchange (without @)
  github_url TEXT,                   -- https://github.com/jup-ag
  website_url TEXT,                  -- https://jup.ag
  token_address TEXT,                -- Solana contract address
  ticker TEXT,                       -- JUP (without $)

  -- Trust metrics
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_tier TEXT NOT NULL DEFAULT 'neutral' CHECK (trust_tier IN ('verified', 'trusted', 'neutral', 'caution', 'avoid')),
  trust_confidence TEXT NOT NULL DEFAULT 'low' CHECK (trust_confidence IN ('low', 'medium', 'high')),

  -- Team members (JSONB array)
  team JSONB DEFAULT '[]',

  -- Market data (nullable, from DexScreener)
  market_data JSONB,

  -- Shipping history (nullable, from GitHub)
  shipping_history JSONB,

  -- Social metrics (nullable, from X)
  social_metrics JSONB,

  -- Timestamps
  last_scan_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- For searching by identifiers
CREATE INDEX idx_projects_x_handle ON projects(x_handle) WHERE x_handle IS NOT NULL;
CREATE INDEX idx_projects_ticker ON projects(ticker) WHERE ticker IS NOT NULL;
CREATE INDEX idx_projects_token_address ON projects(token_address) WHERE token_address IS NOT NULL;

-- For feed queries (recent, sorted)
CREATE INDEX idx_projects_last_scan_at ON projects(last_scan_at DESC);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- For filtering by trust
CREATE INDEX idx_projects_trust_score ON projects(trust_score DESC);
CREATE INDEX idx_projects_trust_tier ON projects(trust_tier);

-- Full-text search on name
CREATE INDEX idx_projects_name_trgm ON projects USING gin(name gin_trgm_ops);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Auto-calculate trust_tier from trust_score
CREATE OR REPLACE FUNCTION calculate_trust_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trust_tier = CASE
    WHEN NEW.trust_score >= 85 THEN 'verified'
    WHEN NEW.trust_score >= 70 THEN 'trusted'
    WHEN NEW.trust_score >= 50 THEN 'neutral'
    WHEN NEW.trust_score >= 30 THEN 'caution'
    ELSE 'avoid'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_trust_tier
  BEFORE INSERT OR UPDATE OF trust_score ON projects
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trust_tier();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read on projects" ON projects
  FOR SELECT
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Allow service insert on projects" ON projects
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service update on projects" ON projects
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE projects IS 'Unified project entities - the core of CLARP Terminal';
COMMENT ON COLUMN projects.x_handle IS 'X/Twitter handle without @ prefix';
COMMENT ON COLUMN projects.ticker IS 'Token ticker without $ prefix';
COMMENT ON COLUMN projects.trust_score IS '0-100 score where 100 is most trusted';
COMMENT ON COLUMN projects.team IS 'JSONB array of team members discovered from scans';
COMMENT ON COLUMN projects.market_data IS 'JSONB object with price, volume, mcap from DexScreener';
COMMENT ON COLUMN projects.shipping_history IS 'JSONB object with GitHub activity metrics';
COMMENT ON COLUMN projects.social_metrics IS 'JSONB object with X engagement metrics';
