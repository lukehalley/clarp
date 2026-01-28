import { NextRequest, NextResponse } from 'next/server';
import { resolveEntity } from '@/lib/terminal/entity-resolver';
import { getProjectByTokenAddress, getProjectByHandle } from '@/lib/terminal/project-service';
import { checkHandleCooldown } from '@/lib/terminal/xintel/scan-service';

/**
 * Preflight check before starting a scan
 * Returns rate limit status and whether project already exists
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query parameter required' },
      { status: 400 }
    );
  }

  try {
    // Quick entity resolution to get the canonical ID and X handle
    const result = await resolveEntity(query.trim());

    if (!result.success || !result.entity) {
      return NextResponse.json({
        canScan: true, // Let them try, will fail properly in scan
        reason: 'Entity not resolved',
      });
    }

    const entity = result.entity;
    const canonicalId = entity.canonicalId;
    const xHandle = entity.xHandle?.toLowerCase().replace('@', '');

    // Check if project already exists (can skip scan entirely)
    let existingProject = false;
    if (entity.inputType === 'token_address' && entity.tokenAddresses?.[0]?.address) {
      const project = await getProjectByTokenAddress(entity.tokenAddresses[0].address);
      existingProject = !!project;
    } else if (xHandle) {
      const project = await getProjectByHandle(xHandle);
      existingProject = !!project;
    }

    // Check rate limit for X handle (if we have one)
    let rateLimited = false;
    let waitSeconds = 0;

    if (xHandle) {
      const cooldown = checkHandleCooldown(xHandle);
      rateLimited = cooldown.limited;
      waitSeconds = cooldown.waitSeconds;
    }

    return NextResponse.json({
      canScan: !rateLimited,
      existingProject,
      canonicalId,
      xHandle,
      inputType: entity.inputType,
      rateLimited,
      waitSeconds,
    });
  } catch (err) {
    console.error('[Preflight] Error:', err);
    return NextResponse.json({
      canScan: true, // Let them try
      error: 'Preflight check failed',
    });
  }
}
