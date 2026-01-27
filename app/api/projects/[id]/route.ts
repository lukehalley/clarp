import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, getProjectByHandle, getProjectByTokenAddress, deleteProject, deleteProjectByHandle } from '@/lib/terminal/project-service';
import { deleteCachedReportFromSupabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if it looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    // Check if it looks like a Solana address (base58, 32-44 chars)
    const isSolanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(id);

    let project = null;

    if (isUuid) {
      project = await getProjectById(id);
    } else if (isSolanaAddress) {
      // Try token address first
      project = await getProjectByTokenAddress(id);
    }

    // If not found yet, try as X handle
    if (!project) {
      const handle = id.replace(/^@/, '').toLowerCase();
      project = await getProjectByHandle(handle);
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('[API/projects/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID or handle is required' },
        { status: 400 }
      );
    }

    // Try to delete by ID first, then by handle
    let deleted = false;
    let handle: string | undefined;

    // Check if it looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      // Get the project first to get the handle for cache cleanup
      const project = await getProjectById(id);
      if (project) {
        handle = project.xHandle;
        deleted = await deleteProject(id);
      }
    } else {
      // Treat as handle
      handle = id.replace(/^@/, '').toLowerCase();
      deleted = await deleteProjectByHandle(handle);
    }

    if (!deleted) {
      return NextResponse.json(
        { error: 'Project not found or already deleted' },
        { status: 404 }
      );
    }

    // Also clear the cached report
    if (handle) {
      await deleteCachedReportFromSupabase(handle);
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('[API/projects/[id]] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
