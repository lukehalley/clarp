'use client';

/**
 * WalletGate - Token-gated access component
 *
 * Requires wallet connection + minimum CLARP balance to access children.
 * Shows blurred preview with gate overlay for unauthenticated users.
 */

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Lock, Wallet, Zap, ArrowRight, ExternalLink, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { TIER_THRESHOLDS, BAGS_FM_URL } from '@/lib/config/tokenomics';
import BagsSwap from '@/components/swap/BagsSwap';

interface WalletGateProps {
  children: React.ReactNode;
  requiredBalance?: number;
  showPreview?: boolean;
}

const FREE_SCAN_KEY = 'clarp_free_scan_used';
const FREE_SCAN_PENDING_KEY = 'clarp_free_scan_pending';

export default function WalletGate({
  children,
  requiredBalance = TIER_THRESHOLDS.holder,
  showPreview = true,
}: WalletGateProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { balance, isLoading: balanceLoading } = useTokenBalance();
  const [freeScanUsed, setFreeScanUsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showSwap, setShowSwap] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if free scan was already used
    const used = localStorage.getItem(FREE_SCAN_KEY);
    setFreeScanUsed(used === 'true');
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  const actualBalance = balance ?? 0;

  // Check for pending free scan (allow user through for their free scan)
  const pendingFreeScan = typeof window !== 'undefined'
    ? localStorage.getItem(FREE_SCAN_PENDING_KEY)
    : null;
  const isPendingFreeScan = pendingFreeScan && (Date.now() - parseInt(pendingFreeScan, 10)) < 5 * 60 * 1000; // 5 min window

  // If connected and has sufficient balance, show children
  if (connected && !balanceLoading && actualBalance >= requiredBalance) {
    return <>{children}</>;
  }

  // If pending free scan, allow through
  if (isPendingFreeScan) {
    return <>{children}</>;
  }

  // Gate states
  const isConnected = connected;
  const hasInsufficientBalance = connected && !balanceLoading && actualBalance < requiredBalance;
  const canTryFreeScan = !connected && !freeScanUsed;

  return (
    <div className="relative min-h-[80vh]">
      {/* Blurred Preview */}
      {showPreview && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="blur-md opacity-20 pointer-events-none select-none">
            {children}
          </div>
        </div>
      )}

      {/* Gate Overlay */}
      <div className="absolute inset-0 bg-slate-dark/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Main Gate Card */}
          <div className="bg-slate-medium border-2 border-ivory-light/20 overflow-hidden">
            {/* Header */}
            <div className="p-6 text-center border-b-2 border-ivory-light/10">
              <div className="w-16 h-16 bg-danger-orange/10 border-2 border-danger-orange/50 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-danger-orange" />
              </div>
              <h2 className="text-2xl font-mono font-bold text-ivory-light mb-2">
                CLARP TERMINAL
              </h2>
              <p className="text-sm font-mono text-ivory-light/60">
                {hasInsufficientBalance
                  ? `You need ${requiredBalance.toLocaleString()} CLARP to access`
                  : 'Connect wallet to detect rugpulls before they happen'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Connected but insufficient balance */}
              {hasInsufficientBalance && (
                <>
                  <div className="bg-slate-dark border border-ivory-light/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs text-ivory-light/60">YOUR BALANCE</span>
                      <span className="font-mono text-sm text-ivory-light">
                        {actualBalance.toLocaleString()} CLARP
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-ivory-light/60">REQUIRED</span>
                      <span className="font-mono text-sm text-danger-orange">
                        {requiredBalance.toLocaleString()} CLARP
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-ivory-light/10">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-ivory-light/60">NEED TO BUY</span>
                        <span className="font-mono text-sm text-larp-yellow">
                          {(requiredBalance - actualBalance).toLocaleString()} CLARP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Swap Widget */}
                  <button
                    onClick={() => setShowSwap(!showSwap)}
                    className="w-full bg-danger-orange hover:bg-danger-orange/90 text-black font-mono font-bold
                               py-3 transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    {showSwap ? 'HIDE SWAP' : 'BUY CLARP NOW'}
                    {showSwap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showSwap && (
                    <div className="mt-2">
                      <BagsSwap
                        compact
                        onSuccess={() => {
                          // Balance will refresh automatically
                          setShowSwap(false);
                        }}
                      />
                    </div>
                  )}

                  {!showSwap && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-ivory-light/10" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-slate-medium px-4 font-mono text-xs text-ivory-light/40">
                            OR
                          </span>
                        </div>
                      </div>

                      <a
                        href={BAGS_FM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-slate-dark hover:bg-ivory-light/5 border-2 border-ivory-light/20
                                   hover:border-ivory-light/40 text-ivory-light font-mono
                                   py-3 transition-colors flex items-center justify-center gap-2"
                      >
                        <Wallet className="w-5 h-5" />
                        BUY ON BAGS.FM
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  )}

                  <p className="text-center font-mono text-xs text-ivory-light/40">
                    CLARP trades on Bags.fm with 1% creator fees
                  </p>
                </>
              )}

              {/* Not connected */}
              {!isConnected && (
                <>
                  <button
                    onClick={() => setVisible(true)}
                    className="w-full bg-danger-orange hover:bg-danger-orange/90 text-black font-mono font-bold
                               py-3 transition-colors flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    CONNECT WALLET
                  </button>

                  {/* Show free scan option if not used */}
                  {canTryFreeScan && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-ivory-light/10" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-slate-medium px-4 font-mono text-xs text-ivory-light/40">
                            OR
                          </span>
                        </div>
                      </div>

                      <FreeScanButton />
                    </>
                  )}

                  {/* Show "already used" message */}
                  {freeScanUsed && (
                    <div className="bg-larp-yellow/10 border border-larp-yellow/30 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-larp-yellow flex-shrink-0 mt-0.5" />
                        <p className="font-mono text-xs text-larp-yellow">
                          Free scan already used. Connect wallet with {requiredBalance.toLocaleString()}+ CLARP for full access.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Balance loading */}
              {connected && balanceLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin w-8 h-8 border-2 border-danger-orange border-t-transparent mx-auto" />
                  <p className="font-mono text-xs text-ivory-light/40 mt-2">Checking balance...</p>
                </div>
              )}
            </div>

            {/* Footer - Tier Info */}
            <div className="p-4 bg-slate-dark/50 border-t-2 border-ivory-light/10">
              <h4 className="font-mono text-[10px] font-bold text-ivory-light/40 mb-2 tracking-wider">
                HOLDER BENEFITS (1K+ CLARP)
              </h4>
              <ul className="font-mono text-[11px] text-ivory-light/50 space-y-1">
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-danger-orange" /> 10 scans per day
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-danger-orange" /> Fresh scans (bypass cache)
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-danger-orange" /> Export reports
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-danger-orange" /> 30-day scan history
                </li>
              </ul>
            </div>
          </div>

          {/* Trust indicator */}
          <p className="text-center font-mono text-[10px] text-ivory-light/30 mt-4">
            CLARP never has access to your funds. We only read your token balance.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Free scan button component
 * Redirects to /terminal/scan for full OSINT analysis
 */
// Solana address validation (base58, 32-44 chars)
const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function isValidSolanaAddress(address: string): boolean {
  return SOLANA_ADDRESS_REGEX.test(address.trim());
}

function FreeScanButton() {
  const router = useRouter();
  const [showInput, setShowInput] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');

  const trimmedAddress = tokenAddress.trim();
  const isValidAddress = trimmedAddress.length > 0 && isValidSolanaAddress(trimmedAddress);
  const showValidationError = trimmedAddress.length > 0 && !isValidAddress;

  function handleFreeScan() {
    if (!isValidAddress) return;

    // Set pending free scan flag (expires in 5 minutes)
    localStorage.setItem(FREE_SCAN_PENDING_KEY, Date.now().toString());
    // Mark as used
    localStorage.setItem(FREE_SCAN_KEY, 'true');
    // Redirect to scan page
    router.push(`/terminal/scan?address=${encodeURIComponent(trimmedAddress)}`);
  }

  if (showInput) {
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="Paste Solana token address..."
          className={`w-full bg-slate-dark border-2 px-4 py-3
                     font-mono text-sm text-ivory-light placeholder-ivory-light/30
                     outline-none transition-colors ${
                       showValidationError
                         ? 'border-larp-red/50 focus:border-larp-red'
                         : 'border-ivory-light/20 focus:border-danger-orange/50'
                     }`}
        />
        {showValidationError && (
          <p className="font-mono text-xs text-larp-red">
            Invalid Solana address format (32-44 base58 characters)
          </p>
        )}
        <button
          onClick={handleFreeScan}
          disabled={!isValidAddress}
          className="w-full bg-slate-dark hover:bg-ivory-light/5 disabled:opacity-50
                     disabled:cursor-not-allowed border-2 border-ivory-light/20
                     hover:border-ivory-light/40 text-ivory-light font-mono font-bold
                     py-3 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 text-larp-yellow" />
          RUN FREE SCAN
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="w-full bg-slate-dark hover:bg-ivory-light/5
                 border-2 border-ivory-light/20 hover:border-larp-yellow/50
                 text-ivory-light font-mono py-3 transition-all
                 flex items-center justify-center gap-2"
    >
      <Zap className="w-4 h-4 text-larp-yellow" />
      TRY 1 FREE SCAN
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
