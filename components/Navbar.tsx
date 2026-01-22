'use client';

import { useState } from 'react';
import Link from 'next/link';
import Clarp from '@/components/Clarp';
import PixelGithub from '@/components/PixelGithub';

const NAV_HOVER_TEXT: Record<string, string> = {
  'products': 'vaporware',
  'docs': 'lies',
  'hall of shame': 'victims',
};

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

export default function Navbar({ onConnectWallet, showWalletButton = true }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navHoverText, setNavHoverText] = useState<Record<string, string>>({});
  const [walletMessage, setWalletMessage] = useState('');
  const [showWalletMessage, setShowWalletMessage] = useState(false);

  const handleNavHover = (key: string) => {
    setNavHoverText(prev => ({ ...prev, [key]: NAV_HOVER_TEXT[key] || key }));
  };

  const handleNavLeave = (key: string) => {
    setNavHoverText(prev => ({ ...prev, [key]: '' }));
  };

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
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/#products"
              className="text-sm text-slate-light hover:text-danger-orange transition-colors"
              onMouseEnter={() => handleNavHover('products')}
              onMouseLeave={() => handleNavLeave('products')}
            >
              {navHoverText['products'] || 'products'}
            </Link>
            <Link
              href="/#docs"
              className="text-sm text-slate-light hover:text-danger-orange transition-colors"
              onMouseEnter={() => handleNavHover('docs')}
              onMouseLeave={() => handleNavLeave('docs')}
            >
              {navHoverText['docs'] || 'docs'}
            </Link>
            <Link
              href="/#victims"
              className="text-sm text-slate-light hover:text-danger-orange transition-colors"
              onMouseEnter={() => handleNavHover('hall of shame')}
              onMouseLeave={() => handleNavLeave('hall of shame')}
            >
              {navHoverText['hall of shame'] || 'hall of shame'}
            </Link>
            <Link
              href="/vapourware-detector"
              className="text-sm text-danger-orange hover:text-larp-red transition-colors"
            >
              snitch mode
            </Link>
            <Link
              href="/roadmap"
              className="text-sm text-slate-light hover:text-danger-orange transition-colors"
            >
              roadmap
            </Link>
            <a
              href="https://github.com/lukehalley/Clarp"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-2 group"
              title="view source (it's real)"
            >
              <PixelGithub size={16} className="group-hover:animate-[glitch_0.1s_ease-in-out_2]" />
              <span className="hidden lg:inline">source</span>
            </a>
            {showWalletButton && (
              <button className="btn-secondary text-sm px-4 py-2" onClick={handleWalletClick}>
                connect wallet
              </button>
            )}
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
                href="/#products"
                className="block py-2 text-slate-light hover:text-danger-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                products
              </Link>
              <Link
                href="/#docs"
                className="block py-2 text-slate-light hover:text-danger-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                docs
              </Link>
              <Link
                href="/#victims"
                className="block py-2 text-slate-light hover:text-danger-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                hall of shame
              </Link>
              <Link
                href="/vapourware-detector"
                className="block py-2 text-danger-orange hover:text-larp-red transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                snitch mode
              </Link>
              <Link
                href="/roadmap"
                className="block py-2 text-slate-light hover:text-danger-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                roadmap
              </Link>
              <div className="flex gap-2 mt-2">
                <a
                  href="https://github.com/lukehalley/Clarp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm px-4 py-2 flex items-center justify-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PixelGithub size={16} />
                  source
                </a>
                {showWalletButton && (
                  <button
                    className="flex-1 btn-secondary text-sm px-4 py-2"
                    onClick={() => { handleWalletClick(); setMobileMenuOpen(false); }}
                  >
                    connect wallet
                  </button>
                )}
              </div>
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
