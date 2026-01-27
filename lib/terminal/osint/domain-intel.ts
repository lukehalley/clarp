/**
 * Domain Intelligence - Whois & Age Check
 *
 * Checks domain registration info to detect:
 * - New domains (potential fly-by-night scams)
 * - Domain age vs project claims
 * - Registration privacy (who's hiding?)
 *
 * Uses free RDAP (Registration Data Access Protocol) - successor to Whois
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DomainIntel {
  domain: string;
  isAccessible: boolean;

  // Age info
  createdDate?: Date;
  updatedDate?: Date;
  expiresDate?: Date;
  ageInDays?: number;
  ageInMonths?: number;

  // Age assessment
  ageRisk: 'new' | 'young' | 'established' | 'unknown';
  // new = < 30 days, young = < 6 months, established = > 6 months

  // Registrar info
  registrar?: string;
  registrarUrl?: string;

  // Registrant info (often hidden)
  registrantName?: string;
  registrantOrg?: string;
  registrantCountry?: string;
  isPrivacyProtected: boolean;

  // Nameservers
  nameservers: string[];

  // Status
  status: string[];       // e.g., ['clientTransferProhibited', 'clientDeleteProhibited']

  // Metadata
  fetchedAt: Date;
  source: 'rdap' | 'whois-api' | 'fallback';
}

// ============================================================================
// RDAP SERVERS (by TLD)
// ============================================================================

// RDAP bootstrap - maps TLDs to their RDAP servers
const RDAP_BOOTSTRAP: Record<string, string> = {
  'com': 'https://rdap.verisign.com/com/v1',
  'net': 'https://rdap.verisign.com/net/v1',
  'org': 'https://rdap.publicinterestregistry.org/rdap',
  'io': 'https://rdap.nic.io',
  'xyz': 'https://rdap.nic.xyz',
  'ai': 'https://rdap.nic.ai',
  'app': 'https://rdap.nic.google',
  'dev': 'https://rdap.nic.google',
  'fun': 'https://rdap.nic.fun',
  'me': 'https://rdap.nic.me',
  'co': 'https://rdap.nic.co',
  'gg': 'https://rdap.nic.gg',
};

// Fallback RDAP lookup service
const RDAP_FALLBACK = 'https://rdap.org';

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Get domain registration intel via RDAP
 */
export async function getDomainIntel(domainOrUrl: string): Promise<DomainIntel> {
  // Extract domain from URL if needed
  const domain = extractDomain(domainOrUrl);

  const result: DomainIntel = {
    domain,
    isAccessible: false,
    ageRisk: 'unknown',
    isPrivacyProtected: false,
    nameservers: [],
    status: [],
    fetchedAt: new Date(),
    source: 'rdap',
  };

  if (!domain) {
    return result;
  }

  try {
    console.log(`[DomainIntel] Looking up: ${domain}`);

    // Try RDAP lookup
    const rdapResult = await fetchRdap(domain);

    if (rdapResult) {
      result.isAccessible = true;
      result.source = 'rdap';

      // Parse dates
      if (rdapResult.events) {
        for (const event of rdapResult.events) {
          const date = event.eventDate ? new Date(event.eventDate) : undefined;
          if (!date || isNaN(date.getTime())) continue;

          switch (event.eventAction) {
            case 'registration':
              result.createdDate = date;
              break;
            case 'last changed':
            case 'last update of RDAP database':
              result.updatedDate = date;
              break;
            case 'expiration':
              result.expiresDate = date;
              break;
          }
        }
      }

      // Calculate age
      if (result.createdDate) {
        const now = new Date();
        result.ageInDays = Math.floor((now.getTime() - result.createdDate.getTime()) / (1000 * 60 * 60 * 24));
        result.ageInMonths = Math.floor(result.ageInDays / 30);
        result.ageRisk = assessAgeRisk(result.ageInDays);
      }

      // Parse registrar
      if (rdapResult.entities) {
        for (const entity of rdapResult.entities) {
          if (entity.roles?.includes('registrar')) {
            result.registrar = entity.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3];
            if (entity.links) {
              result.registrarUrl = entity.links.find((l: any) => l.rel === 'self')?.href;
            }
          }
          if (entity.roles?.includes('registrant')) {
            // Check for privacy protection
            const fn = entity.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3];
            if (fn && isPrivacyService(fn)) {
              result.isPrivacyProtected = true;
            } else {
              result.registrantName = fn;
            }
            result.registrantOrg = entity.vcardArray?.[1]?.find((v: any) => v[0] === 'org')?.[3];
            // Country from address
            const adr = entity.vcardArray?.[1]?.find((v: any) => v[0] === 'adr');
            if (adr && Array.isArray(adr[3])) {
              result.registrantCountry = adr[3][6]; // Country is typically index 6
            }
          }
        }
      }

      // Parse nameservers
      if (rdapResult.nameservers) {
        result.nameservers = rdapResult.nameservers
          .map((ns: any) => ns.ldhName?.toLowerCase())
          .filter(Boolean);
      }

      // Parse status
      if (rdapResult.status) {
        result.status = rdapResult.status;
      }

      console.log(`[DomainIntel] ${domain}: age=${result.ageInDays} days (${result.ageRisk}), registrar=${result.registrar}`);
    }

    return result;

  } catch (error) {
    console.error(`[DomainIntel] Error looking up ${domain}:`, error);
    return result;
  }
}

/**
 * Quick check for suspicious domain age
 */
export async function isDomainSuspicious(domainOrUrl: string): Promise<{
  isSuspicious: boolean;
  reasons: string[];
  intel: DomainIntel;
}> {
  const intel = await getDomainIntel(domainOrUrl);
  const reasons: string[] = [];

  // New domain (< 30 days)
  if (intel.ageInDays !== undefined && intel.ageInDays < 30) {
    reasons.push(`Domain registered only ${intel.ageInDays} days ago`);
  }

  // Young domain (< 90 days) claiming to be an established project
  if (intel.ageInDays !== undefined && intel.ageInDays < 90) {
    reasons.push(`Domain is less than 3 months old (${intel.ageInDays} days)`);
  }

  // Expiring soon (< 30 days)
  if (intel.expiresDate) {
    const daysToExpiry = Math.floor((intel.expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysToExpiry < 30 && daysToExpiry > 0) {
      reasons.push(`Domain expires in ${daysToExpiry} days`);
    }
  }

  // Privacy protection (not inherently bad, but worth noting)
  if (intel.isPrivacyProtected) {
    // This is common, don't flag as suspicious by itself
    // reasons.push('Registrant info hidden behind privacy service');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    intel,
  };
}

/**
 * Get domain age in human-readable format
 */
export function formatDomainAge(intel: DomainIntel): string {
  if (!intel.createdDate || intel.ageInDays === undefined) {
    return 'Unknown';
  }

  if (intel.ageInDays < 30) {
    return `${intel.ageInDays} days (NEW!)`;
  }
  if (intel.ageInMonths !== undefined && intel.ageInMonths < 12) {
    return `${intel.ageInMonths} months`;
  }

  const years = Math.floor((intel.ageInMonths || 0) / 12);
  return `${years} year${years !== 1 ? 's' : ''}`;
}

// ============================================================================
// RDAP FETCH
// ============================================================================

async function fetchRdap(domain: string): Promise<any | null> {
  // Get TLD
  const parts = domain.split('.');
  const tld = parts[parts.length - 1].toLowerCase();

  // Try TLD-specific RDAP server first
  const rdapServer = RDAP_BOOTSTRAP[tld];

  if (rdapServer) {
    try {
      const result = await fetchRdapFromServer(rdapServer, domain);
      if (result) return result;
    } catch (error) {
      console.log(`[DomainIntel] TLD RDAP failed for ${domain}, trying fallback`);
    }
  }

  // Fallback to rdap.org
  try {
    return await fetchRdapFromServer(RDAP_FALLBACK, domain);
  } catch (error) {
    console.log(`[DomainIntel] Fallback RDAP failed for ${domain}`);
    return null;
  }
}

async function fetchRdapFromServer(server: string, domain: string): Promise<any | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `${server}/domain/${domain}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/rdap+json, application/json',
        'User-Agent': 'CLARP/1.0',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract domain from URL or domain string
 */
function extractDomain(input: string): string {
  try {
    let domain = input.trim().toLowerCase();

    // If it's a URL, extract the hostname
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      domain = new URL(domain).hostname;
    }

    // Remove www prefix
    domain = domain.replace(/^www\./, '');

    // Validate it looks like a domain
    if (!domain.includes('.') || domain.length < 4) {
      return '';
    }

    return domain;

  } catch {
    return '';
  }
}

/**
 * Assess risk level based on domain age
 */
function assessAgeRisk(ageInDays: number): DomainIntel['ageRisk'] {
  if (ageInDays < 30) return 'new';
  if (ageInDays < 180) return 'young'; // 6 months
  return 'established';
}

/**
 * Check if registrant name indicates privacy protection
 */
function isPrivacyService(name: string): boolean {
  const privacyIndicators = [
    'privacy',
    'proxy',
    'whoisguard',
    'domains by proxy',
    'contact privacy',
    'redacted',
    'data protected',
    'withheld',
    'private',
    'anonymize',
  ];

  const lower = name.toLowerCase();
  return privacyIndicators.some(indicator => lower.includes(indicator));
}
