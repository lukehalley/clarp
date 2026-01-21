'use client';

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'warning' | 'error' | 'success' | 'larp';
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-cloud-light/30 text-slate-light border-cloud-light',
    warning: 'bg-larp-yellow/20 text-amber-700 border-larp-yellow/30',
    error: 'bg-larp-red/20 text-larp-red border-larp-red/30',
    success: 'bg-larp-green/20 text-emerald-700 border-larp-green/30',
    larp: 'bg-larp-purple/20 text-larp-purple border-larp-purple/30',
  };

  return (
    <span className={`badge border ${variants[variant]} ${className}`}>
      {variant === 'warning' && <span className="animate-pulse">!</span>}
      {variant === 'larp' && <span>✦</span>}
      {variant === 'success' && <span>✓</span>}
      {variant === 'error' && <span>✗</span>}
      {children}
    </span>
  );
}
