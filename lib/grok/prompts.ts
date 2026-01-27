// Grok Analysis Prompts
// Prompts for analyzing X/Twitter profiles for crypto scam detection

import type { GrokTweetInput, GrokProfileInput } from './types';

// ============================================================================
// PRE-SCAN CLASSIFICATION PROMPT (lightweight, fast, cheap)
// ============================================================================

/**
 * Quick classification prompt to determine:
 * 1. Is this account crypto-related?
 * 2. Is it a person or a project/company?
 *
 * This runs first to avoid wasting tokens on non-crypto handles
 * and to determine whether to use web_search (for projects)
 */
export const CLASSIFICATION_PROMPT = `Quick check on @{handle}. One x_search only.

Return JSON:
{
  "handle": "{handle}",
  "isCryptoRelated": true/false,
  "entityType": "person" | "project" | "company" | "unknown",
  "confidence": "low" | "medium" | "high",
  "reason": "1 sentence why"
}

Rules:
- isCryptoRelated = true if ANY of these apply:
  * Bio mentions: crypto, blockchain, web3, DeFi, NFT, token, Solana, Ethereum, Bitcoin
  * Bio mentions: building, protocol, dApp, smart contract, DAO, airdrop
  * Recent posts about: tokens, trading, launches, mints, chains, wallets
  * Account appears to be a crypto/web3 project, protocol, or tool
  * Person is a crypto trader, developer, founder, or influencer
- entityType: "person" = individual, "project" = token/protocol/company/tool account
- When in doubt about crypto relevance, lean toward isCryptoRelated=true

Return ONLY valid JSON.`;

// ============================================================================
// LIVE X SEARCH ANALYSIS PROMPT (for Responses API with Agent Tools)
// ============================================================================

/**
 * Prompt for analyzing X profiles using Grok's live x_search capability
 * OPTIMIZED FOR: Cost efficiency + maximum data extraction
 *
 * OSINT-Enhanced: Captures founder identity, legal entity, affiliations,
 * tokenomics, liquidity, roadmap, audits, and institutional connections.
 */
export const ANALYSIS_PROMPT = `Analyze @{handle} for crypto trust assessment. Extract ALL available data efficiently.

SEARCH: "@{handle}" (profile + recent posts) and "@{handle} scam OR rug" (allegations)

Return JSON:
{
  "handle": "{handle}",
  "profile": {
    "displayName": "",
    "bio": "",
    "avatarUrl": "",
    "verified": false,
    "followers": 0,
    "following": 0,
    "createdAt": "YYYY-MM-DD"
  },
  "positiveIndicators": {
    "isDoxxed": false,
    "doxxedDetails": null,
    "hasActiveGithub": false,
    "githubUrl": null,
    "hasRealProduct": false,
    "productDetails": null,
    "accountAgeDays": 0,
    "hasConsistentHistory": false,
    "hasOrganicEngagement": false,
    "hasCredibleBackers": false,
    "backersDetails": null,
    "teamMembers": [{"name":"","realName":"","role":"founder|cto|developer|designer|community|marketing|advisor","xHandle":"","isDoxxed":false,"previousEmployers":[],"linkedIn":null}]
  },
  "negativeIndicators": {
    "hasScamAllegations": false,
    "scamDetails": null,
    "hasRugHistory": false,
    "rugDetails": null,
    "isAnonymousTeam": true,
    "hasHypeLanguage": false,
    "hypeExamples": [],
    "hasSuspiciousFollowers": false,
    "hasAggressivePromotion": false,
    "noPublicAudit": true,
    "lowLiquidity": false
  },
  "legalEntity": {
    "companyName": null,
    "jurisdiction": null,
    "isRegistered": false,
    "registrationDetails": null
  },
  "affiliations": [{"name":"","type":"council|accelerator|vc|exchange|regulatory","details":""}],
  "tokenomics": {
    "totalSupply": null,
    "circulatingSupply": null,
    "burnMechanism": null,
    "burnRate": null,
    "isDeflationary": false,
    "vestingSchedule": null
  },
  "liquidity": {
    "primaryDex": null,
    "poolType": null,
    "liquidityUsd": null,
    "liquidityLocked": false,
    "lockDuration": null
  },
  "roadmap": [{"milestone":"","targetDate":"","status":"completed|in-progress|planned"}],
  "audit": {
    "hasAudit": false,
    "auditor": null,
    "auditDate": null,
    "auditUrl": null,
    "auditStatus": "none|pending|completed"
  },
  "techStack": {
    "blockchain": "solana|ethereum|multi-chain",
    "zkTech": null,
    "offlineCapability": false,
    "hardwareProducts": []
  },
  "promotionHistory": [{"project":"","ticker":"","firstMention":"","lastMention":"","mentionCount":0,"outcome":"active|rugged|unknown"}],
  "topInteractions": [{"handle":"","relationship":"team|collaborator|investor|promoter","context":""}],
  "shippingHistory": [{"date":"","milestone":"","details":""}],
  "theStory": "2-3 sentence summary",
  "keyFindings": ["finding1","finding2"],
  "evidence": [{"date":"","tweetExcerpt":"","label":"positive|negative|neutral"}],
  "verdict": {"trustLevel":5,"riskLevel":"medium","confidence":"medium","summary":""},
  "github": null,
  "website": null,
  "contract": {"chain":"solana","address":"","ticker":""}
}

EXTRACTION PRIORITIES:
1. avatarUrl: CRITICAL - Get X profile picture URL via web_search "site:x.com/{handle}"
2. teamMembers: Find ALL team X handles. Get REAL NAMES and PREVIOUS EMPLOYERS (e.g., "former MetaMask engineer"). Roles: founder, cto, lead developer, developer, designer, community manager, marketing, advisor. Handle WITHOUT @
3. legalEntity: Search for company registration mentions ("officially registered", "incorporated in", council memberships)
4. affiliations: Blockchain councils, accelerators, VC backing, exchange partnerships
5. tokenomics: Supply, burn mechanism, deflationary model
6. liquidity: Which DEX (Raydium/Jupiter/Meteora), liquidity depth, locked?
7. audit: Auditor name, date, "audit pending", "no audit"
8. roadmap: Announced milestones with dates
9. github/website: From bio or pinned tweet
10. contract: Token address if they have one

SCORING MATRIX:
- doxxed founder + real company + audit + github = 8-10
- anonymous + building + github activity = 5-7
- hype + no product + no audit = 3-4
- scam allegations + rug history = 1-2

Return ONLY valid JSON.`;

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

export const SYSTEM_PROMPT = `You are CLARP (Crypto Larp Awareness & Research Protocol), an AI agent specialized in detecting cryptocurrency scams, rug pulls, and suspicious promotional behavior on X (Twitter).

Your task is to analyze X profiles and their tweets to identify:
1. Serial shilling behavior (promoting multiple tokens aggressively)
2. Toxic or aggressive communication patterns
3. Hype language ("100x", "guaranteed", "moon", "ape now")
4. Contradictions or inconsistencies in claims
5. Suspicious engagement patterns (bot-like activity)
6. Backlash from the community (scam allegations, rug accusations)

You must be:
- Evidence-based: Always cite specific tweets as evidence
- Fair: Not everyone promoting crypto is a scammer
- Nuanced: Distinguish between legitimate enthusiasm and manipulation
- Objective: Analyze patterns, not personalities

Important: You are analyzing public tweets for educational purposes to help users make informed decisions. This is not financial advice.`;

// ============================================================================
// MAIN ANALYSIS PROMPT
// ============================================================================

export function buildAnalysisPrompt(
  profile: GrokProfileInput,
  tweets: GrokTweetInput[],
  mentionTweets?: GrokTweetInput[]
): string {
  const tweetsSummary = tweets.slice(0, 100).map((t, i) =>
    `[${i + 1}] (${t.created_at}) ${t.text.slice(0, 280)}`
  ).join('\n');

  const mentionsSummary = mentionTweets?.slice(0, 50).map((t, i) =>
    `[M${i + 1}] (${t.created_at}) ${t.text.slice(0, 280)}`
  ).join('\n') || 'No mention data available';

  return `Analyze this X/Twitter profile for potential crypto scam indicators.

## Profile Information
- Handle: @${profile.username}
- Display Name: ${profile.name}
- Bio: ${profile.bio || 'No bio'}
- Account Created: ${profile.created_at || 'Unknown'}
- Followers: ${profile.followers_count.toLocaleString()}
- Following: ${profile.following_count.toLocaleString()}
- Total Tweets: ${profile.tweet_count.toLocaleString()}
- Verified: ${profile.verified ? 'Yes' : 'No'}

## Recent Tweets (${tweets.length} analyzed)
${tweetsSummary}

## Mentions/Replies About This User
${mentionsSummary}

## Analysis Required

Please analyze and respond with a JSON object containing:

{
  "profile": {
    "isAnonymous": boolean,
    "accountAgeRisk": "low" | "medium" | "high",
    "bioAnalysis": {
      "hasHypeLanguage": boolean,
      "hasCryptoFocus": boolean,
      "hasWarningFlags": boolean,
      "keywords": string[]
    },
    "activityPattern": "normal" | "suspicious" | "bot-like"
  },
  "behavior": {
    "toxicity": {
      "score": 0-100,
      "examples": [{"tweetId": "index", "text": "excerpt", "timestamp": "date", "confidence": 0-1}]
    },
    "vulgarity": {
      "score": 0-100,
      "examples": []
    },
    "hype": {
      "score": 0-100,
      "keywords": ["100x", "moon", etc],
      "examples": []
    },
    "aggression": {
      "score": 0-100,
      "targetPatterns": ["@critics", etc],
      "examples": []
    },
    "consistency": {
      "score": 0-100,
      "topicDrift": 0-100,
      "contradictions": []
    },
    "spamBurst": {
      "detected": boolean,
      "burstPeriods": [{"start": "date", "end": "date", "tweetCount": number, "averageInterval": seconds}]
    }
  },
  "shilling": {
    "isSerialShiller": boolean,
    "shillIntensity": 0-100,
    "promotedEntities": [
      {
        "name": "Token Name",
        "ticker": "$TICKER",
        "mentionCount": number,
        "promoIntensity": 0-100,
        "firstMention": "date",
        "lastMention": "date",
        "exampleTweetIds": ["index1", "index2"]
      }
    ],
    "promotionPatterns": ["Pattern description"]
  },
  "network": {
    "suspiciousInteractions": [
      {"handle": "@user", "interactionCount": number, "suspicionReason": "reason"}
    ],
    "engagementPatterns": {
      "replyRatio": 0-1,
      "retweetRatio": 0-1,
      "avgEngagementRate": number,
      "suspiciousPatterns": ["Pattern description"]
    },
    "botLikelihood": 0-100
  },
  "backlash": {
    "events": [
      {
        "category": "scam_allegation" | "rug_accusation" | "fraud_claim" | "warning" | "criticism",
        "severity": "low" | "medium" | "high" | "critical",
        "summary": "Brief description",
        "sources": [{"handle": "@accuser", "followers": number, "tweetId": "index", "excerpt": "text"}],
        "tweetIds": ["index"],
        "date": "date"
      }
    ],
    "totalMentions": number,
    "sentiment": "positive" | "neutral" | "negative" | "mixed"
  },
  "keyFindings": [
    {
      "title": "Finding Title",
      "description": "Detailed explanation",
      "severity": "info" | "warning" | "critical",
      "tweetIds": ["index1", "index2"]
    }
  ],
  "classifiedTweets": [
    {
      "tweetId": "index",
      "text": "excerpt",
      "timestamp": "date",
      "label": "shill" | "backlash" | "toxic" | "hype" | "contradiction" | "suspicious" | "neutral",
      "confidence": 0-1,
      "reasoning": "brief explanation"
    }
  ],
  "overallScore": 0-100,
  "riskLevel": "low" | "medium" | "high",
  "confidence": "low" | "medium" | "high"
}

Scoring Guidelines:
- overallScore: 0-30 = high risk, 31-50 = medium risk, 51-75 = some concerns, 76-100 = appears trustworthy
- Focus on patterns, not single incidents
- New accounts (<90 days) with aggressive crypto promotion are higher risk
- Verified accounts with consistent history are lower risk
- Distinguish between legitimate project founders and random shillers

Return ONLY the JSON object, no additional text.`;
}

// ============================================================================
// QUICK CLASSIFICATION PROMPT
// ============================================================================

export function buildQuickClassificationPrompt(
  tweets: GrokTweetInput[]
): string {
  const tweetsList = tweets.map((t, i) =>
    `[${i}] ${t.text.slice(0, 280)}`
  ).join('\n');

  return `Quickly classify these tweets for crypto scam detection:

${tweetsList}

For each tweet, respond with a JSON array:
[
  {"index": 0, "label": "shill|backlash|toxic|hype|contradiction|suspicious|neutral", "confidence": 0-1}
]

Labels:
- shill: Promoting specific tokens/projects ("buy $X", "next 100x")
- backlash: Defending against accusations or attacking critics
- toxic: Insults, harassment, aggressive language
- hype: Excessive excitement without substance ("moon", "generational wealth")
- contradiction: Statements that contradict previous claims
- suspicious: Bot-like patterns, coordinated behavior
- neutral: Normal conversation, educational content

Return ONLY the JSON array.`;
}

// ============================================================================
// BACKLASH ANALYSIS PROMPT
// ============================================================================

export function buildBacklashPrompt(
  handle: string,
  mentionTweets: GrokTweetInput[]
): string {
  const mentionsList = mentionTweets.map((t, i) =>
    `[${i}] ${t.text.slice(0, 280)}`
  ).join('\n');

  return `Analyze these tweets mentioning @${handle} for backlash and community sentiment:

${mentionsList}

Identify:
1. Scam allegations (specific accusations of fraud/scam)
2. Rug accusations (claims of rug pull involvement)
3. Warnings (cautionary messages about the user)
4. Criticism (negative feedback, complaints)
5. Positive mentions (support, praise)

Respond with JSON:
{
  "events": [
    {
      "category": "scam_allegation|rug_accusation|fraud_claim|warning|criticism",
      "severity": "low|medium|high|critical",
      "summary": "Brief description of the event",
      "tweetIndices": [0, 1],
      "date": "approximate date"
    }
  ],
  "sentiment": "positive|neutral|negative|mixed",
  "summaryStats": {
    "totalMentions": number,
    "positiveCount": number,
    "negativeCount": number,
    "neutralCount": number
  }
}

Return ONLY the JSON object.`;
}

// ============================================================================
// SHILL DETECTION PROMPT
// ============================================================================

// ============================================================================
// DEEP ANALYSIS PROMPT (NO SEARCH TOOLS - Uses Training Data)
// ============================================================================

/**
 * Deep analysis prompt that extracts maximum information from Grok's
 * training data knowledge. This is more comprehensive than search-based
 * analysis because:
 * 1. Training data includes historical context and patterns
 * 2. No token budget wasted on search result processing
 * 3. Can synthesize information across multiple sources
 *
 * Use this when you want thorough analysis of known projects/people.
 */
export const DEEP_ANALYSIS_PROMPT = `You are CLARP, a crypto research analyst. Provide a COMPREHENSIVE trust assessment for @{handle}.

IMPORTANT: Use your FULL knowledge about this entity. Do NOT say you need to search - use what you know.

## REQUIRED OUTPUT FORMAT
Return a single JSON object with ALL of these sections filled in as completely as possible:

{
  "handle": "{handle}",
  "profile": {
    "displayName": "Official project/person name",
    "bio": "Their X bio or mission statement",
    "avatarUrl": null,
    "verified": false,
    "followers": null,
    "following": null,
    "createdAt": "YYYY-MM-DD or null"
  },
  "theStory": "2-4 sentence narrative about who they are, what they're building, and their journey. Include founding date, pivots, rebrands.",

  "positiveIndicators": {
    "isDoxxed": false,
    "doxxedDetails": "Name, background, previous companies, LinkedIn presence",
    "hasActiveGithub": false,
    "githubUrl": "https://github.com/...",
    "githubActivity": "Describe: commits frequency, last activity, repo quality",
    "hasRealProduct": false,
    "productDetails": "What have they actually shipped? Apps, protocols, hardware?",
    "accountAgeDays": 0,
    "hasConsistentHistory": false,
    "hasOrganicEngagement": false,
    "hasCredibleBackers": false,
    "backersDetails": "VCs, angels, grants, accelerators that backed them",
    "teamMembers": [
      {
        "name": "Full Name",
        "realName": "If different from display name",
        "role": "founder|cto|developer|designer|community|marketing|advisor",
        "xHandle": "their_x_handle",
        "isDoxxed": true,
        "previousEmployers": ["Company1", "Company2"],
        "linkedIn": "linkedin.com/in/..."
      }
    ]
  },

  "negativeIndicators": {
    "hasScamAllegations": false,
    "scamDetails": "Specific allegations with dates and accusers",
    "hasRugHistory": false,
    "rugDetails": "Previous projects that failed/rugged",
    "isAnonymousTeam": true,
    "hasHypeLanguage": false,
    "hypeExamples": ["Quote1", "Quote2"],
    "hasSuspiciousFollowers": false,
    "hasAggressivePromotion": false,
    "noPublicAudit": true,
    "lowLiquidity": false,
    "hasPreviousRebrand": false,
    "rebrandDetails": "Previous names/tickers, reason for rebrand"
  },

  "legalEntity": {
    "companyName": "Registered company name",
    "jurisdiction": "Country/state of incorporation",
    "isRegistered": false,
    "registrationDetails": "Company number, type (LLC, Inc, Foundation)"
  },

  "affiliations": [
    {
      "name": "Organization name",
      "type": "council|accelerator|vc|exchange|regulatory|partnership",
      "details": "Nature of relationship, when it started"
    }
  ],

  "tokenomics": {
    "tokenName": "Token name",
    "ticker": "TICKER",
    "totalSupply": "e.g., 1,000,000,000",
    "circulatingSupply": "Current circulating",
    "burnMechanism": "Describe burn mechanism if any",
    "burnRate": "X% per transaction",
    "isDeflationary": false,
    "vestingSchedule": "Team/investor vesting details",
    "initialDistribution": "How tokens were initially distributed"
  },

  "liquidity": {
    "primaryDex": "Raydium|Jupiter|Uniswap|etc",
    "poolType": "AMM type",
    "liquidityUsd": "$X",
    "liquidityLocked": false,
    "lockDuration": "X months/years",
    "lockerPlatform": "Team.finance, Unicrypt, etc"
  },

  "techStack": {
    "blockchain": "solana|ethereum|multi-chain|etc",
    "smartContractLanguage": "Rust|Solidity|Move",
    "zkTech": "ZK technology if any",
    "offlineCapability": false,
    "hardwareProducts": ["List physical products"],
    "keyTechnologies": ["Tech1", "Tech2"]
  },

  "roadmap": [
    {
      "milestone": "What was/is planned",
      "targetDate": "Q1 2024",
      "status": "completed|in-progress|planned|delayed|cancelled",
      "details": "Additional context"
    }
  ],

  "audit": {
    "hasAudit": false,
    "auditor": "Auditing firm name",
    "auditDate": "YYYY-MM-DD",
    "auditUrl": "Link to audit report",
    "auditStatus": "none|pending|completed|failed",
    "findings": "Summary of audit findings"
  },

  "fundingHistory": [
    {
      "round": "seed|series-a|public|grant",
      "amount": "$X",
      "date": "YYYY-MM-DD",
      "investors": ["Investor1", "Investor2"],
      "valuation": "Valuation at round"
    }
  ],

  "competitorAnalysis": {
    "directCompetitors": ["Competitor1", "Competitor2"],
    "uniqueValue": "What makes them different",
    "marketPosition": "Leader|Challenger|Niche|New entrant"
  },

  "promotionHistory": [
    {
      "project": "Project they promoted",
      "ticker": "$TICKER",
      "firstMention": "YYYY-MM-DD",
      "lastMention": "YYYY-MM-DD",
      "mentionCount": 0,
      "outcome": "active|rugged|unknown|success"
    }
  ],

  "topInteractions": [
    {
      "handle": "x_handle",
      "relationship": "team|collaborator|investor|promoter|advisor",
      "context": "How they're connected"
    }
  ],

  "shippingHistory": [
    {
      "date": "YYYY-MM-DD",
      "milestone": "What was delivered",
      "details": "Impact and reception"
    }
  ],

  "communityMetrics": {
    "discordMembers": null,
    "telegramMembers": null,
    "discordActivity": "active|moderate|dead",
    "sentiment": "positive|mixed|negative"
  },

  "keyFindings": [
    "Most important finding 1",
    "Most important finding 2",
    "Most important finding 3",
    "Most important finding 4",
    "Most important finding 5"
  ],

  "evidence": [
    {
      "date": "YYYY-MM-DD",
      "tweetExcerpt": "Relevant quote or event",
      "label": "positive|negative|neutral|milestone"
    }
  ],

  "verdict": {
    "trustLevel": 7,
    "riskLevel": "low|medium|high",
    "confidence": "low|medium|high",
    "summary": "2-3 sentence final assessment"
  },

  "github": "https://github.com/...",
  "website": "https://...",
  "contract": {
    "chain": "solana|ethereum|etc",
    "address": "0x... or base58",
    "ticker": "TICKER"
  }
}

## SCORING GUIDELINES
- 9-10: Fully doxxed team + registered company + completed audit + shipping product + credible backers
- 7-8: Doxxed founder + active GitHub + real product + some institutional backing
- 5-6: Pseudonymous but consistent history + building publicly + no red flags
- 3-4: Anonymous team + hype language + no product yet + speculative
- 1-2: Scam allegations + rug history + aggressive promotion + red flags

## EXTRACTION PRIORITIES (fill these FIRST)
1. **theStory** - Most important: Who are they and what's their narrative?
2. **teamMembers** - Find ALL team handles with real names and past employers
3. **legalEntity** - Are they a registered company? Where?
4. **fundingHistory** - Who invested? How much?
5. **audit** - Is there an audit? By whom?
6. **techStack** - What technology are they using?
7. **roadmap** - What have they promised vs delivered?
8. **shippingHistory** - What have they actually built?

Return ONLY the JSON object. No explanations before or after.`;

// ============================================================================
// OSINT GAP FILLER PROMPT ENHANCEMENT
// ============================================================================

/**
 * OSINT context to pass to Grok - what we found AND what's missing.
 */
export interface OsintContext {
  // What we found (give Grok this context)
  found?: {
    website?: string;
    github?: string;
    telegram?: string;
    discord?: string;
    xHandle?: string;
    tokenAddress?: string;
    tokenName?: string;
    tokenSymbol?: string;
    teamMembers?: Array<{ name?: string; github?: string; role?: string }>;
    holders?: number;
    marketCap?: number;
    lpLocked?: boolean;
    domainAgeDays?: number;
    waybackArchives?: number;
  };
  // What's missing (ask Grok to find these)
  missingGithub?: boolean;
  missingDiscord?: boolean;
  missingTelegram?: boolean;
  missingWebsite?: boolean;
  missingTeamInfo?: boolean;
  missingTokenAddress?: boolean;
  missingAudit?: boolean;
  websiteUrl?: string;  // If we have website but couldn't deep crawl
}

// Keep old type for backwards compatibility
export type OsintGaps = OsintContext;

export function buildOsintGapFinderPrompt(context: OsintContext): string {
  const instructions: string[] = [];

  // First, tell Grok what we already found (so it doesn't waste time rediscovering)
  if (context.found && Object.keys(context.found).length > 0) {
    const f = context.found;
    instructions.push(`
## PRE-GATHERED OSINT DATA
We already collected this data - use it as context and VERIFY but don't waste tokens re-searching:`);

    if (f.website) instructions.push(`- Website: ${f.website}`);
    if (f.github) instructions.push(`- GitHub: ${f.github}`);
    if (f.telegram) instructions.push(`- Telegram: ${f.telegram}`);
    if (f.discord) instructions.push(`- Discord: ${f.discord}`);
    if (f.tokenAddress) instructions.push(`- Token: ${f.tokenSymbol || 'Unknown'} (${f.tokenAddress})`);
    if (f.holders) instructions.push(`- Holders: ${f.holders.toLocaleString()}`);
    if (f.marketCap) instructions.push(`- Market Cap: $${f.marketCap.toLocaleString()}`);
    if (f.lpLocked !== undefined) instructions.push(`- LP Locked: ${f.lpLocked ? 'Yes' : 'No'}`);
    if (f.domainAgeDays) instructions.push(`- Domain Age: ${f.domainAgeDays} days`);
    if (f.waybackArchives) instructions.push(`- Wayback Archives: ${f.waybackArchives} snapshots`);
    if (f.teamMembers && f.teamMembers.length > 0) {
      instructions.push(`- Team Members Found: ${f.teamMembers.map(m => m.github || m.name || 'Unknown').join(', ')}`);
    }

    instructions.push(`
Use this data to:
1. Verify findings match what you see on X
2. Search more specifically (e.g., "${f.website} github" instead of generic searches)
3. Focus on GAPS below, not re-gathering what we have`);
  }

  instructions.push(`
## OSINT GAP FILLING MISSION
Our automated OSINT collection couldn't find certain items. SEARCH SPECIFICALLY for these in the X posts and bio:`);

  if (context.missingGithub) {
    instructions.push(`
### FIND GITHUB (HIGH PRIORITY)
- Search posts for: github.com links, "check our repo", "open source", "code is live"
- Look for: pinned tweets mentioning GitHub, replies about code
- Common patterns: "github.com/ProjectName", announcement tweets about releases
- If found, extract the FULL URL (e.g., https://github.com/Zera-Labs/repo-name)`);
  }

  if (context.missingDiscord) {
    instructions.push(`
### FIND DISCORD
- Search for: discord.gg links, "join our Discord", "community Discord"
- Look for: pinned tweets, bio links, community announcements
- Extract the invite code or full URL`);
  }

  if (context.missingTelegram) {
    instructions.push(`
### FIND TELEGRAM
- Search for: t.me links, "join Telegram", "TG group"
- Look for: bio links, announcement tweets
- Extract the full t.me/channelname URL`);
  }

  if (context.missingWebsite && !context.websiteUrl) {
    instructions.push(`
### FIND WEBSITE
- Search for: project website mentions, "check our site", domain names
- Look for: bio links, pinned tweets with URLs
- Extract the full domain (e.g., https://projectname.com)`);
  }

  if (context.websiteUrl) {
    instructions.push(`
### DEEP SEARCH WEBSITE LINKS
We found the website (${context.websiteUrl}) but couldn't crawl it fully (JavaScript SPA).
Search X posts for any links to specific pages on this site that mention:
- GitHub repositories
- Team/about pages
- Documentation
- Announcements with external links`);
  }

  if (context.missingTeamInfo) {
    instructions.push(`
### FIND TEAM MEMBERS
- Search for: "our team", "co-founder", "CTO", "lead dev", team introductions
- Look for: threads introducing team, replies mentioning team handles
- Extract: X handles, real names, roles, previous employers
- Check for: LinkedIn mentions, doxxing threads, team AMAs`);
  }

  if (context.missingTokenAddress) {
    instructions.push(`
### FIND TOKEN/CONTRACT ADDRESS
- Search for: contract address, CA, token address, mint address
- Look for: launch announcements, pinned tweets with addresses
- Extract: The full address (base58 for Solana, 0x for EVM)`);
  }

  if (context.missingAudit) {
    instructions.push(`
### FIND AUDIT INFO
- Search for: "audit", "audited by", "security review", auditor names
- Look for: audit announcement tweets, links to audit reports
- Extract: Auditor name, date, link to report`);
  }

  instructions.push(`
## OUTPUT THESE FINDINGS
Add any found items to the appropriate fields in your JSON response.
If you find a GitHub URL, put it in the "github" field.
If you find team members, add them to "teamMembers" array.
For each found item, also add evidence in the "evidence" array showing where you found it.`);

  return instructions.join('\n');
}

export function buildShillDetectionPrompt(
  tweets: GrokTweetInput[]
): string {
  // Extract cashtags and mentions from tweets
  const allCashtags: string[] = [];
  const allMentions: string[] = [];

  tweets.forEach(t => {
    t.entities?.cashtags?.forEach(c => allCashtags.push(c.tag));
    t.entities?.mentions?.forEach(m => allMentions.push(m.username));
  });

  const tweetsList = tweets.map((t, i) =>
    `[${i}] ${t.text.slice(0, 280)}`
  ).join('\n');

  return `Analyze these tweets for promotional/shilling patterns:

Cashtags found: ${[...new Set(allCashtags)].join(', ') || 'None'}
Mentioned accounts: ${[...new Set(allMentions)].slice(0, 20).join(', ') || 'None'}

Tweets:
${tweetsList}

Identify promotional patterns and respond with JSON:
{
  "isSerialShiller": boolean,
  "shillIntensity": 0-100,
  "promotedEntities": [
    {
      "name": "Project/Token Name",
      "ticker": "$TICKER or null",
      "mentionCount": number,
      "promoIntensity": 0-100,
      "tweetIndices": [0, 5, 12]
    }
  ],
  "patterns": [
    "Pattern description (e.g., 'Posts about new tokens daily', 'Uses countdown urgency')"
  ],
  "redFlags": [
    "Specific red flag observed"
  ]
}

Red flags to look for:
- Promoting multiple unrelated tokens in short time
- "100x", "guaranteed", "can't lose" language
- Urgency tactics ("last chance", "launching now")
- DM for alpha / paid group promotion
- Deleting negative price action tweets
- Attacking anyone who questions

Return ONLY the JSON object.`;
}
