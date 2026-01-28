/**
 * Quick Scan Service - Free Tier
 *
 * Uses RugCheck.xyz free API for real security analysis.
 * Returns trust score based on on-chain security indicators.
 */

import { detectLaunchpad, getLaunchpadUrl } from './osint/launchpad-intel';
import { fetchRugCheckReport, type RugCheckResult } from './osint/rugcheck-intel';

export interface QuickScanResult {
  trustScore: number;
  summary: string;
  tokenName?: string;
  tokenSymbol?: string;
  riskLevel?: 'Good' | 'Warn' | 'Danger' | 'Unknown';
  redFlags?: string[];
  greenFlags?: string[];
  launchpad?: string;
  launchpadUrl?: string;
}

/**
 * Run a quick scan for free tier users
 * Uses RugCheck.xyz for real security analysis (free API)
 */
export async function runQuickScan(tokenAddress: string): Promise<QuickScanResult> {
  // Detect launchpad for context
  const launchpad = detectLaunchpad(tokenAddress);
  const launchpadUrl = getLaunchpadUrl(tokenAddress, launchpad);

  // Fetch RugCheck security report (free API)
  console.log(`[QuickScan] Fetching RugCheck report for ${tokenAddress}`);
  const rugcheck = await fetchRugCheckReport(tokenAddress);

  // Build result from RugCheck data
  const result = buildResultFromRugCheck(rugcheck, launchpad, launchpadUrl);

  console.log(`[QuickScan] Result: score=${result.trustScore}, level=${result.riskLevel}, flags=${result.redFlags?.length || 0}`);

  return result;
}

/**
 * Convert RugCheck report to QuickScanResult
 */
function buildResultFromRugCheck(
  rugcheck: RugCheckResult,
  launchpad: string,
  launchpadUrl?: string
): QuickScanResult {
  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  // If RugCheck couldn't access the token
  if (!rugcheck.isAccessible) {
    return {
      trustScore: 50,
      summary: 'Could not fetch security data. Token may be too new or not indexed yet.',
      riskLevel: 'Unknown',
      redFlags: ['Security data unavailable'],
      launchpad: launchpad !== 'unknown' ? launchpad.replace('_', '.') : undefined,
      launchpadUrl,
    };
  }

  // Critical red flags
  if (rugcheck.isRugged) {
    redFlags.push('TOKEN FLAGGED AS RUG PULL');
  }
  if (rugcheck.mintAuthority === 'active') {
    redFlags.push('Mint authority active - unlimited tokens can be minted');
  }
  if (rugcheck.freezeAuthority === 'active') {
    redFlags.push('Freeze authority active - transfers can be frozen');
  }
  if (rugcheck.lpLocked === false && rugcheck.totalLiquidityUsd && rugcheck.totalLiquidityUsd > 1000) {
    redFlags.push('Liquidity not locked - can be pulled anytime');
  }
  if (rugcheck.creatorBalancePercent && rugcheck.creatorBalancePercent > 20) {
    redFlags.push(`Creator holds ${rugcheck.creatorBalancePercent.toFixed(1)}% of supply`);
  }
  if (rugcheck.topHolderPercent && rugcheck.topHolderPercent > 30) {
    redFlags.push(`Single holder controls ${rugcheck.topHolderPercent.toFixed(1)}%`);
  }
  if (rugcheck.topHoldersConcentration && rugcheck.topHoldersConcentration > 60) {
    redFlags.push(`Top 10 hold ${rugcheck.topHoldersConcentration.toFixed(0)}% of supply`);
  }
  if (rugcheck.insiderNetworks && rugcheck.insiderNetworks > 20) {
    redFlags.push(`${rugcheck.insiderNetworks} insider accounts detected`);
  }
  if (rugcheck.transferFeePercent && rugcheck.transferFeePercent > 5) {
    redFlags.push(`High transfer fee: ${rugcheck.transferFeePercent}%`);
  }

  // Add danger-level risks from RugCheck
  for (const risk of rugcheck.risks) {
    if (risk.level === 'danger') {
      const msg = risk.description || risk.name;
      if (!redFlags.some(f => f.toLowerCase().includes(msg.toLowerCase().slice(0, 20)))) {
        redFlags.push(msg);
      }
    }
  }

  // Green flags
  if (rugcheck.mintAuthority === 'renounced') {
    greenFlags.push('Mint authority renounced');
  }
  if (rugcheck.freezeAuthority === 'renounced') {
    greenFlags.push('Freeze authority renounced');
  }
  if (rugcheck.lpLocked) {
    greenFlags.push('Liquidity locked');
  }
  if (rugcheck.totalHolders && rugcheck.totalHolders > 1000) {
    greenFlags.push(`${rugcheck.totalHolders.toLocaleString()} holders`);
  }
  if (rugcheck.totalLiquidityUsd && rugcheck.totalLiquidityUsd > 50000) {
    greenFlags.push(`$${(rugcheck.totalLiquidityUsd / 1000).toFixed(0)}K liquidity`);
  }

  // Convert RugCheck normalized score (0-10) to our 0-100 scale
  const trustScore = rugcheck.normalizedScore * 10;

  // Generate summary
  let summary: string;
  if (rugcheck.isRugged) {
    summary = 'WARNING: This token has been flagged as a rug pull. Do not invest.';
  } else if (trustScore >= 70) {
    summary = redFlags.length > 0
      ? `Generally safe but ${redFlags.length} concern${redFlags.length > 1 ? 's' : ''} detected.`
      : 'On-chain security looks good. No major red flags detected.';
  } else if (trustScore >= 40) {
    summary = `${redFlags.length} risk factor${redFlags.length > 1 ? 's' : ''} detected. Research carefully before investing.`;
  } else {
    summary = `High risk: ${redFlags.length} red flag${redFlags.length > 1 ? 's' : ''} detected. Proceed with extreme caution.`;
  }

  return {
    trustScore,
    summary,
    tokenName: rugcheck.tokenName,
    tokenSymbol: rugcheck.tokenSymbol,
    riskLevel: rugcheck.riskLevel,
    redFlags: redFlags.length > 0 ? redFlags : undefined,
    greenFlags: greenFlags.length > 0 ? greenFlags : undefined,
    launchpad: launchpad !== 'unknown' ? launchpad.replace('_', '.') : undefined,
    launchpadUrl,
  };
}
