'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, LogOut, Copy, Check, ExternalLink } from 'lucide-react';

interface ConnectWalletProps {
  className?: string;
  compact?: boolean;
}

/**
 * Truncate wallet address for display
 * e.g., "7xKp...3nFq"
 */
function truncateAddress(address: string | null, startChars = 4, endChars = 4): string {
  if (!address) return '...';
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export default function ConnectWallet({ className = '', compact = false }: ConnectWalletProps) {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { wallet, isConnecting, isAuthenticated, signIn, signOut } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userDisconnected, setUserDisconnected] = useState(false);
  const [signInRejected, setSignInRejected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track mount state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Check if user previously disconnected
    const disconnected = localStorage.getItem('wallet-user-disconnected') === 'true';
    setUserDisconnected(disconnected);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Auto sign-in when wallet connects (but not if user manually disconnected or rejected sign-in)
  useEffect(() => {
    if (connected && publicKey && !isAuthenticated && !isConnecting && mounted && !userDisconnected && !signInRejected) {
      signIn().catch((err) => {
        console.error('[ConnectWallet] Auto sign-in failed:', err);
        setSignInRejected(true);
        setError(err instanceof Error ? err.message : 'Sign in failed');
        setTimeout(() => setError(null), 5000);
      });
    }
  }, [connected, publicKey, isAuthenticated, isConnecting, mounted, signIn, userDisconnected, signInRejected]);

  // Handle connect - opens wallet modal
  const handleConnect = () => {
    setError(null);
    // Clear flags when user manually initiates connection
    localStorage.removeItem('wallet-user-disconnected');
    setUserDisconnected(false);
    setSignInRejected(false);
    setVisible(true);
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    setDropdownOpen(false);
    // Remember that user manually disconnected to prevent auto-reconnect spam
    localStorage.setItem('wallet-user-disconnected', 'true');
    setUserDisconnected(true);
    try {
      await signOut();
      await disconnect();
    } catch (err) {
      console.error('[ConnectWallet] Disconnect error:', err);
    }
  };

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = wallet;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // View on Solscan
  const handleViewOnSolscan = () => {
    if (!wallet) return;
    window.open(`https://solscan.io/account/${wallet}`, '_blank');
    setDropdownOpen(false);
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className={`relative ${className}`}>
        <div
          className={`
            flex items-center justify-center gap-2
            bg-larp-green border-2 border-black
            font-mono font-bold text-black
            ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'}
          `}
          style={{ boxShadow: '3px 3px 0 black' }}
        >
          <Wallet size={compact ? 14 : 16} />
          <span className={compact ? 'hidden sm:inline' : ''}>CONNECT WALLET</span>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!connected) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`
            flex items-center justify-center gap-2
            bg-larp-green border-2 border-black
            font-mono font-bold text-black
            transition-all hover:translate-x-0.5 hover:translate-y-0.5
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0
            ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'}
          `}
          style={{ boxShadow: isConnecting ? 'none' : '3px 3px 0 black' }}
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span className={compact ? 'hidden sm:inline' : ''}>CONNECTING...</span>
            </>
          ) : (
            <>
              <Wallet size={compact ? 14 : 16} />
              <span className={compact ? 'hidden sm:inline' : ''}>CONNECT WALLET</span>
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-larp-red/20 border border-larp-red text-larp-red font-mono text-xs text-center z-50">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Connected state
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`
          flex items-center gap-2
          bg-larp-green/20 border border-larp-green/50
          text-larp-green font-mono
          transition-all hover:bg-larp-green/30 hover:border-larp-green
          ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'}
        `}
      >
        <div className="w-2 h-2 bg-larp-green rounded-full animate-pulse" />
        <span>{truncateAddress(wallet)}</span>
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-dark border border-ivory-light/20 z-50 shadow-lg">
          {/* Wallet address */}
          <div className="p-3 border-b border-ivory-light/10">
            <p className="font-mono text-[10px] text-ivory-light/40 mb-1">CONNECTED WALLET</p>
            <p className="font-mono text-xs text-ivory-light break-all">{wallet}</p>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={handleCopyAddress}
              className="w-full flex items-center gap-3 px-3 py-2 text-left font-mono text-xs text-ivory-light/70 hover:text-ivory-light hover:bg-ivory-light/5 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-larp-green" />
                  <span className="text-larp-green">COPIED!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>COPY ADDRESS</span>
                </>
              )}
            </button>

            <button
              onClick={handleViewOnSolscan}
              className="w-full flex items-center gap-3 px-3 py-2 text-left font-mono text-xs text-ivory-light/70 hover:text-ivory-light hover:bg-ivory-light/5 transition-colors"
            >
              <ExternalLink size={14} />
              <span>VIEW ON SOLSCAN</span>
            </button>

            <div className="border-t border-ivory-light/10 mt-1 pt-1">
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-3 px-3 py-2 text-left font-mono text-xs text-larp-red/70 hover:text-larp-red hover:bg-larp-red/5 transition-colors"
              >
                <LogOut size={14} />
                <span>DISCONNECT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
