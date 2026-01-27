import { NextRequest, NextResponse } from 'next/server';
import { submitScan, getScanJob, getActiveScanByHandle } from '@/lib/terminal/xintel/scan-service';
import { formatHandle, isValidHandle } from '@/types/xintel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, depth, force } = body;

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Clean the input
    const query = handle.trim();

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query too short' },
        { status: 400 }
      );
    }

    // Try to detect if this looks like an X handle
    const formattedHandle = formatHandle(query);
    const looksLikeHandle = isValidHandle(formattedHandle);

    // Pass the query to scan service - it will figure out what to do
    const result = await submitScan({
      handle: looksLikeHandle ? formattedHandle : query,
      depth: depth || 800,
      force: force || false,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 429 }
      );
    }

    return NextResponse.json({
      jobId: result.jobId,
      handle: result.handle,
      status: result.status,
      cached: result.cached,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process scan request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');
  const handle = request.nextUrl.searchParams.get('handle');

  // If handle is provided, look up active scan by handle (for resume on page refresh)
  if (handle) {
    const job = await getActiveScanByHandle(handle);

    if (!job) {
      return NextResponse.json(
        { error: 'No active scan found for this handle', hasActiveScan: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId: job.id,
      handle: job.handle,
      status: job.status,
      progress: job.progress,
      statusMessage: job.statusMessage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      hasActiveScan: true,
    });
  }

  // Otherwise, look up by jobId
  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID or handle is required' },
      { status: 400 }
    );
  }

  const job = await getScanJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    jobId: job.id,
    handle: job.handle,
    status: job.status,
    progress: job.progress,
    statusMessage: job.statusMessage,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
  });
}
