import { NextRequest, NextResponse } from 'next/server';
import { submitScan, getScanJob } from '@/lib/terminal/xintel/scan-service';
import { isValidHandle, formatHandle } from '@/types/xintel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, depth, force } = body;

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    const formattedHandle = formatHandle(handle);

    if (!isValidHandle(formattedHandle)) {
      return NextResponse.json(
        { error: 'Invalid handle format. X handles must be 4-15 characters (letters, numbers, underscore).' },
        { status: 400 }
      );
    }

    const result = await submitScan({
      handle: formattedHandle,
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

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID is required' },
      { status: 400 }
    );
  }

  const job = getScanJob(jobId);

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
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
  });
}
