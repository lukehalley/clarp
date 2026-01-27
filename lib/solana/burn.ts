// Token Burn Service
// Burn CLARP tokens to reduce supply

import { Connection, Keypair, Transaction } from '@solana/web3.js';
import { createBurnInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { CLARP_MINT } from '@/lib/config/tokenomics';

export interface BurnResult {
  signature: string;
  amount: number;
}

/**
 * Burn CLARP tokens from a wallet
 */
export async function burnClarp(
  connection: Connection,
  payer: Keypair,
  amount: number
): Promise<BurnResult> {
  // Get associated token account
  const ata = await getAssociatedTokenAddress(CLARP_MINT, payer.publicKey);

  // Create burn instruction
  const burnIx = createBurnInstruction(
    ata,                    // Token account to burn from
    CLARP_MINT,            // Mint
    payer.publicKey,       // Owner
    BigInt(amount)         // Amount to burn
  );

  // Build and send transaction
  const tx = new Transaction().add(burnIx);

  const signature = await connection.sendTransaction(tx, [payer]);
  await connection.confirmTransaction(signature, 'confirmed');

  return { signature, amount };
}

/**
 * Get total burned CLARP (requires tracking on our end or mint authority check)
 * For now, returns 0 as we track burns in our database
 */
export async function getTotalBurned(): Promise<number> {
  // Could query our burn_history table here
  return 0;
}
