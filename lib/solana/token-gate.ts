// Token Gate - Server-side tier checking
// Fetches CLARP balance and computes user tier

import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { getConnection } from './connection';
import { CLARP_MINT, CLARP_DECIMALS, TIER_THRESHOLDS, Tier } from '@/lib/config/tokenomics';

/**
 * Get CLARP token balance for a wallet
 * Returns balance in whole tokens (not raw amount)
 */
export async function getWalletBalance(wallet: string): Promise<number> {
  const connection = getConnection();
  const walletPubkey = new PublicKey(wallet);

  try {
    const ata = await getAssociatedTokenAddress(CLARP_MINT, walletPubkey);
    const account = await getAccount(connection, ata);
    return Number(account.amount) / Math.pow(10, CLARP_DECIMALS);
  } catch {
    // No token account = 0 balance
    return 0;
  }
}

/**
 * Compute tier from balance
 */
export function computeTier(balance: number): Tier {
  if (balance >= TIER_THRESHOLDS.whale) return 'whale';
  if (balance >= TIER_THRESHOLDS.power) return 'power';
  if (balance >= TIER_THRESHOLDS.holder) return 'holder';
  return 'free';
}

/**
 * Get user tier info from wallet address
 */
export async function getUserTier(wallet: string): Promise<{
  tier: Tier;
  balance: number;
  nextTier: Tier | null;
  tokensToNextTier: number | null;
}> {
  const balance = await getWalletBalance(wallet);
  const tier = computeTier(balance);

  const tiers: Tier[] = ['free', 'holder', 'power', 'whale'];
  const currentIndex = tiers.indexOf(tier);
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;

  const tokensToNextTier = nextTier
    ? TIER_THRESHOLDS[nextTier] - balance
    : null;

  return {
    tier,
    balance,
    nextTier,
    tokensToNextTier: tokensToNextTier ? Math.ceil(tokensToNextTier) : null,
  };
}

/**
 * Check if wallet meets minimum tier requirement
 */
export async function meetsMinimumTier(wallet: string, requiredTier: Tier): Promise<boolean> {
  const { tier } = await getUserTier(wallet);
  const tiers: Tier[] = ['free', 'holder', 'power', 'whale'];
  return tiers.indexOf(tier) >= tiers.indexOf(requiredTier);
}
