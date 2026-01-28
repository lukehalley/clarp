-- Add OSINT (Open Source Intelligence) fields to projects table
-- This stores enriched data from GitHub API and website checks

-- GitHub Intelligence (from GitHub API - free!)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_intel JSONB;

-- Website Intelligence (from status checks)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS website_intel JSONB;

-- Add comment for documentation
COMMENT ON COLUMN projects.github_intel IS 'GitHub repository intelligence: stars, forks, contributors, commits, health score';
COMMENT ON COLUMN projects.website_intel IS 'Website intelligence: live status, quality score, red flags';
