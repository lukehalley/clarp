import { NextRequest, NextResponse } from 'next/server';
import { getCachedReport, getCacheAge } from '@/lib/terminal/xintel/scan-service';
import { formatHandle, isValidHandle } from '@/types/xintel';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  if (!handle) {
    return NextResponse.json(
      { error: 'Handle is required' },
      { status: 400 }
    );
  }

  const formattedHandle = formatHandle(handle);

  if (!isValidHandle(formattedHandle)) {
    return NextResponse.json(
      { error: 'Invalid handle format' },
      { status: 400 }
    );
  }

  // Get report (always returns data - generates random if no preset)
  const report = await getCachedReport(formattedHandle);
  const cacheAge = await getCacheAge(formattedHandle);

  return NextResponse.json({
    report,
    cached: report.cached,
    cacheAge,
  });
}
