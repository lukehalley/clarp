/**
 * Tokenomics Distribution Service
 *
 * Handles daily distribution of Bags.fm creator fees:
 * - 50% to profit wallet
 * - 30% to operations wallet
 * - 20% to buy & burn CLARP
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { REVENUE_SPLIT, MIN_DISTRIBUTION_SOL, CLARP_MINT } from '@/lib/config/tokenomics';
import { getClaimStats, getClaimablePositions, createClaimTransaction, getSwapQuote } from '@/lib/bags/client';
import { getServiceClient } from '@/lib/supabase/server';

// Wallet addresses from environment
const CREATOR_WALLET = process.env.CLARP_CREATOR_WALLET;
const PROFIT_WALLET = process.env.CLARP_PROFIT_WALLET;
const OPS_WALLET = process.env.CLARP_OPS_WALLET;
const BURN_WALLET = process.env.CLARP_BURN_WALLET;

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface DistributionResult {
  success: boolean;
  distributionId?: string;
  totalClaimed?: number;
  profitAmount?: number;
  opsAmount?: number;
  burnAmount?: number;
  error?: string;
}

/**
 * Check if there are enough fees to distribute
 */
export async function checkClaimableAmount(): Promise<number> {
  if (!CREATOR_WALLET) {
    console.error('[Distribution] CLARP_CREATOR_WALLET not configured');
    return 0;
  }

  const stats = await getClaimStats(CREATOR_WALLET);
  return stats?.totalUnclaimed ?? 0;
}

/**
 * Execute daily distribution
 */
export async function executeDistribution(): Promise<DistributionResult> {
  const supabase = getServiceClient();

  if (!supabase) {
    return {
      success: false,
      error: 'Database not configured',
    };
  }

  // Validate configuration
  if (!CREATOR_WALLET || !PROFIT_WALLET || !OPS_WALLET || !BURN_WALLET) {
    return {
      success: false,
      error: 'Missing wallet configuration. Check environment variables.',
    };
  }

  try {
    // 1. Check claimable amount
    const claimableAmount = await checkClaimableAmount();

    if (claimableAmount < MIN_DISTRIBUTION_SOL) {
      return {
        success: false,
        error: `Insufficient claimable amount: ${claimableAmount} SOL (min: ${MIN_DISTRIBUTION_SOL} SOL)`,
      };
    }

    // 2. Create distribution record
    const profitAmount = claimableAmount * REVENUE_SPLIT.profit;
    const opsAmount = claimableAmount * REVENUE_SPLIT.operations;
    const burnAmount = claimableAmount * REVENUE_SPLIT.burn;

    const { data: distribution, error: insertError } = await supabase
      .from('revenue_distributions')
      .insert({
        total_claimed: claimableAmount,
        currency: 'SOL',
        profit_amount: profitAmount,
        ops_amount: opsAmount,
        burn_amount: burnAmount,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !distribution) {
      return {
        success: false,
        error: `Failed to create distribution record: ${insertError?.message}`,
      };
    }

    // 3. Execute claim transaction (would need keypair for actual transaction)
    // For now, we'll log the intent and mark as pending
    console.log('[Distribution] Would claim:', {
      wallet: CREATOR_WALLET,
      amount: claimableAmount,
      profit: profitAmount,
      ops: opsAmount,
      burn: burnAmount,
    });

    // 4. Get burn quote
    const burnQuote = await getSwapQuote(
      SOL_MINT,
      CLARP_MINT.toBase58(),
      (burnAmount * LAMPORTS_PER_SOL).toString()
    );

    if (burnQuote) {
      console.log('[Distribution] Burn quote:', {
        solIn: burnAmount,
        clarpOut: parseInt(burnQuote.outputAmount) / 1e9,
        priceImpact: burnQuote.priceImpact,
      });
    }

    // 5. Update distribution status
    await supabase
      .from('revenue_distributions')
      .update({
        status: 'pending', // Pending actual transaction execution
        processed_at: new Date().toISOString(),
      })
      .eq('id', distribution.id);

    return {
      success: true,
      distributionId: distribution.id,
      totalClaimed: claimableAmount,
      profitAmount,
      opsAmount,
      burnAmount,
    };
  } catch (error) {
    console.error('[Distribution] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Record a manual burn transaction
 */
export async function recordBurnTransaction(
  signature: string,
  clarpAmount: number,
  solSpent: number,
  distributionId?: string
): Promise<boolean> {
  const supabase = getServiceClient();
  if (!supabase) return false;

  const { error } = await supabase.from('burn_transactions').insert({
    signature,
    clarp_amount: clarpAmount,
    sol_spent: solSpent,
    price_per_clarp: solSpent / clarpAmount,
    distribution_id: distributionId,
    confirmed: false,
  });

  if (error) {
    console.error('[Distribution] Failed to record burn:', error);
    return false;
  }

  return true;
}

/**
 * Confirm a burn transaction (after on-chain verification)
 */
export async function confirmBurnTransaction(
  signature: string,
  blockTime: number
): Promise<boolean> {
  const supabase = getServiceClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('burn_transactions')
    .update({
      confirmed: true,
      block_time: blockTime,
    })
    .eq('signature', signature);

  if (error) {
    console.error('[Distribution] Failed to confirm burn:', error);
    return false;
  }

  return true;
}

/**
 * Get distribution history
 */
export async function getDistributionHistory(limit = 10) {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('revenue_distributions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Distribution] Failed to fetch history:', error);
    return [];
  }

  return data;
}

/**
 * Get burn history
 */
export async function getBurnHistory(limit = 20) {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('burn_transactions')
    .select('*')
    .eq('confirmed', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Distribution] Failed to fetch burns:', error);
    return [];
  }

  return data;
}

/**
 * Get aggregated tokenomics stats
 */
export async function getTokenomicsStats() {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tokenomics_stats')
    .select('*')
    .single();

  if (error) {
    console.error('[Distribution] Failed to fetch stats:', error);
    return null;
  }

  return data;
}
