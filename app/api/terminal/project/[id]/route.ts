import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, getMockScore } from '@/lib/terminal/mock-data';
import type { ProjectResponse } from '@/types/terminal';

// Cache duration: 5-15 minutes (configurable)
const CACHE_DURATION = 5 * 60; // 5 minutes in seconds

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const project = getProjectById(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const score = getMockScore(project.id);

    const response: ProjectResponse = {
      project,
      score,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
      },
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
