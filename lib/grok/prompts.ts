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
- isCryptoRelated: Do they post about crypto, tokens, DeFi, NFTs, web3?
- entityType: "person" = individual influencer/trader, "project" = token/protocol/company account
- If bio mentions nothing crypto and recent posts aren't crypto, set isCryptoRelated=false

Return ONLY valid JSON.`;

// ============================================================================
// LIVE X SEARCH ANALYSIS PROMPT (for Responses API with Agent Tools)
// ============================================================================

/**
 * Prompt for analyzing X profiles using Grok's live x_search capability
 * This is used with the Responses API and grok-4-1-fast model
 *
 * OPTIMIZED FOR:
 * - Capturing ALL tokens/projects they promote (promotionHistory)
 * - Tracking who they interact with most (topInteractions)
 * - Scanning a full year of history
 * - Cost efficiency (structured output, no web search for users)
 */
export const ANALYSIS_PROMPT = `Analyze @{handle} for crypto scam risk. Search their FULL history from the past year.

SEARCH STRATEGY:
1. Search "@{handle}" to get their posts and profile
2. Search "@{handle} scam OR rug OR fraud" to find any allegations
3. Look at posts from the past 12 months, not just recent

CRITICAL: Identify ALL crypto tokens/projects they have promoted (tickers starting with $).

Return JSON:
{
  "handle": "",
  "profile": {
    "displayName": "",
    "bio": "",
    "verified": false,
    "followers": 0,
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
    "teamMembers": []
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
    "hasAggressivePromotion": false
  },
  "promotionHistory": [
    {
      "project": "Token/Project Name",
      "ticker": "$TICKER",
      "firstMention": "YYYY-MM-DD",
      "lastMention": "YYYY-MM-DD",
      "mentionCount": 5,
      "outcome": "active|rugged|failed|unknown",
      "evidenceUrls": ["https://x.com/..."]
    }
  ],
  "topInteractions": [
    {
      "handle": "@username",
      "relationship": "collaborator|promoter|critic|friend",
      "interactionCount": 10,
      "context": "Brief description"
    }
  ],
  "theStory": "2-3 sentences about who they are and what they do",
  "keyFindings": ["top 5-7 findings with specifics"],
  "evidence": [{"date":"YYYY-MM-DD","tweetExcerpt":"","tweetUrl":"","label":"shill|backlash|hype|neutral|positive","relevance":""}],
  "verdict": {
    "trustLevel": 5,
    "riskLevel": "medium",
    "confidence": "medium",
    "summary": "1 sentence verdict"
  },
  "github": null,
  "website": null,
  "contract": null
}

IMPORTANT for promotionHistory:
- Include EVERY token/project they've promoted in the past year
- Note if any tokens rugged after their promotion
- Track how many times they mentioned each

IMPORTANT for topInteractions:
- Who do they reply to most?
- Who do they retweet/quote most?
- Are they part of any crypto groups/cabals?

Scoring: doxxed+github=trustworthy(8-10), anonymous+hype=suspicious(4-6), scam allegations=high risk(1-3).
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
