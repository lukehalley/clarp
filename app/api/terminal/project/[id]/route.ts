import { NextRequest, NextResponse } from 'next/server';

// Terminal project routes - disabled until real data integration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json(
    { error: 'Terminal project feature not yet connected to real data', id },
    { status: 501 }
  );
}
