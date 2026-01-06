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

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
            <a href="#products" className="text-sm text-slate-light hover:text-danger-orange transition-colors">products</a>
            <a href="#docs" className="text-sm text-slate-light hover:text-danger-orange transition-colors">docs</a>
            <a href="#victims" className="text-sm text-slate-light hover:text-danger-orange transition-colors">hall of shame</a>
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
                  <pre className="ascii-art text-danger-orange mb-6 md:hidden text-2xl font-bold">{ASCII_LOGO_MOBILE}</pre>
                  {/* Desktop: full ASCII art */}
                  <pre className="ascii-art text-danger-orange mb-6 hidden md:block">{ASCII_LOGO}</pre>
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
                the framework
              </p>
              <p className="text-base sm:text-lg text-danger-orange font-mono mb-4 sm:mb-6 font-bold">
                for building things. soon.
              </p>

              <p className="text-sm sm:text-base text-slate-light mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0">
                revolutionary infrastructure for the next generation of applications that will definitely exist at some point.
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
                <button className="btn-secondary opacity-50 cursor-not-allowed">
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
              { label: 'lines of code shipped', value: '0', sublabel: '(industry standard)' },
              { label: 'your portfolio', value: '-94%', sublabel: '(this month)' },
              { label: 'working product', value: 'no', sublabel: '(never)' },
              { label: 'you reading this', value: '→ ape', sublabel: '(inevitable)' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-2 sm:p-0">
                <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-danger-orange mb-1">
                  {stat.value}
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
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-dark text-ivory-light overflow-hidden relative">
        <div className="construction-stripe h-1 absolute top-0 left-0 right-0" />
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
              <button className="btn-outline text-sm sm:text-base">whitepaper (blank)</button>
            </div>
            <div className="flex justify-center order-first lg:order-last">
              <div className="scale-75 sm:scale-100">
                <Mascot />
              </div>
            </div>
          </div>
        </div>
        <div className="construction-stripe h-1 absolute bottom-0 left-0 right-0" />
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
            you made it to the bottom
          </h2>
          <p className="text-base sm:text-xl text-slate-light mb-2 sm:mb-4">
            of a website that exists purely to mock you.
          </p>
          <p className="text-sm sm:text-lg text-danger-orange mb-6 sm:mb-8 font-mono font-bold">
            and you're still considering it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button className="btn-primary">
              do it anyway
            </button>
            <button className="btn-secondary">
              pretend you won't
            </button>
          </div>
          <p className="text-xs text-slate-light/50 mt-6 font-mono">
            this button does nothing. like every "launch app" button you've clicked.
          </p>
        </div>
      </section>

      <Footer />

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
            {/* danger stripe top */}
            <div className="construction-stripe h-2 absolute -top-2 left-0 right-0" />

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

            {/* danger stripe bottom */}
            <div className="construction-stripe h-2 absolute -bottom-2 left-0 right-0" />
          </div>
        </div>
      )}
    </main>
  );
}
