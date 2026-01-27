/**
 * Market Intelligence - Price & Volume Data
 *
 * Fetches market data from free Solana DEX APIs:
 * - Jupiter: Price API
 * - Birdeye: Token overview (requires free API key for full data)
 * - DexScreener: Already integrated in scan service
 *
 * No AI - pure API calls
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MarketIntel {
  tokenAddress: string;

  // Price info
  priceUsd?: number;
  priceChange24h?: number;          // % change
  priceChange7d?: number;
  priceChange30d?: number;

  // Volume
  volume24h?: number;
  volume7d?: number;

  // Market cap
  marketCap?: number;
  fullyDilutedValuation?: number;

  // Liquidity
  liquidity?: number;

  // Trading activity
  buys24h?: number;
  sells24h?: number;
  buyers24h?: number;
  sellers24h?: number;
  txCount24h?: number;

  // Holder info
  totalHolders?: number;
  holdersChange24h?: number;

  // Top DEX
  topDex?: string;
  topPair?: string;

  // CoinGecko/CoinMarketCap listing (legitimacy signal)
  coinGeckoId?: string;
  coinMarketCapId?: string;
  isListed: boolean;

  // Metadata
  fetchedAt: Date;
  sources: string[];
}

// ============================================================================
// JUPITER API
// ============================================================================

const JUPITER_PRICE_API = 'https://price.jup.ag/v6';

/**
 * Fetch price from Jupiter
 */
export async function fetchJupiterPrice(tokenAddress: string): Promise<{
  price?: number;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${JUPITER_PRICE_API}/price?ids=${tokenAddress}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { error: `Jupiter API returned ${response.status}` };
    }

    const data = await response.json();
    const tokenData = data.data?.[tokenAddress];

    if (tokenData) {
      return { price: tokenData.price };
    }

    return { error: 'Token not found in Jupiter' };

  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// BIRDEYE API (Free tier)
// ============================================================================

const BIRDEYE_PUBLIC_API = 'https://public-api.birdeye.so';

/**
 * Fetch token overview from Birdeye (limited without API key)
 */
export async function fetchBirdeyeOverview(tokenAddress: string, apiKey?: string): Promise<Partial<MarketIntel>> {
  const result: Partial<MarketIntel> = {};

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // API key is optional but unlocks more data
    if (apiKey) {
      headers['X-API-KEY'] = apiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${BIRDEYE_PUBLIC_API}/defi/token_overview?address=${tokenAddress}`, {
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.log(`[MarketIntel] Birdeye returned ${response.status}`);
      return result;
    }

    const data = await response.json();

    if (data.success && data.data) {
      const d = data.data;

      result.priceUsd = d.price;
      result.priceChange24h = d.priceChange24hPercent;
      result.volume24h = d.v24hUSD;
      result.marketCap = d.mc;
      result.liquidity = d.liquidity;
      result.totalHolders = d.holder;
      result.buys24h = d.buy24h;
      result.sells24h = d.sell24h;
      result.txCount24h = d.trade24h;
    }

    return result;

  } catch (error) {
    console.error(`[MarketIntel] Birdeye error:`, error);
    return result;
  }
}

// ============================================================================
// COINGECKO API (Free)
// ============================================================================

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

/**
 * Search CoinGecko for token (checks if it's listed - legitimacy signal)
 */
export async function searchCoinGecko(tokenAddress: string): Promise<{
  isListed: boolean;
  coinGeckoId?: string;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // CoinGecko uses contract address lookups
    const response = await fetch(
      `${COINGECKO_API}/coins/solana/contract/${tokenAddress}`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    clearTimeout(timeout);

    if (response.status === 404) {
      return { isListed: false };
    }

    if (!response.ok) {
      console.log(`[MarketIntel] CoinGecko returned ${response.status}`);
      return { isListed: false };
    }

    const data = await response.json();

    return {
      isListed: true,
      coinGeckoId: data.id,
      marketCap: data.market_data?.market_cap?.usd,
      volume24h: data.market_data?.total_volume?.usd,
      priceChange24h: data.market_data?.price_change_percentage_24h,
    };

  } catch (error) {
    console.error(`[MarketIntel] CoinGecko error:`, error);
    return { isListed: false };
  }
}

// ============================================================================
// AGGREGATED MARKET INTEL
// ============================================================================

/**
 * Fetch comprehensive market intel from multiple sources
 */
export async function fetchMarketIntel(tokenAddress: string, options?: {
  birdeyeApiKey?: string;
  skipCoinGecko?: boolean;
}): Promise<MarketIntel> {
  const result: MarketIntel = {
    tokenAddress,
    isListed: false,
    fetchedAt: new Date(),
    sources: [],
  };

  console.log(`[MarketIntel] Fetching market data for: ${tokenAddress}`);

  // Fetch from multiple sources in parallel
  const [jupiterResult, birdeyeResult, coinGeckoResult] = await Promise.all([
    fetchJupiterPrice(tokenAddress),
    fetchBirdeyeOverview(tokenAddress, options?.birdeyeApiKey),
    options?.skipCoinGecko
      ? Promise.resolve({ isListed: false as const, coinGeckoId: undefined, marketCap: undefined, volume24h: undefined, priceChange24h: undefined })
      : searchCoinGecko(tokenAddress),
  ]);

  // Jupiter price
  if (jupiterResult.price !== undefined) {
    result.priceUsd = jupiterResult.price;
    result.sources.push('jupiter');
  }

  // Birdeye data
  if (Object.keys(birdeyeResult).length > 0) {
    // Merge Birdeye data, preferring existing values
    result.priceUsd = result.priceUsd ?? birdeyeResult.priceUsd;
    result.priceChange24h = birdeyeResult.priceChange24h;
    result.volume24h = birdeyeResult.volume24h;
    result.marketCap = birdeyeResult.marketCap;
    result.liquidity = birdeyeResult.liquidity;
    result.totalHolders = birdeyeResult.totalHolders;
    result.buys24h = birdeyeResult.buys24h;
    result.sells24h = birdeyeResult.sells24h;
    result.txCount24h = birdeyeResult.txCount24h;
    result.sources.push('birdeye');
  }

  // CoinGecko listing check
  if (coinGeckoResult.isListed) {
    result.isListed = true;
    result.coinGeckoId = coinGeckoResult.coinGeckoId;
    result.marketCap = result.marketCap ?? coinGeckoResult.marketCap;
    result.volume24h = result.volume24h ?? coinGeckoResult.volume24h;
    result.priceChange24h = result.priceChange24h ?? coinGeckoResult.priceChange24h;
    result.sources.push('coingecko');
  }

  console.log(`[MarketIntel] Price: $${result.priceUsd?.toFixed(8)}, MCap: $${result.marketCap?.toLocaleString()}, Listed: ${result.isListed}`);

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format price for display
 */
export function formatPrice(price: number | undefined): string {
  if (price === undefined) return 'N/A';

  if (price < 0.000001) {
    return `$${price.toExponential(2)}`;
  }
  if (price < 0.01) {
    return `$${price.toFixed(8)}`;
  }
  if (price < 1) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Format large numbers (1000 -> 1K, 1000000 -> 1M)
 */
export function formatLargeNumber(num: number | undefined): string {
  if (num === undefined) return 'N/A';

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(0);
}

/**
 * Get trading activity summary
 */
export function getTradingActivitySummary(intel: MarketIntel): string {
  const parts: string[] = [];

  if (intel.volume24h) {
    parts.push(`Vol: $${formatLargeNumber(intel.volume24h)}`);
  }
  if (intel.txCount24h) {
    parts.push(`Txs: ${intel.txCount24h.toLocaleString()}`);
  }
  if (intel.buys24h && intel.sells24h) {
    const buyRatio = intel.buys24h / (intel.buys24h + intel.sells24h);
    parts.push(`Buys: ${(buyRatio * 100).toFixed(0)}%`);
  }

  return parts.join(' | ') || 'No trading data';
}
