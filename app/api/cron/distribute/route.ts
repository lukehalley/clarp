// Revenue Distribution Cron
// Runs daily to distribute creator fees: profit, ops, burn

import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { REVENUE_SPLIT, MIN_DISTRIBUTION_SOL } from '@/lib/config/tokenomics';
import { swapSolToClarp } from '@/lib/solana/jupiter';
import { burnClarp } from '@/lib/solana/burn';
import { getServiceClient } from '@/lib/supabase/server';

// Wallet addresses from environment
function getWallets() {
  const creator = process.env.CREATOR_WALLET_PUBKEY;
  const profit = process.env.PROFIT_WALLET_PUBKEY;
  const operations = process.env.OPS_WALLET_PUBKEY;

  if (!creator || !profit || !operations) {
    throw new Error('Missing wallet configuration. Set CREATOR_WALLET_PUBKEY, PROFIT_WALLET_PUBKEY, and OPS_WALLET_PUBKEY.');
  }

  return {
    creator: new PublicKey(creator),
    profit: new PublicKey(profit),
    operations: new PublicKey(operations),
  };
}

export async function GET(request: NextRequest) {
  // Check if flywheel is enabled
  if (process.env.ENABLE_FLYWHEEL !== 'true') {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Flywheel disabled (set ENABLE_FLYWHEEL=true to enable)',
    });
  }

  // Verify cron secret (Vercel cron or manual trigger)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for required environment variables
  if (!process.env.CREATOR_WALLET_PRIVATE_KEY) {
    return NextResponse.json({
      error: 'CREATOR_WALLET_PRIVATE_KEY not configured',
    }, { status: 500 });
  }

  const rpcUrl = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json({
      error: 'SOLANA_RPC_URL not configured',
    }, { status: 500 });
  }

  const connection = new Connection(rpcUrl, 'confirmed');

  try {
    const wallets = getWallets();

    // Check creator wallet balance
    const balance = await connection.getBalance(wallets.creator);
    const balanceSOL = balance / LAMPORTS_PER_SOL;

    console.log(`[Distribute] Creator balance: ${balanceSOL.toFixed(4)} SOL`);

    if (balanceSOL < MIN_DISTRIBUTION_SOL) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Balance ${balanceSOL.toFixed(4)} SOL below minimum ${MIN_DISTRIBUTION_SOL} SOL`,
        balance: balanceSOL,
      });
    }

    // Load creator keypair
    const creatorKeypair = Keypair.fromSecretKey(
      bs58.decode(process.env.CREATOR_WALLET_PRIVATE_KEY)
    );

    // Verify keypair matches expected creator wallet
    if (!creatorKeypair.publicKey.equals(wallets.creator)) {
      return NextResponse.json({
        error: 'Creator wallet private key does not match CREATOR_WALLET_PUBKEY',
      }, { status: 500 });
    }

    // Calculate distributions (leave 0.01 SOL for rent)
    const rentReserve = 0.01 * LAMPORTS_PER_SOL;
    const distributable = balance - rentReserve;

    if (distributable <= 0) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Balance too low after rent reserve',
        balance: balanceSOL,
      });
    }

    const amounts = {
      profit: Math.floor(distributable * REVENUE_SPLIT.profit),
      operations: Math.floor(distributable * REVENUE_SPLIT.operations),
      burn: Math.floor(distributable * REVENUE_SPLIT.burn),
    };

    // Build distribution transaction
    const tx = new Transaction();

    tx.add(SystemProgram.transfer({
      fromPubkey: wallets.creator,
      toPubkey: wallets.profit,
      lamports: amounts.profit,
    }));

    tx.add(SystemProgram.transfer({
      fromPubkey: wallets.creator,
      toPubkey: wallets.operations,
      lamports: amounts.operations,
    }));

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallets.creator;

    // Sign and send distribution
    tx.sign(creatorKeypair);
    const distSig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(distSig, 'confirmed');

    console.log(`[Distribute] Distribution tx: ${distSig}`);

    // Execute buy & burn
    let burnResult = { signature: '', amount: 0, clarpBurned: 0 };

    try {
      // Swap SOL to CLARP
      const swapResult = await swapSolToClarp(
        connection,
        creatorKeypair,
        amounts.burn
      );

      console.log(`[Distribute] Swapped ${amounts.burn} lamports for ${swapResult.outputAmount} CLARP`);

      // Burn the CLARP
      const burn = await burnClarp(
        connection,
        creatorKeypair,
        swapResult.outputAmount
      );

      burnResult = {
        signature: burn.signature,
        amount: amounts.burn,
        clarpBurned: swapResult.outputAmount,
      };

      console.log(`[Distribute] Burned ${swapResult.outputAmount} CLARP, tx: ${burn.signature}`);
    } catch (err) {
      console.error('[Distribute] Burn failed:', err);
      // Continue even if burn fails - distribution already happened
    }

    // Log to database
    try {
      const supabase = getServiceClient();
      if (!supabase) {
        console.warn('[Distribute] Supabase not configured, skipping database logging');
      } else {
        // Insert distribution record with new schema
        const { data: distribution, error: distError } = await supabase
          .from('revenue_distributions')
          .insert({
            total_claimed: balanceSOL,
            currency: 'SOL',
            profit_amount: amounts.profit / LAMPORTS_PER_SOL,
            ops_amount: amounts.operations / LAMPORTS_PER_SOL,
            burn_amount: amounts.burn / LAMPORTS_PER_SOL,
            claim_tx_signature: distSig,
            profit_tx_signature: distSig,
            ops_tx_signature: distSig,
            burn_tx_signature: burnResult.signature || null,
            status: burnResult.clarpBurned > 0 ? 'completed' : 'processing',
            processed_at: new Date().toISOString(),
          })
          .select()
          .single();

        // Log burn transaction separately for analytics
        if (burnResult.clarpBurned > 0 && !distError) {
          await supabase.from('burn_transactions').insert({
            signature: burnResult.signature,
            clarp_amount: burnResult.clarpBurned,
            sol_spent: amounts.burn / LAMPORTS_PER_SOL,
            price_per_clarp: (amounts.burn / LAMPORTS_PER_SOL) / burnResult.clarpBurned,
            distribution_id: distribution?.id,
            confirmed: true,
            block_time: Math.floor(Date.now() / 1000),
          });
        }
      }
    } catch (dbError) {
      console.error('[Distribute] Failed to log to database:', dbError);
      // Don't fail the response - distribution succeeded
    }

    return NextResponse.json({
      success: true,
      distributed: {
        totalSOL: balanceSOL,
        profit: amounts.profit / LAMPORTS_PER_SOL,
        operations: amounts.operations / LAMPORTS_PER_SOL,
        burn: amounts.burn / LAMPORTS_PER_SOL,
      },
      burn: burnResult.clarpBurned > 0 ? {
        clarpBurned: burnResult.clarpBurned,
        signature: burnResult.signature,
      } : null,
      transactions: {
        distribution: distSig,
        burn: burnResult.signature || null,
      },
    });

  } catch (error) {
    console.error('[Distribute] Failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
