/**
 * RugCheck.xyz Intelligence
 *
 * Free API for Solana token security analysis.
 * Checks for common rug pull indicators.
 *
 * API: https://api.rugcheck.xyz/v1/tokens/{mint}/report
 */

// ============================================================================
// TYPES
// ============================================================================

export interface RugCheckResult {
  // Identifiers
  tokenAddress: string;

  // Overall assessment
  score: number;                    // Higher = more risks detected
  normalizedScore: number;          // 0-10 (higher = safer)
  riskLevel: 'Good' | 'Warn' | 'Danger' | 'Unknown';

  // Risk factors
  risks: RugCheckRisk[];

  // Token info
  tokenName?: string;
  tokenSymbol?: string;
  totalSupply?: string;
  decimals?: number;
  price?: number;

  // Key security flags
  mintAuthority: 'renounced' | 'active' | 'unknown';     // Can new tokens be minted?
  freezeAuthority: 'renounced' | 'active' | 'unknown';   // Can transfers be frozen?
  mutableMetadata: boolean;                               // Can token metadata be changed?
  transferFeePercent?: number;                            // Transfer fee if any

  // Liquidity info
  totalLiquidityUsd?: number;
  lpLocked: boolean | null;
  markets: Array<{
    marketType: string;           // 'raydium', 'orca', 'meteora', etc.
    lpLockedPercent?: number;
    lpBurnedPercent?: number;
    liquidityUsd?: number;
  }>;

  // Creator info
  creatorAddress?: string;
  creatorBalance?: number;
  creatorBalancePercent?: number;

  // Holder distribution
  totalHolders?: number;
  topHolders?: Array<{
    address: string;
    balance: number;
    percent: number;
    isCreator?: boolean;
    isInsider?: boolean;
  }>;
  topHolderPercent?: number;        // Largest single holder %
  topHoldersConcentration?: number; // Top 10 combined %

  // Insider detection
  insiderNetworks?: number;         // Number of insider network accounts

  // Rug status
  isRugged: boolean;

  // Status
  isAccessible: boolean;
  fetchedAt: Date;
  rugcheckUrl: string;
}

export interface RugCheckRisk {
  name: string;
  description: string;
  level: 'info' | 'warn' | 'danger';
  value?: string | number;
}

// ============================================================================
// RUGCHECK API
// ============================================================================

const RUGCHECK_API = 'https://api.rugcheck.xyz/v1';

/**
 * Fetch token security report from RugCheck.xyz
 */
export async function fetchRugCheckReport(tokenAddress: string): Promise<RugCheckResult> {
  const result: RugCheckResult = {
    tokenAddress,
    score: 0,
    normalizedScore: 0,
    riskLevel: 'Unknown',
    risks: [],
    mintAuthority: 'unknown',
    freezeAuthority: 'unknown',
    mutableMetadata: false,
    markets: [],
    lpLocked: null,
    isRugged: false,
    isAccessible: false,
    fetchedAt: new Date(),
    rugcheckUrl: `https://rugcheck.xyz/tokens/${tokenAddress}`,
  };

  try {
    console.log(`[RugCheck] Fetching report for: ${tokenAddress}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${RUGCHECK_API}/tokens/${tokenAddress}/report`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CLARP/1.0',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.log(`[RugCheck] API returned ${response.status}`);
      return result;
    }

    const data = await response.json();
    result.isAccessible = true;

    // Map response to our type
    result.score = data.score ?? 0;
    result.normalizedScore = Math.max(0, 10 - Math.floor(result.score / 10)); // Convert to 0-10 (higher = safer)
    result.riskLevel = mapRiskLevel(result.normalizedScore);
    result.isRugged = data.rugged === true;

    // Token metadata
    if (data.tokenMeta) {
      result.tokenName = data.tokenMeta.name;
      result.tokenSymbol = data.tokenMeta.symbol;
    }
    if (data.token) {
      result.totalSupply = data.token.supply;
      result.decimals = data.token.decimals;
    }
    result.price = data.price;

    // Authorities - null means renounced
    result.mintAuthority = data.mintAuthority === null ? 'renounced' : 'active';
    result.freezeAuthority = data.freezeAuthority === null ? 'renounced' : 'active';

    // Mutable metadata check (from fileMeta or risks)
    result.mutableMetadata = data.fileMeta?.mutable === true;
    if (!result.mutableMetadata && data.risks) {
      result.mutableMetadata = data.risks.some((r: any) =>
        r.name?.toLowerCase().includes('mutable') ||
        r.description?.toLowerCase().includes('mutable metadata')
      );
    }

    // Transfer fee
    if (data.transferFee) {
      result.transferFeePercent = data.transferFee.pct || 0;
    }

    // Creator info
    result.creatorAddress = data.creator;
    if (data.creatorTokenAccount) {
      result.creatorBalance = data.creatorTokenAccount.amount;
      result.creatorBalancePercent = data.creatorTokenAccount.pct;
    }

    // Holder info
    result.totalHolders = data.totalHolders;

    // Top holders
    if (data.topHolders && Array.isArray(data.topHolders)) {
      result.topHolders = data.topHolders.slice(0, 10).map((h: any) => ({
        address: h.owner || h.address,
        balance: h.amount || h.balance,
        percent: h.pct,
        isCreator: (h.owner || h.address) === data.creator,
        isInsider: h.insider === true,
      }));

      // Track top holder percent (excluding LPs)
      if (result.topHolders && result.topHolders.length > 0) {
        const nonLpHolders = result.topHolders.filter(h => !h.address?.includes('LP'));
        if (nonLpHolders.length > 0) {
          result.topHolderPercent = nonLpHolders[0].percent;
        }

        // Calculate top holder concentration
        result.topHoldersConcentration = result.topHolders
          .reduce((sum, h) => sum + (h.percent || 0), 0);
      }
    }

    // Market/LP info
    result.totalLiquidityUsd = data.totalMarketLiquidity;
    if (data.markets && Array.isArray(data.markets)) {
      let hasLockedLp = false;
      result.markets = data.markets.map((m: any) => {
        const market = {
          marketType: m.marketType || 'unknown',
          lpLockedPercent: m.lp?.lpLockedPct,
          lpBurnedPercent: m.lp?.lpBurnedPct,
          liquidityUsd: m.lp?.quoteUSD,
        };
        if ((market.lpLockedPercent ?? 0) > 50 || (market.lpBurnedPercent ?? 0) > 50) {
          hasLockedLp = true;
        }
        return market;
      });
      result.lpLocked = hasLockedLp;
    }

    // Insider networks
    if (data.insiderNetworks) {
      result.insiderNetworks = Array.isArray(data.insiderNetworks)
        ? data.insiderNetworks.reduce((sum: number, n: any) => sum + (n.activeAccounts || 0), 0)
        : 0;
    }

    // Map risks
    if (data.risks && Array.isArray(data.risks)) {
      result.risks = data.risks.map((r: any) => ({
        name: r.name,
        description: r.description,
        level: mapRiskSeverity(r.level || r.score),
        value: r.value,
      }));
    }

    console.log(`[RugCheck] Score: ${result.score} (${result.normalizedScore}/10), Level: ${result.riskLevel}, Risks: ${result.risks.length}, Holders: ${result.totalHolders}`);

    return result;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`[RugCheck] Request timed out`);
    } else {
      console.error(`[RugCheck] Error:`, error);
    }
    return result;
  }
}

/**
 * Quick check if token has any major red flags
 */
export async function hasRugCheckRedFlags(tokenAddress: string): Promise<{
  hasRedFlags: boolean;
  flags: string[];
  report: RugCheckResult;
}> {
  const report = await fetchRugCheckReport(tokenAddress);

  const flags: string[] = [];

  // Critical flags
  if (report.isRugged) {
    flags.push('⚠️ TOKEN FLAGGED AS RUG PULL');
  }
  if (report.mintAuthority === 'active') {
    flags.push('Mint authority active - unlimited tokens can be created');
  }
  if (report.freezeAuthority === 'active') {
    flags.push('Freeze authority active - your tokens can be frozen');
  }

  // LP flags
  if (report.lpLocked === false && report.totalLiquidityUsd && report.totalLiquidityUsd > 1000) {
    flags.push('Liquidity not locked - can be pulled at any time');
  }

  // Holder concentration flags
  if (report.creatorBalancePercent && report.creatorBalancePercent > 20) {
    flags.push(`Creator holds ${report.creatorBalancePercent.toFixed(1)}% of supply`);
  }
  if (report.topHolderPercent && report.topHolderPercent > 30) {
    flags.push(`Single holder controls ${report.topHolderPercent.toFixed(1)}% of supply`);
  }
  if (report.topHoldersConcentration && report.topHoldersConcentration > 60) {
    flags.push(`Top 10 holders control ${report.topHoldersConcentration.toFixed(1)}% of supply`);
  }

  // Insider flag
  if (report.insiderNetworks && report.insiderNetworks > 20) {
    flags.push(`${report.insiderNetworks} insider network accounts detected`);
  }

  // Transfer fee flag
  if (report.transferFeePercent && report.transferFeePercent > 5) {
    flags.push(`High transfer fee: ${report.transferFeePercent}%`);
  }

  // Mutable metadata warning (less critical but worth noting)
  if (report.mutableMetadata) {
    flags.push('Token metadata can be changed by owner');
  }

  // Add danger-level risks
  for (const risk of report.risks) {
    if (risk.level === 'danger') {
      const msg = risk.description || risk.name;
      if (!flags.some(f => f.includes(msg))) {
        flags.push(msg);
      }
    }
  }

  return {
    hasRedFlags: flags.length > 0,
    flags,
    report,
  };
}

/**
 * Get a simple summary string for the token
 */
export function getRugCheckSummary(report: RugCheckResult): string {
  const parts: string[] = [];

  parts.push(`Score: ${report.normalizedScore}/10 (${report.riskLevel})`);

  if (report.mintAuthority === 'renounced' && report.freezeAuthority === 'renounced') {
    parts.push('Authorities renounced ✓');
  } else {
    if (report.mintAuthority === 'active') parts.push('Mint authority active ⚠');
    if (report.freezeAuthority === 'active') parts.push('Freeze authority active ⚠');
  }

  if (report.lpLocked) {
    parts.push('LP locked ✓');
  } else if (report.lpLocked === false) {
    parts.push('LP not locked ⚠');
  }

  if (report.totalHolders) {
    parts.push(`${report.totalHolders.toLocaleString()} holders`);
  }

  if (report.totalLiquidityUsd) {
    parts.push(`$${report.totalLiquidityUsd.toLocaleString()} liquidity`);
  }

  return parts.join(' | ');
}

// ============================================================================
// HELPERS
// ============================================================================

function mapRiskLevel(normalizedScore: number | undefined): RugCheckResult['riskLevel'] {
  if (normalizedScore === undefined || normalizedScore === null) return 'Unknown';
  if (normalizedScore >= 7) return 'Good';
  if (normalizedScore >= 4) return 'Warn';
  return 'Danger';
}

function mapRiskSeverity(level: string | number): RugCheckRisk['level'] {
  // Handle numeric scores
  if (typeof level === 'number') {
    if (level >= 3000) return 'danger';
    if (level >= 1000) return 'warn';
    return 'info';
  }

  // Handle string levels
  switch (level?.toLowerCase()) {
    case 'danger':
    case 'high':
    case 'critical':
      return 'danger';
    case 'warn':
    case 'warning':
    case 'medium':
      return 'warn';
    default:
      return 'info';
  }
}
