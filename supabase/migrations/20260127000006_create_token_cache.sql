-- Create token_cache table for caching ticker -> token address mappings
-- This avoids repeated DexScreener lookups for the same tokens across scans

CREATE TABLE IF NOT EXISTS token_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The ticker symbol (e.g., "ZERA", "MON3Y") - normalized to uppercase
  ticker TEXT NOT NULL,
  -- The chain (default solana for now)
  chain TEXT NOT NULL DEFAULT 'solana',
  -- Token address on chain
  token_address TEXT NOT NULL,
  -- Pool/pair address for DexScreener
  pool_address TEXT,
  -- Token metadata
  name TEXT,
  symbol TEXT,
  image_url TEXT,
  dex_type TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Unique constraint on ticker + chain
  CONSTRAINT unique_ticker_chain UNIQUE (ticker, chain)
);

-- Create indexes for fast lookups
CREATE INDEX idx_token_cache_ticker ON token_cache(ticker);
CREATE INDEX idx_token_cache_token_address ON token_cache(token_address);
CREATE INDEX idx_token_cache_updated_at ON token_cache(updated_at);

-- Add comment for documentation
COMMENT ON TABLE token_cache IS 'Cache for ticker -> token address mappings from DexScreener';

-- Enable Row Level Security
ALTER TABLE token_cache ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (public cache)
CREATE POLICY "Allow all operations on token_cache" ON token_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_token_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_token_cache_updated_at
  BEFORE UPDATE ON token_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_token_cache_updated_at();
