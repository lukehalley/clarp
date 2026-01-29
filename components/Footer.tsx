'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import PixelGithub from '@/components/PixelGithub';

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

const LINK_MESSAGES = [
  'this feature is coming. check the roadmap.',
  'building. check the roadmap.',
  'CLARP spots LARP. soon you will too.',
  'scanning for rugs...',
  'token gate shipping soon.',
  'staking program in development.',
  'trust intelligence loading...',
  'rebrand detection: coming soon',
];

export default function Footer() {
  const [clickedLink, setClickedLink] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const handleLinkClick = (e: React.MouseEvent, linkName: string) => {
    e.preventDefault();
    const msg = LINK_MESSAGES[Math.floor(Math.random() * LINK_MESSAGES.length)];
    setMessage(msg);
    setClickedLink(linkName);
    setTimeout(() => setClickedLink(null), 2000);
  };

  return (
    <footer className="bg-slate-dark text-ivory-light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12 items-start">
          {/* Brand */}
          <div className="sm:col-span-2">
            <div className="font-mono text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              <span className="text-danger-orange">$</span>clarp
            </div>
            <p className="text-sm sm:text-base text-ivory-light/60 mb-4 sm:mb-6 max-w-sm">
              trust intelligence for crypto. scan projects. scan people.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a
                href="https://t.me/CLARPTG"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-medium flex items-center justify-center text-ivory-light/60 hover:text-danger-orange hover:bg-slate-light/20 transition-colors border border-slate-light/20"
                title="telegram"
              >
                <Send size={16} />
              </a>
              <a
                href="https://x.com/i/communities/2013904367188132011"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-medium flex items-center justify-center text-ivory-light/60 hover:text-danger-orange hover:bg-slate-light/20 transition-colors border border-slate-light/20"
                title="x community"
              >
                <XIcon size={15} />
              </a>
              <a
                href="https://github.com/lukehalley/Clarp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-medium flex items-center justify-center text-ivory-light/60 hover:text-danger-orange hover:bg-slate-light/20 transition-colors border border-slate-light/20"
                title="github"
              >
                <PixelGithub size={16} className="text-current" />
              </a>
              <a
                href="https://dexscreener.com/solana/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-medium flex items-center justify-center text-ivory-light/60 hover:text-danger-orange hover:bg-slate-light/20 transition-colors border border-slate-light/20"
                title="dexscreener"
              >
                <img src="/dexscreener-icon.svg" alt="dexscreener" className="w-4 h-4 invert opacity-60" />
              </a>
            </div>
          </div>

          {/* Links - two columns that should align */}
          <div className="h-full">
            <h4 className="font-mono text-xs sm:text-sm text-danger-orange mb-3 sm:mb-4 h-5">coming soon</h4>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { name: 'token-gated access', note: 'building' },
                { name: 'daily CLARP burn', note: 'building' },
                { name: 'staking program', note: 'planned' },
                { name: 'rebrand detector', note: 'planned' },
              ].map(item => (
                <li key={item.name} className="min-h-[24px] flex items-center">
                  <button
                    onClick={(e) => handleLinkClick(e, item.name)}
                    className={`text-sm text-left transition-colors flex items-center gap-2 ${
                      clickedLink === item.name ? 'text-danger-orange' : 'text-ivory-light/60 hover:text-ivory-light'
                    }`}
                  >
                    {clickedLink === item.name ? '▸ ' : ''}{item.name}
                    <span className="text-[10px] text-danger-orange shrink-0">({item.note})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="h-full">
            <h4 className="font-mono text-xs sm:text-sm text-danger-orange mb-3 sm:mb-4 h-5">links</h4>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { label: 'terminal', note: 'live', href: '/terminal' },
                { label: 'github', note: 'open source', href: 'https://github.com/lukehalley/Clarp' },
                { label: 'dexscreener', note: '$CLARP', href: 'https://dexscreener.com/solana/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS' },
                { label: 'bags.fm', note: 'trade', href: 'https://bags.fm/token/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS' },
              ].map(item => (
                <li key={item.label} className="min-h-[24px] flex items-center">
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-sm text-left transition-colors flex items-center gap-2 text-ivory-light/60 hover:text-danger-orange"
                  >
                    {item.label}
                    <span className="text-[10px] text-larp-green shrink-0">({item.note})</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Message toast - fixed height container to prevent layout shift */}
        <div className="h-[52px] mb-6">
          <div
            className={`p-3 bg-larp-red/10 border border-larp-red/30 text-sm font-mono text-ivory-light/80 transition-all duration-300 ${
              clickedLink ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 invisible'
            }`}
          >
            <span className="text-larp-red">error:</span> {message}
          </div>
        </div>

        {/* Terminal CTA */}
        <div className="py-6 sm:py-8 border-t border-slate-light/20 text-center">
          <p className="text-sm sm:text-base text-ivory-light/60 mb-4 font-mono">
            scan projects. scan people. trust with receipts.
          </p>
          <a
            href="/terminal"
            className="inline-block px-6 py-3 bg-danger-orange text-black font-mono font-bold text-sm border-2 border-danger-orange hover:bg-transparent hover:text-danger-orange transition-colors"
          >
            launch terminal
          </a>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-slate-light/10">
          <p className="text-[10px] sm:text-xs text-ivory-light/40 text-center">
            © 2025 clarp. all rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
