import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/verify-token';
import { getServiceClient } from '@/lib/supabase/server';

// GET /api/terminal/watchlist - Get user's watchlist
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUserFromRequest(request);

    if (!user) {
      // Return empty for unauthenticated users (they use localStorage)
      return NextResponse.json({ watchlist: [], authenticated: false });
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from('user_watchlist')
      .select('project_id, added_at')
      .eq('user_id', user.userId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('[Watchlist] Fetch error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch watchlist' },
        { status: 500 }
      );
    }

    const watchlist = data.map((item) => ({
      projectId: item.project_id,
      addedAt: item.added_at,
    }));

    return NextResponse.json({ watchlist, authenticated: true });
  } catch (error) {
    console.error('[Watchlist] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/terminal/watchlist - Add project to watchlist
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { error } = await supabase.from('user_watchlist').upsert(
      {
        user_id: user.userId,
        project_id: projectId,
        added_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,project_id' }
    );

    if (error) {
      console.error('[Watchlist] Add error:', error.message);
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error('[Watchlist] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/terminal/watchlist - Remove project from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { error } = await supabase
      .from('user_watchlist')
      .delete()
      .eq('user_id', user.userId)
      .eq('project_id', projectId);

    if (error) {
      console.error('[Watchlist] Delete error:', error.message);
      return NextResponse.json(
        { error: 'Failed to remove from watchlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error('[Watchlist] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
