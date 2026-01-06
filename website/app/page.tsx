'use client';

import { useState, useEffect } from 'react';
import Terminal from '@/components/Terminal';
import ProductCard from '@/components/ProductCard';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Mascot from '@/components/Mascot';
import DocsSection from '@/components/DocsSection';
import Footer from '@/components/Footer';
import Clarp from '@/components/Clarp';
import ClarpAI from '@/components/ClarpAI';
import ActivityNotifications from '@/components/ActivityNotifications';

const ASCII_LOGO = `
 ██████╗██╗      █████╗ ██████╗ ██████╗
██╔════╝██║     ██╔══██╗██╔══██╗██╔══██╗
██║     ██║     ███████║██████╔╝██████╔╝
██║     ██║     ██╔══██║██╔══██╗██╔═══╝
╚██████╗███████╗██║  ██║██║  ██║██║
 ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝`;

const ASCII_LOGO_MOBILE = `$CLARP`;

const PRODUCTS = [
  {
    name: 'clarp terminal',
    tagline: 'development environment',
    description: 'write code here. or don\'t. the progress bar will stay at 99% either way.',
    features: ['syntax highlighting', 'auto-save (never)', 'dark mode'],
    progress: 99,
    status: 'coming-soon' as const,
  },
  {
    name: 'larpscan',
    tagline: 'analytics dashboard',
    description: 'view metrics about things that don\'t exist. very comprehensive.',
    features: ['charts', 'graphs', 'numbers'],
    progress: 73,
    status: 'development' as const,
  },
  {
    name: 'clarp x402',
    tagline: 'payment infrastructure',
    description: 'send money. receive money. theoretically. hasn\'t been tested.',
    features: ['transactions', 'receipts', 'disputes (pending)'],
    progress: 47,
    status: 'roadmap' as const,
  },
];

// Easter egg messages for various interactions
const LOADING_MESSAGES = [
  'locating blockchain...',
  'syncing vaporware...',
  'deploying nothing...',
  'auditing vibes...',
  'connecting to mainnet (fake)...',
  'initializing cope...',
  'fetching liquidity (there is none)...',
  'compiling promises...',
];

const FOOTER_MESSAGES = [
  'this link goes nowhere. like your investments.',
  'did you expect documentation?',
  'the real treasure was the gas fees we paid along the way.',
  'page not found. neither is the product.',
  '404: honesty not found (just kidding, we\'re honest)',
  'you clicked a footer link. on a parody site.',
];

const NAV_HOVER_TEXT: Record<string, string> = {
  products: 'vaporware',
  ai: 'chatgpt wrapper',
  docs: 'this page',
  'hall of shame': 'your portfolio',
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Easter egg states
  const [showWhitepaperModal, setShowWhitepaperModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [showFooterMessage, setShowFooterMessage] = useState(false);
  const [footerMessage, setFooterMessage] = useState('');
  const [glitchedStat, setGlitchedStat] = useState<number | null>(null);
  const [navHoverText, setNavHoverText] = useState<Record<string, string>>({});
  const [ctaClicks, setCtaClicks] = useState({ doIt: 0, pretend: 0 });
  const [asciiClicks, setAsciiClicks] = useState(0);
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [konamiActivated, setKonamiActivated] = useState(false);
  const [rageClicks, setRageClicks] = useState(0);
  const [showRageMessage, setShowRageMessage] = useState(false);
  const [cursorTrail, setCursorTrail] = useState<{x: number, y: number, id: number}[]>([]);

  useEffect(() => {
    setMounted(true);

    // Konami code easter egg: ↑↑↓↓←→←→BA
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++;
        setKonamiProgress(konamiIndex);
        if (konamiIndex === konamiCode.length) {
          setKonamiActivated(true);
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
        setKonamiProgress(0);
      }
    };

    // Rage click detection
    let clickTimes: number[] = [];
    const handleClick = () => {
      const now = Date.now();
      clickTimes.push(now);
      clickTimes = clickTimes.filter(t => now - t < 2000); // clicks in last 2s
      if (clickTimes.length >= 10) {
        setRageClicks(prev => prev + 1);
        setShowRageMessage(true);
        setTimeout(() => setShowRageMessage(false), 3000);
        clickTimes = [];
      }
    };

    // Cursor trail when Konami activated
    const handleMouseMove = (e: MouseEvent) => {
      if (konamiActivated) {
        setCursorTrail(prev => [...prev.slice(-15), { x: e.clientX, y: e.clientY, id: Date.now() }]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [konamiActivated]);

  // Easter egg: fake loading that cycles through messages and fails
  const triggerFakeLoading = () => {
    setLoadingProgress(0);
    setLoadingFailed(false);
    setShowLoadingModal(true);

    // Shuffle messages for this session
    const shuffled = [...LOADING_MESSAGES].sort(() => Math.random() - 0.5);
    let messageIndex = 0;

    setLoadingMessage(shuffled[0]);

    // Cycle through messages (slow and painful)
    const messageInterval = setInterval(() => {
      messageIndex++;
      if (messageIndex < shuffled.length) {
        setLoadingMessage(shuffled[messageIndex]);
        setLoadingProgress(prev => Math.min(prev + 10, 95));
      }
    }, 1800);

    // Progress bar increments (glacial)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 99) return 99;
        return prev + Math.random() * 3;
      });
    }, 500);

    // Fail after cycling through messages
    setTimeout(() => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      setLoadingProgress(99);
      setLoadingMessage('fatal error: product not found');
      setLoadingFailed(true);

      // Auto-close after showing failure
      setTimeout(() => {
        setShowLoadingModal(false);
        setLoadingFailed(false);
        setLoadingProgress(0);
      }, 3000);
    }, shuffled.length * 1800 + 1000);
  };

  // Easter egg: footer link click
  const handleFooterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const msg = FOOTER_MESSAGES[Math.floor(Math.random() * FOOTER_MESSAGES.length)];
    setFooterMessage(msg);
    setShowFooterMessage(true);
    setTimeout(() => setShowFooterMessage(false), 3000);
  };

  // Easter egg: stat glitch
  const triggerStatGlitch = (index: number) => {
    setGlitchedStat(index);
    setTimeout(() => setGlitchedStat(null), 500);
  };

  // Easter egg: nav hover text change
  const handleNavHover = (key: string) => {
    setNavHoverText(prev => ({ ...prev, [key]: NAV_HOVER_TEXT[key] || key }));
  };

  const handleNavLeave = (key: string) => {
    setNavHoverText(prev => ({ ...prev, [key]: '' }));
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen">
      {/* sticky header with stripe + nav */}
      <header className="sticky top-0 z-50">
        <div className="construction-stripe h-3" />
        <nav className="bg-ivory-light/95 backdrop-blur-sm border-b-2 border-slate-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Clarp size={28} className="sm:w-8 sm:h-8" />
            <span className="font-mono text-lg sm:text-xl font-bold text-slate-dark">$clarp</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#products"
              className="text-sm text-slate-light hover:text-danger-orange transition-colors"
              onMouseEnter={() => handleNavHover('products')}
              onMouseLeave={() => handleNavLeave('products')}
            >
              {navHoverText['products'] || 'products'}
            </a>
            <a
              href="#docs"
              className="text-sm text-slate-light hover:text-danger-orange transition-colors"
              onMouseEnter={() => handleNavHover('docs')}
              onMouseLeave={() => handleNavLeave('docs')}
            >
              {navHoverText['docs'] || 'docs'}
            </a>
            <a
              href="#victims"
              className="text-sm text-slate-light hover:text-danger-orange transition-colors"
              onMouseEnter={() => handleNavHover('hall of shame')}
              onMouseLeave={() => handleNavLeave('hall of shame')}
            >
              {navHoverText['hall of shame'] || 'hall of shame'}
            </a>
            <button className="btn-secondary text-sm px-4 py-2" onClick={() => setShowWalletModal(true)}>connect wallet</button>
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
                href="#products"
                className="block py-2 text-slate-light hover:text-danger-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                products
              </a>
              <a
                href="#docs"
                className="block py-2 text-slate-light hover:text-danger-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                docs
              </a>
              <a
                href="#victims"
                className="block py-2 text-slate-light hover:text-danger-orange transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                hall of shame
              </a>
              <button
                className="w-full btn-secondary text-sm px-4 py-2 mt-2"
                onClick={() => { setShowWalletModal(true); setMobileMenuOpen(false); }}
              >
                connect wallet
              </button>
            </div>
          </div>
        )}
        </nav>
      </header>

      {/* hero section */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 overflow-hidden">
        {/* background grid */}
        <div className="absolute inset-0 bg-grid bg-grid opacity-30" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* left: terminal */}
            <div className="order-2 lg:order-1">
              <Terminal title="clarp">
                <div className="h-[280px] sm:h-[320px] overflow-y-auto overflow-x-hidden scrollbar-hide">
                  {/* Mobile: simple text logo */}
                  <pre
                    className="ascii-art text-danger-orange mb-6 md:hidden text-2xl font-bold cursor-pointer hover:text-larp-red transition-colors"
                    onClick={() => {
                      setAsciiClicks(prev => prev + 1);
                    }}
                  >
                    {asciiClicks >= 5 ? '$COPE' : asciiClicks >= 3 ? '$LARP' : ASCII_LOGO_MOBILE}
                  </pre>
                  {/* Desktop: full ASCII art */}
                  <pre
                    className={`ascii-art text-danger-orange mb-6 hidden md:block cursor-pointer hover:text-larp-red transition-colors ${asciiClicks >= 3 ? 'animate-[glitch_0.1s_ease-in-out_infinite]' : ''}`}
                    onClick={() => {
                      setAsciiClicks(prev => prev + 1);
                    }}
                  >
                    {asciiClicks >= 5 ? `
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██████╔╝█████╗
██║     ██║   ██║██╔═══╝ ██╔══╝
╚██████╗╚██████╔╝██║     ███████╗
 ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝` : ASCII_LOGO}
                  </pre>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="terminal-prompt text-ivory-light/90">clarp --status</span>
                    </div>
                    <div>&nbsp;</div>
                    <div className="text-larp-green">✓ readme exists</div>
                    <div className="text-larp-green">✓ logo exists</div>
                    <div className="text-larp-green">✓ twitter exists</div>
                    <div className="text-larp-red">✗ product</div>
                    <div className="mt-2">
                      <span className="text-danger-orange">status: normal</span>
                    </div>
                    <span className="inline-block w-3 h-5 bg-danger-orange animate-blink" />
                  </div>
                </div>
              </Terminal>
            </div>

            {/* right: hero copy */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-dark leading-tight mb-4 sm:mb-6 font-display">
                $clarp
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-slate-light mb-2 sm:mb-4">
                vaporware-as-a-service
              </p>
              <p className="text-base sm:text-lg text-danger-orange font-mono mb-4 sm:mb-6 font-bold">
                shipping nothing since 2025
              </p>

              <p className="text-sm sm:text-base text-slate-light mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0">
                enterprise-grade infrastructure for things that don't exist. join the waitlist for the waitlist.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8">
                <div className="relative">
                  <button className="btn-primary relative overflow-hidden group" onClick={(e) => {
                    const btn = e.currentTarget;
                    btn.classList.add('animate-[glitch_0.05s_ease-in-out_5]');
                    setTimeout(() => btn.classList.remove('animate-[glitch_0.05s_ease-in-out_5]'), 300);
                    setShowSmoke(true);
                    setTimeout(() => setShowSmoke(false), 800);
                  }}>
                    <span className="group-active:opacity-0 transition-opacity">view roadmap</span>
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-active:opacity-100 text-black font-mono text-xs tracking-widest">░░░░░░░</span>
                  </button>
                  {showSmoke && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="absolute smoke-particle smoke-1 text-slate-dark/70 font-mono text-sm">░░</span>
                      <span className="absolute smoke-particle smoke-2 text-slate-dark/60 font-mono text-xs">░░░</span>
                      <span className="absolute smoke-particle smoke-3 text-danger-orange/50 font-mono text-sm">░</span>
                      <span className="absolute smoke-particle smoke-4 text-slate-dark/50 font-mono text-xs">░░</span>
                      <span className="absolute smoke-particle smoke-5 text-danger-orange/40 font-mono text-lg">░</span>
                      <span className="absolute smoke-particle smoke-6 text-slate-dark/60 font-mono text-xs">░░░</span>
                      <span className="absolute smoke-particle smoke-7 text-slate-dark/50 font-mono text-sm">░░</span>
                    </div>
                  )}
                </div>
                <button
                  className="btn-secondary hover:opacity-100 transition-opacity"
                  onClick={triggerFakeLoading}
                >
                  get started (never)
                </button>
              </div>

              <div className="font-mono text-sm text-slate-light">
                <span className="text-cloud-medium">ca:</span>{' '}
                <span className="text-slate-dark">doesn't matter. you don't read contracts anyway.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* stats section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-slate-dark text-ivory-light border-y-4 border-danger-orange">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[
              { label: 'lines of code shipped', value: '0', glitchValue: 'NaN', sublabel: '(industry standard)' },
              { label: 'your portfolio', value: '-94%', glitchValue: '-∞%', sublabel: '(this month)' },
              { label: 'working product', value: 'no', glitchValue: '404', sublabel: '(never)' },
              { label: 'you reading this', value: '→ ape', glitchValue: 'rekt', sublabel: '(inevitable)' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`text-center p-2 sm:p-0 cursor-pointer select-none transition-transform hover:scale-105 ${glitchedStat === i ? 'animate-[glitch_0.1s_ease-in-out_5]' : ''}`}
                onClick={() => triggerStatGlitch(i)}
              >
                <div className={`text-2xl sm:text-3xl md:text-4xl font-mono font-bold mb-1 transition-colors ${glitchedStat === i ? 'text-larp-red' : 'text-danger-orange'}`}>
                  {glitchedStat === i ? stat.glitchValue : stat.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-ivory-light">{stat.label}</div>
                <div className="text-[10px] sm:text-xs text-ivory-light/50">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* products section */}
      <section id="products" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-3 sm:mb-4 font-display">
              products
            </h2>
            <p className="text-sm sm:text-base text-slate-light max-w-2xl mx-auto px-2">
              none of these exist. neither do theirs. you know this.
              you're still scrolling.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {PRODUCTS.map((product, i) => (
              <ProductCard
                key={i}
                {...product}
                delay={i * 150}
              />
            ))}
          </div>
        </div>
      </section>

      {/* mascot section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-dark text-ivory-light overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <span className="badge badge-error mb-4 sm:mb-6">mascot</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 font-display">
                this is <span className="text-danger-orange">clarp</span>
              </h2>
              <p className="text-sm sm:text-base text-ivory-light/70 mb-4 sm:mb-6">
                an image. on a website. about nothing.
                you scrolled here on purpose.
              </p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-left">
                {[
                  'represents nothing. like the tokens you hold.',
                  'under construction since forever. familiar?',
                  'more honest than your "alpha" discord.',
                  'at least this admits it\'s a joke.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-ivory-light/80">
                    <span className="text-danger-orange shrink-0">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                className="btn-outline text-sm sm:text-base"
                onClick={() => setShowWhitepaperModal(true)}
              >
                whitepaper (blank)
              </button>
            </div>
            <div className="flex justify-center order-first lg:order-last">
              <div className="scale-75 sm:scale-100">
                <Mascot />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* documentation section */}
      <section id="docs" className="py-16 sm:py-24 px-4 sm:px-6">
        <DocsSection />
      </section>

      {/* roadmap section */}
      <section id="victims" className="py-16 sm:py-24 px-4 sm:px-6 bg-ivory-medium border-y-2 border-slate-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <span className="badge badge-error mb-3 sm:mb-4">roadmap</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-3 sm:mb-4 font-display">
              roadmap
            </h2>
            <p className="text-sm sm:text-base text-slate-light">
              you've seen this format a hundred times. it never matters.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {[
              { phase: 'q1 2025', title: 'launch', items: ['make website', 'add stripe animation', 'claim it\'s different this time'], status: 'complete' },
              { phase: 'q2 2025', title: 'growth', items: ['post on twitter', 'post on twitter again', 'call it marketing'], status: 'current' },
              { phase: 'q3 2025', title: 'scale', items: ['partnership announcement (nothing happens)', 'ecosystem expansion (telegram group)', 'developer program (0 developers)'], status: 'upcoming' },
              { phase: 'q∞', title: 'ship product', items: ['no'], status: 'never' },
            ].map((phase, i) => (
              <div
                key={i}
                className={`p-4 sm:p-6 border-2 ${
                  phase.status === 'complete'
                    ? 'bg-larp-green/5 border-larp-green'
                    : phase.status === 'current'
                    ? 'bg-danger-orange/5 border-danger-orange'
                    : phase.status === 'never'
                    ? 'bg-larp-red/5 border-larp-red'
                    : 'bg-ivory-light border-slate-dark'
                }`}
                style={{ boxShadow: '4px 4px 0 var(--slate-dark)' }}
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <div>
                    <span className="text-[10px] sm:text-xs font-mono text-slate-light">{phase.phase}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-dark">{phase.title}</h3>
                  </div>
                  <Badge
                    variant={
                      phase.status === 'complete' ? 'success' :
                      phase.status === 'current' ? 'warning' :
                      phase.status === 'never' ? 'error' : 'default'
                    }
                  >
                    {phase.status === 'complete' ? 'done' :
                     phase.status === 'current' ? 'larping' :
                     phase.status === 'never' ? 'never' : 'copium'}
                  </Badge>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs sm:text-sm text-slate-light">
                      <span className={`shrink-0 ${
                        phase.status === 'complete' ? 'text-larp-green' :
                        phase.status === 'never' ? 'text-larp-red' : 'text-cloud-medium'
                      }`}>
                        {phase.status === 'complete' ? '✓' : phase.status === 'never' ? '✗' : '○'}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                {phase.status === 'current' && (
                  <div className="mt-4">
                    <ProgressBar progress={99} label="progress (perpetually stuck)" showPercent />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-4 sm:mb-6 font-display">
            {ctaClicks.doIt >= 3 ? 'you\'re still clicking' : ctaClicks.pretend >= 3 ? 'liar' : 'you made it to the bottom'}
          </h2>
          <p className="text-base sm:text-xl text-slate-light mb-2 sm:mb-4">
            {ctaClicks.doIt >= 5 ? 'seriously?' : ctaClicks.pretend >= 5 ? 'we both know you\'re lying.' : 'of a website that exists purely to mock you.'}
          </p>
          <p className="text-sm sm:text-lg text-danger-orange mb-6 sm:mb-8 font-mono font-bold">
            {ctaClicks.doIt + ctaClicks.pretend >= 10 ? `clicked ${ctaClicks.doIt + ctaClicks.pretend} times. seek help.` : 'and you\'re still considering it.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              className={`btn-primary ${ctaClicks.doIt >= 3 ? 'animate-pulse' : ''}`}
              onClick={() => {
                setCtaClicks(prev => ({ ...prev, doIt: prev.doIt + 1 }));
                if (ctaClicks.doIt >= 5) {
                  setShowWalletModal(true);
                }
              }}
            >
              {ctaClicks.doIt >= 5 ? 'fine. here.' : ctaClicks.doIt >= 3 ? 'stop' : ctaClicks.doIt >= 1 ? 'you clicked it' : 'do it anyway'}
            </button>
            <button
              className={`btn-secondary ${ctaClicks.pretend >= 3 ? 'line-through' : ''}`}
              onClick={() => setCtaClicks(prev => ({ ...prev, pretend: prev.pretend + 1 }))}
            >
              {ctaClicks.pretend >= 5 ? 'cope' : ctaClicks.pretend >= 3 ? 'sure you won\'t' : ctaClicks.pretend >= 1 ? 'you\'re lying' : 'pretend you won\'t'}
            </button>
          </div>
          <p className="text-xs text-slate-light/50 mt-6 font-mono">
            {ctaClicks.doIt + ctaClicks.pretend >= 5 ? 'you\'ve clicked ' + (ctaClicks.doIt + ctaClicks.pretend) + ' times. the button still does nothing.' : 'this button does nothing. like every "launch app" button you\'ve clicked.'}
          </p>
        </div>
      </section>

      <Footer />

      {/* activity notifications */}
      <ActivityNotifications />

      {/* clarp ai floating chat */}
      <ClarpAI />

      {/* wallet modal */}
      {showWalletModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setShowWalletModal(false)}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-slate-dark/90 backdrop-blur-sm" />

          {/* modal */}
          <div
            className="relative bg-ivory-light border-4 border-danger-orange p-8 max-w-md w-full mx-4 animate-[glitch_0.1s_ease-in-out_3]"
            style={{ boxShadow: '8px 8px 0 #0a0a09, 12px 12px 0 #FF6B35' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button */}
            <button
              className="absolute -top-4 -right-4 w-10 h-10 bg-larp-red text-black font-mono font-bold text-xl flex items-center justify-center border-2 border-black hover:bg-danger-orange transition-colors"
              style={{ boxShadow: '3px 3px 0 black' }}
              onClick={() => setShowWalletModal(false)}
            >
              ✗
            </button>

            {/* content */}
            <div className="text-center">
              <div className="text-5xl mb-4 font-mono text-danger-orange font-bold">.</div>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-dark mb-4 font-mono">
                there is no wallet
              </h3>
              <p className="text-slate-light mb-2 font-mono text-sm">
                there is no token. there is no contract.
              </p>
              <p className="text-slate-light mb-6 font-mono text-sm">
                you clicked "connect wallet" on a parody website.
              </p>
              <div className="space-y-3">
                <button
                  className="w-full btn-primary"
                  onClick={() => setShowWalletModal(false)}
                >
                  close and reflect
                </button>
                <p className="text-xs text-slate-light/60 font-mono">
                  you won't.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* whitepaper modal - easter egg */}
      {showWhitepaperModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setShowWhitepaperModal(false)}
        >
          <div className="absolute inset-0 bg-slate-dark/95 backdrop-blur-sm" />
          <div
            className="relative bg-ivory-light border-4 border-slate-dark p-12 max-w-2xl w-full mx-4 min-h-[400px] flex flex-col items-center justify-center"
            style={{ boxShadow: '8px 8px 0 #0a0a09' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-4 -right-4 w-10 h-10 bg-larp-red text-black font-mono font-bold text-xl flex items-center justify-center border-2 border-black hover:bg-danger-orange transition-colors"
              style={{ boxShadow: '3px 3px 0 black' }}
              onClick={() => setShowWhitepaperModal(false)}
            >
              ✗
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-mono text-slate-light/40 mb-8">$clarp whitepaper v1.0</h3>
              <div className="text-9xl font-mono text-slate-dark mb-8">.</div>
              <p className="text-slate-light/40 font-mono text-sm">
                [this page intentionally left blank]
              </p>
              <p className="text-slate-light/30 font-mono text-xs mt-4">
                like most whitepapers, but at least we're honest.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* loading modal - cycles through messages then fails */}
      {showLoadingModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => !loadingFailed && setShowLoadingModal(false)}
        >
          <div className="absolute inset-0 bg-slate-dark/95 backdrop-blur-sm" />
          <div
            className={`relative bg-slate-dark border-4 p-8 max-w-md w-full mx-4 transition-colors ${loadingFailed ? 'border-larp-red' : 'border-danger-orange'}`}
            style={{ boxShadow: loadingFailed ? '8px 8px 0 #ef4444' : '8px 8px 0 #FF6B35' }}
            onClick={(e) => e.stopPropagation()}
          >
            {!loadingFailed && (
              <button
                className="absolute -top-4 -right-4 w-10 h-10 bg-larp-red text-black font-mono font-bold text-xl flex items-center justify-center border-2 border-black hover:bg-danger-orange transition-colors"
                style={{ boxShadow: '3px 3px 0 black' }}
                onClick={() => setShowLoadingModal(false)}
              >
                ✗
              </button>
            )}

            <div className="text-center">
              <div className="mb-6">
                {loadingFailed ? (
                  <div className="inline-block w-12 h-12 border-4 border-larp-red flex items-center justify-center text-larp-red text-2xl font-bold">
                    ✗
                  </div>
                ) : (
                  <div className="inline-block w-12 h-12 border-4 border-danger-orange border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <p className={`font-mono text-sm mb-2 transition-colors ${loadingFailed ? 'text-larp-red' : 'text-danger-orange'}`}>
                {loadingMessage}
              </p>
              <div className="w-full bg-slate-medium h-2 overflow-hidden mb-4">
                <div
                  className={`h-full transition-all duration-200 ${loadingFailed ? 'bg-larp-red' : 'bg-danger-orange'}`}
                  style={{ width: `${Math.min(loadingProgress, 99)}%` }}
                />
              </div>
              <p className={`font-mono text-xs ${loadingFailed ? 'text-larp-red' : 'text-ivory-light/50'}`}>
                {loadingFailed ? 'connection terminated' : `${Math.floor(loadingProgress)}% complete`}
              </p>
              {!loadingFailed && (
                <p className="text-ivory-light/30 font-mono text-[10px] mt-4">
                  (click anywhere to give up)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* footer message toast - easter egg */}
      {showFooterMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[100] animate-slide-in">
          <div
            className="bg-slate-dark border-2 border-danger-orange p-4 font-mono text-sm text-ivory-light"
            style={{ boxShadow: '4px 4px 0 #FF6B35' }}
          >
            <span className="text-danger-orange">error:</span> {footerMessage}
          </div>
        </div>
      )}

      {/* Konami code progress indicator */}
      {konamiProgress > 0 && !konamiActivated && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-slate-dark border-2 border-larp-yellow px-4 py-2 font-mono text-xs text-larp-yellow">
            konami: {Array(konamiProgress).fill('▓').join('')}{Array(10 - konamiProgress).fill('░').join('')}
          </div>
        </div>
      )}

      {/* Konami activated mode */}
      {konamiActivated && (
        <>
          {/* Rainbow border animation */}
          <div className="fixed inset-0 pointer-events-none z-[80] border-4 animate-pulse" style={{ borderColor: `hsl(${Date.now() / 20 % 360}, 70%, 50%)` }} />

          {/* Achievement unlocked */}
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]">
            <div className="bg-larp-green text-black px-6 py-3 font-mono text-sm font-bold border-2 border-black" style={{ boxShadow: '4px 4px 0 black' }}>
              🎮 KONAMI MODE ACTIVATED - you found nothing. congrats.
            </div>
          </div>

          {/* Cursor trail */}
          {cursorTrail.map((point, i) => (
            <div
              key={point.id}
              className="fixed w-3 h-3 bg-danger-orange pointer-events-none z-[200] transition-opacity"
              style={{
                left: point.x - 6,
                top: point.y - 6,
                opacity: (i + 1) / cursorTrail.length * 0.8,
                transform: `scale(${(i + 1) / cursorTrail.length})`,
              }}
            />
          ))}
        </>
      )}

      {/* Rage clicking message */}
      {showRageMessage && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-[shake_0.5s_ease-in-out]">
          <div className="bg-larp-red text-black px-8 py-4 font-mono text-lg font-bold border-4 border-black" style={{ boxShadow: '8px 8px 0 black' }}>
            {rageClicks >= 5 ? 'SEEK PROFESSIONAL HELP' :
             rageClicks >= 3 ? 'RAGE CLICKING DETECTED (again)' :
             rageClicks >= 2 ? 'still rage clicking?' :
             'RAGE CLICKING DETECTED'}
          </div>
        </div>
      )}

      {/* Rage click counter - shows after first rage */}
      {rageClicks > 0 && !showRageMessage && (
        <div className="fixed bottom-20 left-4 z-[90] font-mono text-[10px] text-ivory-light/30">
          rage incidents: {rageClicks}
        </div>
      )}
    </main>
  );
}
