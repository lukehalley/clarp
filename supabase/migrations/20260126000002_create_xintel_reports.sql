-- Create xintel_reports table for caching X Intel scan reports
-- This migration was applied to Supabase project: nthfsdvmpdoljpqbxzoi (clarp)

CREATE TABLE IF NOT EXISTS xintel_reports (
  handle TEXT PRIMARY KEY,
  report JSONB NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create index on expires_at for efficient cleanup queries
CREATE INDEX idx_xintel_reports_expires_at ON xintel_reports(expires_at);

-- Add comment for documentation
COMMENT ON TABLE xintel_reports IS 'Cache for X Intel scan reports with 6-hour TTL';

-- Enable Row Level Security (but allow all operations for now via anon key)
ALTER TABLE xintel_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is a cache table)
CREATE POLICY "Allow all operations on xintel_reports" ON xintel_reports
  FOR ALL
  USING (true)
  WITH CHECK (true);
