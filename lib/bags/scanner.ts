/**
 * Bags Token Scanner
 * Hybrid mode: Auto-scan popular tokens, on-demand for others
 *
 * Uses Bags API to:
 * - Check if token has significant volume (lifetime fees)
 * - Popular tokens (>$10K fees) get auto-scanned
 * - Other tokens require manual scan request
 */

import { detectLaunchpad } from '@/lib/terminal/osint/launchpad-intel';
import { getLifetimeFees, getTokenInfo } from '@/lib/bags/client';
import { getServiceClient } from '@/lib/supabase/server';

// Volume threshold for "popular" tokens (in SOL)
const VOLUME_THRESHOLD_SOL = 10; // ~$2000 at current prices

// Cache TTL (24 hours)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface BagsTokenWithScore {
  address: string;
  name?: string;
  symbol?: string;
  imageUrl?: string;
  trustScore?: number;
  lifetimeFees?: number;
  isPopular: boolean;
  scannedAt?: Date;
  projectId?: string;
}

/**
 * Check if a token should be auto-scanned
 * Returns true for Bags tokens with significant volume
 */
export async function shouldAutoScan(tokenAddress: string): Promise<boolean> {
  // Only auto-scan Bags tokens
  if (detectLaunchpad(tokenAddress) !== 'bags_fm') {
    return false;
  }

  // Check if token has significant volume
  const fees = await getLifetimeFees(tokenAddress);
  if (!fees) return false;

  return fees.totalFees >= VOLUME_THRESHOLD_SOL;
}

/**
 * Get cached Bags token data from database
 */
export async function getCachedBagsToken(tokenAddress: string): Promise<BagsTokenWithScore | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  // Check projects table for existing scan
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, trust_score, last_scan_at, avatar_url')
    .eq('token_address', tokenAddress)
    .single();

  if (project) {
    const scannedAt = new Date(project.last_scan_at);
    const age = Date.now() - scannedAt.getTime();

    // Return cached if not expired
    if (age < CACHE_TTL_MS) {
      return {
        address: tokenAddress,
        name: project.name,
        trustScore: project.trust_score,
        imageUrl: project.avatar_url,
        isPopular: true,
        scannedAt,
        projectId: project.id,
      };
    }
  }

  return null;
}

/**
 * Get Bags token info and determine if it needs scanning
 */
export async function getBagsTokenStatus(tokenAddress: string): Promise<{
  needsScan: boolean;
  isPopular: boolean;
  cached?: BagsTokenWithScore;
  tokenInfo?: {
    name?: string;
    symbol?: string;
    lifetimeFees?: number;
  };
}> {
  // Check cache first
  const cached = await getCachedBagsToken(tokenAddress);
  if (cached) {
    return {
      needsScan: false,
      isPopular: true,
      cached,
    };
  }

  // Get token info from Bags API
  const [tokenInfo, fees] = await Promise.all([
    getTokenInfo(tokenAddress),
    getLifetimeFees(tokenAddress),
  ]);

  const isPopular = (fees?.totalFees ?? 0) >= VOLUME_THRESHOLD_SOL;

  return {
    needsScan: true,
    isPopular,
    tokenInfo: {
      name: tokenInfo?.name,
      symbol: tokenInfo?.symbol,
      lifetimeFees: fees?.totalFees,
    },
  };
}

/**
 * Get all cached Bags tokens from database
 * Useful for showing a list of scanned Bags tokens
 */
export async function getCachedBagsTokens(limit = 20): Promise<BagsTokenWithScore[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  // Get projects that are Bags tokens (have token_address ending in BAGS)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, token_address, trust_score, last_scan_at, avatar_url')
    .not('token_address', 'is', null)
    .order('last_scan_at', { ascending: false })
    .limit(limit);

  if (!projects) return [];

  // Filter to only Bags tokens
  return projects
    .filter((p) => p.token_address && detectLaunchpad(p.token_address) === 'bags_fm')
    .map((p) => ({
      address: p.token_address!,
      name: p.name,
      trustScore: p.trust_score,
      imageUrl: p.avatar_url,
      isPopular: true,
      scannedAt: new Date(p.last_scan_at),
      projectId: p.id,
    }));
}

/**
 * Get trending Bags tokens that need scanning
 * These are tokens with high fees but not yet in our database
 */
export async function getTrendingUnscannedTokens(): Promise<string[]> {
  // This would ideally use the Bags trending API
  // For now, return empty - tokens come from user requests
  return [];
}
