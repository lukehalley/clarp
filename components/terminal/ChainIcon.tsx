'use client';

import Image from 'next/image';

export type Chain = 'solana' | 'ethereum' | 'base' | 'arbitrum';

export const CHAIN_INFO: Record<Chain, { name: string; shortName: string; color: string }> = {
  solana: { name: 'Solana', shortName: 'SOL', color: '#9945FF' },
  ethereum: { name: 'Ethereum', shortName: 'ETH', color: '#627EEA' },
  base: { name: 'Base', shortName: 'BASE', color: '#0052FF' },
  arbitrum: { name: 'Arbitrum', shortName: 'ARB', color: '#28A0F0' },
};

const CHAIN_ICONS: Record<Chain, string> = {
  ethereum: '/icons/chains/eth.svg',
  solana: '/icons/chains/sol.svg',
  base: '/icons/chains/base.svg',
  arbitrum: '/icons/chains/arb.svg',
};

interface ChainIconProps {
  chain: Chain;
  size?: number;
  className?: string;
}

export default function ChainIcon({ chain, size = 16, className = '' }: ChainIconProps) {
  const iconPath = CHAIN_ICONS[chain];

  if (!iconPath) {
    return null;
  }

  return (
    <Image
      src={iconPath}
      alt={chain}
      width={size}
      height={size}
      className={className}
    />
  );
}
