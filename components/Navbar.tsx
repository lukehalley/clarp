'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import Clarp from '@/components/Clarp';
import PixelGithub from '@/components/PixelGithub';
import { usePageTransition } from '@/components/ClientLayout';

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

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { navigateWithFade } = usePageTransition();

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    navigateWithFade(href);
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="construction-stripe h-3" />
      <nav className="bg-ivory-light/95 backdrop-blur-sm border-b-2 border-slate-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Clarp size={28} className="sm:w-8 sm:h-8" />
            <span className="font-mono text-lg sm:text-xl font-bold text-slate-dark">$clarp</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="/roadmap"
              onClick={(e) => handleNavClick(e, '/roadmap')}
              className="text-sm text-slate-dark hover:text-danger-orange transition-colors font-mono font-bold cursor-pointer"
            >
              roadmap
            </a>
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
              <a
                href="https://dexscreener.com/solana/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border-2 border-slate-dark bg-white hover:bg-slate-dark text-slate-dark transition-all group"
                style={{ boxShadow: '2px 2px 0 #0a0a09' }}
                title="dexscreener"
              >
                <img src="/dexscreener-icon.svg" alt="dexscreener" className="w-4 h-4 group-hover:invert" />
              </a>
            </div>
            <button
              onClick={(e) => handleNavClick(e, '/terminal')}
              className="group relative ml-2 px-5 py-2.5 bg-black text-ivory-light font-mono font-bold text-sm border-2 border-danger-orange transition-all duration-150 overflow-hidden cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0_#FF6B35] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              style={{ boxShadow: '3px 3px 0 #FF6B35' }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-danger-orange animate-pulse" />
                terminal
              </span>
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
              <a
                href="/roadmap"
                onClick={(e) => handleNavClick(e, '/roadmap')}
                className="block py-2 text-slate-dark hover:text-danger-orange transition-colors font-mono font-bold cursor-pointer"
              >
                roadmap
              </a>
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
                <a
                  href="https://dexscreener.com/solana/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-dark bg-white text-slate-dark font-mono text-sm"
                  style={{ boxShadow: '2px 2px 0 #0a0a09' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img src="/dexscreener-icon.svg" alt="" className="w-4 h-4" />
                  chart
                </a>
              </div>
              <a
                href="/terminal"
                onClick={(e) => handleNavClick(e, '/terminal')}
                className="block w-full text-center mt-2 px-5 py-3 bg-black text-ivory-light font-mono font-bold text-sm border-2 border-danger-orange transition-all duration-150 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#FF6B35]"
                style={{ boxShadow: '3px 3px 0 #FF6B35' }}
              >
                launch terminal
              </a>
            </div>
          </div>
        )}

      </nav>
    </header>
  );
}
