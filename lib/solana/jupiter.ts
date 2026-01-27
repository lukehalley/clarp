// Jupiter Swap Service
// Swap SOL to CLARP via Jupiter aggregator

import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { CLARP_MINT } from '@/lib/config/tokenomics';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
}

export interface SwapResult {
  signature: string;
  inputAmount: number;
  outputAmount: number;
}

/**
 * Get a swap quote from Jupiter
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 100
): Promise<SwapQuote> {
  const response = await fetch(
    `${JUPITER_API}/quote?` +
    `inputMint=${inputMint}&` +
    `outputMint=${outputMint}&` +
    `amount=${amount}&` +
    `slippageBps=${slippageBps}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jupiter quote failed: ${error}`);
  }

  return response.json();
}

/**
 * Execute a swap transaction
 */
export async function executeSwap(
  connection: Connection,
  payer: Keypair,
  quote: SwapQuote
): Promise<SwapResult> {
  // Get swap transaction
  const swapResponse = await fetch(`${JUPITER_API}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: payer.publicKey.toString(),
      wrapAndUnwrapSol: true,
    }),
  });

  if (!swapResponse.ok) {
    const error = await swapResponse.text();
    throw new Error(`Jupiter swap failed: ${error}`);
  }

  const { swapTransaction } = await swapResponse.json();

  // Deserialize and sign
  const txBuf = Buffer.from(swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([payer]);

  // Send and confirm
  const signature = await connection.sendTransaction(tx, {
    maxRetries: 3,
  });

  await connection.confirmTransaction(signature, 'confirmed');

  return {
    signature,
    inputAmount: parseInt(quote.inAmount),
    outputAmount: parseInt(quote.outAmount),
  };
}

/**
 * Swap SOL to CLARP
 */
export async function swapSolToClarp(
  connection: Connection,
  payer: Keypair,
  lamports: number
): Promise<SwapResult> {
  const quote = await getSwapQuote(
    SOL_MINT,
    CLARP_MINT.toString(),
    lamports
  );

  return executeSwap(connection, payer, quote);
}

/**
 * Get estimated CLARP output for given SOL amount
 */
export async function estimateClarpOutput(lamports: number): Promise<number> {
  try {
    const quote = await getSwapQuote(
      SOL_MINT,
      CLARP_MINT.toString(),
      lamports
    );
    return parseInt(quote.outAmount);
  } catch {
    return 0;
  }
}
