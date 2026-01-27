/**
 * Website Scraper - NO AI
 *
 * Extracts social links and metadata from websites using pure scraping.
 * Priority: APIs > Scraping > LLM (this is the scraping layer)
 *
 * Supports deep crawling - crawls internal pages to find all links.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ScrapedWebsite {
  url: string;
  isLive: boolean;
  statusCode?: number;

  // Extracted links (from HTML)
  twitter?: string;       // X/Twitter handle
  github?: string;        // GitHub URL
  telegram?: string;      // Telegram URL
  discord?: string;       // Discord URL
  docs?: string;          // Documentation URL
  whitepaper?: string;    // Whitepaper URL

  // Meta info
  title?: string;
  description?: string;
  ogImage?: string;

  // All social links found
  allSocialLinks: Array<{
    platform: string;
    url: string;
  }>;

  // Email addresses found
  emails: string[];

  // Deep crawl info
  pagesCrawled: number;
  internalLinksFound: number;

  // Timing
  scrapedAt: Date;
  loadTimeMs: number;
}

// ============================================================================
// LINK PATTERNS
// ============================================================================

const SOCIAL_PATTERNS = {
  twitter: [
    /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(@?[\w]+)/gi,
    /href=["'](?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([\w]+)["']/gi,
  ],
  github: [
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+(?:\/[\w.-]+)?)/gi,
    /href=["'](?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+(?:\/[\w.-]+)?)["']/gi,
  ],
  telegram: [
    /(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([\w]+)/gi,
    /href=["'](?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([\w]+)["']/gi,
  ],
  discord: [
    /(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com\/invite)\/([\w-]+)/gi,
    /href=["'](?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com\/invite)\/([\w-]+)["']/gi,
  ],
  linkedin: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([\w-]+)/gi,
  ],
  medium: [
    /(?:https?:\/\/)?(?:www\.)?medium\.com\/@?([\w-]+)/gi,
    /(?:https?:\/\/)?([\w-]+)\.medium\.com/gi,
  ],
  youtube: [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|@)([\w-]+)/gi,
  ],
};

// Docs patterns
const DOCS_PATTERNS = [
  /href=["']((?:https?:\/\/)?docs\.[^"'\s]+)["']/gi,
  /href=["']([^"'\s]*\/docs(?:\/[^"'\s]*)?)["']/gi,
  /href=["']((?:https?:\/\/)?gitbook\.io[^"'\s]+)["']/gi,
  /href=["']([^"'\s]*documentation[^"'\s]*)["']/gi,
];

// Whitepaper patterns
const WHITEPAPER_PATTERNS = [
  /href=["']([^"'\s]*whitepaper[^"'\s]*\.pdf)["']/gi,
  /href=["']([^"'\s]*whitepaper[^"'\s]*)["']/gi,
  /href=["']([^"'\s]*litepaper[^"'\s]*)["']/gi,
];

// Email pattern
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_MAX_PAGES = 15;         // Max pages to crawl
const DEFAULT_TIMEOUT_MS = 10000;     // Timeout per page
const TOTAL_TIMEOUT_MS = 45000;       // Total crawl timeout

// Pages that are likely to have social links
const PRIORITY_PATHS = [
  '/',
  '/about',
  '/team',
  '/contact',
  '/socials',
  '/links',
  '/community',
  '/news',
  '/blog',
  '/announcement',
  '/announcements',
  '/faq',
  '/roadmap',
];

// ============================================================================
// MAIN SCRAPER (DEEP CRAWL)
// ============================================================================

export interface ScrapeOptions {
  maxPages?: number;
  deepCrawl?: boolean;
}

/**
 * Scrape a website and extract social links + metadata
 * Supports deep crawling to find links on internal pages
 * No AI - pure regex extraction
 */
export async function scrapeWebsite(url: string, options: ScrapeOptions = {}): Promise<ScrapedWebsite> {
  const { maxPages = DEFAULT_MAX_PAGES, deepCrawl = true } = options;
  const startTime = Date.now();

  // Normalize URL
  let normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const result: ScrapedWebsite = {
    url: normalizedUrl,
    isLive: false,
    allSocialLinks: [],
    emails: [],
    pagesCrawled: 0,
    internalLinksFound: 0,
    scrapedAt: new Date(),
    loadTimeMs: 0,
  };

  // Aggregated data from all pages
  const allTwitterHandles: string[] = [];
  const allGithubUrls: string[] = [];
  const allTelegramUrls: string[] = [];
  const allDiscordUrls: string[] = [];
  const allLinkedinUrls: string[] = [];
  const allMediumUrls: string[] = [];
  const allYoutubeUrls: string[] = [];
  const allDocsUrls: string[] = [];
  const allWhitepaperUrls: string[] = [];
  const allEmails: string[] = [];

  try {
    const baseUrl = new URL(normalizedUrl);
    const baseHost = baseUrl.host;

    // Track visited pages
    const visited = new Set<string>();
    const toVisit: string[] = [];

    // Start with priority paths
    const priorityUrls = PRIORITY_PATHS.map(path => {
      try {
        return new URL(path, normalizedUrl).href;
      } catch {
        return null;
      }
    }).filter((u): u is string => u !== null);

    // Queue priority pages first, then homepage
    toVisit.push(normalizedUrl);
    for (const pUrl of priorityUrls) {
      if (!toVisit.includes(pUrl)) {
        toVisit.push(pUrl);
      }
    }

    console.log(`[WebsiteScraper] Starting deep crawl of ${normalizedUrl} (max ${maxPages} pages)`);

    // Crawl pages
    while (toVisit.length > 0 && visited.size < maxPages) {
      // Check total timeout
      if (Date.now() - startTime > TOTAL_TIMEOUT_MS) {
        console.log(`[WebsiteScraper] Total timeout reached after ${visited.size} pages`);
        break;
      }

      const pageUrl = toVisit.shift()!;

      // Skip if already visited
      const normalizedPageUrl = normalizeUrlForVisited(pageUrl);
      if (visited.has(normalizedPageUrl)) continue;
      visited.add(normalizedPageUrl);

      try {
        const pageResult = await fetchAndExtract(pageUrl, baseHost);

        if (pageResult.isLive) {
          result.isLive = true;
          if (!result.statusCode) result.statusCode = pageResult.statusCode;
          if (!result.title) result.title = pageResult.title;
          if (!result.description) result.description = pageResult.description;
          if (!result.ogImage) result.ogImage = pageResult.ogImage;

          // Aggregate social links
          allTwitterHandles.push(...pageResult.twitterHandles);
          allGithubUrls.push(...pageResult.githubUrls);
          allTelegramUrls.push(...pageResult.telegramUrls);
          allDiscordUrls.push(...pageResult.discordUrls);
          allLinkedinUrls.push(...pageResult.linkedinUrls);
          allMediumUrls.push(...pageResult.mediumUrls);
          allYoutubeUrls.push(...pageResult.youtubeUrls);
          allDocsUrls.push(...pageResult.docsUrls);
          allWhitepaperUrls.push(...pageResult.whitepaperUrls);
          allEmails.push(...pageResult.emails);

          // Queue internal links for crawling
          if (deepCrawl) {
            // Add regular HTML links
            for (const link of pageResult.internalLinks) {
              const normalizedLink = normalizeUrlForVisited(link);
              if (!visited.has(normalizedLink) && !toVisit.includes(link)) {
                toVisit.push(link);
                result.internalLinksFound++;
              }
            }

            // Also extract SPA routes from embedded JS/JSON (for React/Next.js/TanStack sites)
            for (const route of pageResult.spaRoutes) {
              const normalizedRoute = normalizeUrlForVisited(route);
              if (!visited.has(normalizedRoute) && !toVisit.includes(route)) {
                toVisit.push(route);
                result.internalLinksFound++;
              }
            }
          }
        }
      } catch (error) {
        // Continue to next page on error
        console.log(`[WebsiteScraper] Error on ${pageUrl}:`, error instanceof Error ? error.message : error);
      }
    }

    result.pagesCrawled = visited.size;
    result.loadTimeMs = Date.now() - startTime;

    // Process aggregated results - dedupe and set primary links
    const validTwitter = filterTwitterHandles([...new Set(allTwitterHandles)]);
    if (validTwitter.length > 0) {
      result.twitter = validTwitter[0];
    }

    const validGithub = filterGitHubUrls([...new Set(allGithubUrls)]);
    if (validGithub.length > 0) {
      result.github = `https://github.com/${validGithub[0]}`;
    }

    const uniqueTelegram = [...new Set(allTelegramUrls)];
    if (uniqueTelegram.length > 0) {
      result.telegram = `https://t.me/${uniqueTelegram[0]}`;
    }

    const uniqueDiscord = [...new Set(allDiscordUrls)];
    if (uniqueDiscord.length > 0) {
      result.discord = `https://discord.gg/${uniqueDiscord[0]}`;
    }

    const uniqueDocs = [...new Set(allDocsUrls)];
    if (uniqueDocs.length > 0) {
      result.docs = resolveUrl(normalizedUrl, uniqueDocs[0]);
    }

    const uniqueWhitepaper = [...new Set(allWhitepaperUrls)];
    if (uniqueWhitepaper.length > 0) {
      result.whitepaper = resolveUrl(normalizedUrl, uniqueWhitepaper[0]);
    }

    // Collect all social links
    if (result.twitter) {
      result.allSocialLinks.push({ platform: 'twitter', url: `https://x.com/${result.twitter}` });
    }
    if (result.github) {
      result.allSocialLinks.push({ platform: 'github', url: result.github });
    }
    if (result.telegram) {
      result.allSocialLinks.push({ platform: 'telegram', url: result.telegram });
    }
    if (result.discord) {
      result.allSocialLinks.push({ platform: 'discord', url: result.discord });
    }
    [...new Set(allLinkedinUrls)].forEach(u => {
      result.allSocialLinks.push({ platform: 'linkedin', url: `https://linkedin.com/company/${u}` });
    });
    [...new Set(allMediumUrls)].forEach(u => {
      result.allSocialLinks.push({ platform: 'medium', url: `https://medium.com/@${u}` });
    });
    [...new Set(allYoutubeUrls)].forEach(u => {
      result.allSocialLinks.push({ platform: 'youtube', url: `https://youtube.com/@${u}` });
    });

    // Dedupe social links
    result.allSocialLinks = dedupeByUrl(result.allSocialLinks);

    // Dedupe emails
    result.emails = [...new Set(allEmails)].filter(email =>
      !email.includes('example.com') &&
      !email.includes('sentry.io') &&
      !email.includes('webpack') &&
      !email.endsWith('.png') &&
      !email.endsWith('.jpg')
    ).slice(0, 10);

    console.log(`[WebsiteScraper] Crawled ${result.pagesCrawled} pages in ${result.loadTimeMs}ms`);
    console.log(`[WebsiteScraper] Found: twitter=${result.twitter}, github=${result.github}, telegram=${result.telegram}`);

    return result;

  } catch (error) {
    console.error(`[WebsiteScraper] Error scraping ${normalizedUrl}:`, error);
    result.loadTimeMs = Date.now() - startTime;
    return result;
  }
}

// ============================================================================
// SINGLE PAGE FETCH & EXTRACT
// ============================================================================

interface PageExtraction {
  isLive: boolean;
  statusCode?: number;
  title?: string;
  description?: string;
  ogImage?: string;
  twitterHandles: string[];
  githubUrls: string[];
  telegramUrls: string[];
  discordUrls: string[];
  linkedinUrls: string[];
  mediumUrls: string[];
  youtubeUrls: string[];
  docsUrls: string[];
  whitepaperUrls: string[];
  emails: string[];
  internalLinks: string[];
  spaRoutes: string[];  // Routes extracted from SPA frameworks
}

async function fetchAndExtract(pageUrl: string, baseHost: string): Promise<PageExtraction> {
  const result: PageExtraction = {
    isLive: false,
    twitterHandles: [],
    githubUrls: [],
    telegramUrls: [],
    discordUrls: [],
    linkedinUrls: [],
    mediumUrls: [],
    youtubeUrls: [],
    docsUrls: [],
    whitepaperUrls: [],
    emails: [],
    internalLinks: [],
    spaRoutes: [],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CLARP/1.0; +https://clarp.fun)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    result.statusCode = response.status;
    result.isLive = response.ok;

    if (!response.ok) {
      return result;
    }

    const html = await response.text();

    // Extract meta info
    result.title = extractMeta(html, 'title') || extractTag(html, 'title');
    result.description = extractMeta(html, 'description') || extractMeta(html, 'og:description');
    result.ogImage = extractMeta(html, 'og:image');

    // Extract social links
    result.twitterHandles = extractMatches(html, SOCIAL_PATTERNS.twitter);
    result.githubUrls = extractMatches(html, SOCIAL_PATTERNS.github);
    result.telegramUrls = extractMatches(html, SOCIAL_PATTERNS.telegram);
    result.discordUrls = extractMatches(html, SOCIAL_PATTERNS.discord);
    result.linkedinUrls = extractMatches(html, SOCIAL_PATTERNS.linkedin);
    result.mediumUrls = extractMatches(html, SOCIAL_PATTERNS.medium);
    result.youtubeUrls = extractMatches(html, SOCIAL_PATTERNS.youtube);
    result.docsUrls = extractMatchesFull(html, DOCS_PATTERNS);
    result.whitepaperUrls = extractMatchesFull(html, WHITEPAPER_PATTERNS);

    // Extract emails
    const emails = html.match(EMAIL_PATTERN) || [];
    result.emails = emails;

    // Extract internal links for further crawling
    result.internalLinks = extractInternalLinks(html, pageUrl, baseHost);

    // Extract SPA routes (for React/Next.js/TanStack Router sites)
    try {
      const baseUrl = new URL(pageUrl).origin;
      result.spaRoutes = extractSpaRoutes(html, baseUrl);
    } catch {}

    return result;

  } catch (error) {
    clearTimeout(timeout);
    return result;
  }
}

/**
 * Extract SPA routes from embedded JavaScript/JSON data
 * Many SPAs embed route manifests in the HTML
 */
function extractSpaRoutes(html: string, baseUrl: string): string[] {
  const routes: string[] = [];

  // TanStack Router pattern: routes:$R[2]={"/news/$slug":...}
  const tanstackMatch = html.match(/routes:\$R\[\d+\]=\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
  if (tanstackMatch) {
    const routePatterns = tanstackMatch[1].matchAll(/"(\/[^"]+)":/g);
    for (const match of routePatterns) {
      const route = match[1];
      // Skip dynamic routes with $params for now
      if (!route.includes('$')) {
        try {
          routes.push(new URL(route, baseUrl).href);
        } catch {}
      }
    }
  }

  // Next.js pattern: __NEXT_DATA__
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      // Extract page paths from buildManifest or similar
      if (data.buildManifest?.pages) {
        Object.keys(data.buildManifest.pages).forEach(page => {
          if (!page.startsWith('/_') && !page.includes('[')) {
            try {
              routes.push(new URL(page, baseUrl).href);
            } catch {}
          }
        });
      }
    } catch {}
  }

  // Also extract any embedded URLs that look like internal pages
  // Pattern: "/news/announcement/some-slug" in JSON strings
  const jsonUrlPattern = /"(\/(?:news|blog|posts?|articles?|announcements?)\/[^"]+)"/gi;
  let match;
  while ((match = jsonUrlPattern.exec(html)) !== null) {
    try {
      routes.push(new URL(match[1], baseUrl).href);
    } catch {}
  }

  return [...new Set(routes)];
}

/**
 * Extract internal links from HTML
 */
function extractInternalLinks(html: string, currentUrl: string, baseHost: string): string[] {
  const links: string[] = [];
  const hrefPattern = /href=["']([^"'#]+)["']/gi;

  let match;
  while ((match = hrefPattern.exec(html)) !== null) {
    try {
      const href = match[1];

      // Skip external resources, anchors, javascript, etc.
      if (href.startsWith('javascript:') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('#') ||
          href.startsWith('data:')) {
        continue;
      }

      // Resolve relative URLs
      const absoluteUrl = new URL(href, currentUrl);

      // Only include same-host links (internal)
      if (absoluteUrl.host === baseHost) {
        // Skip static assets - comprehensive list
        const path = absoluteUrl.pathname.toLowerCase();
        if (path.endsWith('.css') ||
            path.endsWith('.js') ||
            path.endsWith('.mjs') ||
            path.endsWith('.png') ||
            path.endsWith('.jpg') ||
            path.endsWith('.jpeg') ||
            path.endsWith('.gif') ||
            path.endsWith('.svg') ||
            path.endsWith('.ico') ||
            path.endsWith('.webp') ||
            path.endsWith('.avif') ||
            path.endsWith('.woff') ||
            path.endsWith('.woff2') ||
            path.endsWith('.ttf') ||
            path.endsWith('.otf') ||
            path.endsWith('.eot') ||
            path.endsWith('.pdf') ||
            path.endsWith('.mp3') ||
            path.endsWith('.mp4') ||
            path.endsWith('.webm') ||
            path.endsWith('.json') ||
            path.endsWith('.xml') ||
            path.endsWith('.txt') ||
            path.endsWith('.webmanifest') ||
            path.endsWith('.map') ||
            path.includes('/static/') ||
            path.includes('/_next/') ||
            path.includes('/assets/') ||
            path.includes('/fonts/')) {
          continue;
        }

        links.push(absoluteUrl.href);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return [...new Set(links)];
}

/**
 * Normalize URL for visited tracking (removes trailing slash, query params)
 */
function normalizeUrlForVisited(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove query params and hash, normalize trailing slash
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return url;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract meta tag content
 */
function extractMeta(html: string, name: string): string | undefined {
  // Try name attribute
  const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (nameMatch) return nameMatch[1];

  // Try property attribute (for og: tags)
  const propMatch = html.match(new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (propMatch) return propMatch[1];

  // Try reverse order (content before name/property)
  const reverseNameMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'));
  if (reverseNameMatch) return reverseNameMatch[1];

  const reversePropMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, 'i'));
  if (reversePropMatch) return reversePropMatch[1];

  return undefined;
}

/**
 * Extract tag content
 */
function extractTag(html: string, tagName: string): string | undefined {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i'));
  return match ? match[1].trim() : undefined;
}

/**
 * Extract all matches from patterns (capture group 1)
 */
function extractMatches(html: string, patterns: RegExp[]): string[] {
  const results: string[] = [];

  for (const pattern of patterns) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1]) {
        results.push(match[1].toLowerCase().replace('@', ''));
      }
    }
  }

  return [...new Set(results)]; // Dedupe
}

/**
 * Extract full URL matches (for docs, whitepapers)
 */
function extractMatchesFull(html: string, patterns: RegExp[]): string[] {
  const results: string[] = [];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1]) {
        results.push(match[1]);
      }
    }
  }

  return [...new Set(results)];
}

/**
 * Filter out common false positive Twitter handles
 */
function filterTwitterHandles(handles: string[]): string[] {
  const blacklist = new Set([
    'intent', 'share', 'home', 'search', 'explore', 'notifications',
    'messages', 'settings', 'login', 'signup', 'i', 'hashtag',
    'widgets', 'embed', 'tos', 'privacy', 'help',
  ]);

  return handles.filter(h =>
    h.length >= 2 &&
    h.length <= 15 &&
    !blacklist.has(h) &&
    /^[a-z0-9_]+$/.test(h)
  );
}

/**
 * Filter out common false positive GitHub URLs
 */
function filterGitHubUrls(urls: string[]): string[] {
  const blacklist = new Set([
    'github', 'about', 'features', 'pricing', 'enterprise',
    'login', 'join', 'explore', 'topics', 'trending', 'collections',
    'events', 'sponsors', 'readme', 'security', 'settings',
  ]);

  return urls.filter(u => {
    const parts = u.split('/');
    const org = parts[0];
    return org &&
      org.length >= 2 &&
      !blacklist.has(org.toLowerCase()) &&
      /^[a-z0-9_-]+$/i.test(org);
  });
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(baseUrl: string, relativeUrl: string): string {
  if (relativeUrl.startsWith('http')) {
    return relativeUrl;
  }

  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
  }
}

/**
 * Dedupe social links by URL
 */
function dedupeByUrl(links: Array<{ platform: string; url: string }>): Array<{ platform: string; url: string }> {
  const seen = new Set<string>();
  return links.filter(link => {
    const normalized = link.url.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
