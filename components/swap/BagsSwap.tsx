'use client';

/**
 * BagsSwap - Embedded swap widget for buying CLARP
 *
 * Uses Bags.fm Swap API to:
 * 1. Get quote (SOL → CLARP)
 * 2. Create swap transaction
 * 3. User signs and confirms
 *
 * Brutalist design matching CLARP Terminal aesthetic
 */

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { ArrowDown, Loader2, ExternalLink, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { getSwapQuote, createSwapTransaction } from '@/lib/bags/client';
import { CLARP_MINT, BAGS_FM_URL } from '@/lib/config/tokenomics';
import { useTokenBalance } from '@/hooks/useTokenBalance';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const LAMPORTS_PER_SOL = 1_000_000_000;

interface BagsSwapProps {
  onSuccess?: () => void;
  suggestedAmount?: number; // SOL amount to reach next tier
  compact?: boolean;
}

type SwapState = 'idle' | 'quoting' | 'quoted' | 'swapping' | 'success' | 'error';

export default function BagsSwap({ onSuccess, suggestedAmount, compact = false }: BagsSwapProps) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { refetch: refetchBalance } = useTokenBalance();

  const [amount, setAmount] = useState(suggestedAmount?.toString() || '0.1');
  const [state, setState] = useState<SwapState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const [quote, setQuote] = useState<{
    outputAmount: string;
    priceImpact: number;
  } | null>(null);

  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && parseFloat(amount) > 0) {
        fetchQuote();
      } else {
        setQuote(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [amount]);

  async function fetchQuote() {
    if (!amount || parseFloat(amount) <= 0) return;

    setState('quoting');
    setError(null);

    try {
      const quoteResult = await getSwapQuote(
        SOL_MINT,
        CLARP_MINT.toBase58(),
        Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL).toString()
      );

      if (quoteResult) {
        setQuote({
          outputAmount: (parseInt(quoteResult.outputAmount) / 1e9).toFixed(0),
          priceImpact: quoteResult.priceImpact,
        });
        setState('quoted');
      } else {
        setError('failed to get quote');
        setState('error');
      }
    } catch (err) {
      console.error('[BagsSwap] Quote error:', err);
      setError('quote failed');
      setState('error');
    }
  }

  async function executeSwap() {
    if (!publicKey || !signTransaction || !quote) return;

    setState('swapping');
    setError(null);

    try {
      // Get swap transaction from Bags API
      const swapTx = await createSwapTransaction(
        {
          inputMint: SOL_MINT,
          outputMint: CLARP_MINT.toBase58(),
          inputAmount: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL).toString(),
          outputAmount: quote.outputAmount,
          priceImpact: quote.priceImpact,
          slippage: 0.5,
        },
        publicKey.toBase58()
      );

      if (!swapTx) {
        throw new Error('failed to create swap transaction');
      }

      // Deserialize and sign
      const transaction = Transaction.from(Buffer.from(swapTx.transaction, 'base64'));
      const signed = await signTransaction(transaction);

      // Submit
      const signature = await connection.sendRawTransaction(signed.serialize());

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      setTxSignature(signature);
      setState('success');

      // Refresh balance
      setTimeout(() => {
        refetchBalance();
      }, 2000);

      onSuccess?.();
    } catch (err: unknown) {
      console.error('[BagsSwap] Swap error:', err);
      const errorMessage = err instanceof Error ? err.message : 'swap failed';
      setError(errorMessage);
      setState('error');
    }
  }

  // Success state
  if (state === 'success' && txSignature) {
    return (
      <div className={`bg-larp-green/10 border-2 border-larp-green/50 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-larp-green" />
          <span className="font-mono text-sm text-larp-green font-bold">swap successful!</span>
        </div>
        <p className="font-mono text-xs text-ivory-light/60 mb-3">
          you received {quote?.outputAmount} CLARP
        </p>
        <a
          href={`https://solscan.io/tx/${txSignature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono text-xs text-larp-green hover:underline"
        >
          view transaction <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className={`bg-slate-dark border-2 border-ivory-light/20 ${compact ? 'p-3' : 'p-4'} space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm text-ivory-light flex items-center gap-2">
          <Zap className="w-4 h-4 text-danger-orange" />
          buy $clarp
        </h3>
        <a
          href={BAGS_FM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-ivory-light/40 hover:text-danger-orange transition-colors flex items-center gap-1"
        >
          bags.fm <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Input */}
      <div className="space-y-1">
        <label className="font-mono text-[10px] text-ivory-light/40">you pay</label>
        <div className="flex items-center bg-slate-medium border-2 border-ivory-light/10 focus-within:border-danger-orange/50 transition-colors">
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setQuote(null);
              setState('idle');
            }}
            className="flex-1 bg-transparent px-3 py-2 font-mono text-lg text-ivory-light outline-none"
            placeholder="0.0"
            min="0"
            step="0.1"
          />
          <span className="px-3 font-mono text-sm text-ivory-light/60">SOL</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center">
        <div className="p-1 bg-slate-medium border border-ivory-light/10">
          <ArrowDown className="w-4 h-4 text-ivory-light/40" />
        </div>
      </div>

      {/* Output */}
      <div className="space-y-1">
        <label className="font-mono text-[10px] text-ivory-light/40">you receive</label>
        <div className="flex items-center bg-slate-medium border-2 border-ivory-light/10">
          <div className="flex-1 px-3 py-2 font-mono text-lg text-ivory-light">
            {state === 'quoting' ? (
              <span className="text-ivory-light/40">...</span>
            ) : quote ? (
              <span className="text-danger-orange">{parseInt(quote.outputAmount).toLocaleString()}</span>
            ) : (
              <span className="text-ivory-light/40">—</span>
            )}
          </div>
          <span className="px-3 font-mono text-sm text-danger-orange">CLARP</span>
        </div>
      </div>

      {/* Price Impact Warning */}
      {quote && quote.priceImpact > 1 && (
        <div className="flex items-center gap-2 p-2 bg-larp-yellow/10 border border-larp-yellow/30">
          <AlertTriangle className="w-4 h-4 text-larp-yellow flex-shrink-0" />
          <span className="font-mono text-[10px] text-larp-yellow">
            price impact: {quote.priceImpact.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-larp-red/10 border border-larp-red/30">
          <AlertTriangle className="w-4 h-4 text-larp-red flex-shrink-0" />
          <span className="font-mono text-[10px] text-larp-red">{error}</span>
        </div>
      )}

      {/* Action Button */}
      {connected ? (
        <button
          onClick={quote ? executeSwap : fetchQuote}
          disabled={state === 'quoting' || state === 'swapping' || !amount || parseFloat(amount) <= 0}
          className="w-full bg-danger-orange hover:bg-danger-orange/90
                     disabled:bg-slate-medium disabled:text-ivory-light/30 disabled:cursor-not-allowed
                     text-black font-mono font-bold py-3 transition-colors
                     flex items-center justify-center gap-2
                     shadow-[4px_4px_0_rgba(0,0,0,0.3)]
                     hover:shadow-[2px_2px_0_rgba(0,0,0,0.3)]
                     hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          {state === 'quoting' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              getting quote...
            </>
          )}
          {state === 'swapping' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              swapping...
            </>
          )}
          {(state === 'idle' || state === 'error') && 'get quote'}
          {state === 'quoted' && 'swap now'}
        </button>
      ) : (
        <div className="text-center py-2">
          <span className="font-mono text-xs text-ivory-light/40">
            connect wallet to swap
          </span>
        </div>
      )}

      {/* Footer */}
      <p className="text-center font-mono text-[10px] text-ivory-light/30">
        1% creator fee on all trades
      </p>
    </div>
  );
}
