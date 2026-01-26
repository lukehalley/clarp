// X Intel Scan Service
// Handles scan job management and report generation
// Uses Grok with live X search (no separate X API needed)

import {
  ScanJob,
  ScanStatus,
  XIntelReport,
  SCAN_STATUS_PROGRESS,
} from '@/types/xintel';
import { getGrokClient, isGrokAvailable, GrokApiError } from '@/lib/grok/client';
import { grokAnalysisToReport } from './transformers';
import {
  isSupabaseAvailable,
  getCachedReportFromSupabase,
  cacheReportInSupabase,
  deleteCachedReportFromSupabase,
  getCacheAgeFromSupabase,
} from '@/lib/supabase/client';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Check if real API mode is enabled (only needs Grok with x_search capability)
const USE_REAL_API = process.env.ENABLE_REAL_X_API === 'true'
  && isGrokAvailable();

// In-memory job storage (would be Redis/DB in production)
const scanJobs: Map<string, ScanJob> = new Map();

// Report cache (would be Redis/DB in production)
const reportCache: Map<string, { report: XIntelReport; cachedAt: Date }> = new Map();

// Default cache TTL: 6 hours
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// Rate limiting (per handle)
const scanCooldowns: Map<string, Date> = new Map();
const COOLDOWN_MS = 60 * 1000; // 1 minute between scans of same handle

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
  status: ScanStatus;
  cached: boolean;
  error?: string;
  useRealApi?: boolean;
}

/**
 * Submit a new scan job
 */
export async function submitScan(options: SubmitScanOptions): Promise<SubmitScanResult> {
  const { handle, depth = 200, force = false } = options;
  const normalizedHandle = handle.toLowerCase().replace('@', '');

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
          status: 'cached',
          cached: true,
          useRealApi: cached.report.disclaimer.includes('AI-powered'),
        };
      }
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

  // Start processing asynchronously
  processScanJob(jobId);

  return {
    jobId,
    status: 'queued',
    cached: false,
    useRealApi: USE_REAL_API,
  };
}

/**
 * Get scan job status
 */
export function getScanJob(jobId: string): ScanJob | null {
  return scanJobs.get(jobId) || null;
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
    scanJobs.set(jobId, job);
  }
}

/**
 * Process scan using Grok with live X search
 * Grok handles all data fetching via x_search and web_search tools
 */
async function processRealScan(job: ScanJob): Promise<void> {
  const grokClient = getGrokClient();

  // Stage 1: Starting analysis
  console.log(`[XIntel] Stage 1: Fetching for @${job.handle}`);
  updateJobStatus(job, 'fetching', 10);

  // Stage 2: Grok analyzes the profile using x_search
  console.log(`[XIntel] Stage 2: Analyzing @${job.handle} with Grok...`);
  updateJobStatus(job, 'analyzing', 30);
  const analysis = await grokClient.analyzeProfile(job.handle);
  console.log(`[XIntel] Grok analysis complete for @${job.handle}, risk: ${analysis.riskLevel}`);

  // Stage 3: Build report from Grok analysis
  console.log(`[XIntel] Stage 3: Building report for @${job.handle}`);
  updateJobStatus(job, 'scoring', 80);
  const report = grokAnalysisToReport(analysis);

  // Stage 4: Complete
  console.log(`[XIntel] Stage 4: Complete for @${job.handle}`);
  updateJobStatus(job, 'complete', 100);
  job.completedAt = new Date();
  scanJobs.set(job.id, job);

  // Cache the report in both Supabase and in-memory
  const cachedAt = new Date();
  reportCache.set(job.handle, { report, cachedAt });

  // Async cache to Supabase (don't block on this)
  if (isSupabaseAvailable()) {
    cacheReportInSupabase(
      job.handle,
      report as unknown as Record<string, unknown>,
      CACHE_TTL_MS
    ).catch(err => console.error('[XIntel] Failed to cache to Supabase:', err));
  }
}

/**
 * Update job status and progress
 */
function updateJobStatus(job: ScanJob, status: ScanStatus, progress?: number): void {
  job.status = status;
  job.progress = progress ?? SCAN_STATUS_PROGRESS[status];
  scanJobs.set(job.id, job);
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
} {
  return {
    grokConfigured: isGrokAvailable(),
    realApiEnabled: USE_REAL_API,
  };
}
