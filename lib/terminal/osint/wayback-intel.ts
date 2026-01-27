/**
 * Wayback Machine Intelligence
 *
 * Uses the Internet Archive's Wayback Machine to:
 * - Check if website existed before (history)
 * - Detect rebrands (domain used to be something else)
 * - Find old social links that may have changed
 *
 * API: https://archive.org/help/wayback_api.php
 */

// ============================================================================
// TYPES
// ============================================================================

export interface WaybackIntel {
  url: string;
  domain: string;

  // Archive status
  hasArchives: boolean;
  totalSnapshots: number;

  // First/last archive
  firstArchiveDate?: Date;
  lastArchiveDate?: Date;

  // Archive URLs
  firstArchiveUrl?: string;
  lastArchiveUrl?: string;

  // Age analysis
  archiveAgeInDays?: number;        // Days since first archive
  daysSinceLastArchive?: number;    // Days since most recent

  // Content changes (from first vs current)
  titleChanged?: boolean;
  oldTitle?: string;

  // Snapshot list (most recent 10)
  recentSnapshots: Array<{
    timestamp: string;              // YYYYMMDDHHMMSS format
    archiveUrl: string;
    statusCode?: number;
  }>;

  // Metadata
  fetchedAt: Date;
}

// ============================================================================
// WAYBACK MACHINE API
// ============================================================================

const WAYBACK_API = 'https://archive.org/wayback/available';
const WAYBACK_CDX_API = 'https://web.archive.org/cdx/search/cdx';

/**
 * Get Wayback Machine intel for a URL/domain
 */
export async function getWaybackIntel(urlOrDomain: string): Promise<WaybackIntel> {
  // Normalize to domain
  const domain = extractDomain(urlOrDomain);
  const url = urlOrDomain.startsWith('http') ? urlOrDomain : `https://${domain}`;

  const result: WaybackIntel = {
    url,
    domain,
    hasArchives: false,
    totalSnapshots: 0,
    recentSnapshots: [],
    fetchedAt: new Date(),
  };

  if (!domain) {
    return result;
  }

  try {
    console.log(`[WaybackIntel] Checking archives for: ${domain}`);

    // Fetch CDX data (calendar of snapshots)
    const cdxData = await fetchCdxData(domain);

    if (cdxData.length > 0) {
      result.hasArchives = true;
      result.totalSnapshots = cdxData.length;

      // First archive
      const firstSnapshot = cdxData[0];
      result.firstArchiveDate = parseWaybackTimestamp(firstSnapshot.timestamp);
      result.firstArchiveUrl = `https://web.archive.org/web/${firstSnapshot.timestamp}/${url}`;

      // Last archive
      const lastSnapshot = cdxData[cdxData.length - 1];
      result.lastArchiveDate = parseWaybackTimestamp(lastSnapshot.timestamp);
      result.lastArchiveUrl = `https://web.archive.org/web/${lastSnapshot.timestamp}/${url}`;

      // Calculate ages
      const now = Date.now();
      if (result.firstArchiveDate) {
        result.archiveAgeInDays = Math.floor((now - result.firstArchiveDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      if (result.lastArchiveDate) {
        result.daysSinceLastArchive = Math.floor((now - result.lastArchiveDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Recent snapshots (last 10)
      const recentSnapshots = cdxData.slice(-10).reverse();
      result.recentSnapshots = recentSnapshots.map(s => ({
        timestamp: s.timestamp,
        archiveUrl: `https://web.archive.org/web/${s.timestamp}/${url}`,
        statusCode: parseInt(s.statuscode, 10) || undefined,
      }));

      console.log(`[WaybackIntel] ${domain}: ${result.totalSnapshots} snapshots, first: ${result.firstArchiveDate?.toISOString().split('T')[0]}`);
    } else {
      console.log(`[WaybackIntel] ${domain}: No archives found`);
    }

    return result;

  } catch (error) {
    console.error(`[WaybackIntel] Error:`, error);
    return result;
  }
}

/**
 * Quick check: has website been around for a while?
 */
export async function checkWebsiteHistory(urlOrDomain: string): Promise<{
  hasHistory: boolean;
  firstSeen?: Date;
  ageInDays?: number;
  totalSnapshots: number;
  archiveUrl?: string;
}> {
  const intel = await getWaybackIntel(urlOrDomain);

  return {
    hasHistory: intel.hasArchives,
    firstSeen: intel.firstArchiveDate,
    ageInDays: intel.archiveAgeInDays,
    totalSnapshots: intel.totalSnapshots,
    archiveUrl: intel.firstArchiveUrl,
  };
}

/**
 * Fetch old version of website to compare (title, links, etc.)
 */
export async function fetchOldSnapshot(urlOrDomain: string): Promise<{
  found: boolean;
  snapshotDate?: Date;
  title?: string;
  description?: string;
  archiveUrl?: string;
}> {
  const domain = extractDomain(urlOrDomain);
  const url = urlOrDomain.startsWith('http') ? urlOrDomain : `https://${domain}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Get oldest available snapshot
    const response = await fetch(`${WAYBACK_API}?url=${encodeURIComponent(url)}&timestamp=19900101`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { found: false };
    }

    const data = await response.json();

    if (data.archived_snapshots?.closest) {
      const snapshot = data.archived_snapshots.closest;
      const archiveUrl = snapshot.url;
      const timestamp = snapshot.timestamp;

      // Fetch the archived page to extract title
      const pageResult = await fetchArchivedPage(archiveUrl);

      return {
        found: true,
        snapshotDate: parseWaybackTimestamp(timestamp),
        title: pageResult.title,
        description: pageResult.description,
        archiveUrl,
      };
    }

    return { found: false };

  } catch (error) {
    console.error(`[WaybackIntel] Error fetching old snapshot:`, error);
    return { found: false };
  }
}

// ============================================================================
// CDX API (Snapshot Calendar)
// ============================================================================

interface CdxEntry {
  timestamp: string;
  original: string;
  mimetype: string;
  statuscode: string;
  digest: string;
  length: string;
}

async function fetchCdxData(domain: string): Promise<CdxEntry[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // CDX API returns a list of all snapshots
    // Limit to 100 to avoid huge responses
    const params = new URLSearchParams({
      url: domain,
      output: 'json',
      filter: 'statuscode:200',
      collapse: 'timestamp:8',    // One per day
      limit: '100',
    });

    const response = await fetch(`${WAYBACK_CDX_API}?${params}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    // First row is headers
    if (!Array.isArray(data) || data.length < 2) {
      return [];
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Convert to objects
    return rows.map((row: string[]) => {
      const entry: Record<string, string> = {};
      headers.forEach((header: string, i: number) => {
        entry[header] = row[i];
      });
      return entry as unknown as CdxEntry;
    });

  } catch (error) {
    console.error(`[WaybackIntel] CDX API error:`, error);
    return [];
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Fetch an archived page and extract basic info
 */
async function fetchArchivedPage(archiveUrl: string): Promise<{
  title?: string;
  description?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(archiveUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; CLARP/1.0)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {};
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Extract description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : undefined;

    return { title, description };

  } catch {
    return {};
  }
}

/**
 * Parse Wayback Machine timestamp (YYYYMMDDHHMMSS) to Date
 */
function parseWaybackTimestamp(timestamp: string): Date | undefined {
  if (!timestamp || timestamp.length < 8) return undefined;

  try {
    const year = parseInt(timestamp.substring(0, 4), 10);
    const month = parseInt(timestamp.substring(4, 6), 10) - 1; // 0-indexed
    const day = parseInt(timestamp.substring(6, 8), 10);
    const hour = timestamp.length >= 10 ? parseInt(timestamp.substring(8, 10), 10) : 0;
    const minute = timestamp.length >= 12 ? parseInt(timestamp.substring(10, 12), 10) : 0;
    const second = timestamp.length >= 14 ? parseInt(timestamp.substring(12, 14), 10) : 0;

    return new Date(Date.UTC(year, month, day, hour, minute, second));
  } catch {
    return undefined;
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(input: string): string {
  try {
    let domain = input.trim().toLowerCase();

    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      domain = new URL(domain).hostname;
    }

    domain = domain.replace(/^www\./, '');

    return domain;
  } catch {
    return '';
  }
}

/**
 * Format archive age for display
 */
export function formatArchiveAge(intel: WaybackIntel): string {
  if (!intel.hasArchives || !intel.archiveAgeInDays) {
    return 'No archive history';
  }

  const days = intel.archiveAgeInDays;

  if (days < 30) {
    return `First archived ${days} days ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `First archived ${months} month${months !== 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(days / 365);
  return `First archived ${years} year${years !== 1 ? 's' : ''} ago`;
}
