// Supabase Client for CLARP
// Used for authentication and data storage

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types for xintel_reports table
export interface XIntelReportRow {
  handle: string;
  report: Record<string, unknown>;
  scanned_at: string;
  expires_at: string;
}

// Database types for token_cache table
export interface TokenCacheRow {
  id: string;
  ticker: string;
  chain: string;
  token_address: string;
  pool_address: string | null;
  name: string | null;
  symbol: string | null;
  image_url: string | null;
  dex_type: string | null;
  created_at: string;
  updated_at: string;
}

// Singleton client instance
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client (browser/client-side)
 * Returns null if credentials are not configured
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY, client disabled');
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}

/**
 * Create a fresh Supabase client (for client components)
 * Use this when you need a new instance
 */
export function createSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return !!(url && key);
}

/**
 * Get cached report from Supabase
 */
export async function getCachedReportFromSupabase(
  handle: string
): Promise<XIntelReportRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('xintel_reports')
      .select('*')
      .eq('handle', handle)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, not a real error
        console.error('[Supabase] Error fetching cached report:', error.message);
      }
      return null;
    }

    return data as XIntelReportRow;
  } catch (err) {
    console.error('[Supabase] Failed to fetch cached report:', err);
    return null;
  }
}

/**
 * Store report in Supabase cache
 */
export async function cacheReportInSupabase(
  handle: string,
  report: Record<string, unknown>,
  ttlMs: number
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    const { error } = await client.from('xintel_reports').upsert(
      {
        handle,
        report,
        scanned_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'handle' }
    );

    if (error) {
      console.error('[Supabase] Error caching report:', error.message);
      return false;
    }

    console.log(`[Supabase] Cached report for @${handle}, expires at ${expiresAt.toISOString()}`);
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to cache report:', err);
    return false;
  }
}

/**
 * Delete cached report from Supabase
 */
export async function deleteCachedReportFromSupabase(handle: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('xintel_reports')
      .delete()
      .eq('handle', handle);

    if (error) {
      console.error('[Supabase] Error deleting cached report:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Failed to delete cached report:', err);
    return false;
  }
}

/**
 * Get cache age in seconds for a handle
 */
export async function getCacheAgeFromSupabase(handle: string): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('xintel_reports')
      .select('scanned_at')
      .eq('handle', handle)
      .single();

    if (error || !data) return null;

    const scannedAt = new Date(data.scanned_at);
    return Math.floor((Date.now() - scannedAt.getTime()) / 1000);
  } catch {
    return null;
  }
}

/**
 * Clean up expired reports (can be called periodically)
 */
export async function cleanupExpiredReports(): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;

  try {
    const { data, error } = await client
      .from('xintel_reports')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('handle');

    if (error) {
      console.error('[Supabase] Error cleaning up expired reports:', error.message);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      console.log(`[Supabase] Cleaned up ${count} expired reports`);
    }
    return count;
  } catch (err) {
    console.error('[Supabase] Failed to cleanup expired reports:', err);
    return 0;
  }
}

// ============================================================================
// SCAN JOB FUNCTIONS (for persistent background scans)
// ============================================================================

export interface ScanJobRow {
  id: string;
  handle: string;
  depth: number;
  status: string;
  progress: number;
  status_message: string | null;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new scan job in the database
 */
export async function createScanJob(job: {
  id: string;
  handle: string;
  depth: number;
  status: string;
  progress: number;
  statusMessage?: string;
  startedAt: Date;
}): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('scan_jobs').insert({
      id: job.id,
      handle: job.handle,
      depth: job.depth,
      status: job.status,
      progress: job.progress,
      status_message: job.statusMessage || null,
      started_at: job.startedAt.toISOString(),
    });

    if (error) {
      console.error('[Supabase] Error creating scan job:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Failed to create scan job:', err);
    return false;
  }
}

/**
 * Update scan job status in the database
 */
export async function updateScanJob(
  jobId: string,
  updates: {
    status?: string;
    progress?: number;
    statusMessage?: string;
    completedAt?: Date;
    error?: string;
  }
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.statusMessage !== undefined) updateData.status_message = updates.statusMessage;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt.toISOString();
    if (updates.error !== undefined) updateData.error = updates.error;

    const { error } = await client
      .from('scan_jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error('[Supabase] Error updating scan job:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Failed to update scan job:', err);
    return false;
  }
}

/**
 * Get a scan job by ID from the database
 */
export async function getScanJobFromDb(jobId: string): Promise<ScanJobRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('scan_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[Supabase] Error fetching scan job:', error.message);
      }
      return null;
    }

    return data as ScanJobRow;
  } catch (err) {
    console.error('[Supabase] Failed to fetch scan job:', err);
    return null;
  }
}

/**
 * Get the most recent active (non-complete, non-failed) scan job for a handle
 * This is used to resume scans when user refreshes the page
 */
export async function getActiveScanJobByHandle(handle: string): Promise<ScanJobRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedHandle = handle.toLowerCase().replace('@', '');

  try {
    const { data, error } = await client
      .from('scan_jobs')
      .select('*')
      .eq('handle', normalizedHandle)
      .not('status', 'in', '("complete","failed","cached")')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[Supabase] Error fetching active scan job:', error.message);
      }
      return null;
    }

    return data as ScanJobRow;
  } catch (err) {
    console.error('[Supabase] Failed to fetch active scan job:', err);
    return null;
  }
}

/**
 * Get the most recent scan job for a handle (any status)
 * Used to check if a recent scan exists
 */
export async function getRecentScanJobByHandle(
  handle: string,
  maxAgeMs: number = 5 * 60 * 1000 // default 5 minutes
): Promise<ScanJobRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalizedHandle = handle.toLowerCase().replace('@', '');
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();

  try {
    const { data, error } = await client
      .from('scan_jobs')
      .select('*')
      .eq('handle', normalizedHandle)
      .gte('started_at', cutoff)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[Supabase] Error fetching recent scan job:', error.message);
      }
      return null;
    }

    return data as ScanJobRow;
  } catch (err) {
    console.error('[Supabase] Failed to fetch recent scan job:', err);
    return null;
  }
}

/**
 * Cleanup old completed/failed scan jobs (keep last 24 hours)
 */
export async function cleanupOldScanJobs(): Promise<number> {
  const client = getSupabaseClient();
  if (!client) return 0;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await client
      .from('scan_jobs')
      .delete()
      .in('status', ['complete', 'failed', 'cached'])
      .lt('completed_at', cutoff)
      .select('id');

    if (error) {
      console.error('[Supabase] Error cleaning up scan jobs:', error.message);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error('[Supabase] Failed to cleanup scan jobs:', err);
    return 0;
  }
}

// ============================================================================
// TOKEN CACHE FUNCTIONS
// ============================================================================

/**
 * Get cached token by ticker
 */
export async function getCachedToken(
  ticker: string,
  chain: string = 'solana'
): Promise<TokenCacheRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  // Normalize ticker (uppercase, no $ prefix)
  const normalizedTicker = ticker.replace(/^\$/, '').toUpperCase();

  try {
    const { data, error } = await client
      .from('token_cache')
      .select('*')
      .eq('ticker', normalizedTicker)
      .eq('chain', chain)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[Supabase] Error fetching cached token:', error.message);
      }
      return null;
    }

    return data as TokenCacheRow;
  } catch (err) {
    console.error('[Supabase] Failed to fetch cached token:', err);
    return null;
  }
}

/**
 * Get cached token by address
 */
export async function getCachedTokenByAddress(
  tokenAddress: string,
  chain: string = 'solana'
): Promise<TokenCacheRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('token_cache')
      .select('*')
      .eq('token_address', tokenAddress)
      .eq('chain', chain)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[Supabase] Error fetching cached token by address:', error.message);
      }
      return null;
    }

    return data as TokenCacheRow;
  } catch (err) {
    console.error('[Supabase] Failed to fetch cached token by address:', err);
    return null;
  }
}

/**
 * Cache a token mapping
 */
export async function cacheToken(token: {
  ticker: string;
  chain?: string;
  tokenAddress: string;
  poolAddress?: string;
  name?: string;
  symbol?: string;
  imageUrl?: string;
  dexType?: string;
}): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  // Normalize ticker
  const normalizedTicker = token.ticker.replace(/^\$/, '').toUpperCase();

  try {
    const { error } = await client.from('token_cache').upsert(
      {
        ticker: normalizedTicker,
        chain: token.chain || 'solana',
        token_address: token.tokenAddress,
        pool_address: token.poolAddress || null,
        name: token.name || null,
        symbol: token.symbol || null,
        image_url: token.imageUrl || null,
        dex_type: token.dexType || null,
      },
      { onConflict: 'ticker,chain' }
    );

    if (error) {
      console.error('[Supabase] Error caching token:', error.message);
      return false;
    }

    console.log(`[Supabase] Cached token $${normalizedTicker} -> ${token.tokenAddress}`);
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to cache token:', err);
    return false;
  }
}

/**
 * Get multiple cached tokens by tickers
 */
export async function getCachedTokens(
  tickers: string[],
  chain: string = 'solana'
): Promise<Map<string, TokenCacheRow>> {
  const client = getSupabaseClient();
  const result = new Map<string, TokenCacheRow>();
  if (!client || tickers.length === 0) return result;

  // Normalize tickers
  const normalizedTickers = tickers.map(t => t.replace(/^\$/, '').toUpperCase());

  try {
    const { data, error } = await client
      .from('token_cache')
      .select('*')
      .in('ticker', normalizedTickers)
      .eq('chain', chain);

    if (error) {
      console.error('[Supabase] Error fetching cached tokens:', error.message);
      return result;
    }

    for (const row of data || []) {
      result.set(row.ticker, row as TokenCacheRow);
    }

    return result;
  } catch (err) {
    console.error('[Supabase] Failed to fetch cached tokens:', err);
    return result;
  }
}
