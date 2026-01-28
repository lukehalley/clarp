// X Intel Scan Service
// Handles scan job management and report generation
// Uses Grok with live X search (no separate X API needed)

import {
  ScanJob,
  ScanStatus,
  XIntelReport,
  SCAN_STATUS_PROGRESS,
} from '@/types/xintel';
import { getGrokClient, isGrokAvailable } from '@/lib/grok/client';
import { grokAnalysisToReport, enrichShilledEntitiesWithTokenData } from './transformers';
import {
  isSupabaseAvailable,
  getCachedReportFromSupabase,
  cacheReportInSupabase,
  deleteCachedReportFromSupabase,
  getCacheAgeFromSupabase,
  createScanJob,
  updateScanJob,
  getScanJobFromDb,
  getActiveScanJobByHandle,
} from '@/lib/supabase/client';
import { upsertProjectByHandle, upsertProjectByTokenAddress } from '@/lib/terminal/project-service';
import type { GrokAnalysisResult, GrokCommunityAnalysisResult } from '@/lib/grok/types';
import { fetchGitHubRepoIntel, checkWebsiteLive, type GitHubRepoIntel } from '@/lib/terminal/osint';
import {
  resolveEntity,
  detectInputType,
  type ResolvedEntity,
  type ResolutionResult,
  type InputType,
} from '@/lib/terminal/entity-resolver';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Check if real API mode is enabled (only needs Grok with x_search capability)
const USE_REAL_API = process.env.ENABLE_REAL_X_API === 'true'
  && isGrokAvailable();

// Check if search tools should be disabled for deeper training-data analysis
// Set DISABLE_SEARCH_TOOLS=true to use Grok's knowledge instead of live search
const DISABLE_SEARCH_TOOLS = process.env.DISABLE_SEARCH_TOOLS === 'true';

// In-memory job storage (would be Redis/DB in production)
const scanJobs: Map<string, ScanJob> = new Map();

// Report cache (would be Redis/DB in production)
const reportCache: Map<string, { report: XIntelReport; cachedAt: Date }> = new Map();

// Default cache TTL: 24 hours (aggressive caching to reduce Grok API costs)
// See docs/adr/001-aggressive-caching.md for decision rationale
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Rate limiting (per handle)
const scanCooldowns: Map<string, Date> = new Map();
const COOLDOWN_MS = 60 * 1000; // 1 minute between scans of same handle

/**
 * Check if a handle is rate limited (for preflight checks)
 */
export function checkHandleCooldown(handle: string): { limited: boolean; waitSeconds: number } {
  const normalizedHandle = handle.toLowerCase().replace('@', '');
  const lastScan = scanCooldowns.get(normalizedHandle);

  if (!lastScan) {
    return { limited: false, waitSeconds: 0 };
  }

  const elapsed = Date.now() - lastScan.getTime();
  if (elapsed < COOLDOWN_MS) {
    return {
      limited: true,
      waitSeconds: Math.ceil((COOLDOWN_MS - elapsed) / 1000),
    };
  }

  return { limited: false, waitSeconds: 0 };
}

// OSINT entity cache (for passing OSINT gaps to Grok)
// Stores resolved entities by handle so processScanJob can extract gaps
const osintEntityCache: Map<string, ResolvedEntity> = new Map();

// ============================================================================
// PUBLIC API
// ============================================================================

export interface SubmitScanOptions {
  handle: string;
  depth?: number;
  force?: boolean;
}

export interface SubmitScanResult {
  jobId: string;
  handle?: string;
  status: ScanStatus;
  cached: boolean;
  error?: string;
  useRealApi?: boolean;
}

// ============================================================================
// UNIVERSAL SCAN (ANY INPUT TYPE)
// ============================================================================

export interface UniversalScanOptions {
  input: string;              // Any: token address, X handle, website, GitHub URL
  depth?: number;
  force?: boolean;
  skipXAnalysis?: boolean;    // Skip Grok X analysis (just OSINT)
}

export interface UniversalScanResult {
  jobId: string;
  inputType: InputType;
  canonicalId?: string;
  status: ScanStatus;
  cached: boolean;
  error?: string;
  // OSINT-only data (available immediately)
  osintData?: ResolvedEntity;
  // Full data (after X analysis)
  fullReport?: XIntelReport;
}

/**
 * Submit a universal scan that accepts any input type
 * Uses entity resolver for OSINT, then optionally Grok for X analysis
 *
 * Flow:
 * 1. Entity resolver gathers all OSINT data (FREE)
 * 2. If X handle found AND skipXAnalysis=false, run Grok analysis (PAID)
 * 3. Combine into comprehensive report
 */
export async function submitUniversalScan(options: UniversalScanOptions): Promise<UniversalScanResult> {
  const { input, depth = 200, force = false, skipXAnalysis = false } = options;

  console.log(`[UniversalScan] Starting scan for: "${input.slice(0, 50)}..."`);

  // Step 1: Detect input type
  const inputType = detectInputType(input);
  console.log(`[UniversalScan] Detected input type: ${inputType}`);

  // Step 2: Run entity resolver (FREE OSINT)
  console.log(`[UniversalScan] Running entity resolver...`);
  const resolutionResult = await resolveEntity(input);

  if (!resolutionResult.success || !resolutionResult.entity) {
    return {
      jobId: '',
      inputType,
      status: 'failed',
      cached: false,
      error: resolutionResult.error || 'Failed to resolve entity',
    };
  }

  const entity = resolutionResult.entity;
  console.log(`[UniversalScan] Entity resolved: ${entity.canonicalId}, confidence: ${entity.confidence}`);

  // Log what OSINT data we found (for debugging)
  console.log(`[UniversalScan] OSINT Summary:`);
  console.log(`  - X Handle: ${entity.xHandle || 'not found'}`);
  console.log(`  - Website: ${entity.website || 'not found'}`);
  console.log(`  - GitHub: ${entity.github || 'not found'}`);
  console.log(`  - Telegram: ${entity.telegram || 'not found'}`);
  console.log(`  - Discord: ${entity.discord || 'not found'}`);
  console.log(`  - Team members: ${entity.discoveredTeam?.length || 0}`);
  console.log(`  - Risk flags: ${entity.riskFlags?.length || 0}`);
  console.log(`  - Legitimacy signals: ${entity.legitimacySignals?.length || 0}`);

  if (entity.securityIntel?.isAccessible) {
    console.log(`  - RugCheck score: ${entity.securityIntel.normalizedScore}/10`);
  }
  if (entity.domainIntel?.isAccessible) {
    console.log(`  - Domain age: ${entity.domainIntel.ageInDays} days`);
  }
  if (entity.marketIntel?.priceUsd) {
    console.log(`  - Price: $${entity.marketIntel.priceUsd}`);
  }

  // If no X handle or skipXAnalysis, check for X community URL or return OSINT-only result
  if (!entity.xHandle || skipXAnalysis) {
    console.log(`[UniversalScan] No X handle${entity.xCommunityUrl ? ', but found X community URL' : ''} - ${entity.xCommunityUrl ? 'running community analysis' : 'returning OSINT-only result'}`);

    // Try X community analysis if we have a community URL
    let communityAnalysis: GrokCommunityAnalysisResult | null = null;
    if (entity.xCommunityUrl && !skipXAnalysis && isGrokAvailable()) {
      try {
        console.log(`[UniversalScan] Analyzing X community: ${entity.xCommunityUrl}`);
        const grokClient = getGrokClient();
        communityAnalysis = await grokClient.analyzeCommunity(entity.xCommunityUrl);
        console.log(`[UniversalScan] Community analysis complete: ${communityAnalysis.communityName}, health: ${communityAnalysis.verdict.communityHealth}`);

        // Extract X handle from community if found
        if (communityAnalysis.projectInfo?.xHandle && !entity.xHandle) {
          console.log(`[UniversalScan] Community analysis found X handle: @${communityAnalysis.projectInfo.xHandle}`);
          // We could trigger a full X handle scan here if desired, but for now just log it
        }
      } catch (err) {
        console.error(`[UniversalScan] Community analysis failed:`, err);
      }
    }

    // Build key findings from OSINT + community analysis
    const keyFindings: string[] = [
      ...(entity.securityIntel?.isRugged ? ['⚠️ FLAGGED AS RUG PULL'] : []),
      ...(entity.securityIntel?.mintAuthority === 'active' ? ['Mint authority active'] : []),
      ...(entity.securityIntel?.freezeAuthority === 'active' ? ['Freeze authority active'] : []),
    ];

    // Add community analysis findings
    if (communityAnalysis) {
      keyFindings.push(`X Community: ${communityAnalysis.communityName || 'Analyzed'}`);
      if (communityAnalysis.memberCount) {
        keyFindings.push(`Community members: ${communityAnalysis.memberCount.toLocaleString()}`);
      }
      if (communityAnalysis.communitySignals?.sentiment) {
        keyFindings.push(`Community sentiment: ${communityAnalysis.communitySignals.sentiment}`);
      }
      // Add key findings from community analysis
      if (communityAnalysis.keyFindings?.length > 0) {
        keyFindings.push(...communityAnalysis.keyFindings.slice(0, 3));
      }
      // Add red flags from community
      if (communityAnalysis.communitySignals?.redFlags?.length) {
        keyFindings.push(...communityAnalysis.communitySignals.redFlags.slice(0, 2).map((f: string) => `⚠️ ${f}`));
      }
    } else if (entity.xCommunityUrl) {
      keyFindings.push(`X Community: ${entity.xCommunityUrl}`);
    }

    if (!communityAnalysis) {
      keyFindings.push('OSINT-only scan (no X handle found)');
    }

    // Calculate trust score based on community analysis if available
    const baseScore = communityAnalysis ? communityAnalysis.verdict.legitimacyScore * 10 : 50;
    const trustTier = baseScore >= 70 ? 'trusted' as const :
                      baseScore >= 40 ? 'neutral' as const : 'caution' as const;

    // Save the project to DB so redirect works (even without X handle)
    if (isSupabaseAvailable() && entity.tokenAddresses?.[0]?.address) {
      const tokenAddress = entity.tokenAddresses[0].address;
      const projectData = {
        name: entity.name || entity.symbol || communityAnalysis?.projectInfo?.name || `Token ${tokenAddress.slice(0, 8)}...`,
        description: entity.description || communityAnalysis?.description || undefined,
        avatarUrl: entity.imageUrl || undefined,
        tokenAddress,
        ticker: entity.symbol || communityAnalysis?.projectInfo?.ticker?.replace('$', '') || undefined,
        websiteUrl: entity.website || communityAnalysis?.projectInfo?.website || undefined,
        githubUrl: entity.github || undefined,
        telegramUrl: entity.telegram || undefined,
        discordUrl: entity.discord || undefined,
        xCommunityUrl: entity.xCommunityUrl || undefined,
        trustScore: {
          score: baseScore,
          tier: trustTier,
          confidence: communityAnalysis ? 'medium' as const : 'low' as const,
          lastUpdated: new Date(),
        },
        marketData: entity.marketIntel ? {
          price: entity.marketIntel.priceUsd || 0,
          priceChange24h: entity.marketIntel.priceChange24h || 0,
          marketCap: entity.marketIntel.marketCap,
          volume24h: entity.marketIntel.volume24h,
          liquidity: entity.marketIntel.liquidity,
        } : undefined,
        securityIntel: entity.securityIntel?.isAccessible ? {
          mintAuthorityEnabled: entity.securityIntel.mintAuthority === 'active',
          freezeAuthorityEnabled: entity.securityIntel.freezeAuthority === 'active',
          lpLocked: entity.securityIntel.lpLocked === true,
          holdersCount: entity.securityIntel.totalHolders,
          risks: entity.securityIntel.risks?.map(r => r.description || r.name) || [],
        } : undefined,
        keyFindings,
        // Store community analysis data
        communityIntel: communityAnalysis ? {
          communityUrl: communityAnalysis.communityUrl,
          communityName: communityAnalysis.communityName,
          memberCount: communityAnalysis.memberCount,
          isActive: communityAnalysis.isActive,
          sentiment: communityAnalysis.communitySignals?.sentiment,
          healthScore: communityAnalysis.verdict.communityHealth,
          legitimacyScore: communityAnalysis.verdict.legitimacyScore,
          analyzedAt: new Date(),
        } : undefined,
        lastScanAt: new Date(),
      };

      // Await the save to prevent race condition with redirect
      try {
        const savedProject = await upsertProjectByTokenAddress(tokenAddress, projectData);
        if (savedProject) {
          console.log(`[UniversalScan] Saved ${communityAnalysis ? 'community-enhanced' : 'OSINT-only'} project: ${savedProject.name} (id: ${savedProject.id})`);
        } else {
          console.warn(`[UniversalScan] Failed to save project for token ${tokenAddress.slice(0, 8)}... - upsert returned null`);
        }
      } catch (err) {
        console.error('[UniversalScan] Failed to save project:', err);
      }
    }

    return {
      jobId: `osint_${entity.canonicalId}_${Date.now()}`,
      inputType,
      canonicalId: entity.canonicalId,
      status: 'complete',
      cached: false,
      osintData: entity,
    };
  }

  // Step 3: Run X analysis via existing scan flow
  console.log(`[UniversalScan] X handle found (@${entity.xHandle}), running X analysis...`);

  // Store OSINT entity for the scan processor to use for gap-filling
  osintEntityCache.set(entity.xHandle.toLowerCase(), entity);

  // Save OSINT project immediately so user can see data while AI analyzes
  // This will be enriched later when the X analysis completes
  // IMPORTANT: Await the save to prevent 404 race condition on redirect
  if (isSupabaseAvailable() && entity.tokenAddresses?.[0]?.address) {
    const tokenAddress = entity.tokenAddresses[0].address;
    const osintProjectData = {
      name: entity.name || entity.symbol || `Token ${tokenAddress.slice(0, 8)}...`,
      description: entity.description || undefined,
      avatarUrl: entity.imageUrl || undefined,
      tokenAddress,
      ticker: entity.symbol || undefined,
      xHandle: entity.xHandle,
      websiteUrl: entity.website || undefined,
      githubUrl: entity.github || undefined,
      telegramUrl: entity.telegram || undefined,
      discordUrl: entity.discord || undefined,
      trustScore: {
        score: 50, // Preliminary score, will be updated after AI analysis
        tier: 'neutral' as const,
        confidence: 'low' as const,
        lastUpdated: new Date(),
      },
      marketData: entity.marketIntel ? {
        price: entity.marketIntel.priceUsd || 0,
        priceChange24h: entity.marketIntel.priceChange24h || 0,
        marketCap: entity.marketIntel.marketCap,
        volume24h: entity.marketIntel.volume24h,
        liquidity: entity.marketIntel.liquidity,
      } : undefined,
      securityIntel: entity.securityIntel?.isAccessible ? {
        mintAuthorityEnabled: entity.securityIntel.mintAuthority === 'active',
        freezeAuthorityEnabled: entity.securityIntel.freezeAuthority === 'active',
        lpLocked: entity.securityIntel.lpLocked === true,
        holdersCount: entity.securityIntel.totalHolders,
        risks: entity.securityIntel.risks?.map(r => r.description || r.name) || [],
      } : undefined,
      keyFindings: [
        ...(entity.securityIntel?.isRugged ? ['⚠️ FLAGGED AS RUG PULL'] : []),
        ...(entity.securityIntel?.mintAuthority === 'active' ? ['Mint authority active'] : []),
        ...(entity.securityIntel?.freezeAuthority === 'active' ? ['Freeze authority active'] : []),
        '⏳ AI analysis in progress...',
      ],
      lastScanAt: new Date(),
    };

    // Await the save to prevent 404 race condition with redirect
    try {
      const savedProject = await upsertProjectByTokenAddress(tokenAddress, osintProjectData);
      if (savedProject) {
        console.log(`[UniversalScan] Saved preliminary OSINT project: ${savedProject.name} (id: ${savedProject.id})`);
      } else {
        // This shouldn't happen anymore with the x_handle check fix, but log for debugging
        console.warn(`[UniversalScan] Failed to save project for token ${tokenAddress.slice(0, 8)}... - upsert returned null`);
      }
    } catch (err) {
      console.error('[UniversalScan] Failed to save preliminary project:', err);
    }
  }

  const xScanResult = await submitScan({
    handle: entity.xHandle,
    depth,
    force,
  });

  // If cached, get the cached report and merge with OSINT
  if (xScanResult.status === 'cached') {
    try {
      const cachedReport = await getCachedReport(entity.xHandle);
      return {
        jobId: xScanResult.jobId,
        inputType,
        canonicalId: entity.canonicalId,
        status: 'complete',
        cached: true,
        osintData: entity,
        fullReport: mergeOsintWithReport(entity, cachedReport),
      };
    } catch (err) {
      console.error(`[UniversalScan] Failed to get cached report:`, err);
    }
  }

  // Return result with OSINT data - X analysis running in background
  return {
    jobId: xScanResult.jobId,
    inputType,
    canonicalId: entity.canonicalId,
    status: xScanResult.status,
    cached: xScanResult.cached,
    error: xScanResult.error,
    osintData: entity,
  };
}

/**
 * Merge OSINT entity data with X Intel report
 */
function mergeOsintWithReport(entity: ResolvedEntity, report: XIntelReport): XIntelReport {
  const merged = { ...report };

  // Add OSINT findings to key findings
  const osintFindings: typeof report.keyFindings = [];

  // Security findings
  if (entity.securityIntel?.isAccessible) {
    const sec = entity.securityIntel;
    if (sec.isRugged) {
      osintFindings.push({
        id: 'osint_rugged',
        title: 'Token Flagged as Rug Pull',
        description: 'This token has been flagged as a rug pull by RugCheck.xyz',
        severity: 'critical',
        evidenceIds: [],
      });
    }
    if (sec.mintAuthority === 'active') {
      osintFindings.push({
        id: 'osint_mint_active',
        title: 'Mint Authority Active',
        description: 'The token mint authority is still active, meaning unlimited tokens can be created.',
        severity: 'critical',
        evidenceIds: [],
      });
    }
    if (sec.freezeAuthority === 'active') {
      osintFindings.push({
        id: 'osint_freeze_active',
        title: 'Freeze Authority Active',
        description: 'The token freeze authority is active, meaning your tokens can be frozen at any time.',
        severity: 'critical',
        evidenceIds: [],
      });
    }
    if (sec.lpLocked === false && sec.totalLiquidityUsd && sec.totalLiquidityUsd > 1000) {
      osintFindings.push({
        id: 'osint_lp_unlocked',
        title: 'Liquidity Not Locked',
        description: `$${sec.totalLiquidityUsd.toLocaleString()} in liquidity is not locked and can be pulled at any time.`,
        severity: 'warning',
        evidenceIds: [],
      });
    }
  }

  // Domain age findings
  if (entity.domainIntel?.isAccessible && entity.domainIntel.ageRisk === 'new') {
    osintFindings.push({
      id: 'osint_new_domain',
      title: 'Very New Domain',
      description: `Website domain was registered only ${entity.domainIntel.ageInDays} days ago.`,
      severity: 'warning',
      evidenceIds: [],
    });
  }

  // GitHub findings (positive)
  if (entity.githubIntel?.repo) {
    const gh = entity.githubIntel.repo;
    if (gh.stars >= 100) {
      osintFindings.push({
        id: 'osint_gh_popular',
        title: 'Active GitHub Repository',
        description: `GitHub repo has ${gh.stars} stars and ${entity.githubIntel.contributors?.length || 0} contributors.`,
        severity: 'info',
        evidenceIds: [],
      });
    }
  }

  // CoinGecko listing (positive)
  if (entity.marketIntel?.isListed) {
    osintFindings.push({
      id: 'osint_coingecko',
      title: 'Listed on CoinGecko',
      description: 'Token is listed on CoinGecko, indicating some level of market recognition.',
      severity: 'info',
      evidenceIds: [],
    });
  }

  // Merge findings
  merged.keyFindings = [...osintFindings, ...report.keyFindings];

  // Add OSINT disclaimer
  merged.disclaimer = `${report.disclaimer} OSINT data enriched from: ${[
    entity.securityIntel?.isAccessible ? 'RugCheck' : null,
    entity.marketIntel?.sources?.join(', ') || null,
    entity.domainIntel?.isAccessible ? 'RDAP' : null,
    entity.historyIntel?.hasArchives ? 'Wayback Machine' : null,
    entity.githubIntel ? 'GitHub API' : null,
  ].filter(Boolean).join(', ')}.`;

  return merged;
}

/**
 * Extract OSINT context from resolved entity - both what we found AND what's missing.
 * This gives Grok context to work with and tells it what to look for.
 */
function extractOsintGaps(entity: ResolvedEntity): {
  found?: {
    website?: string;
    github?: string;
    telegram?: string;
    discord?: string;
    xHandle?: string;
    tokenAddress?: string;
    tokenName?: string;
    tokenSymbol?: string;
    teamMembers?: Array<{ name?: string; github?: string; role?: string }>;
    holders?: number;
    marketCap?: number;
    lpLocked?: boolean;
    domainAgeDays?: number;
    waybackArchives?: number;
  };
  missingGithub?: boolean;
  missingDiscord?: boolean;
  missingTelegram?: boolean;
  missingWebsite?: boolean;
  missingTeamInfo?: boolean;
  missingTokenAddress?: boolean;
  missingAudit?: boolean;
  websiteUrl?: string;
} {
  // Collect what we found
  const found: {
    website?: string;
    github?: string;
    telegram?: string;
    discord?: string;
    xHandle?: string;
    tokenAddress?: string;
    tokenName?: string;
    tokenSymbol?: string;
    teamMembers?: Array<{ name?: string; github?: string; role?: string }>;
    holders?: number;
    marketCap?: number;
    lpLocked?: boolean;
    domainAgeDays?: number;
    waybackArchives?: number;
  } = {};

  if (entity.website) found.website = entity.website;
  if (entity.github) found.github = entity.github;
  if (entity.telegram) found.telegram = entity.telegram;
  if (entity.discord) found.discord = entity.discord;
  if (entity.xHandle) found.xHandle = entity.xHandle;

  if (entity.tokenAddresses?.[0]) {
    found.tokenAddress = entity.tokenAddresses[0].address;
    found.tokenSymbol = entity.tokenAddresses[0].symbol;
  }
  if (entity.name) found.tokenName = entity.name;

  if (entity.discoveredTeam && entity.discoveredTeam.length > 0) {
    found.teamMembers = entity.discoveredTeam.map(m => ({
      name: m.name,
      github: m.github,
      role: m.role,
    }));
  }

  if (entity.securityIntel?.totalHolders) found.holders = entity.securityIntel.totalHolders;
  if (entity.marketIntel?.marketCap) found.marketCap = entity.marketIntel.marketCap;
  if (entity.securityIntel?.lpLocked !== undefined && entity.securityIntel.lpLocked !== null) {
    found.lpLocked = entity.securityIntel.lpLocked;
  }
  if (entity.domainIntel?.ageInDays) found.domainAgeDays = entity.domainIntel.ageInDays;
  if (entity.historyIntel?.totalSnapshots) found.waybackArchives = entity.historyIntel.totalSnapshots;

  // Identify gaps
  const result: ReturnType<typeof extractOsintGaps> = {};

  // Include found data if we have any
  if (Object.keys(found).length > 0) {
    result.found = found;
  }

  // Check what's missing
  if (!entity.github && !entity.githubIntel) {
    result.missingGithub = true;
    // If we have a website but no GitHub, tell Grok to look harder
    if (entity.website) {
      result.websiteUrl = entity.website;
    }
  }

  if (!entity.discord && !entity.discordIntel) {
    result.missingDiscord = true;
  }

  if (!entity.telegram && !entity.telegramIntel) {
    result.missingTelegram = true;
  }

  if (!entity.website && !entity.websiteIntel) {
    result.missingWebsite = true;
  }

  // Check for team info
  if (!entity.discoveredTeam || entity.discoveredTeam.length === 0) {
    result.missingTeamInfo = true;
  }

  // Check for token address
  if (!entity.tokenAddresses || entity.tokenAddresses.length === 0) {
    result.missingTokenAddress = true;
  }

  // Always ask about audits - OSINT rarely finds these
  result.missingAudit = true;

  // Log what we're passing to Grok
  const foundKeys = result.found ? Object.keys(result.found) : [];
  const missingKeys = Object.entries(result)
    .filter(([k, v]) => k.startsWith('missing') && v)
    .map(([k]) => k);

  if (foundKeys.length > 0 || missingKeys.length > 0) {
    console.log(`[XIntel] OSINT context for Grok:`);
    if (foundKeys.length > 0) console.log(`  Found: ${foundKeys.join(', ')}`);
    if (missingKeys.length > 0) console.log(`  Missing: ${missingKeys.join(', ')}`);
  }

  return result;
}

/**
 * Get universal scan result (combines OSINT + X analysis if available)
 */
export async function getUniversalScanResult(jobId: string): Promise<UniversalScanResult | null> {
  // Check if this is an OSINT-only job
  if (jobId.startsWith('osint_')) {
    // OSINT jobs are already complete - no further processing needed
    return null;
  }

  // Get the X scan job
  const job = await getScanJob(jobId);
  if (!job) return null;

  // If complete, get the report
  if (job.status === 'complete' || job.status === 'cached') {
    try {
      const report = await getCachedReport(job.handle);
      return {
        jobId,
        inputType: 'x_handle',
        canonicalId: job.handle,
        status: job.status,
        cached: job.status === 'cached',
        fullReport: report,
      };
    } catch (err) {
      // Report not ready yet
    }
  }

  return {
    jobId,
    inputType: 'x_handle',
    canonicalId: job.handle,
    status: job.status,
    cached: false,
    error: job.error,
  };
}

/**
 * Detect query type and extract/normalize the handle
 * Only accepts X URLs or handles - no plain text
 */
type QueryType = 'x_url' | 'handle' | 'invalid';

function detectQueryType(query: string): { type: QueryType; value: string; error?: string } {
  const trimmed = query.trim();

  // X/Twitter URL: https://x.com/username or https://twitter.com/username
  const urlMatch = trimmed.match(/^https?:\/\/(www\.)?(x|twitter)\.com\/([a-zA-Z0-9_]+)/i);
  if (urlMatch) {
    return { type: 'x_url', value: urlMatch[3].toLowerCase() };
  }

  // @handle format
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).toLowerCase();
    // Basic validation: alphanumeric + underscore, 1-15 chars
    if (/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
      return { type: 'handle', value: handle };
    }
    return { type: 'invalid', value: trimmed, error: 'Invalid handle format. Use @username (1-15 characters).' };
  }

  // Looks like a handle without @ (alphanumeric + underscore, 1-15 chars)
  if (/^[a-zA-Z0-9_]{1,15}$/.test(trimmed)) {
    return { type: 'handle', value: trimmed.toLowerCase() };
  }

  // Invalid - not a handle or URL
  return {
    type: 'invalid',
    value: trimmed,
    error: 'Please enter an X handle (@username) or X URL (x.com/username).'
  };
}

/**
 * Submit a new scan job
 */
export async function submitScan(options: SubmitScanOptions): Promise<SubmitScanResult> {
  const { handle: rawQuery, depth = 200, force = false } = options;

  // Detect what type of query this is (only accepts X URLs or handles)
  const queryInfo = detectQueryType(rawQuery);
  console.log(`[XIntel] Query type: ${queryInfo.type}, value: "${queryInfo.value}"`);

  // Reject invalid queries immediately
  if (queryInfo.type === 'invalid') {
    return {
      jobId: '',
      status: 'failed',
      cached: false,
      error: queryInfo.error || 'Please enter an X handle (@username) or X URL (x.com/username).',
    };
  }

  const normalizedHandle = queryInfo.value.toLowerCase().replace('@', '');

  // Check rate limiting
  const lastScan = scanCooldowns.get(normalizedHandle);
  if (lastScan && !force) {
    const elapsed = Date.now() - lastScan.getTime();
    if (elapsed < COOLDOWN_MS) {
      return {
        jobId: '',
        status: 'failed',
        cached: false,
        error: `Rate limited. Try again in ${Math.ceil((COOLDOWN_MS - elapsed) / 1000)} seconds.`,
      };
    }
  }

  // Check cache (unless force rescan)
  if (!force) {
    // First check Supabase cache
    if (isSupabaseAvailable()) {
      const supabaseCached = await getCachedReportFromSupabase(normalizedHandle);
      if (supabaseCached) {
        // Also populate in-memory cache for faster subsequent access
        const report = supabaseCached.report as unknown as XIntelReport;
        reportCache.set(normalizedHandle, {
          report,
          cachedAt: new Date(supabaseCached.scanned_at),
        });
        return {
          jobId: `cached_${normalizedHandle}`,
          handle: normalizedHandle,
          status: 'cached',
          cached: true,
          useRealApi: report.disclaimer?.includes('AI-powered') ?? false,
        };
      }
    }

    // Fall back to in-memory cache
    const cached = reportCache.get(normalizedHandle);
    if (cached) {
      const age = Date.now() - cached.cachedAt.getTime();
      if (age < CACHE_TTL_MS) {
        return {
          jobId: `cached_${normalizedHandle}`,
          handle: normalizedHandle,
          status: 'cached',
          cached: true,
          useRealApi: cached.report.disclaimer.includes('AI-powered'),
        };
      }
    }
  }

  // Check if there's already an active scan for this handle
  if (isSupabaseAvailable()) {
    const activeJob = await getActiveScanJobByHandle(normalizedHandle);
    if (activeJob) {
      console.log(`[XIntel] Found active scan job ${activeJob.id} for @${normalizedHandle}, resuming`);
      // Restore to in-memory cache for polling
      const restoredJob: ScanJob = {
        id: activeJob.id,
        handle: activeJob.handle,
        depth: activeJob.depth,
        status: activeJob.status as ScanStatus,
        progress: activeJob.progress,
        statusMessage: activeJob.status_message || undefined,
        startedAt: new Date(activeJob.started_at),
        completedAt: activeJob.completed_at ? new Date(activeJob.completed_at) : undefined,
        error: activeJob.error || undefined,
      };
      scanJobs.set(activeJob.id, restoredJob);
      return {
        jobId: activeJob.id,
        handle: normalizedHandle,
        status: activeJob.status as ScanStatus,
        cached: false,
        useRealApi: USE_REAL_API,
      };
    }
  }

  // Create new job
  const jobId = `job_${normalizedHandle}_${Date.now()}`;
  const job: ScanJob = {
    id: jobId,
    handle: normalizedHandle,
    depth,
    status: 'queued',
    progress: 0,
    startedAt: new Date(),
  };

  scanJobs.set(jobId, job);
  scanCooldowns.set(normalizedHandle, new Date());

  // Persist job to database for recovery after page refresh
  if (isSupabaseAvailable()) {
    createScanJob({
      id: jobId,
      handle: normalizedHandle,
      depth,
      status: 'queued',
      progress: 0,
      startedAt: job.startedAt,
    }).catch(err => console.error('[XIntel] Failed to persist scan job:', err));
  }

  // Start processing asynchronously
  processScanJob(jobId);

  return {
    jobId,
    handle: normalizedHandle,
    status: 'queued',
    cached: false,
    useRealApi: USE_REAL_API,
  };
}

/**
 * Get scan job status (checks in-memory first, then database)
 */
export async function getScanJob(jobId: string): Promise<ScanJob | null> {
  // Check in-memory cache first
  const memoryJob = scanJobs.get(jobId);
  if (memoryJob) {
    return memoryJob;
  }

  // Fall back to database
  if (isSupabaseAvailable()) {
    const dbJob = await getScanJobFromDb(jobId);
    if (dbJob) {
      // Restore to in-memory cache
      const job: ScanJob = {
        id: dbJob.id,
        handle: dbJob.handle,
        depth: dbJob.depth,
        status: dbJob.status as ScanStatus,
        progress: dbJob.progress,
        statusMessage: dbJob.status_message || undefined,
        startedAt: new Date(dbJob.started_at),
        completedAt: dbJob.completed_at ? new Date(dbJob.completed_at) : undefined,
        error: dbJob.error || undefined,
      };
      scanJobs.set(jobId, job);
      return job;
    }
  }

  return null;
}

/**
 * Get active scan job by handle (for resuming scans after page refresh)
 */
export async function getActiveScanByHandle(handle: string): Promise<ScanJob | null> {
  const normalizedHandle = handle.toLowerCase().replace('@', '');

  // Check in-memory cache first
  for (const job of scanJobs.values()) {
    if (job.handle === normalizedHandle &&
        job.status !== 'complete' &&
        job.status !== 'failed' &&
        job.status !== 'cached') {
      return job;
    }
  }

  // Fall back to database
  if (isSupabaseAvailable()) {
    const dbJob = await getActiveScanJobByHandle(normalizedHandle);
    if (dbJob) {
      const job: ScanJob = {
        id: dbJob.id,
        handle: dbJob.handle,
        depth: dbJob.depth,
        status: dbJob.status as ScanStatus,
        progress: dbJob.progress,
        statusMessage: dbJob.status_message || undefined,
        startedAt: new Date(dbJob.started_at),
        completedAt: dbJob.completed_at ? new Date(dbJob.completed_at) : undefined,
        error: dbJob.error || undefined,
      };
      scanJobs.set(dbJob.id, job);
      return job;
    }
  }

  return null;
}

/**
 * Get cached report
 */
export async function getCachedReport(handle: string): Promise<XIntelReport> {
  const normalizedHandle = handle.toLowerCase().replace('@', '');

  // First check Supabase cache
  if (isSupabaseAvailable()) {
    const supabaseCached = await getCachedReportFromSupabase(normalizedHandle);
    if (supabaseCached) {
      const report = supabaseCached.report as unknown as XIntelReport;
      // Also populate in-memory cache
      reportCache.set(normalizedHandle, {
        report,
        cachedAt: new Date(supabaseCached.scanned_at),
      });
      return report;
    }
  }

  // Fall back to in-memory cache
  const cached = reportCache.get(normalizedHandle);
  if (cached) {
    const age = Date.now() - cached.cachedAt.getTime();
    if (age < CACHE_TTL_MS) {
      return cached.report;
    }
  }

  // No cached report found - throw error
  throw new Error(`No cached report found for @${normalizedHandle}. Please run a scan first.`);
}

/**
 * Check if real API mode is enabled
 */
export function isRealApiEnabled(): boolean {
  return USE_REAL_API;
}

// ============================================================================
// SCAN PROCESSING
// ============================================================================

/**
 * Process a scan job through the pipeline
 * Uses Grok with live X search
 */
async function processScanJob(jobId: string): Promise<void> {
  const job = scanJobs.get(jobId);
  if (!job) return;

  // Check real API status at runtime
  const grokAvailable = isGrokAvailable();
  console.log(`[XIntel] Processing job ${jobId} for @${job.handle}, grokAvailable: ${grokAvailable}`);

  if (!grokAvailable) {
    job.status = 'failed';
    job.error = 'Grok API not configured. Set XAI_API_KEY in environment.';
    scanJobs.set(jobId, job);
    return;
  }

  try {
    console.log(`[XIntel] Starting scan for @${job.handle}`);
    await processRealScan(job);
    console.log(`[XIntel] Completed scan for @${job.handle}`);
  } catch (error) {
    console.error(`[XIntel] Scan job ${jobId} failed:`, error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
    scanJobs.set(jobId, job);

    // Persist failure to database
    if (isSupabaseAvailable()) {
      updateScanJob(jobId, {
        status: 'failed',
        error: job.error,
        completedAt: job.completedAt,
      }).catch(err => console.error('[XIntel] Failed to persist job failure:', err));
    }
  }
}

/**
 * Process scan using Grok with live X search
 * Grok handles all data fetching via x_search and web_search tools
 *
 * Flow:
 * 1. Quick classification to check if crypto-related and person vs project
 * 2. If not crypto-related, return early with "not relevant" report
 * 3. If project, use web_search for deeper research; if person, skip it
 */
async function processRealScan(job: ScanJob): Promise<void> {
  const grokClient = getGrokClient();

  // Stage 1: Initialize
  console.log(`[XIntel] Stage 1: Initializing for @${job.handle}`);
  updateJobStatus(job, 'queued', 5, 'Initializing scan...');
  await sleep(200);

  // Stage 2: Quick classification (cheap pre-scan)
  console.log(`[XIntel] Stage 2: Classifying @${job.handle}...`);
  updateJobStatus(job, 'fetching', 10, 'Classifying account type...');

  let isProject = false;
  let classifiedEntityType: 'project' | 'person' | 'company' | 'unknown' = 'unknown';
  try {
    const classification = await grokClient.classifyHandle(job.handle);
    console.log(`[XIntel] Classification result: crypto=${classification.isCryptoRelated}, type=${classification.entityType}`);
    classifiedEntityType = classification.entityType;

    // Early exit if not crypto-related
    if (!classification.isCryptoRelated) {
      console.log(`[XIntel] @${job.handle} is not crypto-related, creating minimal report`);
      updateJobStatus(job, 'complete', 100, 'Not crypto-related');
      job.completedAt = new Date();
      scanJobs.set(job.id, job);

      // Create a minimal "not relevant" report
      const notRelevantReport: XIntelReport = {
        id: `report_${job.handle}_${Date.now()}`,
        profile: {
          handle: job.handle,
          verified: false,
          languagesDetected: ['en'],
        },
        score: {
          overall: 100,
          riskLevel: 'low',
          factors: [],
          confidence: 'high',
        },
        keyFindings: [{
          id: 'kf_not_crypto',
          title: 'Not Crypto-Related',
          description: classification.reason || 'This account does not appear to be involved in cryptocurrency.',
          severity: 'info',
          evidenceIds: [],
        }],
        shilledEntities: [],
        backlashEvents: [],
        behaviorMetrics: {
          toxicity: { score: 0, examples: [] },
          vulgarity: { score: 0, examples: [] },
          hype: { score: 0, examples: [], keywords: [] },
          aggression: { score: 0, examples: [], targetPatterns: [] },
          consistency: { score: 100, topicDrift: 0, contradictions: [] },
          spamBurst: { detected: false, burstPeriods: [] },
        },
        networkMetrics: {
          topInteractions: [],
          mentionList: [],
          engagementHeuristics: {
            replyRatio: 0,
            retweetRatio: 0,
            avgEngagementRate: 0,
            suspiciousPatterns: [],
          },
        },
        linkedEntities: [],
        evidence: [],
        scanTime: new Date(),
        postsAnalyzed: 0,
        cached: false,
        disclaimer: `AI-powered classification. Tokens used: ${classification.tokensUsed || 0}. This account was determined to not be crypto-related.`,
      };

      // Cache the report
      reportCache.set(job.handle, { report: notRelevantReport, cachedAt: new Date() });
      if (isSupabaseAvailable()) {
        cacheReportInSupabase(
          job.handle,
          notRelevantReport as unknown as Record<string, unknown>,
          CACHE_TTL_MS
        ).catch(err => console.error('[XIntel] Failed to cache to Supabase:', err));
      }
      return;
    }

    // Determine if it's a project (use web_search) or person (skip web_search)
    isProject = classification.entityType === 'project' || classification.entityType === 'company';
    console.log(`[XIntel] @${job.handle} is a ${classification.entityType}, isProject=${isProject}`);
  } catch (err) {
    // Classification failed, continue with default (person, no web_search)
    console.warn(`[XIntel] Classification failed for @${job.handle}, assuming crypto person:`, err);
  }

  // Stage 3: Fetching profile (UI progress)
  console.log(`[XIntel] Stage 3: Fetching for @${job.handle}`);
  updateJobStatus(job, 'fetching', 15, 'Fetching profile metadata...');
  await sleep(200);
  updateJobStatus(job, 'fetching', 20, 'Loading recent posts...');
  await sleep(200);

  // Stage 4: Extracting data
  console.log(`[XIntel] Stage 4: Extracting data for @${job.handle}`);
  updateJobStatus(job, 'extracting', 25, 'Extracting mentioned entities...');
  await sleep(200);
  updateJobStatus(job, 'extracting', 30, 'Parsing linked accounts...');
  await sleep(200);
  updateJobStatus(job, 'extracting', 35, 'Identifying promoted tokens...');
  await sleep(200);
  updateJobStatus(job, 'extracting', 40, 'Mapping engagement patterns...');
  await sleep(200);

  // Stage 5: AI Analysis (this is the long-running part)
  const useSearchTools = !DISABLE_SEARCH_TOOLS;
  const analysisMode = DISABLE_SEARCH_TOOLS
    ? 'Deep analysis (training data)'
    : (isProject ? 'Search analysis with web search' : 'Search analysis (X only)');
  console.log(`[XIntel] Stage 5: Analyzing @${job.handle} - ${analysisMode}`);
  updateJobStatus(job, 'analyzing', 45, DISABLE_SEARCH_TOOLS ? 'Deep knowledge analysis...' : (isProject ? 'Deep analysis with web search...' : 'Analyzing X activity...'));

  // Start a progress simulation while waiting for Grok
  const progressInterval = startAnalysisProgress(job);

  try {
    // Extract OSINT gaps to pass to Grok for targeted discovery
    const osintEntity = osintEntityCache.get(job.handle.toLowerCase());
    const osintGaps = osintEntity ? extractOsintGaps(osintEntity) : undefined;

    const analysis = await grokClient.analyzeProfile(job.handle, { isProject, useSearchTools, osintGaps });
    clearInterval(progressInterval);
    console.log(`[XIntel] Grok analysis complete for @${job.handle}, risk: ${analysis.riskLevel}`);

    // Stage 5: Building report
    console.log(`[XIntel] Stage 5: Building report for @${job.handle}`);
    updateJobStatus(job, 'scoring', 70, 'Calculating risk score...');
    await sleep(200);
    updateJobStatus(job, 'scoring', 75, 'Compiling evidence...');
    await sleep(200);
    updateJobStatus(job, 'scoring', 80, 'Generating key findings...');
    let report = grokAnalysisToReport(analysis);
    await sleep(200);

    // Stage 6: Enriching token data
    console.log(`[XIntel] Stage 6: Enriching token data for @${job.handle}`);
    updateJobStatus(job, 'enriching', 85, 'Looking up token data...');

    if (report.shilledEntities && report.shilledEntities.length > 0) {
      const tokenCount = report.shilledEntities.length;
      updateJobStatus(job, 'enriching', 88, `Fetching data for ${tokenCount} token${tokenCount > 1 ? 's' : ''}...`);

      try {
        report = await enrichShilledEntitiesWithTokenData(report);
        const enrichedCount = report.shilledEntities.filter(e => e.tokenData).length;
        console.log(`[XIntel] Enriched ${enrichedCount}/${tokenCount} tokens with market data`);
        updateJobStatus(job, 'enriching', 95, `Enriched ${enrichedCount} token${enrichedCount !== 1 ? 's' : ''}`);
      } catch (err) {
        console.error(`[XIntel] Token enrichment failed:`, err);
        updateJobStatus(job, 'enriching', 95, 'Token enrichment partial');
      }
    } else {
      updateJobStatus(job, 'enriching', 95, 'No tokens to enrich');
    }
    await sleep(200);

    // Stage 7: Complete
    console.log(`[XIntel] Stage 7: Complete for @${job.handle}`);
    updateJobStatus(job, 'complete', 100, 'Scan complete!');
    job.completedAt = new Date();
    scanJobs.set(job.id, job);

    // Cache the report in both Supabase and in-memory
    const cachedAt = new Date();
    reportCache.set(job.handle, { report, cachedAt });

    // Save to Supabase - await project upsert to prevent race condition with redirect
    if (isSupabaseAvailable()) {
      // Cache report async (ok if this completes after redirect)
      cacheReportInSupabase(
        job.handle,
        report as unknown as Record<string, unknown>,
        CACHE_TTL_MS
      ).catch(err => console.error('[XIntel] Failed to cache to Supabase:', err));

      // Await project upsert so it exists before client redirects
      try {
        await upsertProjectFromAnalysis(job.handle, analysis, report, classifiedEntityType);
      } catch (err) {
        console.error('[XIntel] Failed to upsert project:', err);
      }
    }
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}

/**
 * Start a progress simulation during the long-running analysis phase
 * This gives users visual feedback while waiting for Grok
 */
function startAnalysisProgress(job: ScanJob): ReturnType<typeof setInterval> {
  const analysisSteps = [
    { progress: 48, message: 'Searching X for recent activity...' },
    { progress: 52, message: 'Analyzing post history...' },
    { progress: 55, message: 'Detecting promotional patterns...' },
    { progress: 58, message: 'Searching for controversies...' },
    { progress: 62, message: 'Checking backlash mentions...' },
    { progress: 65, message: 'Analyzing engagement authenticity...' },
    { progress: 68, message: 'Evaluating follower quality...' },
    { progress: 72, message: 'Cross-referencing with web sources...' },
    { progress: 75, message: 'Building behavior profile...' },
    { progress: 78, message: 'Finalizing analysis...' },
  ];

  let stepIndex = 0;

  return setInterval(() => {
    if (stepIndex < analysisSteps.length) {
      const step = analysisSteps[stepIndex];
      updateJobStatus(job, 'analyzing', step.progress, step.message);
      stepIndex++;
    }
  }, 1500); // Update every 1.5 seconds
}

/**
 * Simple sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Update job status and progress (both in-memory and database)
 */
function updateJobStatus(job: ScanJob, status: ScanStatus, progress?: number, message?: string): void {
  job.status = status;
  job.progress = progress ?? SCAN_STATUS_PROGRESS[status];
  job.statusMessage = message;
  scanJobs.set(job.id, job);

  // Persist to database (async, don't block)
  if (isSupabaseAvailable()) {
    const updates: { status: string; progress: number; statusMessage?: string; completedAt?: Date; error?: string } = {
      status,
      progress: job.progress,
      statusMessage: message,
    };
    if (status === 'complete' || status === 'failed') {
      updates.completedAt = new Date();
    }
    if (job.error) {
      updates.error = job.error;
    }
    updateScanJob(job.id, updates).catch(err =>
      console.error('[XIntel] Failed to persist job status update:', err)
    );
  }
}

// ============================================================================
// PROJECT ENTITY CREATION
// ============================================================================

/**
 * Normalize role names into standard categories
 */
function normalizeRole(role?: string): string | undefined {
  if (!role) return undefined;

  const lower = role.toLowerCase();

  // Founder/Leadership
  if (lower.includes('founder') || lower.includes('ceo') || lower.includes('co-founder')) {
    return 'Founder';
  }
  if (lower.includes('cto') || lower.includes('chief tech')) {
    return 'CTO';
  }
  if (lower.includes('coo') || lower.includes('chief operating')) {
    return 'COO';
  }

  // Development
  if (lower.includes('lead dev') || lower.includes('lead engineer') || lower.includes('head of eng')) {
    return 'Lead Developer';
  }
  if (lower.includes('dev') || lower.includes('engineer') || lower.includes('programmer')) {
    return 'Developer';
  }
  if (lower.includes('front-end') || lower.includes('frontend')) {
    return 'Frontend Dev';
  }
  if (lower.includes('back-end') || lower.includes('backend')) {
    return 'Backend Dev';
  }
  if (lower.includes('smart contract') || lower.includes('solidity') || lower.includes('rust dev')) {
    return 'Smart Contract Dev';
  }

  // Design
  if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) {
    return 'Designer';
  }

  // Community/Marketing
  if (lower.includes('community') || lower.includes('cm') || lower.includes('mod') || lower.includes('gm')) {
    return 'Community';
  }
  if (lower.includes('marketing') || lower.includes('growth')) {
    return 'Marketing';
  }
  if (lower.includes('social') || lower.includes('content')) {
    return 'Content';
  }

  // Operations
  if (lower.includes('ops') || lower.includes('operations')) {
    return 'Operations';
  }
  if (lower.includes('product') || lower.includes('pm')) {
    return 'Product';
  }

  // Advisor/Investor
  if (lower.includes('advisor') || lower.includes('adviser')) {
    return 'Advisor';
  }
  if (lower.includes('investor') || lower.includes('backer')) {
    return 'Investor';
  }

  // Vague/generic roles - return as "Team Member"
  if (lower === 'team' || lower === 'member' || lower === 'contributor' || lower === 'staff') {
    return 'Team Member';
  }

  // Return original if no match (capitalize first letter)
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Fetch X profile avatar URL via Twitter syndication API
 */
async function fetchXAvatarUrl(handle: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://syndication.twitter.com/srv/timeline-profile/screen-name/${handle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      console.log(`[XIntel] Failed to fetch X syndication for @${handle}: ${res.status}`);
      return undefined;
    }

    const html = await res.text();

    // Extract profile_images URL
    const match = html.match(/https:\/\/pbs\.twimg\.com\/profile_images\/[^"'\\]+/);
    if (match) {
      // Convert _normal to _400x400 for higher resolution
      const url = match[0].replace(/_normal\./, '_400x400.');
      console.log(`[XIntel] Found avatar for @${handle}: ${url}`);
      return url;
    }

    return undefined;
  } catch (err) {
    console.error(`[XIntel] Error fetching avatar for @${handle}:`, err);
    return undefined;
  }
}

/**
 * Create or update a project entity from Grok analysis + OSINT data
 * Now uses the rich OSINT entity collected by entity-resolver for comprehensive data
 */
async function upsertProjectFromAnalysis(
  handle: string,
  analysis: GrokAnalysisResult,
  report: XIntelReport,
  entityType?: 'project' | 'person' | 'company' | 'unknown'
): Promise<void> {
  const normalizedHandle = handle.toLowerCase().replace('@', '');

  // ========================================================================
  // RETRIEVE OSINT ENTITY (collected by entity-resolver - FREE data!)
  // ========================================================================
  const osintEntity = osintEntityCache.get(normalizedHandle);
  if (osintEntity) {
    console.log(`[XIntel] Found OSINT entity for @${normalizedHandle} with:`, {
      hasSecurityIntel: !!osintEntity.securityIntel?.isAccessible,
      hasDomainIntel: !!osintEntity.domainIntel?.isAccessible,
      hasMarketIntel: !!osintEntity.marketIntel?.priceUsd,
      hasGithubIntel: !!osintEntity.githubIntel,
      hasWebsiteIntel: !!osintEntity.websiteIntel?.isLive,
      hasHistoryIntel: !!osintEntity.historyIntel?.hasArchives,
      hasLaunchpadData: !!osintEntity.launchpadData,
      riskFlagsCount: osintEntity.riskFlags?.length || 0,
      legitimacySignalsCount: osintEntity.legitimacySignals?.length || 0,
    });
  } else {
    console.log(`[XIntel] No OSINT entity found for @${normalizedHandle}, using Grok data only`);
  }

  // Determine project name - prefer OSINT (more likely to be token name)
  const name = osintEntity?.name || analysis.profile?.displayName || `@${normalizedHandle}`;

  // Extract team members from both Grok analysis AND OSINT (merge them)
  const grokTeam = (analysis.positiveIndicators?.teamMembers || [])
    .filter(member => member.xHandle || member.name);
  const osintTeam = osintEntity?.discoveredTeam || [];

  // Merge teams, deduplicate by handle/name
  const seenMembers = new Set<string>();
  const mergedTeam: Array<{ handle: string; displayName?: string; role?: string; avatarUrl?: string; isDoxxed?: boolean; linkedIn?: string }> = [];

  // Add Grok team first (usually has roles from AI)
  for (const member of grokTeam) {
    const key = (member.xHandle || member.name || '').toLowerCase();
    if (key && !seenMembers.has(key)) {
      seenMembers.add(key);
      const memberHandle = member.xHandle?.replace('@', '').toLowerCase();
      const avatarUrl = memberHandle ? await fetchXAvatarUrl(memberHandle) : undefined;
      mergedTeam.push({
        handle: member.xHandle || '',
        displayName: member.name,
        role: normalizeRole(member.role),
        avatarUrl,
        isDoxxed: !!member.linkedIn,
        linkedIn: member.linkedIn || undefined,
      });
    }
  }

  // Add OSINT team (from GitHub contributors)
  for (const member of osintTeam) {
    const key = (member.twitter || member.github || member.name || '').toLowerCase();
    if (key && !seenMembers.has(key)) {
      seenMembers.add(key);
      mergedTeam.push({
        handle: member.twitter || member.github || '',
        displayName: member.name,
        role: normalizeRole(member.role),
        isDoxxed: member.isDoxxed,
      });
    }
  }

  // Extract ticker from OSINT or Grok
  const ticker = osintEntity?.symbol ||
    analysis.contract?.ticker?.replace('$', '') ||
    analysis.promotionHistory?.find(p =>
      p.project?.toLowerCase().includes(name.toLowerCase())
    )?.ticker?.replace('$', '') ||
    undefined;

  // Extract token address from OSINT
  const tokenAddress = osintEntity?.tokenAddresses?.[0]?.address ||
    analysis.contract?.address ||
    undefined;

  // ========================================================================
  // BUILD COMPREHENSIVE OSINT-ENRICHED PROJECT DATA
  // ========================================================================

  // Security Intel from RugCheck (OSINT)
  const securityIntel = osintEntity?.securityIntel?.isAccessible ? {
    mintAuthorityEnabled: osintEntity.securityIntel.mintAuthority === 'active',
    freezeAuthorityEnabled: osintEntity.securityIntel.freezeAuthority === 'active',
    lpLocked: osintEntity.securityIntel.lpLocked === true,
    lpLockedPercent: osintEntity.securityIntel.markets?.[0]?.lpLockedPercent,
    risks: osintEntity.securityIntel.risks?.map(r => r.description || r.name) || [],
    holdersCount: osintEntity.securityIntel.totalHolders,
    top10HoldersPercent: osintEntity.securityIntel.topHoldersConcentration,
    // Domain intel (from RDAP)
    domainAgeDays: osintEntity.domainIntel?.ageInDays,
    domainRegistrar: osintEntity.domainIntel?.registrar,
  } : undefined;

  // Market Data from OSINT (Jupiter, Birdeye, CoinGecko, DexScreener)
  const marketData = osintEntity?.marketIntel || osintEntity?.tokenData ? {
    price: osintEntity.marketIntel?.priceUsd || osintEntity.tokenData?.priceUsd || 0,
    priceChange24h: osintEntity.marketIntel?.priceChange24h || osintEntity.tokenData?.priceChange24h || 0,
    marketCap: osintEntity.marketIntel?.marketCap || osintEntity.tokenData?.marketCap,
    volume24h: osintEntity.marketIntel?.volume24h || osintEntity.tokenData?.volume24h,
    liquidity: osintEntity.marketIntel?.liquidity || osintEntity.tokenData?.liquidity,
  } : undefined;

  // GitHub Intel from OSINT (already comprehensive from entity-resolver)
  const githubIntelData = osintEntity?.githubIntel ? {
    stars: osintEntity.githubIntel.repo?.stars || 0,
    forks: osintEntity.githubIntel.repo?.forks || 0,
    watchers: osintEntity.githubIntel.repo?.watchers || 0,
    openIssues: osintEntity.githubIntel.repo?.openIssues || 0,
    lastCommitDate: osintEntity.githubIntel.repo?.lastCommitDate || undefined,
    lastCommitMessage: osintEntity.githubIntel.repo?.lastCommitMessage || undefined,
    commitsLast30d: osintEntity.githubIntel.repo?.commitsLast30d || 0,
    commitsLast90d: osintEntity.githubIntel.repo?.commitsLast90d || 0,
    contributorsCount: osintEntity.githubIntel.contributors?.length || 0,
    topContributors: osintEntity.githubIntel.contributors?.slice(0, 5).map(c => ({
      login: c.login,
      avatarUrl: c.avatarUrl,
      contributions: c.contributions,
    })),
    primaryLanguage: osintEntity.githubIntel.repo?.primaryLanguage || undefined,
    license: osintEntity.githubIntel.repo?.license || undefined,
    isArchived: osintEntity.githubIntel.repo?.isArchived || false,
    healthScore: osintEntity.githubIntel.repo?.healthScore || 0,
    healthFactors: osintEntity.githubIntel.repo?.healthFactors || [],
  } : undefined;

  // Website Intel from OSINT (scraped data + wayback history)
  // Check all social links for docs/roadmap/team pages
  const allSocialLinks = osintEntity?.websiteIntel?.allSocialLinks || [];
  const hasDocsLink = !!(osintEntity?.websiteIntel?.docs || osintEntity?.docs ||
    allSocialLinks.some(l => l.url.toLowerCase().includes('docs') || l.url.toLowerCase().includes('gitbook')));
  const hasRoadmapLink = allSocialLinks.some(l => l.url.toLowerCase().includes('roadmap'));
  const hasTeamLink = allSocialLinks.some(l =>
    l.url.toLowerCase().includes('team') || l.url.toLowerCase().includes('about'));
  const hasAuditLink = allSocialLinks.some(l =>
    l.url.toLowerCase().includes('audit') || l.url.toLowerCase().includes('certik') ||
    l.url.toLowerCase().includes('hacken') || l.url.toLowerCase().includes('security'));

  const websiteIntelData = osintEntity?.websiteIntel || osintEntity?.historyIntel ? {
    isLive: osintEntity.websiteIntel?.isLive ?? true,
    lastChecked: new Date(),
    // From website scrape - detect pages from title/description and links
    hasDocumentation: hasDocsLink,
    hasRoadmap: hasRoadmapLink || (osintEntity?.websiteIntel?.title?.toLowerCase().includes('roadmap') || false),
    hasTokenomics: osintEntity?.websiteIntel?.title?.toLowerCase().includes('tokenomics') ||
      osintEntity?.websiteIntel?.description?.toLowerCase().includes('tokenomics') || false,
    hasTeamPage: hasTeamLink,
    hasAuditInfo: hasAuditLink,
    // Red flags and trust indicators from OSINT
    redFlags: [
      ...(osintEntity.riskFlags || []),
      ...(osintEntity.websiteIntel?.isLive === false ? ['Website not accessible'] : []),
      ...(osintEntity.domainIntel?.ageRisk === 'new' ?
        [`Domain registered only ${osintEntity.domainIntel.ageInDays} days ago`] : []),
    ],
    trustIndicators: [
      ...(osintEntity.legitimacySignals || []),
      ...(osintEntity.websiteIntel?.isLive ? ['Website is live'] : []),
      ...(osintEntity.historyIntel?.hasArchives ?
        [`Website history since ${osintEntity.historyIntel.firstArchiveDate?.toISOString().split('T')[0]}`] : []),
      ...(osintEntity.domainIntel?.ageRisk === 'established' ?
        [`Domain established (${osintEntity.domainIntel.ageInMonths} months old)`] : []),
    ],
    websiteQuality: osintEntity.websiteIntel?.isLive ?
      (osintEntity.legitimacySignals && osintEntity.legitimacySignals.length > 3 ?
        'professional' as const : 'basic' as const) : 'suspicious' as const,
    qualityScore: calculateWebsiteQualityScore(osintEntity),
  } : undefined;

  // Positive Indicators (from OSINT + Grok)
  const positiveIndicators = {
    isDoxxed: analysis.positiveIndicators?.isDoxxed || mergedTeam.some(m => m.isDoxxed),
    doxxedDetails: analysis.positiveIndicators?.doxxedDetails || undefined,
    hasActiveGithub: analysis.positiveIndicators?.hasActiveGithub || (githubIntelData?.commitsLast30d || 0) > 0,
    githubActivity: githubIntelData ? `${githubIntelData.commitsLast30d} commits in last 30d` : undefined,
    hasRealProduct: analysis.positiveIndicators?.hasRealProduct || false,
    productDetails: analysis.positiveIndicators?.productDetails || undefined,
    accountAgeDays: osintEntity?.domainIntel?.ageInDays || 0,
    hasConsistentHistory: osintEntity?.historyIntel?.hasArchives || false,
    hasOrganicEngagement: !analysis.negativeIndicators?.hasSuspiciousFollowers,
    hasCredibleBackers: analysis.positiveIndicators?.hasCredibleBackers || false,
    backersDetails: analysis.positiveIndicators?.backersDetails || undefined,
  };

  // Negative Indicators (from OSINT + Grok) - all boolean fields must be boolean, not undefined
  const negativeIndicators = {
    hasScamAllegations: !!(analysis.negativeIndicators?.hasScamAllegations),
    scamDetails: analysis.negativeIndicators?.scamDetails || undefined,
    hasRugHistory: !!(analysis.negativeIndicators?.hasRugHistory || osintEntity?.securityIntel?.isRugged),
    rugDetails: osintEntity?.securityIntel?.isRugged ? 'Flagged as rug pull by RugCheck' : undefined,
    isAnonymousTeam: !!(analysis.negativeIndicators?.isAnonymousTeam || mergedTeam.length === 0),
    hasHypeLanguage: !!(analysis.negativeIndicators?.hasHypeLanguage),
    hypeExamples: analysis.negativeIndicators?.hypeExamples || [],
    hasSuspiciousFollowers: !!(analysis.negativeIndicators?.hasSuspiciousFollowers),
    suspiciousDetails: analysis.negativeIndicators?.suspiciousDetails || undefined,
    hasPreviousRebrand: !!(analysis.negativeIndicators?.hasPreviousRebrand),
    rebrandDetails: analysis.negativeIndicators?.rebrandDetails || undefined,
    hasAggressivePromotion: !!(analysis.negativeIndicators?.hasAggressivePromotion),
    promotionDetails: analysis.negativeIndicators?.promotionDetails || undefined,
    noPublicAudit: !hasAuditLink,
    lowLiquidity: (marketData?.liquidity || 0) < 10000,
    unverifiedLegalEntity: true, // Default, could be updated from Grok
  };

  // Tokenomics from OSINT
  const tokenomics = osintEntity?.securityIntel ? {
    totalSupply: osintEntity.securityIntel.totalSupply || undefined,
    circulatingSupply: undefined, // Would need additional API
    burnMechanism: undefined,
    burnRate: undefined,
    isDeflationary: false,
    vestingSchedule: undefined,
  } : undefined;

  // Liquidity from OSINT
  const liquidity = osintEntity?.securityIntel?.markets?.[0] ? {
    primaryDex: osintEntity.securityIntel.markets[0].marketType || undefined,
    poolType: undefined,
    liquidityUsd: osintEntity.securityIntel.totalLiquidityUsd,
    liquidityLocked: osintEntity.securityIntel.lpLocked === true,
    lockDuration: undefined,
  } : undefined;

  // Tech Stack from OSINT
  const techStack = osintEntity?.techStack ? {
    blockchain: osintEntity.tokenAddresses?.[0]?.chain || 'solana',
    zkTech: undefined,
    offlineCapability: false,
    hardwareProducts: [],
  } : undefined;

  // Key findings from OSINT + Grok - comprehensive analysis for ANY Solana token
  const keyFindings: string[] = [];
  // Use raw OSINT data for key findings (securityIntel var above is transformed for projectData)
  const rawSecurityIntel = osintEntity?.securityIntel;
  const rawTokenData = osintEntity?.tokenData;
  const rawMarketIntel = osintEntity?.marketIntel;

  // === CRITICAL SECURITY FLAGS (show first) ===
  if (rawSecurityIntel?.isRugged) keyFindings.push('⚠️ FLAGGED AS RUG PULL');
  if (rawSecurityIntel?.mintAuthority === 'active') keyFindings.push('Mint authority active - unlimited supply risk');
  if (rawSecurityIntel?.freezeAuthority === 'active') keyFindings.push('Freeze authority active - tokens can be frozen');

  // === HOLDER CONCENTRATION (from RugCheck) ===
  // High concentration is a major risk signal for ANY token
  if (rawSecurityIntel?.topHoldersConcentration && rawSecurityIntel.topHoldersConcentration > 50) {
    keyFindings.push(`Top 10 holders control ${rawSecurityIntel.topHoldersConcentration.toFixed(0)}% of supply`);
  } else if (rawSecurityIntel?.topHolderPercent && rawSecurityIntel.topHolderPercent > 20) {
    keyFindings.push(`Largest holder owns ${rawSecurityIntel.topHolderPercent.toFixed(1)}% of supply`);
  }

  // Insider detection
  if (rawSecurityIntel?.insiderNetworks && rawSecurityIntel.insiderNetworks > 10) {
    keyFindings.push(`${rawSecurityIntel.insiderNetworks} insider network accounts detected`);
  }

  // Creator holdings
  if (rawSecurityIntel?.creatorBalancePercent && rawSecurityIntel.creatorBalancePercent > 10) {
    keyFindings.push(`Creator still holds ${rawSecurityIntel.creatorBalancePercent.toFixed(1)}% of supply`);
  }

  // === LIQUIDITY STATUS ===
  if (rawSecurityIntel?.lpLocked === false && (rawSecurityIntel?.totalLiquidityUsd || 0) > 1000) {
    keyFindings.push('Liquidity not locked - can be pulled');
  } else if (rawSecurityIntel?.lpLocked === true) {
    keyFindings.push('LP locked ✓');
  }

  // === TRADING VENUE INFO (for ANY token) ===
  const tokenDexType = rawTokenData?.dexType;
  const tokenRawDexId = rawTokenData?.rawDexId;
  const tokenLiquidity = rawTokenData?.liquidity || rawMarketIntel?.liquidity;

  // Format DEX name nicely
  const formatDexName = (dex: string | undefined, raw: string | undefined): string => {
    if (!dex && !raw) return 'Unknown DEX';
    if (dex === 'pumpswap') return 'PumpSwap';
    if (dex === 'pump_fun') return 'Pump.fun (bonding curve)';
    if (dex === 'raydium') return 'Raydium';
    if (dex === 'meteora') return 'Meteora';
    if (dex === 'orca') return 'Orca';
    if (dex === 'moonshot') return 'Moonshot';
    if (dex === 'jupiter') return 'Jupiter';
    return raw || dex || 'DEX';
  };

  // === LAUNCHPAD + GRADUATION STATUS ===
  // Detect launchpad from either address pattern or DexScreener dexId
  const detectedLaunchpad = osintEntity?.launchpad || rawTokenData?.detectedLaunchpad;

  if (detectedLaunchpad && detectedLaunchpad !== 'unknown') {
    const isGraduatedFromDex = rawTokenData?.isGraduated;
    const isGraduatedFromLaunchpad = osintEntity?.launchpadData?.isGraduated;
    const tokenIsGraduated = isGraduatedFromDex ?? isGraduatedFromLaunchpad;

    // Format launchpad name
    const launchpadName = detectedLaunchpad === 'pump_fun' ? 'Pump.fun' :
                          detectedLaunchpad === 'bags_fm' ? 'Bags.fm' :
                          detectedLaunchpad === 'moonshot' ? 'Moonshot' :
                          detectedLaunchpad === 'raydium_launchlab' ? 'Raydium LaunchLab' :
                          detectedLaunchpad === 'meteora_dbc' ? 'Meteora DBC' :
                          detectedLaunchpad === 'letsbonk' ? 'LetsBonk' :
                          detectedLaunchpad;

    if (tokenIsGraduated === true) {
      const graduatedTo = formatDexName(tokenDexType, tokenRawDexId);
      keyFindings.push(`Launched on ${launchpadName}: Graduated to ${graduatedTo}`);
    } else if (tokenIsGraduated === false) {
      keyFindings.push(`Launched on ${launchpadName}: Still on bonding curve`);
    } else {
      keyFindings.push(`Launched on ${launchpadName}`);
    }
  } else if (tokenDexType && tokenDexType !== 'unknown') {
    // For non-launchpad tokens, show where they're trading
    const dexName = formatDexName(tokenDexType, tokenRawDexId);
    const liqStr = tokenLiquidity ? ` ($${(tokenLiquidity / 1000).toFixed(0)}K liquidity)` : '';
    keyFindings.push(`Trading on ${dexName}${liqStr}`);
  }

  // === TOKEN AGE ===
  if (rawTokenData?.pairCreatedAt) {
    const ageMs = Date.now() - rawTokenData.pairCreatedAt;
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    if (ageDays < 7) {
      keyFindings.push(`New token: created ${ageDays === 0 ? 'today' : ageDays === 1 ? 'yesterday' : `${ageDays} days ago`}`);
    } else if (ageDays < 30) {
      keyFindings.push(`Token age: ${Math.floor(ageDays / 7)} week${ageDays >= 14 ? 's' : ''} old`);
    }
  }

  // === HOLDER COUNT ===
  const holderCount = rawSecurityIntel?.totalHolders || rawMarketIntel?.totalHolders;
  if (holderCount) {
    if (holderCount < 100) {
      keyFindings.push(`Low holder count: ${holderCount} wallets`);
    } else if (holderCount > 10000) {
      keyFindings.push(`Large holder base: ${(holderCount / 1000).toFixed(0)}K+ wallets`);
    }
  }

  // === POSITIVE SIGNALS ===
  if (osintEntity?.domainIntel?.ageRisk === 'established') {
    keyFindings.push(`Established domain: ${osintEntity.domainIntel.ageInMonths}+ months old`);
  } else if (osintEntity?.domainIntel?.ageRisk === 'new') {
    keyFindings.push(`New domain: registered ${osintEntity.domainIntel.ageInDays} days ago`);
  }

  if (githubIntelData && githubIntelData.stars > 100) {
    keyFindings.push(`Strong GitHub presence: ${githubIntelData.stars} stars`);
  }

  if (rawMarketIntel?.isListed) {
    keyFindings.push('Listed on CoinGecko ✓');
  }

  // === RUGCHECK SCORE (as summary) ===
  if (rawSecurityIntel?.riskLevel && rawSecurityIntel.riskLevel !== 'Unknown') {
    const emoji = rawSecurityIntel.riskLevel === 'Good' ? '✓' :
                  rawSecurityIntel.riskLevel === 'Warn' ? '⚠️' : '🚨';
    keyFindings.push(`RugCheck: ${rawSecurityIntel.normalizedScore}/10 (${rawSecurityIntel.riskLevel}) ${emoji}`);
  }

  // Map Grok's entityType to our EntityType (normalize 'company' to 'organization')
  const normalizedEntityType = entityType === 'company' ? 'organization' as const :
                               entityType === 'project' ? 'project' as const :
                               entityType === 'person' ? 'person' as const : undefined;

  // Build project data with comprehensive OSINT
  const projectData = {
    name,
    entityType: normalizedEntityType,
    description: analysis.theStory || osintEntity?.description || analysis.overallAssessment || undefined,
    avatarUrl: osintEntity?.imageUrl || analysis.profile?.avatarUrl || await fetchXAvatarUrl(normalizedHandle),
    tags: extractTags(analysis, githubIntelData, osintEntity),
    aiSummary: analysis.verdict?.summary || analysis.overallAssessment || undefined,
    xHandle: normalizedHandle,
    githubUrl: osintEntity?.github || analysis.github || undefined,
    websiteUrl: osintEntity?.website || analysis.website || undefined,
    tokenAddress,
    ticker,
    discordUrl: osintEntity?.discord || undefined,
    telegramUrl: osintEntity?.telegram || undefined,
    trustScore: {
      score: report.score.overall,
      tier: report.score.riskLevel === 'low' ? 'trusted' as const :
            report.score.riskLevel === 'medium' ? 'neutral' as const : 'caution' as const,
      confidence: report.score.confidence,
      lastUpdated: new Date(),
    },
    team: mergedTeam,
    socialMetrics: {
      followers: analysis.profile?.followers,
      engagement: undefined,
      postsPerWeek: undefined,
    },
    // OSINT-enriched fields (OSINT is primary - free & reliable, Grok is fallback)
    marketData,
    githubIntel: githubIntelData,
    websiteIntel: websiteIntelData,
    securityIntel,
    // OSINT primary, Grok fallback
    tokenomics: tokenomics || analysis.tokenomics,
    liquidity: liquidity || analysis.liquidity,
    techStack: techStack || analysis.techStack,
    positiveIndicators,
    negativeIndicators,
    keyFindings: keyFindings.length > 0 ? keyFindings : undefined,
    theStory: analysis.theStory || undefined,
    // Grok-provided deep analysis fields
    legalEntity: analysis.legalEntity || undefined,
    affiliations: analysis.affiliations?.length ? analysis.affiliations : undefined,
    roadmap: analysis.roadmap?.length ? analysis.roadmap : undefined,
    audit: analysis.audit || undefined,
    shippingHistory: analysis.shippingHistory?.length ? analysis.shippingHistory : undefined,
    controversies: analysis.controversies?.length ? analysis.controversies : undefined,
    lastScanAt: new Date(),
  };

  await upsertProjectByHandle(normalizedHandle, projectData);
  console.log(`[XIntel] Upserted project entity for @${normalizedHandle} (type: ${normalizedEntityType || 'unknown'}) with OSINT enrichment`);
}

/**
 * Calculate website quality score based on OSINT signals
 */
function calculateWebsiteQualityScore(osintEntity: ResolvedEntity | undefined): number {
  if (!osintEntity) return 50;

  let score = 50;

  // Positive signals
  if (osintEntity.websiteIntel?.isLive) score += 10;
  if (osintEntity.githubIntel) score += 10;
  if (osintEntity.historyIntel?.hasArchives) score += 5;
  if (osintEntity.domainIntel?.ageRisk === 'established') score += 10;
  if (osintEntity.legitimacySignals && osintEntity.legitimacySignals.length > 0)
    score += Math.min(osintEntity.legitimacySignals.length * 3, 15);

  // Negative signals
  if (osintEntity.riskFlags && osintEntity.riskFlags.length > 0)
    score -= Math.min(osintEntity.riskFlags.length * 5, 25);
  if (osintEntity.domainIntel?.ageRisk === 'new') score -= 15;
  if (osintEntity.securityIntel?.isRugged) score -= 30;

  return Math.max(0, Math.min(100, score));
}

/**
 * Extract relevant tags from analysis
 */
function extractTags(
  analysis: GrokAnalysisResult,
  githubIntel?: { stars: number; commitsLast30d: number; isArchived: boolean; license?: string; contributorsCount: number } | null,
  osintEntity?: ResolvedEntity
): string[] {
  const tags: string[] = [];

  // Entity type from Grok
  if (analysis.positiveIndicators?.hasRealProduct) tags.push('product');
  if (analysis.positiveIndicators?.hasActiveGithub) tags.push('builder');
  if (analysis.positiveIndicators?.isDoxxed) tags.push('doxxed');
  if (analysis.positiveIndicators?.hasCredibleBackers) tags.push('backed');

  // Risk indicators from Grok
  if (analysis.negativeIndicators?.hasScamAllegations) tags.push('allegations');
  if (analysis.negativeIndicators?.hasRugHistory) tags.push('rug-history');
  if (analysis.negativeIndicators?.isAnonymousTeam) tags.push('anon');

  // GitHub-based tags
  if (githubIntel) {
    if (githubIntel.stars >= 100) tags.push('popular');
    if (githubIntel.commitsLast30d >= 10) tags.push('active');
    if (githubIntel.isArchived) tags.push('archived');
    if (githubIntel.license) tags.push('open-source');
    if (githubIntel.contributorsCount >= 5) tags.push('team');
  }

  // OSINT-based tags
  if (osintEntity) {
    // Launchpad
    if (osintEntity.launchpad === 'pump_fun') tags.push('pump-fun');
    if (osintEntity.launchpad === 'bags_fm') tags.push('bags-fm');

    // Graduation status - prefer DexScreener data over launchpad API
    const tokenGraduated = osintEntity.tokenData?.isGraduated ?? osintEntity.launchpadData?.isGraduated;
    if (tokenGraduated) tags.push('graduated');

    // Security status from RugCheck
    if (osintEntity.securityIntel?.isAccessible) {
      if (osintEntity.securityIntel.mintAuthority === 'renounced' &&
          osintEntity.securityIntel.freezeAuthority === 'renounced') {
        tags.push('authorities-renounced');
      }
      if (osintEntity.securityIntel.lpLocked) tags.push('lp-locked');
      if (osintEntity.securityIntel.isRugged) tags.push('rug-flagged');
      if ((osintEntity.securityIntel.totalHolders || 0) > 1000) tags.push('1k-holders');
      if ((osintEntity.securityIntel.totalHolders || 0) > 10000) tags.push('10k-holders');
    }

    // Domain age
    if (osintEntity.domainIntel?.ageRisk === 'new') tags.push('new-domain');
    if (osintEntity.domainIntel?.ageRisk === 'established') tags.push('established-domain');

    // Market presence
    if (osintEntity.marketIntel?.isListed) tags.push('coingecko');
    if ((osintEntity.marketIntel?.liquidity || 0) > 100000) tags.push('high-liquidity');

    // Social presence
    if (osintEntity.telegramIntel?.memberCount && osintEntity.telegramIntel.memberCount > 1000) tags.push('active-telegram');
    if (osintEntity.discordIntel?.isVerified) tags.push('verified-discord');

    // Wayback history
    if (osintEntity.historyIntel?.hasArchives) tags.push('archived-history');
  }

  return [...new Set(tags)]; // Deduplicate
}

// ============================================================================
// SHARE LINKS
// ============================================================================

// Share link storage (would be DB in production)
const shareLinks: Map<string, { handle: string; expiresAt: Date }> = new Map();

export interface CreateShareLinkResult {
  url: string;
  shareId: string;
  expiresAt: Date;
}

/**
 * Create a shareable link for a report
 */
export function createShareLink(handle: string): CreateShareLinkResult {
  const normalizedHandle = handle.toLowerCase().replace('@', '');
  const shareId = `share_${normalizedHandle}_${Date.now().toString(36)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  shareLinks.set(shareId, {
    handle: normalizedHandle,
    expiresAt,
  });

  return {
    url: `/terminal/xintel/${normalizedHandle}?share=${shareId}`,
    shareId,
    expiresAt,
  };
}

/**
 * Validate a share link
 */
export function validateShareLink(shareId: string): { valid: boolean; handle?: string } {
  const link = shareLinks.get(shareId);

  if (!link) {
    return { valid: false };
  }

  if (link.expiresAt < new Date()) {
    shareLinks.delete(shareId);
    return { valid: false };
  }

  return { valid: true, handle: link.handle };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get cache age in seconds
 */
export async function getCacheAge(handle: string): Promise<number | null> {
  const normalizedHandle = handle.toLowerCase().replace('@', '');

  // First check Supabase
  if (isSupabaseAvailable()) {
    const supabaseAge = await getCacheAgeFromSupabase(normalizedHandle);
    if (supabaseAge !== null) {
      return supabaseAge;
    }
  }

  // Fall back to in-memory cache
  const cached = reportCache.get(normalizedHandle);
  if (!cached) return null;

  return Math.floor((Date.now() - cached.cachedAt.getTime()) / 1000);
}

/**
 * Clear cache for a handle
 */
export async function clearCache(handle: string): Promise<void> {
  const normalizedHandle = handle.toLowerCase().replace('@', '');

  // Clear from both Supabase and in-memory
  reportCache.delete(normalizedHandle);

  if (isSupabaseAvailable()) {
    await deleteCachedReportFromSupabase(normalizedHandle);
  }
}

/**
 * Get all active jobs (for admin/monitoring)
 */
export function getActiveJobs(): ScanJob[] {
  return Array.from(scanJobs.values())
    .filter(job => job.status !== 'complete' && job.status !== 'failed')
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

/**
 * Get API configuration status (for debugging/admin)
 */
export function getApiStatus(): {
  grokConfigured: boolean;
  realApiEnabled: boolean;
  searchToolsDisabled: boolean;
} {
  return {
    grokConfigured: isGrokAvailable(),
    realApiEnabled: USE_REAL_API,
    searchToolsDisabled: DISABLE_SEARCH_TOOLS,
  };
}
