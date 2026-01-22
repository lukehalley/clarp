'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Terminal from '@/components/Terminal';
import ProductCarousel from '@/components/ProductCarousel';
import ProgressBar from '@/components/ProgressBar';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Mascot from '@/components/Mascot';
import DocsSection from '@/components/DocsSection';
import Footer from '@/components/Footer';
import Clarp from '@/components/Clarp';
import ActivityNotifications from '@/components/ActivityNotifications';
import HallOfShame from '@/components/HallOfShame';
import WarningTicker from '@/components/WarningTicker';
import Roadmap from '@/components/Roadmap';
import TERMINAL_CONVERSATIONS from '@/data/terminal-conversations.json';
import HERO_SENTENCES from '@/data/hero-sentences.json';
import WARNING_TICKERS from '@/data/warning-tickers.json';
import DONATIONS from '@/data/donations.json';

const ASCII_LOGO = `
 ██████╗██╗      █████╗ ██████╗ ██████╗
██╔════╝██║     ██╔══██╗██╔══██╗██╔══██╗
██║     ██║     ███████║██████╔╝██████╔╝
██║     ██║     ██╔══██║██╔══██╗██╔═══╝
╚██████╗███████╗██║  ██║██║  ██║██║
 ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝`;

const ASCII_LOGO_MOBILE = `$CLARP`;

// Easter egg messages for various interactions
const LOADING_MESSAGES = [
  'connecting to bonding curve casino...',
  'pvp trenches status: checking...',
  'scanning for soft rug signals...',
  'calculating jeet probability...',
  'loading exit liquidity profile...',
  'syncing with kol bundle wallets...',
  'deploying cope mechanisms...',
  'fetching delulu metrics...',
  'preparing to get cooked...',
  'initializing ngmi protocol...',
];

const FOOTER_MESSAGES = [
  'this link rugged before it loaded.',
  'your click was exit liquidity. ngmi.',
  'the real treasure was the kol bundles we paid along the way.',
  '404: product not found. neither is yours.',
  'you clicked a footer link. very jeet behavior.',
  'soft rug on that click. try again q2.',
  'page coming q2 (the eternal q2).',
];

// Animation phases: 'typing' | 'paused' | 'deleting'
type AnimationPhase = 'typing' | 'paused' | 'deleting';


export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Terminal conversation animation states
  const [currentConversation, setCurrentConversation] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [currentMessageText, setCurrentMessageText] = useState('');
  const [phase, setPhase] = useState<AnimationPhase>('typing');
  const terminalRef = useRef<HTMLDivElement>(null);

  // Hero sentence rotation (brutalist instant swap)
  const [heroSentenceIndex, setHeroSentenceIndex] = useState(0);

  // Easter egg states
  const [showWhitepaperModal, setShowWhitepaperModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [showFooterMessage, setShowFooterMessage] = useState(false);
  const [footerMessage, setFooterMessage] = useState('');
  const [ctaClicks, setCtaClicks] = useState({ doIt: 0, pretend: 0 });
  const [asciiClicks, setAsciiClicks] = useState(0);
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [konamiActivated, setKonamiActivated] = useState(false);
  const [rageClicks, setRageClicks] = useState(0);
  const [showRageMessage, setShowRageMessage] = useState(false);
  const [cursorTrail, setCursorTrail] = useState<{x: number, y: number, id: number}[]>([]);

  // CA copy state
  const [caCopied, setCaCopied] = useState(false);
  const CA_ADDRESS = 'GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS';

  // Terminal conversation typing animation
  useEffect(() => {
    if (!mounted) return;

    const conversation = TERMINAL_CONVERSATIONS[currentConversation];
    const totalMessages = conversation.messages.length;
    let timeout: NodeJS.Timeout;

    if (phase === 'typing') {
      // Currently typing out a message character by character
      const currentMessage = conversation.messages[visibleMessages];
      if (!currentMessage) {
        // All messages shown, pause then delete
        timeout = setTimeout(() => {
          setPhase('deleting');
        }, 3000);
      } else if (currentMessageText.length < currentMessage.content.length) {
        // Still typing current message
        timeout = setTimeout(() => {
          setCurrentMessageText(currentMessage.content.slice(0, currentMessageText.length + 1));
        }, currentMessage.role === 'user' ? 40 : 20); // User types slower
      } else {
        // Done with current message, move to next
        timeout = setTimeout(() => {
          setVisibleMessages((prev) => prev + 1);
          setCurrentMessageText('');
        }, currentMessage.role === 'user' ? 800 : 500);
      }
    } else if (phase === 'deleting') {
      if (visibleMessages > 0) {
        timeout = setTimeout(() => {
          setVisibleMessages((prev) => prev - 1);
        }, 100);
      } else {
        // Done deleting, move to next conversation
        setCurrentConversation((prev) => (prev + 1) % TERMINAL_CONVERSATIONS.length);
        setCurrentMessageText('');
        setPhase('typing');
      }
    }

    return () => clearTimeout(timeout);
  }, [mounted, phase, visibleMessages, currentMessageText, currentConversation]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [visibleMessages, currentMessageText]);

  // Hero sentence rotation (brutalist instant swap)
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setHeroSentenceIndex((prev) => (prev + 1) % HERO_SENTENCES.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    setMounted(true);

    // Konami code easter egg: ↑↑↓↓←→
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to exit Konami mode
      if (e.code === 'Escape') {
        setKonamiActivated(false);
        setCursorTrail([]);
        konamiIndex = 0;
        setKonamiProgress(0);
        return;
      }

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

  if (!mounted) return null;

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* hero section */}
      <section className="relative py-12 sm:py-16 lg:py-24 px-4 sm:px-6 overflow-hidden">
        {/* background grid */}
        <div className="absolute inset-0 bg-grid bg-grid opacity-30" />

        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* left: terminal */}
            <div className="order-2 lg:order-1">
              <Terminal title="clarp">
                <div ref={terminalRef} className="h-[280px] sm:h-[320px] overflow-y-auto overflow-x-hidden scrollbar-hide">
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
                  {/* Animated terminal output - vibe coding conversation */}
                  <div className="space-y-2">
                    {TERMINAL_CONVERSATIONS[currentConversation].messages.map((msg, i) => {
                      const isVisible = i < visibleMessages;
                      const isTyping = i === visibleMessages && phase === 'typing';
                      const displayText = isTyping ? currentMessageText : (isVisible ? msg.content : '');

                      if (!isVisible && !isTyping) return null;

                      return (
                        <div key={i} className="flex items-start gap-2">
                          {msg.role === 'user' ? (
                            <>
                              <span className="text-larp-green shrink-0">&gt;</span>
                              <span className="text-ivory-light font-mono">
                                {displayText}
                                {isTyping && <span className="inline-block w-2 h-4 bg-larp-green animate-blink align-middle ml-0.5" />}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-danger-orange shrink-0">ai:</span>
                              <span className="text-ivory-light/80">
                                {displayText}
                                {isTyping && <span className="inline-block w-2 h-4 bg-danger-orange animate-blink align-middle ml-0.5" />}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                    {/* Show cursor at bottom when paused between conversations */}
                    {phase === 'deleting' && visibleMessages === 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-larp-green">&gt;</span>
                        <span className="inline-block w-2 h-4 bg-larp-green animate-blink" />
                      </div>
                    )}
                  </div>
                </div>
              </Terminal>
            </div>

            {/* right: hero copy */}
            <div className="order-1 lg:order-2 text-center lg:text-left overflow-hidden">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-dark leading-tight mb-4 sm:mb-6 font-display">
                $clarp
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-slate-light mb-2 sm:mb-4">
                first autonomous trust pilot
              </p>
              <p className="text-base sm:text-lg text-danger-orange font-mono mb-4 sm:mb-6 font-bold">
                polymarket odds + on-chain receipts
              </p>

              <p className="text-sm sm:text-base text-slate-light mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0 min-h-[6rem] sm:min-h-[4.5rem]">
                {HERO_SENTENCES[heroSentenceIndex]}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8 w-full max-w-full">
                <Link
                  href="/roadmap"
                  className="btn-primary relative overflow-hidden group"
                >
                  view roadmap
                </Link>
                <a
                  href="https://dexscreener.com/solana/6c71mun334bafcuvn3cwajfqnk6skztzk9vfzrthstwj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary hover:opacity-100 transition-opacity"
                >
                  dexscreener
                </a>
              </div>

              {/* CA Box */}
              <div
                className="bg-slate-dark border-2 border-danger-orange px-4 sm:px-6 py-3 sm:py-4 font-mono flex items-center gap-3 sm:gap-4 group cursor-pointer hover:border-larp-green transition-colors w-full max-w-2xl overflow-hidden"
                style={{ boxShadow: '4px 4px 0 #FF6B35' }}
                onClick={() => {
                  navigator.clipboard.writeText(CA_ADDRESS);
                  setCaCopied(true);
                  setTimeout(() => setCaCopied(false), 2000);
                }}
              >
                <span className="text-danger-orange font-bold text-sm sm:text-base shrink-0">ca:</span>
                <span className="text-ivory-light text-xs sm:text-sm flex-1 truncate min-w-0">{CA_ADDRESS}</span>
                <span className={`shrink-0 text-xs sm:text-sm px-3 py-1 border transition-all ${caCopied ? 'bg-larp-green text-black border-larp-green' : 'bg-transparent text-ivory-light/60 border-ivory-light/30 group-hover:border-larp-green group-hover:text-larp-green'}`}>
                  {caCopied ? '✓ copied' : 'copy'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ticker: hero → mascot */}
      <WarningTicker messages={WARNING_TICKERS[0].messages} direction={WARNING_TICKERS[0].direction as 'left' | 'right'} />

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
                you're about to scroll past 100 fake products.
                but first, meet the jpeg.
              </p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-left">
                {[
                  'the official mascot of autonomous rug detection.',
                  'more due diligence than your $50m ai agent.',
                  'scanning polymarket while you sleep.',
                  'CLARP spots LARP. that\'s the whole product.',
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
                whitepaper (still blank though)
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

      {/* ticker: mascot → products */}
      <WarningTicker messages={WARNING_TICKERS[1].messages} direction={WARNING_TICKERS[1].direction as 'left' | 'right'} />

      {/* products section */}
      <section id="products" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-3 sm:mb-4 font-display">
              products
            </h2>
            <p className="text-sm sm:text-base text-slate-light max-w-2xl mx-auto px-2">
              100 products they promised. none exist. ours does.
              scroll to see the receipts.
            </p>
          </div>

          <div className="relative pt-8">
            <ProductCarousel />
          </div>
        </div>
      </section>

      {/* ticker: products → charity */}
      <WarningTicker messages={WARNING_TICKERS[2].messages} direction={WARNING_TICKERS[2].direction as 'left' | 'right'} />

      {/* charity section - the plot twist */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 overflow-hidden bg-slate-dark">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: The twist */}
            <div className="text-center lg:text-left">
              <span className="badge badge-success mb-4 sm:mb-6">plot twist</span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-ivory-light mb-4 sm:mb-6 font-display">
                <span className="text-larp-green">100%</span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-ivory-light/90 mb-2">
                of fees go to charity.
              </p>
              <div className="w-32 sm:w-48 h-1 bg-danger-orange mb-6 mx-auto lg:mx-0" />
              <p className="text-base sm:text-lg text-ivory-light/70 mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0">
                rug detection that funds ai safety research. full circle.
              </p>
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-left max-w-md mx-auto lg:mx-0">
                {[
                  'every transaction.',
                  'public proof.',
                  'no trust required.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-ivory-light/80">
                    <span className="text-larp-green shrink-0">▸</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs sm:text-sm text-danger-orange font-mono font-bold">
                utility with a conscience.
              </p>
            </div>

            {/* Right: Receipt/proof card */}
            <div className="flex justify-center order-first lg:order-last">
              <div
                className="relative bg-ivory-light border-2 sm:border-3 border-slate-dark w-full max-w-sm"
                style={{ boxShadow: '4px 4px 0 #0a0a09' }}
              >
                {/* Receipt header */}
                <div className="bg-slate-dark px-4 sm:px-6 py-3 sm:py-4">
                  <p className="text-ivory-light font-mono text-sm sm:text-base text-center">DONATION RECEIPT</p>
                </div>

                {/* Receipt content */}
                <div className="p-4 sm:p-6 space-y-4">
                  <div>
                    <p className="text-slate-light font-mono text-xs mb-1">FROM:</p>
                    <p className="text-slate-dark font-mono text-sm">$CLARP Protocol Fees</p>
                  </div>

                  <div className="border-t border-dashed border-slate-light/30" />

                  <div>
                    <p className="text-slate-light font-mono text-xs mb-1">TO:</p>
                    <p className="text-slate-dark font-mono text-sm">Verified Charity Partner</p>
                  </div>

                  <div className="border-t border-dashed border-slate-light/30" />

                  <div>
                    <p className="text-slate-light font-mono text-xs mb-1">AMOUNT:</p>
                    <p className="text-larp-green font-mono text-xl sm:text-2xl font-bold">100% OF FEES</p>
                  </div>

                  <div className="border-t border-dashed border-slate-light/30" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-light font-mono text-xs mb-1">STATUS:</p>
                      <span className="inline-block bg-larp-green text-black font-mono text-xs px-3 py-1 font-bold">
                        VERIFIED
                      </span>
                    </div>
                    <span className="text-larp-green text-3xl">✓</span>
                  </div>

                  <p className="text-slate-light/60 font-mono text-[10px] text-center pt-2">
                    on-chain proof available
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Donations list */}
          {DONATIONS.length > 0 && (
            <div className="mt-12 sm:mt-16">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-larp-green text-lg">▸</span>
                <h3 className="text-lg sm:text-xl font-mono text-ivory-light font-bold">
                  verified donations ({DONATIONS.length})
                </h3>
              </div>
              <div className="space-y-3">
                {DONATIONS.map((donation, i) => (
                  <a
                    key={i}
                    href={`https://solscan.io/tx/${donation.tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-ivory-light/5 border border-ivory-light/10 hover:border-larp-green/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-larp-green shrink-0">✓</span>
                      <span className="font-mono text-sm text-ivory-light/80 truncate">
                        {donation.tx.slice(0, 8)}...{donation.tx.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {donation.amount && (
                        <span className="font-mono text-sm text-larp-green">{donation.amount}</span>
                      )}
                      <span className="text-xs text-ivory-light/40 font-mono">{donation.date}</span>
                      <span className="text-ivory-light/40 group-hover:text-larp-green transition-colors">→</span>
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-xs text-ivory-light/30 font-mono mt-4 text-center">
                click any transaction to verify on solscan
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ticker: charity → docs */}
      <WarningTicker messages={WARNING_TICKERS[3].messages} direction={WARNING_TICKERS[3].direction as 'left' | 'right'} />

      {/* documentation section */}
      <section id="docs" className="py-16 sm:py-24 px-4 sm:px-6">
        <DocsSection />
      </section>

      {/* ticker: docs → hall of shame */}
      <WarningTicker messages={WARNING_TICKERS[4].messages} direction={WARNING_TICKERS[4].direction as 'left' | 'right'} />

      {/* hall of shame section */}
      <section id="victims" className="bg-slate-dark">
        <HallOfShame />
      </section>

      {/* ticker: hall of shame → roadmap */}
      <WarningTicker messages={WARNING_TICKERS[5].messages} direction={WARNING_TICKERS[5].direction as 'left' | 'right'} />

      {/* roadmap section */}
      <Roadmap />

      {/* ticker: roadmap → cta */}
      <WarningTicker messages={WARNING_TICKERS[6].messages} direction={WARNING_TICKERS[6].direction as 'left' | 'right'} />

      {/* cta section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative bg-slate-dark">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ivory-light mb-4 sm:mb-6 font-display">
            {ctaClicks.doIt >= 3 ? 'you\'re still clicking' : ctaClicks.pretend >= 3 ? 'liar' : 'you made it to the bottom'}
          </h2>
          <p className="text-base sm:text-xl text-ivory-light/70 mb-2 sm:mb-4">
            {ctaClicks.doIt >= 5 ? 'seriously?' : ctaClicks.pretend >= 5 ? 'we both know you\'re lying.' : 'now you know what we\'re building.'}
          </p>
          <p className="text-sm sm:text-lg text-danger-orange mb-6 sm:mb-8 font-mono font-bold">
            {ctaClicks.doIt + ctaClicks.pretend >= 10 ? `clicked ${ctaClicks.doIt + ctaClicks.pretend} times. seek help.` : 'first mover. no one else is doing this.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              className={`btn-primary ${ctaClicks.doIt >= 3 ? 'animate-pulse' : ''}`}
              onClick={() => setCtaClicks(prev => ({ ...prev, doIt: prev.doIt + 1 }))}
            >
              {ctaClicks.doIt >= 5 ? 'you won' : ctaClicks.doIt >= 3 ? 'stop' : ctaClicks.doIt >= 1 ? 'you clicked it' : 'do it anyway'}
            </button>
            <button
              className={`btn-secondary ${ctaClicks.pretend >= 3 ? 'line-through' : ''}`}
              onClick={() => setCtaClicks(prev => ({ ...prev, pretend: prev.pretend + 1 }))}
            >
              {ctaClicks.pretend >= 5 ? 'cope' : ctaClicks.pretend >= 3 ? 'sure you won\'t' : ctaClicks.pretend >= 1 ? 'you\'re lying' : 'pretend you won\'t'}
            </button>
          </div>
          <p className="text-xs text-ivory-light/50 mt-6 font-mono">
            {ctaClicks.doIt + ctaClicks.pretend >= 5 ? 'you\'ve clicked ' + (ctaClicks.doIt + ctaClicks.pretend) + ' times. you\'re early.' : 'polymarket odds + on-chain analysis. first of its kind.'}
          </p>
        </div>
      </section>

      {/* ticker: cta → footer */}
      <WarningTicker messages={WARNING_TICKERS[7].messages} direction={WARNING_TICKERS[7].direction as 'left' | 'right'} />

      <Footer />

      {/* activity notifications */}
      <ActivityNotifications />

      {/* whitepaper modal - easter egg */}
      {showWhitepaperModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          onClick={() => setShowWhitepaperModal(false)}
          data-modal-open="true"
        >
          <div className="absolute inset-0 bg-slate-dark/95 backdrop-blur-sm" />
          <div
            className="relative bg-ivory-light border-2 sm:border-4 border-slate-dark p-6 sm:p-12 w-full max-w-[min(90vw,500px)] sm:max-w-[600px] flex flex-col items-center justify-center"
            style={{
              boxShadow: '4px 4px 0 #0a0a09',
              aspectRatio: '1 / 1.414',
              maxHeight: 'calc(100vh - 4rem)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button - inside on mobile, outside on desktop */}
            <button
              className="absolute top-2 right-2 sm:-top-4 sm:-right-4 w-8 h-8 sm:w-10 sm:h-10 bg-larp-red text-black font-mono font-bold text-lg sm:text-xl flex items-center justify-center border-2 border-black hover:bg-danger-orange active:translate-x-0.5 active:translate-y-0.5 transition-all"
              style={{ boxShadow: '2px 2px 0 black' }}
              onClick={() => setShowWhitepaperModal(false)}
            >
              ✗
            </button>

            <div className="text-center flex flex-col items-center justify-center h-full">
              {/* blank whitepaper - that's the joke */}
            </div>
          </div>
        </div>
      )}

      {/* loading modal - cycles through messages then fails */}
      {showLoadingModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          onClick={() => !loadingFailed && setShowLoadingModal(false)}
          data-modal-open="true"
        >
          <div className="absolute inset-0 bg-slate-dark/95 backdrop-blur-sm" />
          <div
            className={`relative bg-slate-dark border-2 sm:border-4 p-6 sm:p-8 max-w-md w-full transition-colors ${loadingFailed ? 'border-larp-red' : 'border-danger-orange'}`}
            style={{ boxShadow: loadingFailed ? '4px 4px 0 #E74C3C' : '4px 4px 0 #FF6B35' }}
            onClick={(e) => e.stopPropagation()}
          >
            {!loadingFailed && (
              <button
                className="absolute top-2 right-2 sm:-top-4 sm:-right-4 w-8 h-8 sm:w-10 sm:h-10 bg-larp-red text-black font-mono font-bold text-lg sm:text-xl flex items-center justify-center border-2 border-black hover:bg-danger-orange active:translate-x-0.5 active:translate-y-0.5 transition-all"
                style={{ boxShadow: '2px 2px 0 black' }}
                onClick={() => setShowLoadingModal(false)}
              >
                ✗
              </button>
            )}

            <div className="text-center pt-4 sm:pt-0">
              <div className="mb-5 sm:mb-6">
                {loadingFailed ? (
                  <div className="inline-flex w-10 h-10 sm:w-12 sm:h-12 border-4 border-larp-red items-center justify-center text-larp-red text-xl sm:text-2xl font-bold">
                    ✗
                  </div>
                ) : (
                  <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-danger-orange border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <p className={`font-mono text-xs sm:text-sm mb-2 transition-colors ${loadingFailed ? 'text-larp-red' : 'text-danger-orange'}`}>
                {loadingMessage}
              </p>
              <div className="w-full bg-slate-medium h-1.5 sm:h-2 overflow-hidden mb-3 sm:mb-4">
                <div
                  className={`h-full transition-all duration-200 ${loadingFailed ? 'bg-larp-red' : 'bg-danger-orange'}`}
                  style={{ width: `${Math.min(loadingProgress, 99)}%` }}
                />
              </div>
              <p className={`font-mono text-[10px] sm:text-xs ${loadingFailed ? 'text-larp-red' : 'text-ivory-light/50'}`}>
                {loadingFailed ? 'connection terminated' : `${Math.floor(loadingProgress)}% complete`}
              </p>
              {!loadingFailed && (
                <p className="text-ivory-light/30 font-mono text-[9px] sm:text-[10px] mt-3 sm:mt-4">
                  (tap anywhere to give up)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* footer message toast - easter egg */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[400px] z-[100] pointer-events-none">
        <div
          className={`bg-slate-dark border-2 border-danger-orange p-4 font-mono text-sm text-ivory-light transition-all duration-300 ${
            showFooterMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 invisible'
          }`}
          style={{ boxShadow: '4px 4px 0 #FF6B35' }}
        >
          <span className="text-danger-orange">error:</span> {footerMessage}
        </div>
      </div>

      {/* Konami code progress indicator */}
      {konamiProgress > 0 && !konamiActivated && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-slate-dark border-2 border-larp-yellow px-4 py-2 font-mono text-xs text-larp-yellow">
            konami: {Array(konamiProgress).fill('▓').join('')}{Array(6 - konamiProgress).fill('░').join('')}
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
            <div className="bg-larp-red text-black px-6 py-3 font-mono text-sm font-bold border-2 border-black" style={{ boxShadow: '4px 4px 0 black' }}>
              🎮 RUG SIMULATOR UNLOCKED - dev wallet connected. pulling liquidity in 3... 2...
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
