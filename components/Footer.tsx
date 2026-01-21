'use client';

import { useState } from 'react';

const LINK_MESSAGES = [
  'this link goes nowhere. like your investments.',
  'did you expect documentation?',
  'the real treasure was the gas fees we paid along the way.',
  'page not found. neither is the product.',
  '404: honesty not found (just kidding, we\'re honest)',
  'you clicked a footer link. on a parody site.',
  'there\'s nothing here. you knew that.',
  'connecting to server... jk there is no server.',
  'loading... forever.',
  'error: expectations too high',
];

const SOCIAL_MESSAGES = [
  'imagine if we had social media.',
  'this would go to twitter. if we had one.',
  'the discord is just you. alone.',
  'telegram: 1 member (you, refreshing)',
];

export default function Footer() {
  const [clickedLink, setClickedLink] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [socialClicks, setSocialClicks] = useState(0);
  const [copyrightClicks, setCopyrightClicks] = useState(0);

  const handleLinkClick = (e: React.MouseEvent, linkName: string) => {
    e.preventDefault();
    const msg = LINK_MESSAGES[Math.floor(Math.random() * LINK_MESSAGES.length)];
    setMessage(msg);
    setClickedLink(linkName);
    setTimeout(() => setClickedLink(null), 2000);
  };

  const handleSocialClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSocialClicks(prev => prev + 1);
    const msg = SOCIAL_MESSAGES[Math.floor(Math.random() * SOCIAL_MESSAGES.length)];
    setMessage(msg);
    setClickedLink('social');
    setTimeout(() => setClickedLink(null), 2000);
  };

  const handleCopyrightClick = () => {
    setCopyrightClicks(prev => prev + 1);
  };

  const getCopyrightText = () => {
    if (copyrightClicks >= 10) return '© 2025 clarp. you clicked the copyright 10 times. seek help.';
    if (copyrightClicks >= 5) return '© 2025 clarp. stop clicking this.';
    if (copyrightClicks >= 3) return '© 2025 clarp. why are you clicking the copyright?';
    if (copyrightClicks >= 1) return '© 2025 clarp. yes, you clicked the copyright.';
    return '© 2025 clarp. no rights reserved. it\'s a shitpost.';
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
              self-aware vaporware. no product. just vibes.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={handleSocialClick}
                className={`w-10 h-10 bg-slate-medium flex items-center justify-center text-ivory-light/60 hover:text-danger-orange hover:bg-slate-light/20 transition-colors border border-slate-light/20 ${socialClicks >= 5 ? 'animate-pulse' : ''}`}
              >
                <span className="text-lg">{socialClicks >= 5 ? '.' : '𝕏'}</span>
              </button>
              <button
                onClick={handleSocialClick}
                className={`w-10 h-10 bg-slate-medium flex items-center justify-center text-ivory-light/60 hover:text-danger-orange hover:bg-slate-light/20 transition-colors border border-slate-light/20 ${socialClicks >= 5 ? 'animate-pulse' : ''}`}
              >
                <span className="text-lg">{socialClicks >= 5 ? '.' : '◆'}</span>
              </button>
              <button
                onClick={handleSocialClick}
                className={`w-10 h-10 bg-slate-medium flex items-center justify-center text-ivory-light/60 hover:text-danger-orange hover:bg-slate-light/20 transition-colors border border-slate-light/20 ${socialClicks >= 5 ? 'animate-pulse' : ''}`}
              >
                <span className="text-lg">{socialClicks >= 5 ? '.' : '⌘'}</span>
              </button>
            </div>
            {socialClicks >= 3 && (
              <p className="text-[10px] text-ivory-light/30 font-mono mt-2">
                clicked {socialClicks} social buttons. none of them work.
              </p>
            )}
          </div>

          {/* Links - two columns that should align */}
          <div className="h-full">
            <h4 className="font-mono text-xs sm:text-sm text-danger-orange mb-3 sm:mb-4 h-5">vaporware</h4>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { name: 'clarp terminal', note: 'never' },
                { name: 'larpscan', note: 'no' },
                { name: 'clarp x402', note: 'cope' },
                { name: 'larp academy', note: 'youtube exists' },
              ].map(item => (
                <li key={item.name} className="min-h-[24px] flex items-center">
                  <button
                    onClick={(e) => handleLinkClick(e, item.name)}
                    className={`text-sm text-left transition-colors flex items-center gap-2 ${
                      clickedLink === item.name ? 'text-larp-red' : 'text-ivory-light/60 hover:text-ivory-light'
                    }`}
                  >
                    {clickedLink === item.name ? '✗ ' : ''}{item.name}
                    <span className="text-[10px] text-larp-red shrink-0">({item.note})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="h-full">
            <h4 className="font-mono text-xs sm:text-sm text-danger-orange mb-3 sm:mb-4 h-5">honesty</h4>
            <ul className="space-y-2 sm:space-y-3">
              {[
                { label: 'docs', note: 'you\'re looking at it' },
                { label: 'whitepaper', note: 'blank' },
                { label: 'github', note: 'empty' },
                { label: 'audit', note: '"gpt said it\'s fine"' },
              ].map(item => (
                <li key={item.label} className="min-h-[24px] flex items-center">
                  <button
                    onClick={(e) => handleLinkClick(e, item.label)}
                    className={`text-sm text-left transition-colors flex items-center gap-2 ${
                      clickedLink === item.label ? 'text-larp-red' : 'text-ivory-light/60 hover:text-ivory-light'
                    }`}
                  >
                    {clickedLink === item.label ? '✗ ' : ''}{item.label}
                    <span className="text-[10px] text-slate-light shrink-0">({item.note})</span>
                  </button>
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

        {/* Bottom */}
        <div className="pt-6 sm:pt-8 border-t border-slate-light/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <p
              className="text-[10px] sm:text-xs text-ivory-light/40 text-center md:text-left cursor-pointer hover:text-ivory-light/60 transition-colors"
              onClick={handleCopyrightClick}
            >
              {getCopyrightText()}
            </p>
            <p className="text-[10px] sm:text-xs text-ivory-light/40 font-mono text-center md:text-right">
              <span className="text-larp-red">×</span> not financial advice. don't buy this. you'll lose it all anyway.
            </p>
          </div>
        </div>

        {/* Easter egg - hidden on mobile */}
        <div className="mt-8 sm:mt-12 text-center hidden sm:block">
          <pre className="inline-block text-[6px] sm:text-[8px] text-ivory-light/20 font-mono leading-tight hover:text-ivory-light/40 transition-colors cursor-help">
{`
    ╭───────────────────────────────────────╮
    │  you scrolled all the way down?       │
    │  just like checking "ai agent" repos  │
    │  and finding nothing but readmes.     │
    │                                       │
    │  anyway                               │
    │                                       │
    ╰───────────────────────────────────────╯
`}
          </pre>
        </div>
      </div>
    </footer>
  );
}
