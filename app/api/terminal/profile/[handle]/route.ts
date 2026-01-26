import { NextRequest, NextResponse } from 'next/server';

// Terminal profile routes - disabled until real data integration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  return NextResponse.json(
    { error: 'Terminal profile feature not yet connected to real data', handle },
    { status: 501 }
  );
}
