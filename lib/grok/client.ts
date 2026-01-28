// Grok Client
// xAI Grok API client using the Responses API with Agent Tools for live X search

import {
  GrokAnalysisResult,
  GrokClassificationResult,
  GrokResponsesApiResponse,
  GrokTextOutput,
  GrokTopInteraction,
} from './types';
import {
  ANALYSIS_PROMPT,
  CLASSIFICATION_PROMPT,
  DEEP_ANALYSIS_PROMPT,
  buildOsintGapFinderPrompt,
  type OsintGaps,
} from './prompts';

// ============================================================================
// CONFIGURATION
// ============================================================================

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';
const DEFAULT_MODEL = 'grok-4-1-fast';

// ============================================================================
// ERROR TYPES
// ============================================================================

export class GrokApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rawError?: unknown
  ) {
    super(message);
    this.name = 'GrokApiError';
  }
}

export class GrokParseError extends Error {
  constructor(
    message: string,
    public rawResponse: string
  ) {
    super(message);
    this.name = 'GrokParseError';
  }
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

export class GrokClient {
  private model: string;

  constructor(model: string = DEFAULT_MODEL) {
    this.model = model;
  }

  /**
   * Check if the client is configured with valid credentials
   */
  isConfigured(): boolean {
    return !!XAI_API_KEY;
  }

  /**
   * Resolve a plain text query to an X handle
   * Used when user searches for project names, tickers, etc.
   *
   * @returns X handle if found, null otherwise
   */
  async resolveQuery(query: string): Promise<{
    handle: string | null;
    isCryptoRelated: boolean;
    entityType: 'person' | 'project' | 'company' | 'token' | 'unknown';
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }> {
    if (!XAI_API_KEY) {
      throw new GrokApiError('Grok API client not configured. Set XAI_API_KEY environment variable.');
    }

    const prompt = `Search for "${query}" and determine if it's related to cryptocurrency, blockchain, or web3.

If you find information about this, respond with JSON:
{
  "handle": "the_x_handle_if_found", // X/Twitter handle WITHOUT @ prefix, or null if not found
  "isCryptoRelated": true, // boolean
  "entityType": "project", // "person", "project", "company", "token", or "unknown"
  "confidence": "high", // "high", "medium", or "low"
  "reason": "Brief explanation"
}

IMPORTANT:
- Use x_search to find X/Twitter accounts related to this query
- If you find an X handle for this entity, include it in "handle"
- If the query IS an X handle (like @example), just return that handle
- If the query is a ticker (like $SOL), find the project's X handle
- Return ONLY valid JSON, no markdown`;

    console.log(`[Grok] Resolving query: "${query}"...`);

    try {
      const response = await fetch(`${XAI_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: [{ role: 'user', content: prompt }],
          tools: [{ type: 'x_search' }, { type: 'web_search' }],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GrokApiError(
          errorData.error || `API request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }

      const data: GrokResponsesApiResponse = await response.json();

      const textOutput = data.output?.find(
        (o): o is GrokTextOutput => o.type === 'message' && o.role === 'assistant'
      );

      if (!textOutput?.content?.[0]?.text) {
        throw new GrokApiError('No text response from Grok API');
      }

      const text = textOutput.content[0].text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);

      if (!jsonMatch) {
        console.warn('[Grok] Query resolution failed to parse JSON');
        return {
          handle: null,
          isCryptoRelated: false,
          entityType: 'unknown',
          confidence: 'low',
          reason: 'Could not parse response',
        };
      }

      const parsed = JSON.parse(jsonMatch[1].trim());
      console.log(`[Grok] Resolved query "${query}" -> handle: ${parsed.handle || 'not found'}, crypto: ${parsed.isCryptoRelated}`);

      return {
        handle: parsed.handle || null,
        isCryptoRelated: parsed.isCryptoRelated ?? false,
        entityType: parsed.entityType || 'unknown',
        confidence: parsed.confidence || 'low',
        reason: parsed.reason || '',
      };
    } catch (error) {
      if (error instanceof GrokApiError) {
        throw error;
      }
      throw new GrokApiError(
        error instanceof Error ? error.message : 'Unknown error during query resolution'
      );
    }
  }

  /**
   * Quick classification to determine if handle is crypto-related and person vs project
   * This is a lightweight pre-scan to save costs on non-crypto handles
   *
   * @returns Classification result with isCryptoRelated and entityType
   */
  async classifyHandle(handle: string): Promise<GrokClassificationResult> {
    if (!XAI_API_KEY) {
      throw new GrokApiError('Grok API client not configured. Set XAI_API_KEY environment variable.');
    }

    // Detect if this is a community URL
    const communityMatch = handle.match(/x\.com\/i\/communities\/(\d+)/i);
    const isCommunity = !!communityMatch;

    // Define handleKey for both cases - used in return statements
    const handleKey = isCommunity
      ? `community_${communityMatch![1]}`
      : handle.toLowerCase().replace('@', '');

    let prompt: string;
    let logMessage: string;

    if (isCommunity) {
      // For communities, use a modified prompt
      prompt = `Quick check on X community ${handle}. One x_search only.

Return JSON:
{
  "handle": "${handleKey}",
  "isCryptoRelated": true/false,
  "entityType": "project",
  "confidence": "low" | "medium" | "high",
  "reason": "1 sentence why"
}

Rules:
- isCryptoRelated = true if the community is about crypto, blockchain, web3, DeFi, NFTs, tokens, Solana, Ethereum, or any cryptocurrency
- entityType should be "project" for communities
- When in doubt about crypto relevance, lean toward isCryptoRelated=true

Return ONLY valid JSON.`;
      logMessage = `[Grok] Classifying community ${handleKey}...`;
    } else {
      prompt = CLASSIFICATION_PROMPT.replace(/{handle}/g, handleKey);
      logMessage = `[Grok] Classifying @${handleKey}...`;
    }

    console.log(logMessage);

    try {
      const response = await fetch(`${XAI_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: [{ role: 'user', content: prompt }],
          tools: [{ type: 'x_search' }],
          temperature: 0.1, // Low temperature for consistent classification
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GrokApiError(
          errorData.error || `API request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }

      const data: GrokResponsesApiResponse = await response.json();

      if (data.error) {
        throw new GrokApiError(data.error, undefined, data);
      }

      const textOutput = data.output?.find(
        (o): o is GrokTextOutput => o.type === 'message' && o.role === 'assistant'
      );

      if (!textOutput?.content?.[0]?.text) {
        throw new GrokApiError('No text response from Grok API');
      }

      const text = textOutput.content[0].text;
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);

      if (!jsonMatch) {
        console.warn('[Grok] Classification failed to parse, defaulting to crypto person');
        return {
          handle: handleKey,
          isCryptoRelated: true,
          entityType: 'person',
          confidence: 'low',
          reason: 'Failed to parse classification response',
          tokensUsed: data.usage?.total_tokens,
        };
      }

      try {
        const parsed = JSON.parse(jsonMatch[1]);
        console.log(`[Grok] Classification: crypto=${parsed.isCryptoRelated}, type=${parsed.entityType}, tokens=${data.usage?.total_tokens}`);

        return {
          handle: handleKey,
          isCryptoRelated: Boolean(parsed.isCryptoRelated),
          entityType: this.normalizeEntityType(parsed.entityType),
          confidence: this.normalizeConfidence(parsed.confidence),
          reason: String(parsed.reason || ''),
          tokensUsed: data.usage?.total_tokens,
        };
      } catch {
        console.warn('[Grok] Classification JSON parse failed, defaulting to crypto person');
        return {
          handle: handleKey,
          isCryptoRelated: true,
          entityType: 'person',
          confidence: 'low',
          reason: 'Failed to parse classification JSON',
          tokensUsed: data.usage?.total_tokens,
        };
      }
    } catch (error) {
      if (error instanceof GrokApiError) throw error;
      throw new GrokApiError(
        error instanceof Error ? error.message : 'Unknown error during classification',
        undefined,
        error
      );
    }
  }

  /**
   * Analyze an X profile using Grok's live search capabilities
   * This uses the Responses API with x_search (and optionally web_search)
   *
   * @param handle - The X handle to analyze
   * @param options.isProject - If true, also use web_search for project research
   *                           If false (default), only use x_search for cost efficiency
   * @param options.useSearchTools - If false, disable x_search and web_search entirely
   *                                 and use Grok's training data knowledge (deeper analysis)
   */
  async analyzeProfile(
    handle: string,
    options: { isProject?: boolean; useSearchTools?: boolean; osintGaps?: OsintGaps } = {}
  ): Promise<GrokAnalysisResult> {
    if (!XAI_API_KEY) {
      throw new GrokApiError('Grok API client not configured. Set XAI_API_KEY environment variable.');
    }

    const { isProject = false, useSearchTools = true, osintGaps } = options;
    const handleKey = handle.toLowerCase().replace('@', '');

    // Choose base prompt based on whether we're using search tools
    let prompt = useSearchTools
      ? ANALYSIS_PROMPT.replace(/{handle}/g, handleKey)
      : DEEP_ANALYSIS_PROMPT.replace(/{handle}/g, handleKey);

    // Append OSINT gap-filler instructions if there are gaps to fill
    if (osintGaps && Object.values(osintGaps).some(v => v)) {
      const gapPrompt = buildOsintGapFinderPrompt(osintGaps);
      prompt = prompt + '\n\n' + gapPrompt;
      console.log(`[Grok] Adding OSINT gap-filler for: ${Object.entries(osintGaps).filter(([, v]) => v).map(([k]) => k).join(', ')}`);
    }

    // Configure tools based on options
    // When useSearchTools is false, we don't provide any tools and rely on training data
    let tools: Array<{ type: string }> | undefined;
    if (useSearchTools) {
      // For user scans, only use x_search (cheaper)
      // For project scans, also include web_search for deeper research
      tools = isProject
        ? [{ type: 'x_search' }, { type: 'web_search' }]
        : [{ type: 'x_search' }];
    }

    const toolsDesc = tools ? tools.map(t => t.type).join(', ') : 'none (training data only)';
    console.log(`[Grok] Analyzing @${handleKey} with tools: ${toolsDesc}`);

    try {
      // Build request body - only include tools if we're using them
      const requestBody: {
        model: string;
        input: Array<{ role: string; content: string }>;
        tools?: Array<{ type: string }>;
        temperature: number;
      } = {
        model: this.model,
        input: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: useSearchTools ? 0.3 : 0.2, // Lower temperature for training data mode
      };

      // Only add tools if we're using them
      if (tools) {
        requestBody.tools = tools;
      }

      const response = await fetch(`${XAI_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GrokApiError(
          errorData.error || `API request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }

      const data: GrokResponsesApiResponse = await response.json();

      if (data.error) {
        throw new GrokApiError(data.error, undefined, data);
      }

      // Extract text content from output
      const textOutput = data.output?.find(
        (o): o is GrokTextOutput => o.type === 'message' && o.role === 'assistant'
      );

      if (!textOutput?.content?.[0]?.text) {
        throw new GrokApiError('No text response from Grok API');
      }

      const analysisText = textOutput.content[0].text;
      const citations = textOutput.content[0].annotations?.filter(a => a.type === 'url_citation') || [];

      return this.parseAnalysisResponse(analysisText, citations, data.usage);
    } catch (error) {
      if (error instanceof GrokApiError || error instanceof GrokParseError) {
        throw error;
      }
      throw new GrokApiError(
        error instanceof Error ? error.message : 'Unknown error during analysis',
        undefined,
        error
      );
    }
  }

  /**
   * Quick research query - returns raw text response
   */
  async research(query: string): Promise<{ text: string; citations: Array<{ url: string; title?: string }> }> {
    if (!XAI_API_KEY) {
      throw new GrokApiError('Grok API client not configured. Set XAI_API_KEY environment variable.');
    }

    try {
      const response = await fetch(`${XAI_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: [
            {
              role: 'user',
              content: query,
            },
          ],
          tools: [{ type: 'x_search' }, { type: 'web_search' }],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new GrokApiError(
          errorData.error || `API request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }

      const data: GrokResponsesApiResponse = await response.json();

      const textOutput = data.output?.find(
        (o): o is GrokTextOutput => o.type === 'message' && o.role === 'assistant'
      );

      if (!textOutput?.content?.[0]?.text) {
        throw new GrokApiError('No text response from Grok API');
      }

      const citations = textOutput.content[0].annotations
        ?.filter(a => a.type === 'url_citation')
        .map(a => ({ url: a.url, title: a.title })) || [];

      return {
        text: textOutput.content[0].text,
        citations,
      };
    } catch (error) {
      if (error instanceof GrokApiError) {
        throw error;
      }
      throw new GrokApiError(
        error instanceof Error ? error.message : 'Unknown error during research',
        undefined,
        error
      );
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private parseAnalysisResponse(
    text: string,
    citations: Array<{ url: string; title?: string }>,
    usage?: GrokResponsesApiResponse['usage']
  ): GrokAnalysisResult {
    // Try to parse JSON from the response
    let parsed: Record<string, unknown> | null = null;

    // Extract JSON from the text (might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                      text.match(/(\{[\s\S]*\})/);

    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
        console.log('[Grok] Successfully parsed JSON response');
      } catch (e) {
        console.warn('[Grok] Failed to parse JSON, falling back to text parsing:', e);
      }
    }

    // Default structure
    const defaultPositive = {
      isDoxxed: false,
      doxxedDetails: null,
      hasActiveGithub: false,
      githubUrl: null,
      githubActivity: null,
      hasRealProduct: false,
      productDetails: null,
      accountAgeDays: 0,
      hasConsistentHistory: false,
      hasOrganicEngagement: false,
      hasCredibleBackers: false,
      backersDetails: null,
      teamMembers: [],
    };

    const defaultNegative = {
      hasScamAllegations: false,
      scamDetails: null,
      hasRugHistory: false,
      rugDetails: null,
      isAnonymousTeam: true,
      hasHypeLanguage: false,
      hypeExamples: [],
      hasSuspiciousFollowers: false,
      suspiciousDetails: null,
      hasPreviousRebrand: false,
      rebrandDetails: null,
      hasAggressivePromotion: false,
      promotionDetails: null,
    };

    if (parsed) {
      // Use parsed JSON data
      const profile = parsed.profile as Record<string, unknown> || {};
      const positive = parsed.positiveIndicators as Record<string, unknown> || {};
      const negative = parsed.negativeIndicators as Record<string, unknown> || {};
      const evidenceItems = Array.isArray(parsed.evidence) ? parsed.evidence : [];

      return {
        handle: String(parsed.handle || ''),
        postsAnalyzed: typeof parsed.postsAnalyzed === 'number' ? parsed.postsAnalyzed : undefined,
        profile: {
          handle: String(parsed.handle || profile.handle || ''),
          displayName: profile.displayName as string | undefined,
          bio: profile.bio as string | undefined,
          verified: Boolean(profile.verified),
          followers: typeof profile.followers === 'number' ? profile.followers : undefined,
          following: typeof profile.following === 'number' ? profile.following : undefined,
          createdAt: profile.createdAt as string | undefined,
          xUrl: profile.xUrl as string | undefined,
        },
        positiveIndicators: {
          isDoxxed: Boolean(positive.isDoxxed),
          doxxedDetails: positive.doxxedDetails as string | null || null,
          hasActiveGithub: Boolean(positive.hasActiveGithub),
          githubUrl: positive.githubUrl as string | null || null,
          githubActivity: positive.githubActivity as string | null || null,
          hasRealProduct: Boolean(positive.hasRealProduct),
          productDetails: positive.productDetails as string | null || null,
          accountAgeDays: typeof positive.accountAgeDays === 'number' ? positive.accountAgeDays : 0,
          hasConsistentHistory: Boolean(positive.hasConsistentHistory),
          hasOrganicEngagement: Boolean(positive.hasOrganicEngagement),
          hasCredibleBackers: Boolean(positive.hasCredibleBackers),
          backersDetails: positive.backersDetails as string | null || null,
          teamMembers: Array.isArray(positive.teamMembers) ? positive.teamMembers : [],
        },
        negativeIndicators: {
          hasScamAllegations: Boolean(negative.hasScamAllegations),
          scamDetails: negative.scamDetails as string | null || null,
          hasRugHistory: Boolean(negative.hasRugHistory),
          rugDetails: negative.rugDetails as string | null || null,
          isAnonymousTeam: Boolean(negative.isAnonymousTeam),
          hasHypeLanguage: Boolean(negative.hasHypeLanguage),
          hypeExamples: Array.isArray(negative.hypeExamples) ? negative.hypeExamples : [],
          hasSuspiciousFollowers: Boolean(negative.hasSuspiciousFollowers),
          suspiciousDetails: negative.suspiciousDetails as string | null || null,
          hasPreviousRebrand: Boolean(negative.hasPreviousRebrand),
          rebrandDetails: negative.rebrandDetails as string | null || null,
          hasAggressivePromotion: Boolean(negative.hasAggressivePromotion),
          promotionDetails: negative.promotionDetails as string | null || null,
        },
        github: parsed.github as string | null || null,
        website: parsed.website as string | null || null,
        contract: parsed.contract ? {
          address: String((parsed.contract as Record<string, unknown>).address || ''),
          chain: String((parsed.contract as Record<string, unknown>).chain || 'unknown'),
        } : null,
        controversies: Array.isArray(parsed.controversies) ? parsed.controversies : [],
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
        evidence: evidenceItems.map((ev: Record<string, unknown>) => ({
          date: ev.date as string | undefined,
          tweetExcerpt: String(ev.tweetExcerpt || ev.content || ''),
          tweetUrl: String(ev.tweetUrl || ev.url || ''),
          label: this.normalizeEvidenceLabel(ev.label as string),
          relevance: String(ev.relevance || ev.notes || ''),
        })),
        overallAssessment: parsed.overallAssessment as string | undefined,
        theStory: parsed.theStory as string | undefined,
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : undefined,
        promotionHistory: Array.isArray(parsed.promotionHistory) ? parsed.promotionHistory.map((p: Record<string, unknown>) => ({
          project: String(p.project || ''),
          ticker: p.ticker as string | undefined,
          role: p.role as string | undefined,
          period: p.period as string | undefined,
          firstMention: p.firstMention as string | undefined,
          lastMention: p.lastMention as string | undefined,
          mentionCount: typeof p.mentionCount === 'number' ? p.mentionCount : undefined,
          claims: Array.isArray(p.claims) ? p.claims : undefined,
          outcome: p.outcome as string | undefined,
          evidenceUrls: Array.isArray(p.evidenceUrls) ? p.evidenceUrls : undefined,
        })) : undefined,
        topInteractions: Array.isArray(parsed.topInteractions) ? parsed.topInteractions.map((i: Record<string, unknown>) => ({
          handle: String(i.handle || ''),
          relationship: this.normalizeRelationship(i.relationship as string),
          interactionCount: typeof i.interactionCount === 'number' ? i.interactionCount : 1,
          context: i.context as string | undefined,
        })) : undefined,
        reputation: parsed.reputation ? {
          supporters: Array.isArray((parsed.reputation as any).supporters) ? (parsed.reputation as any).supporters : [],
          critics: Array.isArray((parsed.reputation as any).critics) ? (parsed.reputation as any).critics : [],
          controversies: Array.isArray((parsed.reputation as any).controversies) ? (parsed.reputation as any).controversies : [],
        } : undefined,
        verdict: parsed.verdict ? {
          trustLevel: typeof (parsed.verdict as any).trustLevel === 'number' ? (parsed.verdict as any).trustLevel : 5,
          riskLevel: this.normalizeRiskLevel((parsed.verdict as any).riskLevel),
          confidence: this.normalizeConfidence((parsed.verdict as any).confidence),
          summary: String((parsed.verdict as any).summary || ''),
        } : undefined,
        // OSINT-enhanced fields
        legalEntity: parsed.legalEntity ? {
          companyName: (parsed.legalEntity as any).companyName || null,
          jurisdiction: (parsed.legalEntity as any).jurisdiction || null,
          isRegistered: Boolean((parsed.legalEntity as any).isRegistered),
          registrationDetails: (parsed.legalEntity as any).registrationDetails || null,
        } : undefined,
        affiliations: Array.isArray(parsed.affiliations) ? parsed.affiliations : undefined,
        tokenomics: parsed.tokenomics ? {
          totalSupply: (parsed.tokenomics as any).totalSupply,
          circulatingSupply: (parsed.tokenomics as any).circulatingSupply,
          burnMechanism: (parsed.tokenomics as any).burnMechanism,
          burnRate: (parsed.tokenomics as any).burnRate,
          isDeflationary: Boolean((parsed.tokenomics as any).isDeflationary),
          vestingSchedule: (parsed.tokenomics as any).vestingSchedule,
        } : undefined,
        liquidity: parsed.liquidity ? {
          primaryDex: (parsed.liquidity as any).primaryDex,
          poolType: (parsed.liquidity as any).poolType,
          liquidityUsd: (parsed.liquidity as any).liquidityUsd,
          liquidityLocked: Boolean((parsed.liquidity as any).liquidityLocked),
          lockDuration: (parsed.liquidity as any).lockDuration,
        } : undefined,
        roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : undefined,
        audit: parsed.audit ? {
          hasAudit: Boolean((parsed.audit as any).hasAudit),
          auditor: (parsed.audit as any).auditor,
          auditDate: (parsed.audit as any).auditDate,
          auditUrl: (parsed.audit as any).auditUrl,
          auditStatus: (parsed.audit as any).auditStatus || 'none',
        } : undefined,
        techStack: parsed.techStack ? {
          blockchain: (parsed.techStack as any).blockchain || 'unknown',
          smartContractLanguage: (parsed.techStack as any).smartContractLanguage,
          zkTech: (parsed.techStack as any).zkTech,
          offlineCapability: Boolean((parsed.techStack as any).offlineCapability),
          hardwareProducts: Array.isArray((parsed.techStack as any).hardwareProducts) ? (parsed.techStack as any).hardwareProducts : [],
          keyTechnologies: Array.isArray((parsed.techStack as any).keyTechnologies) ? (parsed.techStack as any).keyTechnologies : [],
        } : undefined,
        shippingHistory: Array.isArray(parsed.shippingHistory) ? parsed.shippingHistory : undefined,
        // Deep analysis fields
        fundingHistory: Array.isArray(parsed.fundingHistory) ? parsed.fundingHistory : undefined,
        competitorAnalysis: parsed.competitorAnalysis ? {
          directCompetitors: Array.isArray((parsed.competitorAnalysis as any).directCompetitors) ? (parsed.competitorAnalysis as any).directCompetitors : [],
          uniqueValue: (parsed.competitorAnalysis as any).uniqueValue,
          marketPosition: (parsed.competitorAnalysis as any).marketPosition || 'unknown',
        } : undefined,
        communityMetrics: parsed.communityMetrics ? {
          discordMembers: (parsed.communityMetrics as any).discordMembers,
          telegramMembers: (parsed.communityMetrics as any).telegramMembers,
          discordActivity: (parsed.communityMetrics as any).discordActivity || 'unknown',
          sentiment: (parsed.communityMetrics as any).sentiment || 'unknown',
        } : undefined,
        riskLevel: this.normalizeRiskLevel(parsed.riskLevel as string),
        confidence: this.normalizeConfidence(parsed.confidence as string),
        rawAnalysis: text,
        citations: citations.map(c => ({ url: c.url, title: c.title })),
        tokensUsed: usage?.total_tokens,
        searchesPerformed: usage?.server_side_tool_usage_details?.x_search_calls ?? 0,
      };
    }

    // Fallback: parse from text (legacy behavior)
    console.log('[Grok] Falling back to text parsing');
    return this.parseFromText(text, citations, usage, defaultPositive, defaultNegative);
  }

  private normalizeRiskLevel(level: string | undefined): 'low' | 'medium' | 'high' {
    const normalized = String(level || '').toLowerCase();
    if (normalized === 'low') return 'low';
    if (normalized === 'high') return 'high';
    return 'medium';
  }

  private normalizeConfidence(conf: string | undefined): 'low' | 'medium' | 'high' {
    const normalized = String(conf || '').toLowerCase();
    if (normalized === 'low') return 'low';
    if (normalized === 'high') return 'high';
    return 'medium';
  }

  private normalizeRelationship(rel: string | undefined): GrokTopInteraction['relationship'] {
    const normalized = String(rel || '').toLowerCase();
    if (normalized === 'collaborator') return 'collaborator';
    if (normalized === 'promoter') return 'promoter';
    if (normalized === 'critic') return 'critic';
    if (normalized === 'friend') return 'friend';
    return 'unknown';
  }

  private normalizeEntityType(type: string | undefined): GrokClassificationResult['entityType'] {
    const normalized = String(type || '').toLowerCase();
    if (normalized === 'person') return 'person';
    if (normalized === 'project') return 'project';
    if (normalized === 'company') return 'company';
    return 'unknown';
  }

  private normalizeEvidenceLabel(
    label: string | undefined
  ): 'shill' | 'backlash' | 'toxic' | 'hype' | 'neutral' | 'positive' | 'promotion' | 'controversy' | 'claim' | 'scam_warning' | 'milestone' {
    const normalized = String(label || '').toLowerCase().replace('_', '-');
    const validLabels = ['shill', 'backlash', 'toxic', 'hype', 'positive', 'promotion', 'controversy', 'claim', 'scam_warning', 'scam-warning', 'milestone'];
    if (validLabels.includes(normalized)) {
      // Normalize scam-warning to scam_warning
      if (normalized === 'scam-warning') return 'scam_warning';
      return normalized as any;
    }
    return 'neutral';
  }

  private parseFromText(
    text: string,
    citations: Array<{ url: string; title?: string }>,
    usage: GrokResponsesApiResponse['usage'] | undefined,
    defaultPositive: GrokAnalysisResult['positiveIndicators'],
    defaultNegative: GrokAnalysisResult['negativeIndicators']
  ): GrokAnalysisResult {
    // Extract basic info from text
    const handleMatch = text.match(/@(\w+)/);
    const handle = handleMatch ? handleMatch[1] : '';

    // Parse followers
    const followersMatch = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*[kK]?\s*followers/i);
    let followers: number | undefined;
    if (followersMatch) {
      let count = parseFloat(followersMatch[1].replace(/,/g, ''));
      if (followersMatch[0].toLowerCase().includes('k')) count *= 1000;
      followers = Math.round(count);
    }

    // Check for doxxed indicators
    const isDoxxed = text.toLowerCase().includes('doxxed') ||
                     text.toLowerCase().includes('known developer') ||
                     text.toLowerCase().includes('publicly known') ||
                     (text.toLowerCase().includes('linkedin') && !text.toLowerCase().includes('no linkedin'));

    // Check for GitHub
    const githubMatch = text.match(/github\.com\/([^\s\]]+)/i);
    const hasGithub = !!githubMatch;

    // Determine risk level
    const hasScam = text.toLowerCase().includes('scam') && !text.toLowerCase().includes('no scam');
    const hasRug = text.toLowerCase().includes('rug') && !text.toLowerCase().includes('no rug');

    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (hasScam || hasRug) {
      riskLevel = 'high';
    } else if (isDoxxed || hasGithub) {
      riskLevel = 'low';
    }

    return {
      handle,
      profile: {
        handle,
        verified: text.toLowerCase().includes('verified'),
        followers,
      },
      positiveIndicators: {
        ...defaultPositive,
        isDoxxed,
        hasActiveGithub: hasGithub,
        githubUrl: githubMatch ? `https://github.com/${githubMatch[1]}` : null,
      },
      negativeIndicators: {
        ...defaultNegative,
        hasScamAllegations: hasScam,
        hasRugHistory: hasRug,
        isAnonymousTeam: !isDoxxed,
      },
      github: githubMatch ? `https://github.com/${githubMatch[1]}` : null,
      website: null,
      contract: null,
      controversies: [],
      keyFindings: [],
      riskLevel,
      confidence: 'medium',
      rawAnalysis: text,
      citations: citations.map(c => ({ url: c.url, title: c.title })),
      tokensUsed: usage?.total_tokens,
      searchesPerformed: usage?.server_side_tool_usage_details?.x_search_calls ?? 0,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let grokClientInstance: GrokClient | null = null;

/**
 * Get the singleton Grok client instance
 */
export function getGrokClient(): GrokClient {
  if (!grokClientInstance) {
    grokClientInstance = new GrokClient();
  }
  return grokClientInstance;
}

/**
 * Check if Grok API is available (credentials configured)
 */
export function isGrokAvailable(): boolean {
  return !!XAI_API_KEY;
}
