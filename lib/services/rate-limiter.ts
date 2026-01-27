// Rate Limiter Service
// Tracks scan usage and enforces tier-based limits

import { getServiceClient } from '@/lib/supabase/server';
import { getUserTier } from '@/lib/solana/token-gate';
import { TIER_LIMITS, Tier } from '@/lib/config/tokenomics';
import crypto from 'crypto';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  tier: Tier;
  reason?: string;
}

/**
 * Hash IP address for privacy
 */
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'clarp-default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

/**
 * Get start of current day (UTC)
 */
function getStartOfDay(): Date {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of current day (UTC)
 */
function getEndOfDay(): Date {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

/**
 * Check if request is within rate limits
 * NOTE: Rate limiting disabled for development
 */
export async function checkRateLimit(
  wallet: string | null,
  ip: string
): Promise<RateLimitResult> {
  // Rate limiting disabled for development
  return {
    allowed: true,
    remaining: Infinity,
    limit: Infinity,
    resetAt: getEndOfDay(),
    tier: 'whale',
    reason: 'Rate limiting disabled',
  };
}

/**
 * Record a scan usage
 */
export async function recordScanUsage(
  wallet: string | null,
  ip: string,
  handle: string,
  tier: Tier,
  cached: boolean
): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  const { error } = await supabase.from('scan_usage').insert({
    wallet: wallet || null,
    ip_hash: wallet ? null : hashIP(ip),
    handle,
    tier,
    cached,
  });

  if (error) {
    console.error('[RateLimiter] Failed to record usage:', error);
    // Don't throw - recording failure shouldn't block the scan
  }
}

/**
 * Get usage stats for a wallet
 */
export async function getUsageStats(wallet: string): Promise<{
  today: number;
  total: number;
  lastScan: Date | null;
}> {
  const supabase = getServiceClient();
  if (!supabase) {
    return { today: 0, total: 0, lastScan: null };
  }
  const startOfDay = getStartOfDay();

  // Get today's count
  const { count: todayCount } = await supabase
    .from('scan_usage')
    .select('*', { count: 'exact', head: true })
    .eq('wallet', wallet)
    .gte('created_at', startOfDay.toISOString());

  // Get total count
  const { count: totalCount } = await supabase
    .from('scan_usage')
    .select('*', { count: 'exact', head: true })
    .eq('wallet', wallet);

  // Get last scan
  const { data: lastScanData } = await supabase
    .from('scan_usage')
    .select('created_at')
    .eq('wallet', wallet)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    today: todayCount || 0,
    total: totalCount || 0,
    lastScan: lastScanData?.created_at ? new Date(lastScanData.created_at) : null,
  };
}
