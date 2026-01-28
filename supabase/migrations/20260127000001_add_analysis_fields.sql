-- Add analysis fields to projects table
-- These store enriched data from Grok AI analysis

-- Security Intel (from RugCheck)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS security_intel JSONB;

-- Tokenomics (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tokenomics JSONB;

-- Liquidity Info (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS liquidity JSONB;

-- Tech Stack (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack JSONB;

-- Legal Entity (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS legal_entity JSONB;

-- Affiliations (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS affiliations JSONB;

-- Roadmap (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS roadmap JSONB;

-- Audit Info (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS audit JSONB;

-- Positive Indicators (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS positive_indicators JSONB;

-- Negative Indicators (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS negative_indicators JSONB;

-- Key Findings (from analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key_findings TEXT[];

-- The Story (narrative from Grok)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS the_story TEXT;

-- Controversies (from Grok analysis)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS controversies TEXT[];

-- Discord URL
ALTER TABLE projects ADD COLUMN IF NOT EXISTS discord_url TEXT;

-- Telegram URL
ALTER TABLE projects ADD COLUMN IF NOT EXISTS telegram_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN projects.security_intel IS 'Security analysis from RugCheck: mint/freeze authority, LP lock status, holders';
COMMENT ON COLUMN projects.tokenomics IS 'Token economics: supply, burn mechanism, vesting';
COMMENT ON COLUMN projects.liquidity IS 'Liquidity info: DEX, pool type, locked status';
COMMENT ON COLUMN projects.tech_stack IS 'Technical architecture: blockchain, ZK tech, hardware';
COMMENT ON COLUMN projects.legal_entity IS 'Legal entity info: company name, jurisdiction, registration';
COMMENT ON COLUMN projects.affiliations IS 'Industry affiliations: councils, accelerators, VCs';
COMMENT ON COLUMN projects.roadmap IS 'Project roadmap milestones';
COMMENT ON COLUMN projects.audit IS 'Security audit information';
COMMENT ON COLUMN projects.positive_indicators IS 'Trust-positive signals from analysis';
COMMENT ON COLUMN projects.negative_indicators IS 'Risk indicators from analysis';
COMMENT ON COLUMN projects.key_findings IS 'Key findings from OSINT and AI analysis';
COMMENT ON COLUMN projects.the_story IS 'Narrative summary of the project';
COMMENT ON COLUMN projects.controversies IS 'Known controversies or issues';
COMMENT ON COLUMN projects.discord_url IS 'Discord server URL';
COMMENT ON COLUMN projects.telegram_url IS 'Telegram group URL';
