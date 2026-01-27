/**
 * Discord Server Scraper
 *
 * Extracts public info from Discord invite links.
 * Uses Discord's public invite API endpoint.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DiscordServerInfo {
  // Identifiers
  inviteCode: string;
  inviteUrl: string;

  // Server info
  guildId?: string;
  guildName?: string;
  description?: string;
  iconUrl?: string;
  bannerUrl?: string;
  splashUrl?: string;

  // Metrics
  memberCount?: number;            // Approximate member count
  presenceCount?: number;          // Online members
  boostLevel?: number;             // Server boost level (0-3)

  // Features
  features: string[];              // e.g., ['COMMUNITY', 'VERIFIED', 'PARTNERED']
  isVerified: boolean;
  isPartnered: boolean;

  // Channel info (the invite channel)
  channelId?: string;
  channelName?: string;
  channelType?: string;            // 'text', 'voice', etc.

  // Inviter (if available)
  inviterUsername?: string;
  inviterId?: string;

  // Status
  isValid: boolean;
  isExpired: boolean;
  expiresAt?: Date;

  // Metadata
  fetchedAt: Date;
}

// ============================================================================
// DISCORD API
// ============================================================================

const DISCORD_INVITE_API = 'https://discord.com/api/v10/invites';

/**
 * Fetch Discord server info from invite code/URL
 */
export async function scrapeDiscordServer(inviteCodeOrUrl: string): Promise<DiscordServerInfo> {
  // Extract invite code from URL if needed
  const inviteCode = extractInviteCode(inviteCodeOrUrl);

  const result: DiscordServerInfo = {
    inviteCode,
    inviteUrl: `https://discord.gg/${inviteCode}`,
    features: [],
    isVerified: false,
    isPartnered: false,
    isValid: false,
    isExpired: false,
    fetchedAt: new Date(),
  };

  if (!inviteCode) {
    return result;
  }

  try {
    console.log(`[DiscordScraper] Fetching invite: ${inviteCode}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Discord's public invite endpoint - includes count info with query params
    const url = `${DISCORD_INVITE_API}/${inviteCode}?with_counts=true&with_expiration=true`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; CLARP/1.0)',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        result.isExpired = true;
        console.log(`[DiscordScraper] Invite ${inviteCode} is invalid or expired`);
      }
      return result;
    }

    const data = await response.json();
    result.isValid = true;

    // Guild (server) info
    if (data.guild) {
      result.guildId = data.guild.id;
      result.guildName = data.guild.name;
      result.description = data.guild.description;
      result.boostLevel = data.guild.premium_subscription_count;

      // Icon URL
      if (data.guild.icon) {
        const ext = data.guild.icon.startsWith('a_') ? 'gif' : 'png';
        result.iconUrl = `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.${ext}`;
      }

      // Banner URL
      if (data.guild.banner) {
        result.bannerUrl = `https://cdn.discordapp.com/banners/${data.guild.id}/${data.guild.banner}.png`;
      }

      // Splash URL
      if (data.guild.splash) {
        result.splashUrl = `https://cdn.discordapp.com/splashes/${data.guild.id}/${data.guild.splash}.png`;
      }

      // Features
      if (data.guild.features && Array.isArray(data.guild.features)) {
        result.features = data.guild.features;
        result.isVerified = data.guild.features.includes('VERIFIED');
        result.isPartnered = data.guild.features.includes('PARTNERED');
      }
    }

    // Member counts
    result.memberCount = data.approximate_member_count;
    result.presenceCount = data.approximate_presence_count;

    // Channel info
    if (data.channel) {
      result.channelId = data.channel.id;
      result.channelName = data.channel.name;
      result.channelType = getChannelType(data.channel.type);
    }

    // Inviter info
    if (data.inviter) {
      result.inviterUsername = data.inviter.username;
      result.inviterId = data.inviter.id;
    }

    // Expiration
    if (data.expires_at) {
      result.expiresAt = new Date(data.expires_at);
      result.isExpired = result.expiresAt < new Date();
    }

    console.log(`[DiscordScraper] ${result.guildName}: ${result.memberCount?.toLocaleString()} members, ${result.presenceCount?.toLocaleString()} online`);

    return result;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`[DiscordScraper] Request timed out`);
    } else {
      console.error(`[DiscordScraper] Error:`, error);
    }
    return result;
  }
}

/**
 * Quick check if Discord server exists and is active
 */
export async function checkDiscordActive(inviteCodeOrUrl: string): Promise<{
  isActive: boolean;
  memberCount?: number;
  onlineCount?: number;
  name?: string;
}> {
  const info = await scrapeDiscordServer(inviteCodeOrUrl);

  return {
    isActive: info.isValid && !info.isExpired,
    memberCount: info.memberCount,
    onlineCount: info.presenceCount,
    name: info.guildName,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract invite code from URL or direct code
 */
function extractInviteCode(input: string): string {
  const trimmed = input.trim();

  // Already just a code
  if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return trimmed;
  }

  // Extract from discord.gg URL
  const ggMatch = trimmed.match(/discord\.gg\/([a-zA-Z0-9-]+)/i);
  if (ggMatch) {
    return ggMatch[1];
  }

  // Extract from discord.com/invite URL
  const inviteMatch = trimmed.match(/discord\.com\/invite\/([a-zA-Z0-9-]+)/i);
  if (inviteMatch) {
    return inviteMatch[1];
  }

  // Extract from discordapp.com/invite URL (old format)
  const appMatch = trimmed.match(/discordapp\.com\/invite\/([a-zA-Z0-9-]+)/i);
  if (appMatch) {
    return appMatch[1];
  }

  return '';
}

/**
 * Get human-readable channel type
 */
function getChannelType(type: number): string {
  const types: Record<number, string> = {
    0: 'text',
    2: 'voice',
    4: 'category',
    5: 'announcement',
    10: 'news_thread',
    11: 'public_thread',
    12: 'private_thread',
    13: 'stage',
    14: 'directory',
    15: 'forum',
  };

  return types[type] || 'unknown';
}
