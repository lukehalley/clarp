'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center font-mono transition-all duration-200 rounded-lg';

  const variants = {
    primary: 'bg-slate-dark text-ivory-light hover:bg-slate-medium border border-slate-dark hover:border-clay',
    secondary: 'bg-transparent text-slate-dark border border-cloud-light hover:border-clay hover:text-clay',
    outline: 'bg-transparent text-ivory-light border border-ivory-light/30 hover:border-clay hover:text-clay',
    ghost: 'bg-transparent text-slate-light hover:text-clay hover:bg-ivory-medium',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  const disabledStyles = disabled
    ? 'opacity-60 cursor-not-allowed hover:bg-slate-dark hover:border-slate-dark hover:text-ivory-light'
    : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
      {disabled && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-slate-light whitespace-nowrap">
          (Coming Soon)
        </span>
      )}
    </button>
  );
}
