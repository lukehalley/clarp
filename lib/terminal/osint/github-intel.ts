// GitHub Intelligence Service
// OSINT enrichment for crypto project GitHub repositories

import type { Project } from '@/types/project';

// ============================================================================
// TYPES
// ============================================================================

export interface GitHubRepoIntel {
  // Basic metrics
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;

  // Activity
  lastCommitDate: string | null;
  lastCommitMessage: string | null;
  commitsLast30d: number;
  commitsLast90d: number;

  // Team
  contributorsCount: number;
  topContributors: Array<{
    login: string;
    avatarUrl: string;
    contributions: number;
  }>;

  // Tech
  primaryLanguage: string | null;
  languages: Record<string, number>; // language -> bytes

  // Metadata
  createdAt: string;
  updatedAt: string;
  description: string | null;
  homepage: string | null;
  license: string | null;
  isArchived: boolean;
  isFork: boolean;

  // Computed health score (0-100)
  healthScore: number;
  healthFactors: string[];
}

export interface GitHubUserIntel {
  login: string;
  avatarUrl: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  twitter?: string | null;      // Twitter/X username from GitHub profile
  blog?: string | null;         // Blog/website/LinkedIn from GitHub profile
  publicRepos: number;
  followers: number;
  following: number;
  createdAt: string;
}

export interface ReadmeIntel {
  // Extracted from README
  projectName?: string;
  description?: string;
  // Social links found in README
  twitter?: string;
  discord?: string;
  telegram?: string;
  website?: string;
  docs?: string;
  // Team/contributors mentioned
  teamMentions: Array<{
    name: string;
    role?: string;
    github?: string;
    twitter?: string;
  }>;
  // Technologies mentioned
  techStack: string[];
  // Badges found (often indicate quality)
  badges: Array<{
    type: string;  // 'build', 'coverage', 'license', 'npm', etc.
    url: string;
  }>;
  // Raw content for LLM if needed later
  rawContent: string;
}

export interface EnrichedContributor extends GitHubUserIntel {
  contributions: number;
  // Derived from bio/company
  likelyRole?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API_BASE = 'https://api.github.com';

// Rate limiting (60 req/hour unauthenticated, 5000 req/hour authenticated)
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = GITHUB_TOKEN ? 80 : 10;

async function rateLimitedFetch(url: string): Promise<Response> {
  // Clean old timestamps (older than 1 minute)
  const oneMinuteAgo = Date.now() - 60000;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  // Check rate limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = 60000 - (Date.now() - requestTimestamps[0]);
    console.log(`[GitHubIntel] Rate limited, waiting ${Math.ceil(waitTime / 1000)}s`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  requestTimestamps.push(Date.now());

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CLARP-Terminal/1.0',
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }

  return fetch(url, { headers });
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Extract owner and repo from a GitHub URL
 * Also handles organization-only URLs by returning just the owner
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string | null } | null {
  // Handle various formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // github.com/owner/repo
  // https://www.github.com/owner/repo
  // https://github.com/owner (org-only URL)

  // First try full owner/repo pattern
  const repoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/\s\.]+)/i);
  if (repoMatch) {
    return {
      owner: repoMatch[1],
      repo: repoMatch[2].replace(/\.git$/, ''),
    };
  }

  // Try owner-only pattern (organization URL)
  const orgMatch = url.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/\s]+)\/?$/i);
  if (orgMatch) {
    return {
      owner: orgMatch[1],
      repo: null,
    };
  }

  return null;
}

/**
 * Find the primary repository for a GitHub organization
 * Returns the most starred public repo, or first repo if none have stars
 */
async function findPrimaryRepo(owner: string): Promise<string | null> {
  try {
    console.log(`[GitHubIntel] Finding primary repo for org: ${owner}`);

    // Fetch org repos sorted by stars
    const res = await rateLimitedFetch(
      `${GITHUB_API_BASE}/users/${owner}/repos?sort=stars&direction=desc&per_page=10&type=public`
    );

    if (!res.ok) {
      console.log(`[GitHubIntel] Failed to fetch repos for ${owner}: ${res.status}`);
      return null;
    }

    const repos = await res.json();

    if (!Array.isArray(repos) || repos.length === 0) {
      console.log(`[GitHubIntel] No public repos found for ${owner}`);
      return null;
    }

    // Find best repo: prefer most starred, non-fork, non-archived
    const bestRepo = repos.find((r: any) => !r.fork && !r.archived) || repos[0];

    console.log(`[GitHubIntel] Found primary repo: ${owner}/${bestRepo.name} (${bestRepo.stargazers_count} stars)`);
    return bestRepo.name;
  } catch (error) {
    console.error(`[GitHubIntel] Error finding primary repo:`, error);
    return null;
  }
}

/**
 * Fetch comprehensive GitHub repository intelligence
 */
export async function fetchGitHubRepoIntel(githubUrl: string): Promise<GitHubRepoIntel | null> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    console.log(`[GitHubIntel] Invalid GitHub URL: ${githubUrl}`);
    return null;
  }

  let { owner, repo } = parsed;

  // If org-only URL, find the primary repository
  if (!repo) {
    console.log(`[GitHubIntel] Org-only URL detected, finding primary repo for: ${owner}`);
    const primaryRepo = await findPrimaryRepo(owner);
    if (!primaryRepo) {
      console.log(`[GitHubIntel] Could not find primary repo for org: ${owner}`);
      return null;
    }
    repo = primaryRepo;
  }

  console.log(`[GitHubIntel] Fetching intel for ${owner}/${repo}`);

  try {
    // Fetch repo details, commits, and contributors in parallel
    const [repoRes, commitsRes, contributorsRes, languagesRes] = await Promise.all([
      rateLimitedFetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`),
      rateLimitedFetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=100`),
      rateLimitedFetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=10`),
      rateLimitedFetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`),
    ]);

    if (!repoRes.ok) {
      console.log(`[GitHubIntel] Repo not found: ${owner}/${repo} (${repoRes.status})`);
      return null;
    }

    const repoData = await repoRes.json();
    const commitsData = commitsRes.ok ? await commitsRes.json() : [];
    const contributorsData = contributorsRes.ok ? await contributorsRes.json() : [];
    const languagesData = languagesRes.ok ? await languagesRes.json() : {};

    // Calculate commit activity
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    let commitsLast30d = 0;
    let commitsLast90d = 0;
    let lastCommitDate: string | null = null;
    let lastCommitMessage: string | null = null;

    if (Array.isArray(commitsData) && commitsData.length > 0) {
      lastCommitDate = commitsData[0]?.commit?.author?.date || null;
      lastCommitMessage = commitsData[0]?.commit?.message?.split('\n')[0] || null;

      for (const commit of commitsData) {
        const commitDate = new Date(commit.commit?.author?.date).getTime();
        if (commitDate > thirtyDaysAgo) commitsLast30d++;
        if (commitDate > ninetyDaysAgo) commitsLast90d++;
      }
    }

    // Get primary language
    const languages = Object.entries(languagesData) as [string, number][];
    languages.sort((a, b) => b[1] - a[1]);
    const primaryLanguage = languages[0]?.[0] || null;

    // Process contributors
    const topContributors = Array.isArray(contributorsData)
      ? contributorsData.slice(0, 5).map((c: any) => ({
          login: c.login,
          avatarUrl: c.avatar_url,
          contributions: c.contributions,
        }))
      : [];

    // Calculate health score
    const { healthScore, healthFactors } = calculateRepoHealth({
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      commitsLast30d,
      commitsLast90d,
      contributorsCount: Array.isArray(contributorsData) ? contributorsData.length : 0,
      isArchived: repoData.archived,
      isFork: repoData.fork,
      lastCommitDate,
      createdAt: repoData.created_at,
    });

    return {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.subscribers_count || repoData.watchers_count,
      openIssues: repoData.open_issues_count,
      lastCommitDate,
      lastCommitMessage,
      commitsLast30d,
      commitsLast90d,
      contributorsCount: Array.isArray(contributorsData) ? contributorsData.length : 0,
      topContributors,
      primaryLanguage,
      languages: languagesData,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      description: repoData.description,
      homepage: repoData.homepage,
      license: repoData.license?.spdx_id || null,
      isArchived: repoData.archived,
      isFork: repoData.fork,
      healthScore,
      healthFactors,
    };
  } catch (error) {
    console.error(`[GitHubIntel] Error fetching repo intel:`, error);
    return null;
  }
}

/**
 * Calculate repository health score (0-100)
 */
function calculateRepoHealth(data: {
  stars: number;
  forks: number;
  openIssues: number;
  commitsLast30d: number;
  commitsLast90d: number;
  contributorsCount: number;
  isArchived: boolean;
  isFork: boolean;
  lastCommitDate: string | null;
  createdAt: string;
}): { healthScore: number; healthFactors: string[] } {
  let score = 50; // Base score
  const factors: string[] = [];

  // Archived = dead project
  if (data.isArchived) {
    return { healthScore: 10, healthFactors: ['Repository is archived'] };
  }

  // Fork with no activity = not a real project
  if (data.isFork && data.commitsLast90d < 5) {
    return { healthScore: 15, healthFactors: ['Fork with minimal activity'] };
  }

  // Recent activity (most important)
  if (data.commitsLast30d >= 10) {
    score += 15;
    factors.push('Very active development');
  } else if (data.commitsLast30d >= 3) {
    score += 10;
    factors.push('Active development');
  } else if (data.commitsLast90d >= 5) {
    score += 5;
    factors.push('Some recent activity');
  } else if (data.commitsLast90d === 0) {
    score -= 15;
    factors.push('No commits in 90 days');
  }

  // Stars (social proof)
  if (data.stars >= 1000) {
    score += 15;
    factors.push('Popular repository (1k+ stars)');
  } else if (data.stars >= 100) {
    score += 10;
    factors.push('Growing community');
  } else if (data.stars >= 10) {
    score += 5;
  }

  // Contributors (team size)
  if (data.contributorsCount >= 10) {
    score += 10;
    factors.push('Large contributor base');
  } else if (data.contributorsCount >= 3) {
    score += 5;
    factors.push('Multiple contributors');
  } else if (data.contributorsCount === 1) {
    score -= 5;
    factors.push('Single contributor');
  }

  // Forks (adoption)
  if (data.forks >= 100) {
    score += 5;
    factors.push('Many forks');
  }

  // Age (established vs new)
  const ageInDays = (Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays > 365) {
    score += 5;
    factors.push('Established repository');
  } else if (ageInDays < 30) {
    factors.push('New repository');
  }

  // Last commit recency
  if (data.lastCommitDate) {
    const daysSinceCommit = (Date.now() - new Date(data.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCommit > 180) {
      score -= 10;
      factors.push('No commits in 6+ months');
    }
  }

  return {
    healthScore: Math.max(0, Math.min(100, score)),
    healthFactors: factors,
  };
}

/**
 * Fetch GitHub user intel
 */
export async function fetchGitHubUserIntel(username: string): Promise<GitHubUserIntel | null> {
  try {
    const res = await rateLimitedFetch(`${GITHUB_API_BASE}/users/${username}`);

    if (!res.ok) {
      console.log(`[GitHubIntel] User not found: ${username}`);
      return null;
    }

    const data = await res.json();

    return {
      login: data.login,
      avatarUrl: data.avatar_url,
      name: data.name,
      bio: data.bio,
      company: data.company,
      location: data.location,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error(`[GitHubIntel] Error fetching user intel:`, error);
    return null;
  }
}

/**
 * Check if GitHub API is configured with a token
 */
export function isGitHubConfigured(): boolean {
  return !!GITHUB_TOKEN;
}

// ============================================================================
// README PARSING (No AI - Pure regex)
// ============================================================================

/**
 * Fetch and parse README.md for social links and team info
 */
export async function fetchReadmeIntel(owner: string, repo: string): Promise<ReadmeIntel | null> {
  try {
    console.log(`[GitHubIntel] Fetching README for ${owner}/${repo}`);

    // Try common README filenames
    const readmeNames = ['README.md', 'readme.md', 'Readme.md', 'README.MD', 'README'];
    let readmeContent: string | null = null;

    for (const name of readmeNames) {
      const res = await rateLimitedFetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/main/${name}`
      );
      if (res.ok) {
        readmeContent = await res.text();
        break;
      }
      // Try master branch
      const resMaster = await rateLimitedFetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/master/${name}`
      );
      if (resMaster.ok) {
        readmeContent = await resMaster.text();
        break;
      }
    }

    if (!readmeContent) {
      console.log(`[GitHubIntel] No README found for ${owner}/${repo}`);
      return null;
    }

    return parseReadme(readmeContent);
  } catch (error) {
    console.error(`[GitHubIntel] Error fetching README:`, error);
    return null;
  }
}

/**
 * Parse README content for social links and team info
 * No AI - pure regex extraction
 */
function parseReadme(content: string): ReadmeIntel {
  const result: ReadmeIntel = {
    teamMentions: [],
    techStack: [],
    badges: [],
    rawContent: content,
  };

  // Extract project name from first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    result.projectName = h1Match[1].replace(/[^\w\s-]/g, '').trim();
  }

  // Extract description (first paragraph after H1)
  // Using [\s\S] instead of . with s flag for compatibility
  const descMatch = content.match(/^#\s+.+\n\n([\s\S]+?)(?:\n\n|\n#)/m);
  if (descMatch) {
    result.description = descMatch[1].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim().slice(0, 300);
  }

  // Extract Twitter/X links
  const twitterMatches = content.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/gi);
  if (twitterMatches) {
    const handles = twitterMatches.map(m => {
      const match = m.match(/(?:twitter\.com|x\.com)\/(@?[\w]+)/i);
      return match ? match[1].replace('@', '').toLowerCase() : null;
    }).filter(Boolean);
    // Filter common false positives
    const validHandle = handles.find(h =>
      h && !['intent', 'share', 'home'].includes(h)
    );
    if (validHandle) result.twitter = validHandle;
  }

  // Extract Discord links
  const discordMatch = content.match(/discord\.(?:gg|com\/invite)\/([\w-]+)/i);
  if (discordMatch) {
    result.discord = `https://discord.gg/${discordMatch[1]}`;
  }

  // Extract Telegram links
  const telegramMatch = content.match(/(?:t\.me|telegram\.me)\/([\w]+)/i);
  if (telegramMatch) {
    result.telegram = `https://t.me/${telegramMatch[1]}`;
  }

  // Extract website (from badges or explicit links)
  const websiteMatch = content.match(/\[(?:website|homepage|live demo|demo)\]\(([^)]+)\)/i);
  if (websiteMatch) {
    result.website = websiteMatch[1];
  }

  // Extract docs link
  const docsMatch = content.match(/\[(?:docs|documentation|api docs|wiki)\]\(([^)]+)\)/i);
  if (docsMatch) {
    result.docs = docsMatch[1];
  }

  // Extract team mentions (common patterns)
  // Pattern: "Built by [@handle](url)" or "Author: Name"
  const teamPatterns = [
    /(?:built|created|developed|authored|maintained)\s+by\s+\[?@?([\w-]+)\]?/gi,
    /(?:author|creator|maintainer|founder|lead):\s*\[?@?([\w\s-]+)\]?/gi,
    /\|\s*\[([^\]]+)\]\(https?:\/\/github\.com\/([\w-]+)\)/g, // Table format
  ];

  for (const pattern of teamPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1]?.trim();
      const github = match[2]?.trim();
      if (name && name.length > 1 && name.length < 50) {
        result.teamMentions.push({
          name,
          github: github || undefined,
        });
      }
    }
  }

  // Dedupe team mentions
  result.teamMentions = dedupeTeamMentions(result.teamMentions);

  // Extract tech stack from badges and mentions
  const techKeywords = [
    'rust', 'solidity', 'typescript', 'javascript', 'python', 'go', 'move',
    'react', 'next.js', 'nextjs', 'vue', 'angular', 'svelte',
    'solana', 'ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche',
    'anchor', 'hardhat', 'foundry', 'truffle',
    'ipfs', 'arweave', 'ceramic',
    'graphql', 'rest', 'grpc',
    'postgresql', 'mongodb', 'redis', 'supabase',
    'docker', 'kubernetes', 'aws', 'vercel',
  ];

  const contentLower = content.toLowerCase();
  for (const tech of techKeywords) {
    if (contentLower.includes(tech)) {
      result.techStack.push(tech);
    }
  }

  // Extract badges
  const badgePatterns = [
    { pattern: /!\[build[^\]]*\]\(([^)]+)\)/gi, type: 'build' },
    { pattern: /!\[coverage[^\]]*\]\(([^)]+)\)/gi, type: 'coverage' },
    { pattern: /!\[license[^\]]*\]\(([^)]+)\)/gi, type: 'license' },
    { pattern: /!\[npm[^\]]*\]\(([^)]+)\)/gi, type: 'npm' },
    { pattern: /!\[crates[^\]]*\]\(([^)]+)\)/gi, type: 'crates' },
    { pattern: /!\[audit[^\]]*\]\(([^)]+)\)/gi, type: 'audit' },
    { pattern: /!\[security[^\]]*\]\(([^)]+)\)/gi, type: 'security' },
  ];

  for (const { pattern, type } of badgePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      result.badges.push({ type, url: match[1] });
    }
  }

  console.log(`[GitHubIntel] README parsed: twitter=${result.twitter}, discord=${result.discord}, team=${result.teamMentions.length}, tech=${result.techStack.length}`);

  return result;
}

function dedupeTeamMentions(mentions: ReadmeIntel['teamMentions']): ReadmeIntel['teamMentions'] {
  const seen = new Set<string>();
  return mentions.filter(m => {
    const key = (m.github || m.name).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================================
// ENRICHED CONTRIBUTOR FETCHING
// ============================================================================

/**
 * Fetch detailed info for top contributors
 * Extracts Twitter handles, names, companies from their profiles
 */
export async function fetchEnrichedContributors(
  owner: string,
  repo: string,
  limit: number = 5
): Promise<EnrichedContributor[]> {
  try {
    console.log(`[GitHubIntel] Fetching enriched contributors for ${owner}/${repo}`);

    // First get contributors list
    const contributorsRes = await rateLimitedFetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=${limit}`
    );

    if (!contributorsRes.ok) {
      console.log(`[GitHubIntel] Failed to fetch contributors: ${contributorsRes.status}`);
      return [];
    }

    const contributors = await contributorsRes.json();

    if (!Array.isArray(contributors) || contributors.length === 0) {
      return [];
    }

    // Fetch detailed user info for each contributor
    const enrichedPromises = contributors.slice(0, limit).map(async (contributor: any) => {
      const userRes = await rateLimitedFetch(`${GITHUB_API_BASE}/users/${contributor.login}`);

      if (!userRes.ok) {
        return {
          login: contributor.login,
          avatarUrl: contributor.avatar_url,
          name: null,
          bio: null,
          company: null,
          location: null,
          twitter: null,
          blog: null,
          publicRepos: 0,
          followers: 0,
          following: 0,
          createdAt: '',
          contributions: contributor.contributions,
        } as EnrichedContributor;
      }

      const userData = await userRes.json();

      // Try to infer role from bio/company
      const likelyRole = inferRole(userData.bio, userData.company, contributor.contributions);

      return {
        login: userData.login,
        avatarUrl: userData.avatar_url,
        name: userData.name,
        bio: userData.bio,
        company: userData.company,
        location: userData.location,
        twitter: userData.twitter_username || null,
        blog: userData.blog || null,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
        createdAt: userData.created_at,
        contributions: contributor.contributions,
        likelyRole,
      } as EnrichedContributor;
    });

    const results = await Promise.all(enrichedPromises);

    console.log(`[GitHubIntel] Enriched ${results.length} contributors`);
    return results;

  } catch (error) {
    console.error(`[GitHubIntel] Error fetching enriched contributors:`, error);
    return [];
  }
}

/**
 * Infer a contributor's role from their bio and contribution count
 */
function inferRole(bio: string | null, company: string | null, contributions: number): string | undefined {
  const bioLower = (bio || '').toLowerCase();
  const companyLower = (company || '').toLowerCase();

  // Check bio for role indicators
  if (bioLower.includes('founder') || bioLower.includes('ceo') || bioLower.includes('co-founder')) {
    return 'founder';
  }
  if (bioLower.includes('cto') || bioLower.includes('chief tech')) {
    return 'cto';
  }
  if (bioLower.includes('lead') && (bioLower.includes('dev') || bioLower.includes('eng'))) {
    return 'lead developer';
  }
  if (bioLower.includes('security') || bioLower.includes('auditor')) {
    return 'security';
  }
  if (bioLower.includes('solidity') || bioLower.includes('smart contract')) {
    return 'smart contract developer';
  }
  if (bioLower.includes('rust') || bioLower.includes('solana')) {
    return 'rust developer';
  }
  if (bioLower.includes('frontend') || bioLower.includes('ui') || bioLower.includes('ux')) {
    return 'frontend developer';
  }
  if (bioLower.includes('backend') || bioLower.includes('infrastructure')) {
    return 'backend developer';
  }

  // Infer from contribution count
  if (contributions > 100) {
    return 'core contributor';
  }
  if (contributions > 20) {
    return 'contributor';
  }

  return undefined;
}

// ============================================================================
// PACKAGE.JSON / CARGO.TOML PARSING
// ============================================================================

export interface ProjectManifest {
  name?: string;
  version?: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  keywords?: string[];
}

/**
 * Fetch and parse package.json or Cargo.toml
 */
export async function fetchProjectManifest(owner: string, repo: string): Promise<ProjectManifest | null> {
  try {
    // Try package.json first (Node.js projects)
    const packageRes = await rateLimitedFetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`
    );

    if (packageRes.ok) {
      const packageJson = await packageRes.json();
      return {
        name: packageJson.name,
        version: packageJson.version,
        description: packageJson.description,
        author: typeof packageJson.author === 'string' ? packageJson.author : packageJson.author?.name,
        license: packageJson.license,
        homepage: packageJson.homepage,
        repository: typeof packageJson.repository === 'string' ? packageJson.repository : packageJson.repository?.url,
        keywords: packageJson.keywords,
      };
    }

    // Try Cargo.toml (Rust projects - common for Solana)
    const cargoRes = await rateLimitedFetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/main/Cargo.toml`
    );

    if (cargoRes.ok) {
      const cargoToml = await cargoRes.text();
      return parseCargoToml(cargoToml);
    }

    return null;
  } catch (error) {
    console.error(`[GitHubIntel] Error fetching project manifest:`, error);
    return null;
  }
}

/**
 * Simple Cargo.toml parser (no external deps)
 */
function parseCargoToml(content: string): ProjectManifest {
  const result: ProjectManifest = {};

  // Extract [package] section values
  const nameMatch = content.match(/^name\s*=\s*"([^"]+)"/m);
  if (nameMatch) result.name = nameMatch[1];

  const versionMatch = content.match(/^version\s*=\s*"([^"]+)"/m);
  if (versionMatch) result.version = versionMatch[1];

  const descMatch = content.match(/^description\s*=\s*"([^"]+)"/m);
  if (descMatch) result.description = descMatch[1];

  const authorMatch = content.match(/^authors\s*=\s*\["([^"]+)"/m);
  if (authorMatch) result.author = authorMatch[1];

  const licenseMatch = content.match(/^license\s*=\s*"([^"]+)"/m);
  if (licenseMatch) result.license = licenseMatch[1];

  const homepageMatch = content.match(/^homepage\s*=\s*"([^"]+)"/m);
  if (homepageMatch) result.homepage = homepageMatch[1];

  const repoMatch = content.match(/^repository\s*=\s*"([^"]+)"/m);
  if (repoMatch) result.repository = repoMatch[1];

  const keywordsMatch = content.match(/^keywords\s*=\s*\[([^\]]+)\]/m);
  if (keywordsMatch) {
    result.keywords = keywordsMatch[1]
      .split(',')
      .map(k => k.trim().replace(/"/g, ''))
      .filter(Boolean);
  }

  return result;
}

// ============================================================================
// COMPREHENSIVE GITHUB INTEL (All-in-one)
// ============================================================================

export interface ComprehensiveGitHubIntel {
  repo: GitHubRepoIntel;
  readme: ReadmeIntel | null;
  manifest: ProjectManifest | null;
  contributors: EnrichedContributor[];
}

/**
 * Fetch ALL GitHub intelligence in one call
 * Combines: repo stats, README parsing, manifest, enriched contributors
 */
export async function fetchComprehensiveGitHubIntel(githubUrl: string): Promise<ComprehensiveGitHubIntel | null> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) {
    console.log(`[GitHubIntel] Invalid GitHub URL: ${githubUrl}`);
    return null;
  }

  let { owner, repo } = parsed;

  // If org-only URL, find the primary repository
  if (!repo) {
    const primaryRepo = await findPrimaryRepo(owner);
    if (!primaryRepo) return null;
    repo = primaryRepo;
  }

  console.log(`[GitHubIntel] Fetching comprehensive intel for ${owner}/${repo}`);

  // Fetch everything in parallel
  const [repoIntel, readmeIntel, manifest, contributors] = await Promise.all([
    fetchGitHubRepoIntel(`https://github.com/${owner}/${repo}`),
    fetchReadmeIntel(owner, repo),
    fetchProjectManifest(owner, repo),
    fetchEnrichedContributors(owner, repo, 5),
  ]);

  if (!repoIntel) {
    return null;
  }

  return {
    repo: repoIntel,
    readme: readmeIntel,
    manifest,
    contributors,
  };
}
