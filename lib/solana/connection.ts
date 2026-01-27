// Solana RPC Connection
// Singleton connection for server-side operations

import { Connection, clusterApiUrl } from '@solana/web3.js';

let connectionInstance: Connection | null = null;

/**
 * Get a singleton Solana connection for server-side operations
 * Uses dedicated RPC if configured, falls back to public endpoint
 */
export function getConnection(): Connection {
  if (!connectionInstance) {
    const rpcUrl =
      process.env.SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      clusterApiUrl('mainnet-beta');

    connectionInstance = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return connectionInstance;
}

/**
 * Get a fresh connection (useful for testing or when you need different config)
 */
export function createConnection(rpcUrl?: string): Connection {
  const url =
    rpcUrl ||
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    clusterApiUrl('mainnet-beta');

  return new Connection(url, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
}
