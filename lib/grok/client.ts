// Grok Client
// xAI Grok API client using the Responses API with Agent Tools for live X search

import {
  GrokAnalysisResult,
  GrokProfileInput,
  GrokResponsesApiResponse,
  GrokTextOutput,
} from './types';
import { ANALYSIS_PROMPT } from './prompts';

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
   * Analyze an X profile using Grok's live search capabilities
   * This uses the Responses API with x_search and web_search tools
   */
  async analyzeProfile(handle: string): Promise<GrokAnalysisResult> {
    if (!XAI_API_KEY) {
      throw new GrokApiError('Grok API client not configured. Set XAI_API_KEY environment variable.');
    }

    const normalizedHandle = handle.toLowerCase().replace('@', '');
    const prompt = ANALYSIS_PROMPT.replace('{handle}', normalizedHandle);

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
              content: prompt,
            },
          ],
          tools: [
            { type: 'x_search' },
            { type: 'web_search' },
          ],
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
          tools: [
            { type: 'x_search' },
            { type: 'web_search' },
          ],
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

      return {
        handle: String(parsed.handle || ''),
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
        overallAssessment: parsed.overallAssessment as string | undefined,
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
