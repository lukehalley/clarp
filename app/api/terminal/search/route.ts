import { NextRequest, NextResponse } from 'next/server';
import { resolveEntity, getSuggestions } from '@/lib/terminal/entity-resolver';
import {
  MOCK_PROJECTS,
  getMockScore,
  getProjectByTicker,
  getProjectByContract,
  getProfileByHandle,
} from '@/lib/terminal/mock-data';
import type { SearchResult, SearchResponse } from '@/types/terminal';

// Rate limit: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

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

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return NextResponse.json(
        { error: 'Query cannot be empty' },
        { status: 400 }
      );
    }

    const results: SearchResult[] = [];
    const entity = resolveEntity(trimmedQuery);

    if (entity) {
      switch (entity.type) {
        case 'ticker': {
          const project = getProjectByTicker(entity.normalized);
          if (project) {
            results.push({
              entity,
              project,
              score: getMockScore(project.id).score,
            });
          }
          break;
        }
        case 'contract': {
          const project = getProjectByContract(entity.normalized);
          if (project) {
            results.push({
              entity,
              project,
              score: getMockScore(project.id).score,
            });
          }
          break;
        }
        case 'x_handle': {
          const profile = getProfileByHandle(entity.normalized);
          if (profile) {
            results.push({
              entity,
              profile,
            });
          }
          const projectMatch = MOCK_PROJECTS.find(
            p => p.xHandle?.toLowerCase() === entity.normalized
          );
          if (projectMatch) {
            results.push({
              entity,
              project: projectMatch,
              score: getMockScore(projectMatch.id).score,
            });
          }
          break;
        }
        default:
          break;
      }
    }

    // Fuzzy matching
    const fuzzyMatches = MOCK_PROJECTS.filter(p =>
      p.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      p.ticker?.toLowerCase().includes(trimmedQuery.toLowerCase())
    );

    for (const project of fuzzyMatches) {
      if (!results.some(r => r.project?.id === project.id)) {
        results.push({
          entity: { type: 'ticker', value: trimmedQuery, normalized: trimmedQuery },
          project,
          score: getMockScore(project.id).score,
        });
      }
    }

    const suggestions = getSuggestions(trimmedQuery);

    const response: SearchResponse = {
      results: results.slice(0, 10),
      suggestions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
