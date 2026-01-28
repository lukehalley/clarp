/**
 * Tokenomics Stats API
 *
 * Returns aggregated tokenomics data for the dashboard:
 * - Lifetime fees collected
 * - Total claimed/unclaimed
 * - Burn statistics
 * - Revenue split breakdown
 * - Recent burn transactions
 */

import { NextResponse } from 'next/server';
import { getClaimStats, getLifetimeFees } from '@/lib/bags/client';
import { CLARP_MINT, REVENUE_SPLIT } from '@/lib/config/tokenomics';
import { getServiceClient } from '@/lib/supabase/server';

const CREATOR_WALLET = process.env.CLARP_CREATOR_WALLET;

export async function GET() {
  const supabase = getServiceClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    // Get stats from database
    const { data: stats } = await supabase
      .from('tokenomics_stats')
      .select('*')
      .single();

    // Get recent distributions
    const { data: recentDistributions } = await supabase
      .from('revenue_distributions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get recent burns
    const { data: recentBurns } = await supabase
      .from('burn_transactions')
      .select('*')
      .eq('confirmed', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Try to get live data from Bags API
    let liveData = null;
    try {
      const clarpAddress = CLARP_MINT.toBase58();

      // Get lifetime fees from Bags
      const fees = await getLifetimeFees(clarpAddress);

      // Get claim stats if creator wallet is configured
      let claimStats = null;
      if (CREATOR_WALLET) {
        claimStats = await getClaimStats(CREATOR_WALLET);
      }

      liveData = {
        lifetimeFees: fees?.totalFees || 0,
        claimed: claimStats?.totalClaimed || 0,
        unclaimed: claimStats?.totalUnclaimed || 0,
      };
    } catch (apiError) {
      console.warn('[Tokenomics API] Failed to fetch live data:', apiError);
    }

    // Combine database and live data
    const response = {
      success: true,
      data: {
        // Revenue stats
        lifetimeFees: liveData?.lifetimeFees ?? stats?.total_claimed_sol ?? 0,
        claimed: liveData?.claimed ?? stats?.total_claimed_sol ?? 0,
        unclaimed: liveData?.unclaimed ?? 0,

        // Distribution stats
        totalDistributed: {
          profit: stats?.total_profit_sol ?? 0,
          operations: stats?.total_ops_sol ?? 0,
          burn: stats?.total_burn_sol ?? 0,
        },
        distributionCount: stats?.completed_distributions ?? 0,

        // Burn stats
        burns: {
          totalClarpBurned: stats?.total_clarp_burned ?? 0,
          totalSolSpent: stats?.total_burn_sol ?? 0,
          transactionCount: stats?.total_burn_count ?? 0,
          recent: (recentBurns ?? []).map((burn: {
            signature: string;
            clarp_amount: number;
            sol_spent: number;
            block_time: number | null;
            created_at: string;
          }) => ({
            signature: burn.signature,
            clarpAmount: burn.clarp_amount,
            solSpent: burn.sol_spent,
            timestamp: burn.block_time || new Date(burn.created_at).getTime() / 1000,
          })),
        },

        // Revenue split configuration
        revenueSplit: REVENUE_SPLIT,

        // Recent distributions
        recentDistributions: (recentDistributions ?? []).map((dist: {
          id: string;
          created_at: string;
          total_claimed: number;
          profit_amount: number;
          ops_amount: number;
          burn_amount: number;
          status: string;
          burn_tx_signature: string | null;
        }) => ({
          id: dist.id,
          date: dist.created_at,
          totalClaimed: dist.total_claimed,
          profitAmount: dist.profit_amount,
          opsAmount: dist.ops_amount,
          burnAmount: dist.burn_amount,
          status: dist.status,
          burnTx: dist.burn_tx_signature,
        })),

        // Meta
        lastUpdated: new Date().toISOString(),
        lastDistribution: stats?.last_distribution_at,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Tokenomics API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tokenomics data',
      },
      { status: 500 }
    );
  }
}
