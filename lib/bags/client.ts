/**
 * Bags API Client
 * Docs: https://docs.bags.fm
 *
 * Provides access to Bags.fm DEX features:
 * - Token info (creator, fees)
 * - Swap quotes and transactions
 * - Analytics (claimable positions, stats)
 * - Fee sharing configuration
 */

const BAGS_API_URL = process.env.BAGS_API_URL || 'https://public-api-v2.bags.fm/api/v1';
const BAGS_API_KEY = process.env.BAGS_API_KEY;

interface BagsApiResponse<T> {
  success: boolean;
  response?: T;
  error?: string;
}

async function bagsRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<BagsApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(BAGS_API_KEY && { 'x-api-key': BAGS_API_KEY }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BAGS_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, response: data };
  } catch (error) {
    console.error('[BagsAPI] Request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TOKEN INFO
// ============================================================================

export interface TokenCreator {
  address: string;
  provider?: string;
}

export async function getTokenCreator(tokenAddress: string): Promise<TokenCreator | null> {
  const result = await bagsRequest<TokenCreator>(`/token/${tokenAddress}/creator`);
  return result.success ? result.response! : null;
}

export interface LifetimeFees {
  tokenAddress: string;
  totalFees: number;
  currency: string;
}

export async function getLifetimeFees(tokenAddress: string): Promise<LifetimeFees | null> {
  const result = await bagsRequest<LifetimeFees>(`/token/${tokenAddress}/fees`);
  return result.success ? result.response! : null;
}

export interface TokenInfo {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  creator?: string;
  lifetimeFees?: number;
  launchDate?: string;
  imageUrl?: string;
}

export async function getTokenInfo(tokenAddress: string): Promise<TokenInfo | null> {
  const result = await bagsRequest<TokenInfo>(`/token/${tokenAddress}`);
  return result.success ? result.response! : null;
}

// ============================================================================
// SWAPS
// ============================================================================

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  slippage: number;
  route?: string[];
}

export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: string
): Promise<SwapQuote | null> {
  const result = await bagsRequest<SwapQuote>('/swap/quote', {
    method: 'POST',
    body: JSON.stringify({ inputMint, outputMint, amount }),
  });
  return result.success ? result.response! : null;
}

export interface SwapTransaction {
  transaction: string; // Base64 encoded
  blockhash: string;
}

export async function createSwapTransaction(
  quote: SwapQuote,
  userWallet: string
): Promise<SwapTransaction | null> {
  const result = await bagsRequest<SwapTransaction>('/swap/transaction', {
    method: 'POST',
    body: JSON.stringify({ ...quote, userWallet }),
  });
  return result.success ? result.response! : null;
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface ClaimablePosition {
  tokenAddress: string;
  claimableAmount: number;
  currency: string;
  lastClaimed?: string;
}

export async function getClaimablePositions(wallet: string): Promise<ClaimablePosition[]> {
  const result = await bagsRequest<ClaimablePosition[]>(`/claims/${wallet}/positions`);
  return result.success ? result.response! : [];
}

export interface ClaimStats {
  totalClaimed: number;
  totalUnclaimed: number;
  currency: string;
}

export async function getClaimStats(wallet: string): Promise<ClaimStats | null> {
  const result = await bagsRequest<ClaimStats>(`/claims/${wallet}/stats`);
  return result.success ? result.response! : null;
}

// ============================================================================
// FEE SHARING
// ============================================================================

export interface FeeShareConfig {
  splits: Array<{
    wallet: string;
    share: number; // 0-1
  }>;
}

export async function configureFeeSharing(
  tokenAddress: string,
  config: FeeShareConfig
): Promise<boolean> {
  const result = await bagsRequest(`/fee-sharing/${tokenAddress}/configure`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return result.success;
}

export async function createClaimTransaction(
  wallet: string,
  tokenAddress: string
): Promise<SwapTransaction | null> {
  const result = await bagsRequest<SwapTransaction>('/claims/transaction', {
    method: 'POST',
    body: JSON.stringify({ wallet, tokenAddress }),
  });
  return result.success ? result.response! : null;
}

// ============================================================================
// TRENDING / DISCOVERY
// ============================================================================

export interface TrendingToken {
  address: string;
  name: string;
  symbol: string;
  volume24h: number;
  priceChange24h: number;
  lifetimeFees: number;
}

export async function getTrendingTokens(limit = 20): Promise<TrendingToken[]> {
  const result = await bagsRequest<TrendingToken[]>(`/tokens/trending?limit=${limit}`);
  return result.success ? result.response! : [];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a token was launched on Bags.fm
 * Bags tokens typically have specific patterns
 */
export function isBagsToken(tokenAddress: string): boolean {
  // This is a heuristic - actual check would need to query the API
  return tokenAddress.length >= 32 && tokenAddress.length <= 44;
}

/**
 * Get the Bags.fm URL for a token
 */
export function getBagsTokenUrl(tokenAddress: string): string {
  return `https://bags.fm/token/${tokenAddress}`;
}

/**
 * Get the Bags.fm trade URL for a token
 */
export function getBagsTradeUrl(tokenAddress: string): string {
  return `https://bags.fm/${tokenAddress}`;
}
