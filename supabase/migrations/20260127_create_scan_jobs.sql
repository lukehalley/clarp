-- Migration: Create scan_jobs table for persistent background scans
-- This allows users to refresh the page and return to check on scan progress

CREATE TABLE IF NOT EXISTS scan_jobs (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  depth INTEGER DEFAULT 200,
  status TEXT NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  status_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for looking up active scans by handle (most common query)
CREATE INDEX IF NOT EXISTS idx_scan_jobs_handle_status ON scan_jobs(handle, status);

-- Index for cleanup of old completed/failed jobs
CREATE INDEX IF NOT EXISTS idx_scan_jobs_completed_at ON scan_jobs(completed_at);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_scan_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_scan_jobs_updated_at
  BEFORE UPDATE ON scan_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_scan_jobs_updated_at();

-- Comment for documentation
COMMENT ON TABLE scan_jobs IS 'Tracks background scan jobs so users can refresh/return and check progress';
COMMENT ON COLUMN scan_jobs.status IS 'One of: queued, fetching, extracting, analyzing, scoring, enriching, complete, failed, cached';
