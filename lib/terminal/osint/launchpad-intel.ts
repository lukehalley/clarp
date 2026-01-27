/**
 * Launchpad Intelligence - Pump.fun & Bags.fm
 *
 * Detects tokens from popular Solana launchpads and fetches their metadata.
 * These platforms have specific address patterns that identify their tokens.
 */

// ============================================================================
// TYPES
// ============================================================================

export type LaunchpadType = 'pump_fun' | 'bags_fm' | 'moonshot' | 'unknown';

export interface LaunchpadTokenInfo {
  // Identifiers
  address: string;
  launchpad: LaunchpadType;
  launchpadUrl?: string;       // Direct link to token on launchpad

  // Token info (from launchpad)
  name?: string;
  symbol?: string;
  description?: string;
  imageUrl?: string;

  // Creator info
  creator?: string;            // Creator wallet address
  creatorTwitter?: string;     // If linked

  // Socials (from launchpad listing)
  twitter?: string;
  telegram?: string;
  website?: string;

  // Metrics
  marketCap?: number;
  bondingCurveProgress?: number; // % to graduation (pump.fun)
  isGraduated?: boolean;         // Has it graduated from bonding curve?

  // Timestamps
  createdAt?: Date;
  graduatedAt?: Date;

  // Status
  isAccessible: boolean;
  fetchedAt: Date;
}

// ============================================================================
// ADDRESS PATTERN DETECTION
// ============================================================================

// Pump.fun tokens end with "pump"
const PUMP_FUN_SUFFIX = 'pump';

// Bags.fm tokens end with this specific address
const BAGS_FM_SUFFIX = '5Xb1VT9bWLW8VERuhCgEcstHmSGb1bhpHZdcxiHXBAGS';

/**
 * Detect which launchpad a token was created on based on address pattern
 */
export function detectLaunchpad(tokenAddress: string): LaunchpadType {
  if (!tokenAddress || typeof tokenAddress !== 'string') {
    return 'unknown';
  }

  const address = tokenAddress.trim();

  // Pump.fun: ends with "pump"
  if (address.toLowerCase().endsWith(PUMP_FUN_SUFFIX)) {
    return 'pump_fun';
  }

  // Bags.fm: ends with specific suffix
  if (address.endsWith(BAGS_FM_SUFFIX)) {
    return 'bags_fm';
  }

  // Moonshot: TBD (need to find pattern)

  return 'unknown';
}

/**
 * Get the launchpad URL for a token
 */
export function getLaunchpadUrl(tokenAddress: string, launchpad: LaunchpadType): string | undefined {
  switch (launchpad) {
    case 'pump_fun':
      return `https://pump.fun/coin/${tokenAddress}`;
    case 'bags_fm':
      // Bags.fm uses the address directly in the URL path
      return `https://bags.fm/${tokenAddress}`;
    default:
      return undefined;
  }
}

// ============================================================================
// PUMP.FUN API
// ============================================================================

const PUMP_FUN_API = 'https://frontend-api.pump.fun';

/**
 * Fetch token info from Pump.fun
 */
export async function fetchPumpFunToken(tokenAddress: string): Promise<LaunchpadTokenInfo> {
  const result: LaunchpadTokenInfo = {
    address: tokenAddress,
    launchpad: 'pump_fun',
    launchpadUrl: `https://pump.fun/coin/${tokenAddress}`,
    isAccessible: false,
    fetchedAt: new Date(),
  };

  try {
    console.log(`[LaunchpadIntel] Fetching Pump.fun token: ${tokenAddress}`);

    // Pump.fun has an API endpoint for coin info
    const response = await fetch(`${PUMP_FUN_API}/coins/${tokenAddress}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CLARP/1.0',
      },
    });

    if (!response.ok) {
      console.log(`[LaunchpadIntel] Pump.fun API returned ${response.status}`);
      // Fall back to scraping the page
      return await scrapePumpFunPage(tokenAddress, result);
    }

    const data = await response.json();
    result.isAccessible = true;

    // Map API response to our type
    result.name = data.name;
    result.symbol = data.symbol;
    result.description = data.description;
    result.imageUrl = data.image_uri;
    result.creator = data.creator;
    result.twitter = extractTwitterHandle(data.twitter);
    result.telegram = data.telegram;
    result.website = data.website;
    result.marketCap = data.usd_market_cap;
    result.bondingCurveProgress = data.bonding_curve_progress;
    result.isGraduated = data.complete === true;
    result.createdAt = data.created_timestamp ? new Date(data.created_timestamp) : undefined;

    console.log(`[LaunchpadIntel] Pump.fun token: ${result.name} (${result.symbol}), graduated=${result.isGraduated}`);

    return result;

  } catch (error) {
    console.error(`[LaunchpadIntel] Error fetching Pump.fun token:`, error);
    return result;
  }
}

/**
 * Fallback: Scrape Pump.fun page for token info
 */
async function scrapePumpFunPage(tokenAddress: string, result: LaunchpadTokenInfo): Promise<LaunchpadTokenInfo> {
  try {
    const pageUrl = `https://pump.fun/coin/${tokenAddress}`;
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CLARP/1.0)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return result;
    }

    const html = await response.text();
    result.isAccessible = true;

    // Extract from meta tags
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (titleMatch) {
      // Title format: "TokenName ($SYMBOL) | pump.fun"
      const titleParts = titleMatch[1].match(/(.+?)\s*\(\$?(\w+)\)/);
      if (titleParts) {
        result.name = titleParts[1].trim();
        result.symbol = titleParts[2].trim();
      }
    }

    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (descMatch) {
      result.description = descMatch[1];
    }

    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (imageMatch) {
      result.imageUrl = imageMatch[1];
    }

    // Try to extract socials from page
    const twitterMatch = html.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/i);
    if (twitterMatch) {
      result.twitter = twitterMatch[1].replace('@', '');
    }

    const telegramMatch = html.match(/(?:t\.me|telegram\.me)\/([\w]+)/i);
    if (telegramMatch) {
      result.telegram = `https://t.me/${telegramMatch[1]}`;
    }

    return result;

  } catch (error) {
    console.error(`[LaunchpadIntel] Error scraping Pump.fun page:`, error);
    return result;
  }
}

// ============================================================================
// BAGS.FM API
// ============================================================================

const BAGS_FM_API = 'https://api.bags.fm';

/**
 * Fetch token info from Bags.fm
 */
export async function fetchBagsFmToken(tokenAddress: string): Promise<LaunchpadTokenInfo> {
  const result: LaunchpadTokenInfo = {
    address: tokenAddress,
    launchpad: 'bags_fm',
    launchpadUrl: `https://bags.fm/${tokenAddress}`,
    isAccessible: false,
    fetchedAt: new Date(),
  };

  try {
    console.log(`[LaunchpadIntel] Fetching Bags.fm token: ${tokenAddress}`);

    // Try Bags.fm API (if they have one - otherwise scrape)
    const response = await fetch(`${BAGS_FM_API}/v1/token/${tokenAddress}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CLARP/1.0',
      },
    });

    if (!response.ok) {
      console.log(`[LaunchpadIntel] Bags.fm API returned ${response.status}`);
      // Fall back to scraping
      return await scrapeBagsFmPage(tokenAddress, result);
    }

    const data = await response.json();
    result.isAccessible = true;

    // Map API response (structure TBD - need to verify actual API)
    result.name = data.name;
    result.symbol = data.symbol;
    result.description = data.description;
    result.imageUrl = data.image;
    result.creator = data.creator;
    result.twitter = extractTwitterHandle(data.twitter);
    result.telegram = data.telegram;
    result.website = data.website;
    result.marketCap = data.marketCap;
    result.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;

    console.log(`[LaunchpadIntel] Bags.fm token: ${result.name} (${result.symbol})`);

    return result;

  } catch (error) {
    console.error(`[LaunchpadIntel] Error fetching Bags.fm token:`, error);
    // Fall back to scraping
    return await scrapeBagsFmPage(tokenAddress, result);
  }
}

/**
 * Fallback: Scrape Bags.fm page for token info
 */
async function scrapeBagsFmPage(tokenAddress: string, result: LaunchpadTokenInfo): Promise<LaunchpadTokenInfo> {
  try {
    const pageUrl = `https://bags.fm/${tokenAddress}`;
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CLARP/1.0)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return result;
    }

    const html = await response.text();
    result.isAccessible = true;

    // Extract from meta tags
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (titleMatch) {
      const titleParts = titleMatch[1].match(/(.+?)\s*\(\$?(\w+)\)/);
      if (titleParts) {
        result.name = titleParts[1].trim();
        result.symbol = titleParts[2].trim();
      } else {
        result.name = titleMatch[1];
      }
    }

    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (descMatch) {
      result.description = descMatch[1];
    }

    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (imageMatch) {
      result.imageUrl = imageMatch[1];
    }

    // Try to extract socials
    const twitterMatch = html.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/i);
    if (twitterMatch) {
      result.twitter = twitterMatch[1].replace('@', '');
    }

    const telegramMatch = html.match(/(?:t\.me|telegram\.me)\/([\w]+)/i);
    if (telegramMatch) {
      result.telegram = `https://t.me/${telegramMatch[1]}`;
    }

    return result;

  } catch (error) {
    console.error(`[LaunchpadIntel] Error scraping Bags.fm page:`, error);
    return result;
  }
}

// ============================================================================
// UNIFIED LAUNCHPAD FETCHER
// ============================================================================

/**
 * Fetch token info from detected launchpad
 * Auto-detects launchpad from address pattern
 */
export async function fetchLaunchpadToken(tokenAddress: string): Promise<LaunchpadTokenInfo | null> {
  const launchpad = detectLaunchpad(tokenAddress);

  if (launchpad === 'unknown') {
    return null;
  }

  switch (launchpad) {
    case 'pump_fun':
      return fetchPumpFunToken(tokenAddress);
    case 'bags_fm':
      return fetchBagsFmToken(tokenAddress);
    default:
      return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract Twitter handle from various URL formats
 */
function extractTwitterHandle(input: string | undefined | null): string | undefined {
  if (!input) return undefined;

  // Already just a handle
  if (/^@?[\w]+$/.test(input)) {
    return input.replace('@', '');
  }

  // URL format
  const match = input.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/i);
  if (match) {
    return match[1].replace('@', '');
  }

  return undefined;
}
