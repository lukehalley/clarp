/**
 * Telegram Group Scraper - NO AI
 *
 * Scrapes public Telegram group/channel info from t.me pages.
 * No API key needed - just fetches the public preview page.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TelegramGroupInfo {
  // Identifiers
  handle: string;              // e.g., "popcatsolana"
  url: string;                 // Full URL

  // Basic info (from meta tags)
  title?: string;              // Group/channel name
  description?: string;        // Group description
  imageUrl?: string;           // Group avatar

  // Metrics (if available)
  memberCount?: number;        // "123K members"
  subscriberCount?: number;    // For channels

  // Type detection
  type: 'group' | 'channel' | 'bot' | 'unknown';

  // Status
  isAccessible: boolean;
  scrapedAt: Date;
}

// ============================================================================
// MAIN SCRAPER
// ============================================================================

/**
 * Scrape Telegram group/channel info from public page
 */
export async function scrapeTelegramGroup(urlOrHandle: string): Promise<TelegramGroupInfo> {
  // Normalize input
  let handle = urlOrHandle.trim();

  // Extract handle from URL if needed
  const urlMatch = handle.match(/(?:t\.me|telegram\.me)\/(@?[\w]+)/i);
  if (urlMatch) {
    handle = urlMatch[1];
  }

  // Remove @ if present
  handle = handle.replace('@', '');

  const url = `https://t.me/${handle}`;

  const result: TelegramGroupInfo = {
    handle,
    url,
    type: 'unknown',
    isAccessible: false,
    scrapedAt: new Date(),
  };

  try {
    console.log(`[TelegramScraper] Fetching: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CLARP/1.0)',
        'Accept': 'text/html',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.log(`[TelegramScraper] HTTP ${response.status} for ${url}`);
      return result;
    }

    const html = await response.text();
    result.isAccessible = true;

    // Extract title from og:title
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
    if (titleMatch) {
      result.title = titleMatch[1];
    }

    // Extract description from og:description
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                      html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i);
    if (descMatch) {
      result.description = decodeHtmlEntities(descMatch[1]);
    }

    // Extract image from og:image
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
    if (imageMatch) {
      result.imageUrl = imageMatch[1];
    }

    // Try to extract member/subscriber count from description or page content
    // Common patterns: "123 456 members", "12.5K subscribers"
    const memberMatch = html.match(/([\d\s,.]+)\s*(?:members|subscribers)/i);
    if (memberMatch) {
      const countStr = memberMatch[1].replace(/[\s,]/g, '');
      let count = parseFloat(countStr);

      // Handle K/M suffixes
      if (countStr.toLowerCase().includes('k')) {
        count *= 1000;
      } else if (countStr.toLowerCase().includes('m')) {
        count *= 1000000;
      }

      if (!isNaN(count)) {
        if (memberMatch[0].toLowerCase().includes('subscriber')) {
          result.subscriberCount = Math.round(count);
          result.type = 'channel';
        } else {
          result.memberCount = Math.round(count);
          result.type = 'group';
        }
      }
    }

    // Detect type from page content
    if (html.includes('tgme_page_extra">') && html.includes('subscriber')) {
      result.type = 'channel';
    } else if (html.includes('tgme_page_extra">') && html.includes('member')) {
      result.type = 'group';
    } else if (handle.toLowerCase().endsWith('bot')) {
      result.type = 'bot';
    }

    console.log(`[TelegramScraper] Found: ${result.title || handle}, type=${result.type}, members=${result.memberCount || result.subscriberCount || 'unknown'}`);

    return result;

  } catch (error) {
    console.error(`[TelegramScraper] Error scraping ${url}:`, error);
    return result;
  }
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
