import { NextRequest, NextResponse } from 'next/server';
import { runQuickScan } from '@/lib/terminal/quick-scan';

/**
 * Free Scan API Endpoint
 *
 * Allows one free scan per IP per 24 hours.
 * Returns limited results (just score and summary).
 */

// In-memory rate limit (resets on server restart, but good enough for MVP)
// In production, use Redis or similar
const FREE_SCAN_LIMIT = new Map<string, number>();
const LIMIT_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  // Fallback to request IP or hash of user-agent for uniqueness
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const lastScan = FREE_SCAN_LIMIT.get(ip);
  if (!lastScan) return true;

  const elapsed = Date.now() - lastScan;
  return elapsed >= LIMIT_DURATION;
}

// Solana address regex (base58, 32-44 chars)
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Free scan already used. Connect wallet with 1K+ CLARP for unlimited access.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { tokenAddress } = body;

    if (!tokenAddress) {
      return NextResponse.json(
        { success: false, error: 'Token address required' },
        { status: 400 }
      );
    }

    // Validate Solana address format
    if (!SOLANA_ADDRESS_REGEX.test(tokenAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    console.log(`[FreeScan] Running quick scan for ${tokenAddress} from IP ${ip}`);

    // Run quick scan (limited data)
    const result = await runQuickScan(tokenAddress);

    // Mark IP as used
    FREE_SCAN_LIMIT.set(ip, Date.now());

    console.log(`[FreeScan] Completed: score=${result.trustScore}, token=${result.tokenName}`);

    // Return scan result with security analysis
    return NextResponse.json({
      success: true,
      result: {
        score: result.trustScore,
        summary: result.summary,
        riskLevel: result.riskLevel,
        tokenName: result.tokenName,
        tokenSymbol: result.tokenSymbol,
        redFlags: result.redFlags?.slice(0, 3), // Limit to top 3 for free
        greenFlags: result.greenFlags?.slice(0, 3),
        launchpad: result.launchpad,
      },
    });
  } catch (error) {
    console.error('[FreeScan] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Scan failed. Please try again.' },
      { status: 500 }
    );
  }
}
