import { NextRequest, NextResponse } from 'next/server';
import { resolveEntity, getSuggestions } from '@/lib/terminal/entity-resolver';
import type { SearchResult } from '@/types/terminal';

// Extended SearchResponse with optional error
interface SearchResponse {
  results: SearchResult[];
  suggestions: string[];
  error?: string;
  meta?: {
    query: string;
    entityType: string;
    totalResults: number;
  };
}

// Rate limit: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json<SearchResponse>(
        { results: [], suggestions: [], error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json<SearchResponse>({ results: [], suggestions: [] });
    }

    // Get entity resolution suggestions
    const suggestions = getSuggestions(query);

    // Resolve the entity type
    const entity = resolveEntity(query);
    const results: SearchResult[] = [];

    // Return empty results - real data integration needed
    return NextResponse.json<SearchResponse>({
      results,
      suggestions,
      meta: {
        query,
        entityType: entity?.type || 'unknown',
        totalResults: results.length,
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json<SearchResponse>(
      { results: [], suggestions: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}
