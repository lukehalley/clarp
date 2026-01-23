import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, getMockScore } from '@/lib/terminal/mock-data';
import type { WatchlistItem } from '@/types/terminal';

// In-memory storage for demo (would use database in production)
const watchlistStore = new Map<string, string[]>();

export async function GET(request: NextRequest) {
  try {
    // Get user ID from header or cookie (simplified for demo)
    const userId = request.headers.get('x-user-id') || 'demo-user';

    const projectIds = watchlistStore.get(userId) || [];

    const items: WatchlistItem[] = projectIds
      .map(id => {
        const project = getProjectById(id);
        if (!project) return null;
        const score = getMockScore(id);
        return {
          projectId: id,
          project,
          score,
          addedAt: new Date(),
          scoreDelta24h: Math.floor(Math.random() * 20) - 5,
        };
      })
      .filter((item): item is WatchlistItem => item !== null);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Watchlist fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await request.json();
    const { projectId } = body;

    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const currentList = watchlistStore.get(userId) || [];

    if (currentList.includes(projectId)) {
      return NextResponse.json(
        { error: 'Project already in watchlist' },
        { status: 409 }
      );
    }

    watchlistStore.set(userId, [...currentList, projectId]);

    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error('Watchlist add error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const currentList = watchlistStore.get(userId) || [];
    const updatedList = currentList.filter(id => id !== projectId);
    watchlistStore.set(userId, updatedList);

    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error('Watchlist delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
