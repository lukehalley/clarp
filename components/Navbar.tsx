'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, MapPin } from 'lucide-react';
import Clarp from '@/components/Clarp';
import PixelGithub from '@/components/PixelGithub';

const WALLET_MESSAGES = [
  'your wallet is already empty. we checked.',
  'connecting... jk, we don\'t have a blockchain',
  'wallet connected! balance: -$47,000 (unrealized)',
  'metamask says no. even it knows better.',
  'transaction pending... forever.',
];

interface NavbarProps {
  onConnectWallet?: () => void;
  showWalletButton?: boolean;
}

// Custom X (Twitter) icon component
function XIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Navbar({ onConnectWallet, showWalletButton = true }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletMessage, setWalletMessage] = useState('');
  const [showWalletMessage, setShowWalletMessage] = useState(false);

  const handleWalletClick = () => {
    if (onConnectWallet) {
      onConnectWallet();
    } else {
      const msg = WALLET_MESSAGES[Math.floor(Math.random() * WALLET_MESSAGES.length)];
      setWalletMessage(msg);
      setShowWalletMessage(true);
      setTimeout(() => setShowWalletMessage(false), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="construction-stripe h-3" />
      <nav className="bg-ivory-light/95 backdrop-blur-sm border-b-2 border-slate-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
            <Clarp size={28} className="sm:w-8 sm:h-8" />
            <span className="font-mono text-lg sm:text-xl font-bold text-slate-dark">$clarp</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/clarp-agent"
              className="text-sm text-danger-orange hover:text-larp-red transition-colors font-mono font-bold preserve-case"
            >
              C[LARP] AGENT
            </Link>
            <Link
              href="/roadmap"
              className="text-sm text-slate-light hover:text-danger-orange transition-colors flex items-center gap-1.5 group"
            >
              <MapPin size={14} className="group-hover:animate-bounce" />
              roadmap
            </Link>
            <div className="flex items-center gap-2 ml-2">
              <a
                href="https://t.me/CLARPTG"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border-2 border-slate-dark bg-white hover:bg-slate-dark hover:text-white text-slate-dark transition-all"
                style={{ boxShadow: '2px 2px 0 #0a0a09' }}
                title="join telegram"
              >
                <Send size={16} />
              </a>
              <a
                href="https://x.com/i/communities/2013904367188132011"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border-2 border-slate-dark bg-white hover:bg-slate-dark hover:text-white text-slate-dark transition-all group"
                style={{ boxShadow: '2px 2px 0 #0a0a09' }}
                title="join x community"
              >
                <XIcon size={15} className="group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://github.com/lukehalley/Clarp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border-2 border-slate-dark bg-white hover:bg-slate-dark hover:text-white text-slate-dark transition-all group"
                style={{ boxShadow: '2px 2px 0 #0a0a09' }}
                title="view source (it's real)"
              >
                <PixelGithub size={16} className="group-hover:animate-[glitch_0.1s_ease-in-out_2]" />
              </a>
            </div>
            <button
              className={`btn-secondary text-sm px-4 py-2 ml-2 ${!showWalletButton ? 'invisible' : ''}`}
              onClick={handleWalletClick}
            >
              connect wallet
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-dark"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 bg-slate-dark transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-slate-dark transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-slate-dark transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-dark/20 bg-ivory-light">
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/clarp-agent"
                className="block py-2 text-danger-orange hover:text-larp-red transition-colors font-mono font-bold preserve-case"
                onClick={() => setMobileMenuOpen(false)}
              >
                C[LARP] AGENT
              </Link>
              <Link
                href="/roadmap"
                className="flex items-center gap-2 py-2 text-slate-light hover:text-danger-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MapPin size={16} />
                roadmap
              </Link>
              <div className="flex gap-3 pt-3 border-t border-slate-dark/10">
                <a
                  href="https://t.me/CLARPTG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-dark bg-white text-slate-dark font-mono text-sm"
                  style={{ boxShadow: '2px 2px 0 #0a0a09' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Send size={16} />
                  telegram
                </a>
                <a
                  href="https://x.com/i/communities/2013904367188132011"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-dark bg-white text-slate-dark font-mono text-sm"
                  style={{ boxShadow: '2px 2px 0 #0a0a09' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <XIcon size={15} />
                  x
                </a>
                <a
                  href="https://github.com/lukehalley/Clarp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-dark bg-white text-slate-dark font-mono text-sm"
                  style={{ boxShadow: '2px 2px 0 #0a0a09' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PixelGithub size={16} />
                  source
                </a>
              </div>
              <button
                className={`w-full btn-secondary text-sm px-4 py-3 mt-2 ${!showWalletButton ? 'invisible' : ''}`}
                onClick={() => { handleWalletClick(); setMobileMenuOpen(false); }}
              >
                connect wallet
              </button>
            </div>
          </div>
        )}

        {/* Wallet message toast */}
        {showWalletMessage && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-4 py-2 bg-slate-dark text-ivory-light text-sm font-mono border-2 border-danger-orange animate-fade-in z-50">
            {walletMessage}
          </div>
        )}
      </nav>
    </header>
  );
}
