// Website Intelligence Service
// OSINT enrichment using Grok to analyze project websites

import { getGrokClient, isGrokAvailable, GrokApiError } from '@/lib/grok/client';

// ============================================================================
// TYPES
// ============================================================================

export interface WebsiteIntel {
  // Status
  isLive: boolean;
  loadTimeMs?: number;
  lastChecked: Date;

  // Content analysis (from Grok)
  hasDocumentation: boolean;
  hasRoadmap: boolean;
  hasTokenomics: boolean;
  hasTeamPage: boolean;
  hasAuditInfo: boolean;
  hasContactInfo: boolean;
  hasSocialLinks: boolean;

  // Extracted data
  teamMembers?: Array<{
    name: string;
    role?: string;
    linkedIn?: string;
    twitter?: string;
  }>;
  roadmapItems?: Array<{
    milestone: string;
    status: 'completed' | 'in-progress' | 'upcoming';
    targetDate?: string;
  }>;
  tokenomicsData?: {
    totalSupply?: string;
    distribution?: Record<string, string>;
    vestingInfo?: string;
  };
  auditInfo?: Array<{
    auditor: string;
    date?: string;
    reportUrl?: string;
  }>;

  // Red flags
  redFlags: string[];

  // Trust indicators
  trustIndicators: string[];

  // Overall assessment
  websiteQuality: 'professional' | 'basic' | 'suspicious' | 'unknown';
  qualityScore: number; // 0-100

  // Raw analysis
  rawAnalysis?: string;
}

// ============================================================================
// WEBSITE ANALYSIS PROMPT
// ============================================================================

const WEBSITE_ANALYSIS_PROMPT = `Analyze this crypto project website for trust indicators and red flags.

Website: {url}

Use web_search to access and analyze the website content. Look for:

1. TRUST INDICATORS:
   - Professional documentation
   - Clear team information with verifiable identities
   - Published audit reports
   - Roadmap with realistic milestones
   - Contact information
   - Social media presence

2. RED FLAGS:
   - Anonymous team
   - Unrealistic promises (guaranteed returns, "100x")
   - No whitepaper or documentation
   - No audit information
   - Fake testimonials
   - Countdown timers creating urgency
   - Missing contact information

3. EXTRACT DATA:
   - Team members (names, roles, social links)
   - Roadmap items and their status
   - Tokenomics if available
   - Audit information

Return JSON:
{
  "isLive": boolean,
  "hasDocumentation": boolean,
  "hasRoadmap": boolean,
  "hasTokenomics": boolean,
  "hasTeamPage": boolean,
  "hasAuditInfo": boolean,
  "hasContactInfo": boolean,
  "hasSocialLinks": boolean,
  "teamMembers": [{"name":"","role":"","linkedIn":"","twitter":""}],
  "roadmapItems": [{"milestone":"","status":"completed|in-progress|upcoming","targetDate":""}],
  "tokenomicsData": {"totalSupply":"","distribution":{},"vestingInfo":""},
  "auditInfo": [{"auditor":"","date":"","reportUrl":""}],
  "redFlags": ["flag1","flag2"],
  "trustIndicators": ["indicator1","indicator2"],
  "websiteQuality": "professional|basic|suspicious|unknown",
  "qualityScore": 0-100,
  "summary": "1-2 sentence summary"
}

Return ONLY valid JSON.`;

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Analyze a website using Grok's web_search capability
 */
export async function analyzeWebsite(websiteUrl: string): Promise<WebsiteIntel | null> {
  if (!isGrokAvailable()) {
    console.log('[WebsiteIntel] Grok not available, skipping website analysis');
    return null;
  }

  // Validate URL
  try {
    new URL(websiteUrl);
  } catch {
    console.log(`[WebsiteIntel] Invalid URL: ${websiteUrl}`);
    return null;
  }

  console.log(`[WebsiteIntel] Analyzing website: ${websiteUrl}`);
  const startTime = Date.now();

  try {
    const grokClient = getGrokClient();
    const prompt = WEBSITE_ANALYSIS_PROMPT.replace('{url}', websiteUrl);

    const { text, citations } = await grokClient.research(prompt);
    const loadTimeMs = Date.now() - startTime;

    // Parse the JSON response
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.warn('[WebsiteIntel] Failed to parse JSON response');
      return createDefaultResult(websiteUrl, false, loadTimeMs, text);
    }

    try {
      const parsed = JSON.parse(jsonMatch[1]);
      console.log(`[WebsiteIntel] Analysis complete for ${websiteUrl}: quality=${parsed.websiteQuality}, score=${parsed.qualityScore}`);

      return {
        isLive: Boolean(parsed.isLive ?? true),
        loadTimeMs,
        lastChecked: new Date(),
        hasDocumentation: Boolean(parsed.hasDocumentation),
        hasRoadmap: Boolean(parsed.hasRoadmap),
        hasTokenomics: Boolean(parsed.hasTokenomics),
        hasTeamPage: Boolean(parsed.hasTeamPage),
        hasAuditInfo: Boolean(parsed.hasAuditInfo),
        hasContactInfo: Boolean(parsed.hasContactInfo),
        hasSocialLinks: Boolean(parsed.hasSocialLinks),
        teamMembers: Array.isArray(parsed.teamMembers) ? parsed.teamMembers : undefined,
        roadmapItems: Array.isArray(parsed.roadmapItems) ? parsed.roadmapItems : undefined,
        tokenomicsData: parsed.tokenomicsData || undefined,
        auditInfo: Array.isArray(parsed.auditInfo) ? parsed.auditInfo : undefined,
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
        trustIndicators: Array.isArray(parsed.trustIndicators) ? parsed.trustIndicators : [],
        websiteQuality: normalizeQuality(parsed.websiteQuality),
        qualityScore: typeof parsed.qualityScore === 'number' ? Math.max(0, Math.min(100, parsed.qualityScore)) : 50,
        rawAnalysis: text,
      };
    } catch (parseError) {
      console.error('[WebsiteIntel] JSON parse error:', parseError);
      return createDefaultResult(websiteUrl, true, loadTimeMs, text);
    }
  } catch (error) {
    console.error('[WebsiteIntel] Analysis error:', error);

    if (error instanceof GrokApiError) {
      throw error;
    }

    return createDefaultResult(websiteUrl, false, Date.now() - startTime);
  }
}

/**
 * Quick check if a website is accessible
 */
export async function checkWebsiteLive(url: string): Promise<{
  isLive: boolean;
  statusCode?: number;
  loadTimeMs?: number;
}> {
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'CLARP-Terminal/1.0',
      },
    });

    clearTimeout(timeout);

    return {
      isLive: response.ok,
      statusCode: response.status,
      loadTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return { isLive: false };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizeQuality(quality: string | undefined): WebsiteIntel['websiteQuality'] {
  const normalized = String(quality || '').toLowerCase();
  if (normalized === 'professional') return 'professional';
  if (normalized === 'basic') return 'basic';
  if (normalized === 'suspicious') return 'suspicious';
  return 'unknown';
}

function createDefaultResult(
  url: string,
  isLive: boolean,
  loadTimeMs?: number,
  rawAnalysis?: string
): WebsiteIntel {
  return {
    isLive,
    loadTimeMs,
    lastChecked: new Date(),
    hasDocumentation: false,
    hasRoadmap: false,
    hasTokenomics: false,
    hasTeamPage: false,
    hasAuditInfo: false,
    hasContactInfo: false,
    hasSocialLinks: false,
    redFlags: isLive ? [] : ['Website not accessible'],
    trustIndicators: [],
    websiteQuality: isLive ? 'unknown' : 'suspicious',
    qualityScore: isLive ? 50 : 20,
    rawAnalysis,
  };
}
