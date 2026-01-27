import { NextRequest, NextResponse } from 'next/server';
import {
  listProjects,
  searchProjects,
  countProjects,
  type ListProjectsOptions,
} from '@/lib/terminal/project-service';
import type { TrustTier } from '@/types/project';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Check if this is a search request
    const query = searchParams.get('q');
    if (query) {
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const projects = await searchProjects(query, limit);
      return NextResponse.json({ projects, total: projects.length });
    }

    // Otherwise, list with filters
    const options: ListProjectsOptions = {
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    };

    // Order
    const orderBy = searchParams.get('orderBy');
    if (orderBy && ['last_scan_at', 'created_at', 'trust_score', 'name'].includes(orderBy)) {
      options.orderBy = orderBy as ListProjectsOptions['orderBy'];
    }

    const order = searchParams.get('order');
    if (order && ['asc', 'desc'].includes(order)) {
      options.order = order as 'asc' | 'desc';
    }

    // Trust filters
    const trustTier = searchParams.get('trustTier');
    if (trustTier && ['verified', 'trusted', 'neutral', 'caution', 'avoid'].includes(trustTier)) {
      options.trustTier = trustTier as TrustTier;
    }

    const minScore = searchParams.get('minScore');
    if (minScore) {
      options.minScore = parseInt(minScore, 10);
    }

    const maxScore = searchParams.get('maxScore');
    if (maxScore) {
      options.maxScore = parseInt(maxScore, 10);
    }

    // Fetch projects and count
    const [projects, total] = await Promise.all([
      listProjects(options),
      countProjects(),
    ]);

    return NextResponse.json({
      projects,
      total,
      limit: options.limit,
      offset: options.offset,
    });
  } catch (error) {
    console.error('[API/projects] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
