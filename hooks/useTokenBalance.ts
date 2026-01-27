'use client';

// Token Balance Hook
// Fetches and tracks CLARP token balance for connected wallet

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { CLARP_MINT, CLARP_DECIMALS } from '@/lib/config/tokenomics';

export interface TokenBalanceState {
  balance: number | null;
  balanceRaw: bigint | null;
  balanceFormatted: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTokenBalance(): TokenBalanceState {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceRaw, setBalanceRaw] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setBalance(null);
      setBalanceRaw(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const ata = await getAssociatedTokenAddress(CLARP_MINT, publicKey);
      const account = await getAccount(connection, ata);

      const rawBalance = account.amount;
      const formattedBalance = Number(rawBalance) / Math.pow(10, CLARP_DECIMALS);

      setBalanceRaw(rawBalance);
      setBalance(formattedBalance);
    } catch (err) {
      // TokenAccountNotFoundError means user has no CLARP
      if (err instanceof Error && err.name === 'TokenAccountNotFoundError') {
        setBalance(0);
        setBalanceRaw(BigInt(0));
      } else {
        console.error('[useTokenBalance] Error:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
        // Still set to 0 on error so UI can render
        setBalance(0);
        setBalanceRaw(BigInt(0));
      }
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey, connected]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh every 30 seconds when connected
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [connected, fetchBalance]);

  return {
    balance,
    balanceRaw,
    balanceFormatted: balance !== null ? balance.toLocaleString() : '—',
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
