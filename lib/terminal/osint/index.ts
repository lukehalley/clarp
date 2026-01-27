// OSINT Module
// Open Source Intelligence for crypto project enrichment
//
// Priority: APIs (free) > Scraping (free) > LLMs (paid)

// GitHub Intelligence
export {
  fetchGitHubRepoIntel,
  fetchGitHubUserIntel,
  fetchReadmeIntel,
  fetchEnrichedContributors,
  fetchProjectManifest,
  fetchComprehensiveGitHubIntel,
  parseGitHubUrl,
  isGitHubConfigured,
  type GitHubRepoIntel,
  type GitHubUserIntel,
  type ReadmeIntel,
  type EnrichedContributor,
  type ProjectManifest,
  type ComprehensiveGitHubIntel,
} from './github-intel';

// Website Analysis (AI-powered)
export {
  analyzeWebsite,
  checkWebsiteLive,
  type WebsiteIntel,
} from './website-intel';

// Website Scraper (NO AI - pure regex)
export {
  scrapeWebsite,
  type ScrapedWebsite,
  type ScrapeOptions,
} from './website-scraper';

// Telegram Scraper
export {
  scrapeTelegramGroup,
  type TelegramGroupInfo,
} from './telegram-scraper';

// Discord Scraper
export {
  scrapeDiscordServer,
  checkDiscordActive,
  type DiscordServerInfo,
} from './discord-scraper';

// Launchpad Detection (Pump.fun, Bags.fm)
export {
  detectLaunchpad,
  getLaunchpadUrl,
  fetchPumpFunToken,
  fetchBagsFmToken,
  fetchLaunchpadToken,
  type LaunchpadType,
  type LaunchpadTokenInfo,
} from './launchpad-intel';

// RugCheck Security Analysis
export {
  fetchRugCheckReport,
  hasRugCheckRedFlags,
  getRugCheckSummary,
  type RugCheckResult,
  type RugCheckRisk,
} from './rugcheck-intel';

// Domain Intelligence (Whois/RDAP)
export {
  getDomainIntel,
  isDomainSuspicious,
  formatDomainAge,
  type DomainIntel,
} from './domain-intel';

// Market Data (Jupiter, Birdeye, CoinGecko)
export {
  fetchMarketIntel,
  fetchJupiterPrice,
  fetchBirdeyeOverview,
  searchCoinGecko,
  formatPrice,
  formatLargeNumber,
  getTradingActivitySummary,
  type MarketIntel,
} from './market-intel';

// Wayback Machine (Website History)
export {
  getWaybackIntel,
  checkWebsiteHistory,
  fetchOldSnapshot,
  formatArchiveAge,
  type WaybackIntel,
} from './wayback-intel';
