import { NextRequest, NextResponse } from 'next/server';
import { submitUniversalScan, getScanJob, getActiveScanByHandle } from '@/lib/terminal/xintel/scan-service';

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
    const input = handle.trim();

    if (input.length < 2) {
      return NextResponse.json(
        { error: 'Search query too short' },
        { status: 400 }
      );
    }

    // Use universal scan - it accepts any input type (token address, X handle, website, GitHub)
    const result = await submitUniversalScan({
      input,
      depth: depth || 200,
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
      inputType: result.inputType,
      canonicalId: result.canonicalId,
      status: result.status,
      cached: result.cached,
      // Include OSINT data if available (for immediate display)
      osintData: result.osintData ? {
        name: result.osintData.name,
        symbol: result.osintData.symbol,
        website: result.osintData.website,
        xHandle: result.osintData.xHandle,
        xUrl: result.osintData.xUrl,
        xCommunityId: result.osintData.xCommunityId,
        github: result.osintData.github,
        telegram: result.osintData.telegram,
        discord: result.osintData.discord,
        confidence: result.osintData.confidence,
        securityIntel: result.osintData.securityIntel,
        marketIntel: result.osintData.marketIntel,
        // Include tokenData for market prices from DexScreener
        tokenData: result.osintData.tokenData ? {
          priceUsd: result.osintData.tokenData.priceUsd,
          priceChange24h: result.osintData.tokenData.priceChange24h,
          volume24h: result.osintData.tokenData.volume24h,
          liquidity: result.osintData.tokenData.liquidity,
          marketCap: result.osintData.tokenData.marketCap,
        } : undefined,
      } : undefined,
    });
  } catch (err) {
    console.error('[API] Scan error:', err);
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

  // OSINT-only jobs are already complete (they don't have background processing)
  if (jobId.startsWith('osint_')) {
    return NextResponse.json({
      jobId,
      status: 'complete',
      progress: 100,
      statusMessage: 'OSINT data ready',
    });
  }

  // Cached results are already complete
  if (jobId.startsWith('cached_')) {
    return NextResponse.json({
      jobId,
      status: 'complete',
      progress: 100,
      statusMessage: 'Cached data loaded',
    });
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
