/**
 * Entity Resolver for CLARP
 *
 * Resolves any input (token address, X handle, website, GitHub) into a normalized
 * entity with all discoverable links. This is the entry point for project scanning.
 *
 * PRIORITY ORDER (minimize AI costs):
 * 1. APIs (DexScreener, GitHub API) - FREE
 * 2. Scraping (Website, Telegram) - FREE
 * 3. LLM (Grok for X analysis) - PAID (last resort)
 *
 * Flow:
 * 1. User enters ANY of: token address, X handle, website URL, GitHub URL
 * 2. Entity resolver detects input type
 * 3. Uses appropriate APIs/scrapers to discover related links
 * 4. Returns normalized entity with all found links
 * 5. Scan service then calls Grok ONLY for X analysis + final synthesis
 */

import { lookupTokenByAddress, searchToken, TokenData } from './xintel/tokenLookup';
import {
  // Website & Social Scrapers
  scrapeWebsite,
  scrapeTelegramGroup,
  scrapeDiscordServer,
  // GitHub Intelligence
  fetchComprehensiveGitHubIntel,
  // Launchpad Detection
  detectLaunchpad,
  fetchLaunchpadToken,
  // Security Analysis
  fetchRugCheckReport,
  // Domain Intelligence
  getDomainIntel,
  // Market Data
  fetchMarketIntel,
  // History Check
  getWaybackIntel,
  // Types
  type ComprehensiveGitHubIntel,
  type ScrapedWebsite,
  type TelegramGroupInfo,
  type DiscordServerInfo,
  type LaunchpadTokenInfo,
  type LaunchpadType,
  type RugCheckResult,
  type DomainIntel,
  type MarketIntel,
  type WaybackIntel,
} from './osint';

// ============================================================================
// TYPES
// ============================================================================

export type InputType = 'token_address' | 'x_handle' | 'website' | 'github' | 'search_query';

export interface ResolvedEntity {
  // The canonical identifier (usually X handle if found)
  canonicalId: string;
  // What type of input was provided
  inputType: InputType;
  // Original input from user
  originalInput: string;

  // Basic info
  name?: string;
  symbol?: string;
  description?: string;
  imageUrl?: string;

  // Discovered links
  xHandle?: string;
  website?: string;
  github?: string;
  telegram?: string;
  discord?: string;
  docs?: string;
  whitepaper?: string;

  // Token data
  tokenAddresses?: Array<{
    chain: string;
    address: string;
    symbol: string;
  }>;
  tokenData?: TokenData;

  // Launchpad info
  launchpad?: LaunchpadType;
  launchpadUrl?: string;
  launchpadData?: LaunchpadTokenInfo;

  // GitHub intel
  githubIntel?: ComprehensiveGitHubIntel;

  // Website intel
  websiteIntel?: ScrapedWebsite;

  // Telegram intel
  telegramIntel?: TelegramGroupInfo;

  // Discord intel
  discordIntel?: DiscordServerInfo;

  // Security analysis (RugCheck)
  securityIntel?: RugCheckResult;

  // Domain intel (Whois)
  domainIntel?: DomainIntel;

  // Market data (Jupiter, Birdeye, CoinGecko)
  marketIntel?: MarketIntel;

  // Website history (Wayback Machine)
  historyIntel?: WaybackIntel;

  // Team discovery (from GitHub + website)
  discoveredTeam?: Array<{
    name?: string;
    github?: string;
    twitter?: string;
    role?: string;
    isDoxxed: boolean;
  }>;

  // Tech stack (from GitHub)
  techStack?: string[];

  // Risk flags (aggregated from all sources)
  riskFlags?: string[];

  // Legitimacy signals (positive indicators)
  legitimacySignals?: string[];

  // Confidence in the resolution (0-100)
  confidence: number;

  // Any warnings or notes about the resolution
  notes?: string[];
}

export interface ResolutionResult {
  success: boolean;
  entity?: ResolvedEntity;
  error?: string;
}

// ============================================================================
// INPUT TYPE DETECTION
// ============================================================================

/**
 * Detect what type of input the user provided
 */
export function detectInputType(input: string): InputType {
  const trimmed = input.trim();

  // Solana address: base58 encoded, 32-44 characters
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
    return 'token_address';
  }

  // Ethereum address: 0x followed by 40 hex chars
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 'token_address';
  }

  // X/Twitter URL
  if (trimmed.includes('twitter.com/') || trimmed.includes('x.com/')) {
    return 'x_handle';
  }

  // GitHub URL
  if (trimmed.includes('github.com/')) {
    return 'github';
  }

  // Pump.fun URL
  if (trimmed.includes('pump.fun/')) {
    return 'token_address';
  }

  // Bags.fm URL
  if (trimmed.includes('bags.fm/')) {
    return 'token_address';
  }

  // X/Twitter handle: starts with @ or looks like a handle
  if (trimmed.startsWith('@') || /^[a-zA-Z0-9_]{1,15}$/.test(trimmed)) {
    if (trimmed.length >= 3 && /^@?[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'x_handle';
    }
  }

  // Website URL (has a domain)
  if (/^https?:\/\//.test(trimmed) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return 'website';
  }

  // Default: treat as a search query
  return 'search_query';
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract X handle from various URL formats
 */
function extractXHandle(input: string): string | null {
  if (input.startsWith('@')) {
    return input.slice(1).toLowerCase();
  }

  const urlMatch = input.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/i);
  if (urlMatch) {
    return urlMatch[1].replace('@', '').toLowerCase();
  }

  if (/^[a-zA-Z0-9_]{1,15}$/.test(input)) {
    return input.toLowerCase();
  }

  return null;
}

/**
 * Extract token address from launchpad URLs
 */
function extractTokenFromUrl(input: string): string | null {
  // Pump.fun: https://pump.fun/coin/{address}
  const pumpMatch = input.match(/pump\.fun\/coin\/([1-9A-HJ-NP-Za-km-z]{32,44})/i);
  if (pumpMatch) return pumpMatch[1];

  // Bags.fm: https://bags.fm/{address}
  const bagsMatch = input.match(/bags\.fm\/([1-9A-HJ-NP-Za-km-z]{32,44})/i);
  if (bagsMatch) return bagsMatch[1];

  return null;
}

/**
 * Extract GitHub org/repo from URL
 */
function extractGitHub(input: string): { org: string; repo?: string } | null {
  const match = input.match(/github\.com\/([^\/\s]+)(?:\/([^\/\s]+))?/i);
  if (match) {
    return { org: match[1], repo: match[2] };
  }
  return null;
}

/**
 * Extract X handle from Twitter URL
 */
function extractXHandleFromUrl(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/i);
  if (match) {
    return match[1].replace('@', '').toLowerCase();
  }
  return null;
}

/**
 * Extract Telegram handle from URL
 */
function extractTelegramHandle(url: string): string | null {
  const match = url.match(/(?:t\.me|telegram\.me)\/([\w]+)/i);
  return match ? match[1] : null;
}

// ============================================================================
// COMPREHENSIVE RESOLUTION
// ============================================================================

/**
 * Resolve from token address - FULL OSINT
 * 1. DexScreener for token data + socials
 * 2. Detect launchpad (Pump.fun, Bags.fm)
 * 3. RugCheck security analysis
 * 4. Scrape website for more links (deep crawl)
 * 5. Domain intel (Whois age)
 * 6. Fetch GitHub intel
 * 7. Scrape Telegram + Discord
 * 8. Market data (Jupiter, Birdeye, CoinGecko)
 * 9. Wayback Machine history
 */
async function resolveFromTokenAddress(address: string): Promise<ResolutionResult> {
  console.log(`[EntityResolver] Resolving token address: ${address}`);

  const notes: string[] = [];
  const riskFlags: string[] = [];
  const legitimacySignals: string[] = [];
  let confidence = 50;

  // Step 1: DexScreener lookup
  const dexResult = await lookupTokenByAddress(address);

  if (!dexResult.found || !dexResult.token) {
    // Try launchpad directly if DexScreener doesn't have it
    const launchpad = detectLaunchpad(address);
    if (launchpad !== 'unknown') {
      const launchpadData = await fetchLaunchpadToken(address);
      if (launchpadData?.isAccessible) {
        return {
          success: true,
          entity: {
            canonicalId: launchpadData.twitter || address,
            inputType: 'token_address',
            originalInput: address,
            name: launchpadData.name,
            symbol: launchpadData.symbol,
            description: launchpadData.description,
            imageUrl: launchpadData.imageUrl,
            xHandle: launchpadData.twitter,
            website: launchpadData.website,
            telegram: launchpadData.telegram,
            launchpad,
            launchpadUrl: launchpadData.launchpadUrl,
            launchpadData,
            tokenAddresses: [{ chain: 'solana', address, symbol: launchpadData.symbol || 'UNKNOWN' }],
            confidence: 70,
            notes: [`Token found on ${launchpad}`],
          },
        };
      }
    }

    return {
      success: false,
      error: dexResult.error || 'Token not found',
    };
  }

  const token = dexResult.token;

  // Extract initial links from DexScreener
  let xHandle = token.twitterUrl ? extractXHandleFromUrl(token.twitterUrl) ?? undefined : undefined;
  let website = token.websiteUrl;
  let telegram = token.telegramUrl;
  let discord: string | undefined;
  let github: string | undefined;
  let docs: string | undefined;
  let whitepaper: string | undefined;

  // Step 2: Detect launchpad
  const launchpad = detectLaunchpad(address);
  let launchpadData: LaunchpadTokenInfo | undefined;

  if (launchpad !== 'unknown') {
    notes.push(`Token from ${launchpad}`);
    const lpData = await fetchLaunchpadToken(address);
    if (lpData?.isAccessible) {
      launchpadData = lpData;
      xHandle = xHandle || lpData.twitter;
      website = website || lpData.website;
      telegram = telegram || lpData.telegram;
      confidence += 10;
    }
  }

  // Step 3: RugCheck security analysis (run in parallel with other calls)
  const securityPromise = fetchRugCheckReport(address);

  // Step 4: Scrape website for more links (deep crawl)
  let websiteIntel: ScrapedWebsite | undefined;
  let domainIntel: DomainIntel | undefined;
  let historyIntel: WaybackIntel | undefined;

  if (website) {
    // Run website scrape, domain intel, and wayback in parallel
    const [webResult, domainResult, historyResult] = await Promise.all([
      scrapeWebsite(website, { maxPages: 15, deepCrawl: true }),
      getDomainIntel(website),
      getWaybackIntel(website),
    ]);

    websiteIntel = webResult;
    domainIntel = domainResult;
    historyIntel = historyResult;

    if (websiteIntel.isLive) {
      // Merge discovered links
      xHandle = xHandle || websiteIntel.twitter;
      github = github || websiteIntel.github;
      telegram = telegram || websiteIntel.telegram;
      discord = discord || websiteIntel.discord;
      docs = docs || websiteIntel.docs;
      whitepaper = whitepaper || websiteIntel.whitepaper;
      confidence += 10;
      notes.push(`Website crawled: ${websiteIntel.pagesCrawled} pages`);
    }

    // Domain age analysis
    if (domainIntel.isAccessible) {
      if (domainIntel.ageRisk === 'new') {
        riskFlags.push(`Domain registered only ${domainIntel.ageInDays} days ago`);
      } else if (domainIntel.ageRisk === 'established') {
        legitimacySignals.push(`Domain established (${domainIntel.ageInMonths} months old)`);
        confidence += 5;
      }
    }

    // Wayback history
    if (historyIntel.hasArchives) {
      legitimacySignals.push(`Website history: ${historyIntel.totalSnapshots} archives since ${historyIntel.firstArchiveDate?.toISOString().split('T')[0]}`);
      confidence += 5;
    }
  }

  // Step 5: Fetch GitHub intel
  let githubIntel: ComprehensiveGitHubIntel | undefined;
  let discoveredTeam: ResolvedEntity['discoveredTeam'] = [];
  let techStack: string[] = [];

  if (github) {
    const ghResult = await fetchComprehensiveGitHubIntel(github);
    if (ghResult) {
      githubIntel = ghResult;
      discoveredTeam = ghResult.contributors.map(c => ({
        name: c.name || undefined,
        github: c.login,
        twitter: c.twitter || undefined,
        role: c.likelyRole,
        isDoxxed: !!(c.name && (c.twitter || c.blog)),
      }));

      techStack = ghResult.readme?.techStack || [];
      if (ghResult.repo.primaryLanguage) {
        techStack.unshift(ghResult.repo.primaryLanguage.toLowerCase());
      }
      techStack = [...new Set(techStack)];

      if (ghResult.readme) {
        xHandle = xHandle || ghResult.readme.twitter;
        discord = discord || ghResult.readme.discord;
        telegram = telegram || ghResult.readme.telegram;
        docs = docs || ghResult.readme.docs;
      }

      // GitHub legitimacy signals
      if (ghResult.repo.stars > 100) {
        legitimacySignals.push(`GitHub: ${ghResult.repo.stars} stars`);
      }
      if (ghResult.contributors.length >= 3) {
        legitimacySignals.push(`${ghResult.contributors.length} contributors`);
      }

      confidence += 15;
    }
  }

  // Step 6: Scrape Telegram + Discord in parallel
  let telegramIntel: TelegramGroupInfo | undefined;
  let discordIntel: DiscordServerInfo | undefined;

  const socialPromises: Promise<void>[] = [];

  if (telegram) {
    const tgHandle = extractTelegramHandle(telegram);
    if (tgHandle) {
      socialPromises.push(
        scrapeTelegramGroup(tgHandle).then(result => {
          telegramIntel = result;
          if (result.memberCount && result.memberCount > 1000) {
            legitimacySignals.push(`Telegram: ${result.memberCount.toLocaleString()} members`);
          }
        })
      );
    }
  }

  if (discord) {
    socialPromises.push(
      scrapeDiscordServer(discord).then(result => {
        discordIntel = result;
        if (result.memberCount && result.memberCount > 1000) {
          legitimacySignals.push(`Discord: ${result.memberCount.toLocaleString()} members`);
        }
        if (result.isVerified) {
          legitimacySignals.push('Discord server verified');
        }
      })
    );
  }

  await Promise.all(socialPromises);

  // Step 7: Market data
  const marketIntel = await fetchMarketIntel(address, { skipCoinGecko: false });

  if (marketIntel.isListed) {
    legitimacySignals.push('Listed on CoinGecko');
    confidence += 10;
  }

  // Step 8: Wait for security analysis
  const securityIntel = await securityPromise;

  if (securityIntel.isAccessible) {
    // Process security flags
    if (securityIntel.isRugged) {
      riskFlags.push('⚠️ FLAGGED AS RUG PULL');
    }
    if (securityIntel.mintAuthority === 'active') {
      riskFlags.push('Mint authority active - unlimited supply risk');
    }
    if (securityIntel.freezeAuthority === 'active') {
      riskFlags.push('Freeze authority active - tokens can be frozen');
    }
    if (securityIntel.lpLocked === false && securityIntel.totalLiquidityUsd && securityIntel.totalLiquidityUsd > 1000) {
      riskFlags.push('Liquidity not locked');
    }
    if (securityIntel.topHolderPercent && securityIntel.topHolderPercent > 30) {
      riskFlags.push(`Single holder controls ${securityIntel.topHolderPercent.toFixed(1)}% of supply`);
    }

    // Positive security signals
    if (securityIntel.mintAuthority === 'renounced' && securityIntel.freezeAuthority === 'renounced') {
      legitimacySignals.push('Mint & freeze authorities renounced');
      confidence += 10;
    }
    if (securityIntel.lpLocked) {
      legitimacySignals.push('Liquidity locked');
      confidence += 5;
    }
    if (securityIntel.totalHolders && securityIntel.totalHolders > 1000) {
      legitimacySignals.push(`${securityIntel.totalHolders.toLocaleString()} holders`);
    }
  }

  // Calculate final confidence
  if (xHandle) confidence += 10;
  if (github) confidence += 5;
  if (discoveredTeam.length > 0) confidence += 10;
  if (riskFlags.length > 0) confidence -= riskFlags.length * 5;

  confidence = Math.max(10, Math.min(confidence, 95)); // Keep between 10-95

  return {
    success: true,
    entity: {
      canonicalId: xHandle || token.symbol || address,
      inputType: 'token_address',
      originalInput: address,
      name: token.name,
      symbol: token.symbol,
      imageUrl: token.imageUrl || undefined,
      xHandle,
      website,
      github,
      telegram,
      discord,
      docs,
      whitepaper,
      tokenAddresses: [{ chain: 'solana', address, symbol: token.symbol }],
      tokenData: token,
      launchpad: launchpad !== 'unknown' ? launchpad : undefined,
      launchpadUrl: launchpadData?.launchpadUrl,
      launchpadData,
      githubIntel,
      websiteIntel,
      telegramIntel,
      discordIntel,
      securityIntel,
      domainIntel,
      marketIntel,
      historyIntel,
      discoveredTeam: discoveredTeam.length > 0 ? discoveredTeam : undefined,
      techStack: techStack.length > 0 ? techStack : undefined,
      riskFlags: riskFlags.length > 0 ? riskFlags : undefined,
      legitimacySignals: legitimacySignals.length > 0 ? legitimacySignals : undefined,
      confidence,
      notes: notes.length > 0 ? notes : undefined,
    },
  };
}

/**
 * Resolve from X handle - minimal, defer to Grok
 */
async function resolveFromXHandle(input: string): Promise<ResolutionResult> {
  const handle = extractXHandle(input);

  if (!handle) {
    return { success: false, error: 'Could not extract X handle from input' };
  }

  console.log(`[EntityResolver] Resolved X handle: @${handle}`);

  return {
    success: true,
    entity: {
      canonicalId: handle,
      inputType: 'x_handle',
      originalInput: input,
      xHandle: handle,
      confidence: 95,
    },
  };
}

/**
 * Resolve from GitHub URL - FULL OSINT
 */
async function resolveFromGitHub(input: string): Promise<ResolutionResult> {
  const github = extractGitHub(input);

  if (!github) {
    return { success: false, error: 'Could not parse GitHub URL' };
  }

  console.log(`[EntityResolver] Resolving GitHub: ${github.org}/${github.repo || ''}`);

  const githubUrl = `https://github.com/${github.org}${github.repo ? '/' + github.repo : ''}`;
  const githubIntel = await fetchComprehensiveGitHubIntel(githubUrl);

  if (!githubIntel) {
    return {
      success: true,
      entity: {
        canonicalId: github.org,
        inputType: 'github',
        originalInput: input,
        github: githubUrl,
        confidence: 50,
        notes: ['Could not fetch GitHub details'],
      },
    };
  }

  // Extract data from GitHub
  let xHandle: string | undefined = githubIntel.readme?.twitter;
  let website = githubIntel.repo.homepage || githubIntel.readme?.website;
  let telegram = githubIntel.readme?.telegram;
  let discord = githubIntel.readme?.discord;
  let docs = githubIntel.readme?.docs;

  // Extract team from contributors
  const discoveredTeam = githubIntel.contributors.map(c => ({
    name: c.name || undefined,
    github: c.login,
    twitter: c.twitter || undefined,
    role: c.likelyRole,
    isDoxxed: !!(c.name && (c.twitter || c.blog)),
  }));

  // Tech stack
  const techStack = githubIntel.readme?.techStack || [];
  if (githubIntel.repo.primaryLanguage) {
    techStack.unshift(githubIntel.repo.primaryLanguage.toLowerCase());
  }

  // Scrape website if found
  let websiteIntel: ScrapedWebsite | undefined;
  if (website) {
    websiteIntel = await scrapeWebsite(website);
    if (websiteIntel.isLive) {
      xHandle = xHandle || websiteIntel.twitter;
      telegram = telegram || websiteIntel.telegram;
      discord = discord || websiteIntel.discord;
      docs = docs || websiteIntel.docs;
    }
  }

  const confidence = 70 + (xHandle ? 10 : 0) + (discoveredTeam.length > 0 ? 10 : 0);

  return {
    success: true,
    entity: {
      canonicalId: xHandle || github.org,
      inputType: 'github',
      originalInput: input,
      name: githubIntel.readme?.projectName || githubIntel.manifest?.name,
      description: githubIntel.repo.description || githubIntel.readme?.description,
      xHandle,
      website,
      github: githubUrl,
      telegram,
      discord,
      docs,
      githubIntel,
      websiteIntel,
      discoveredTeam: discoveredTeam.length > 0 ? discoveredTeam : undefined,
      techStack: [...new Set(techStack)],
      confidence: Math.min(confidence, 95),
    },
  };
}

/**
 * Resolve from website URL - scrape + follow links + full intel
 */
async function resolveFromWebsite(input: string): Promise<ResolutionResult> {
  let url = input.trim();
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  const domainMatch = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
  const domain = domainMatch ? domainMatch[1] : url;

  console.log(`[EntityResolver] Resolving website: ${domain}`);

  const notes: string[] = [];
  const riskFlags: string[] = [];
  const legitimacySignals: string[] = [];

  // Run website scrape, domain intel, and wayback in parallel
  const [websiteIntel, domainIntel, historyIntel] = await Promise.all([
    scrapeWebsite(url, { maxPages: 15, deepCrawl: true }),
    getDomainIntel(url),
    getWaybackIntel(url),
  ]);

  if (!websiteIntel.isLive) {
    return {
      success: true,
      entity: {
        canonicalId: domain.replace(/\.[a-z]+$/, ''),
        inputType: 'website',
        originalInput: input,
        website: url,
        domainIntel,
        historyIntel,
        confidence: 30,
        notes: ['Website not accessible'],
      },
    };
  }

  notes.push(`Crawled ${websiteIntel.pagesCrawled} pages`);

  // Domain age analysis
  if (domainIntel.isAccessible) {
    if (domainIntel.ageRisk === 'new') {
      riskFlags.push(`Domain registered only ${domainIntel.ageInDays} days ago`);
    } else if (domainIntel.ageRisk === 'established') {
      legitimacySignals.push(`Domain established (${domainIntel.ageInMonths} months old)`);
    }
  }

  // Wayback history
  if (historyIntel.hasArchives) {
    legitimacySignals.push(`Website history since ${historyIntel.firstArchiveDate?.toISOString().split('T')[0]}`);
  }

  let xHandle = websiteIntel.twitter;
  let github = websiteIntel.github;
  let telegram = websiteIntel.telegram;
  let discord = websiteIntel.discord;
  let docs = websiteIntel.docs;
  let whitepaper = websiteIntel.whitepaper;

  // Fetch GitHub intel if found
  let githubIntel: ComprehensiveGitHubIntel | undefined;
  let discoveredTeam: ResolvedEntity['discoveredTeam'] = [];
  let techStack: string[] = [];

  if (github) {
    const ghResult = await fetchComprehensiveGitHubIntel(github);
    if (ghResult) {
      githubIntel = ghResult;
      discoveredTeam = ghResult.contributors.map(c => ({
        name: c.name || undefined,
        github: c.login,
        twitter: c.twitter || undefined,
        role: c.likelyRole,
        isDoxxed: !!(c.name && (c.twitter || c.blog)),
      }));

      techStack = ghResult.readme?.techStack || [];
      if (ghResult.repo.primaryLanguage) {
        techStack.unshift(ghResult.repo.primaryLanguage.toLowerCase());
      }

      xHandle = xHandle || ghResult.readme?.twitter;
      telegram = telegram || ghResult.readme?.telegram;
      discord = discord || ghResult.readme?.discord;
      docs = docs || ghResult.readme?.docs;

      if (ghResult.repo.stars > 100) {
        legitimacySignals.push(`GitHub: ${ghResult.repo.stars} stars`);
      }
    }
  }

  // Scrape socials in parallel
  let telegramIntel: TelegramGroupInfo | undefined;
  let discordIntel: DiscordServerInfo | undefined;

  const socialPromises: Promise<void>[] = [];

  if (telegram) {
    const tgHandle = extractTelegramHandle(telegram);
    if (tgHandle) {
      socialPromises.push(
        scrapeTelegramGroup(tgHandle).then(result => {
          telegramIntel = result;
          if (result.memberCount && result.memberCount > 1000) {
            legitimacySignals.push(`Telegram: ${result.memberCount.toLocaleString()} members`);
          }
        })
      );
    }
  }

  if (discord) {
    socialPromises.push(
      scrapeDiscordServer(discord).then(result => {
        discordIntel = result;
        if (result.memberCount && result.memberCount > 1000) {
          legitimacySignals.push(`Discord: ${result.memberCount.toLocaleString()} members`);
        }
      })
    );
  }

  await Promise.all(socialPromises);

  let confidence = 60 + (xHandle ? 10 : 0) + (github ? 10 : 0) + (discoveredTeam.length > 0 ? 10 : 0);
  if (domainIntel.ageRisk === 'established') confidence += 5;
  if (historyIntel.hasArchives) confidence += 5;
  if (riskFlags.length > 0) confidence -= riskFlags.length * 5;

  return {
    success: true,
    entity: {
      canonicalId: xHandle || domain.replace(/\.[a-z]+$/, ''),
      inputType: 'website',
      originalInput: input,
      name: websiteIntel.title,
      description: websiteIntel.description,
      xHandle,
      website: url,
      github,
      telegram,
      discord,
      docs,
      whitepaper,
      websiteIntel,
      githubIntel,
      telegramIntel,
      discordIntel,
      domainIntel,
      historyIntel,
      discoveredTeam: discoveredTeam.length > 0 ? discoveredTeam : undefined,
      techStack: techStack.length > 0 ? [...new Set(techStack)] : undefined,
      riskFlags: riskFlags.length > 0 ? riskFlags : undefined,
      legitimacySignals: legitimacySignals.length > 0 ? legitimacySignals : undefined,
      confidence: Math.max(10, Math.min(confidence, 95)),
      notes: notes.length > 0 ? notes : undefined,
    },
  };
}

/**
 * Resolve from search query - try DexScreener search
 */
async function resolveFromSearch(query: string): Promise<ResolutionResult> {
  console.log(`[EntityResolver] Search query: ${query}`);

  // Try DexScreener search first
  const searchResult = await searchToken(query);

  if (searchResult.found && searchResult.token) {
    // Found a token - resolve it fully
    return resolveFromTokenAddress(searchResult.token.address);
  }

  // Fall back to treating as X handle
  return {
    success: true,
    entity: {
      canonicalId: query.toLowerCase().replace(/\s+/g, ''),
      inputType: 'search_query',
      originalInput: query,
      xHandle: query.toLowerCase().replace(/\s+/g, ''),
      confidence: 30,
      notes: ['No token found - treating as potential X handle'],
    },
  };
}

// ============================================================================
// MAIN RESOLVER
// ============================================================================

/**
 * Resolve any user input into a normalized entity with full OSINT
 */
export async function resolveEntity(input: string): Promise<ResolutionResult> {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Invalid input' };
  }

  const trimmed = input.trim();
  if (trimmed.length < 2) {
    return { success: false, error: 'Input too short' };
  }

  // Check for launchpad URLs first
  const tokenFromUrl = extractTokenFromUrl(trimmed);
  if (tokenFromUrl) {
    return resolveFromTokenAddress(tokenFromUrl);
  }

  const inputType = detectInputType(trimmed);
  console.log(`[EntityResolver] Detected input type: ${inputType} for "${trimmed.slice(0, 50)}..."`);

  switch (inputType) {
    case 'token_address':
      return resolveFromTokenAddress(trimmed);
    case 'x_handle':
      return resolveFromXHandle(trimmed);
    case 'github':
      return resolveFromGitHub(trimmed);
    case 'website':
      return resolveFromWebsite(trimmed);
    case 'search_query':
    default:
      return resolveFromSearch(trimmed);
  }
}

/**
 * Get a human-readable description of the input type
 */
export function getInputTypeLabel(inputType: InputType): string {
  switch (inputType) {
    case 'token_address':
      return 'Token Address';
    case 'x_handle':
      return 'X Handle';
    case 'github':
      return 'GitHub';
    case 'website':
      return 'Website';
    case 'search_query':
      return 'Search';
    default:
      return 'Unknown';
  }
}
