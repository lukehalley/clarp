-- ============================================================================
-- User Authentication Tables for Phantom Wallet Sign-In
-- ============================================================================

-- Users table (wallet address as identity)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- User's watchlist (saved projects)
CREATE TABLE IF NOT EXISTS user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);

-- User's saved searches
CREATE TABLE IF NOT EXISTS user_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT, -- 'project', 'profile', 'token', etc.
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_searches_user_id ON user_searches(user_id);

-- User's alert rules
CREATE TABLE IF NOT EXISTS user_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_alert_rules_user_id ON user_alert_rules(user_id);

-- User's triggered alerts history
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES user_alert_rules(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  read BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_read ON user_alerts(user_id, read);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own record
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Watchlist policies
CREATE POLICY "Users can view own watchlist" ON user_watchlist
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own watchlist" ON user_watchlist
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own watchlist" ON user_watchlist
  FOR DELETE USING (user_id = auth.uid());

-- Searches policies
CREATE POLICY "Users can view own searches" ON user_searches
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own searches" ON user_searches
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own searches" ON user_searches
  FOR DELETE USING (user_id = auth.uid());

-- Alert rules policies
CREATE POLICY "Users can view own alert rules" ON user_alert_rules
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own alert rules" ON user_alert_rules
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own alert rules" ON user_alert_rules
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own alert rules" ON user_alert_rules
  FOR DELETE USING (user_id = auth.uid());

-- Alerts policies
CREATE POLICY "Users can view own alerts" ON user_alerts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own alerts" ON user_alerts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own alerts" ON user_alerts
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- Service role policies (for API routes with JWT verification)
-- ============================================================================

-- Allow service role to insert users (for wallet sign-up)
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Allow service role full access for API operations
CREATE POLICY "Service role full access watchlist" ON user_watchlist
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access searches" ON user_searches
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access alert_rules" ON user_alert_rules
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access alerts" ON user_alerts
  FOR ALL USING (true) WITH CHECK (true);
