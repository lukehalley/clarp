'use client';

import { useState, useEffect, useCallback } from 'react';
import Footer from '@/components/Footer';
import WarningTicker from '@/components/WarningTicker';
import Terminal from '@/components/Terminal';
import { usePageTransition } from '@/components/ClientLayout';
import {
  Terminal as TerminalIcon,
  Scan,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Target,
  Database,
  Eye,
  Award,
  Search,
  FileText,
  Coins,
  ChevronDown,
  Zap,
} from 'lucide-react';

// ASCII art header
const ROADMAP_ASCII = `
██████╗  ██████╗  █████╗ ██████╗ ███╗   ███╗ █████╗ ██████╗
██╔══██╗██╔═══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗
██████╔╝██║   ██║███████║██║  ██║██╔████╔██║███████║██████╔╝
██╔══██╗██║   ██║██╔══██║██║  ██║██║╚██╔╝██║██╔══██║██╔═══╝
██║  ██║╚██████╔╝██║  ██║██████╔╝██║ ╚═╝ ██║██║  ██║██║
╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝     `;

const ROADMAP_ASCII_LIES = `
██╗     ██╗███████╗███████╗
██║     ██║██╔════╝██╔════╝
██║     ██║█████╗  ███████╗
██║     ██║██╔══╝  ╚════██║
███████╗██║███████╗███████║
╚══════╝╚═╝╚══════╝╚══════╝`;

const ROADMAP_ASCII_COPE = `
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██████╔╝█████╗
██║     ██║   ██║██╔═══╝ ██╔══╝
╚██████╗╚██████╔╝██║     ███████╗
 ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝`;

// Boot sequence messages
const BOOT_MESSAGES = [
  { text: '> booting trust_intelligence...', delay: 0 },
  { text: '> OSINT pipeline: 9 sources connected', delay: 300 },
  { text: '> Grok AI: online', delay: 600 },
  { text: '> terminal: LIVE', delay: 900 },
  { text: '> scanning projects & people...', delay: 1200 },
  { text: '> status: SHIPPING', delay: 1500 },
];

// Snarky messages for various interactions
const PROGRESS_HOVER_MESSAGES = [
  'shipping faster than your favorite ai agent',
  'first mover advantage loading...',
  'no other tool does this. yet.',
  'early believers get rewarded',
  'this is the alpha',
];

const PHASE_CLICK_MESSAGES = [
  'you found the alpha',
  'early research = early rewards',
  'this is what due diligence looks like',
  'you\'re earlier than you think',
  'most won\'t read this far',
];

interface RoadmapFeature {
  name: string;
  status: 'done' | 'in-progress' | 'planned';
  description: string;
  details: string[];
  icon: React.ReactNode;
}

interface RoadmapPhase {
  id: string;
  version: string;
  title: string;
  status: 'live' | 'building' | 'planned' | 'future';
  description: string;
  longDescription: string;
  features: RoadmapFeature[];
  eta: string;
  snarkyNote: string;
}

const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'v1',
    version: '1',
    title: 'CLARP Terminal',
    status: 'live',
    description: 'scan any project or person. trust score with receipts.',
    longDescription: 'The CLARP Terminal is live. Paste any token address, X handle, GitHub URL, website, or search query. Get an evidence-backed trust report with a score from 0-100.',
    features: [
      {
        name: 'trust score engine',
        status: 'done',
        description: 'score 0-100 with confidence levels',
        details: [
          'Five tiers: Verified / Trusted / Neutral / Caution / Avoid',
          'Confidence level: low / medium / high',
          'Evidence-backed scoring with verifiable proof',
          'Separate scores for projects and people',
        ],
        icon: <Target size={18} />,
      },
      {
        name: 'OSINT pipeline',
        status: 'done',
        description: '9 free data sources queried in parallel',
        details: [
          'DexScreener, RugCheck, GitHub API',
          'Domain WHOIS, Wayback Machine',
          'Jupiter, Birdeye, CoinGecko',
          'Telegram, Discord member counts',
          'Pump.fun, Bags.fm launchpad data',
        ],
        icon: <Database size={18} />,
      },
      {
        name: 'Grok AI analysis',
        status: 'done',
        description: 'live X search + profile analysis',
        details: [
          'Team member extraction from X profiles',
          'Shill and hype language detection',
          'Scam allegation discovery',
          'Promotion history and contradictions',
          'Community backlash density',
        ],
        icon: <Search size={18} />,
      },
      {
        name: 'project & people scanning',
        status: 'done',
        description: 'two entity types, one search bar',
        details: [
          'Projects: security, market, GitHub, website, tokenomics',
          'People: team discovery, rug history, shill detection',
          'Entity resolution from any input type',
          'Universal search accepts any identifier',
        ],
        icon: <Scan size={18} />,
      },
      {
        name: 'wallet authentication',
        status: 'done',
        description: 'Phantom/Solflare wallet connect',
        details: [
          'Supabase Web3 Auth integration',
          'On-chain balance verification',
          'Tier-based access control',
        ],
        icon: <Shield size={18} />,
      },
    ],
    eta: 'shipped',
    snarkyNote: 'actually shipped. not a roadmap promise. check it yourself.',
  },
  {
    id: 'v2',
    version: '2',
    title: 'Token Gate + Tokenomics',
    status: 'building',
    description: '100K CLARP to access. fees fund everything.',
    longDescription: 'Hold 100K CLARP to use the terminal. No subscriptions. Every trade on Bags.fm generates a 1% creator fee, distributed automatically: 50% dev, 30% ops, 20% burn.',
    features: [
      {
        name: 'token-gated access',
        status: 'in-progress',
        description: '100K CLARP minimum to use terminal',
        details: [
          'On-chain balance check on connect',
          'No subscriptions, no monthly fees',
          'Hold the token, use the product',
          'Alpha access at higher tiers',
        ],
        icon: <Coins size={18} />,
      },
      {
        name: 'automated fee distribution',
        status: 'in-progress',
        description: '1% creator fee split 50/30/20',
        details: [
          '50% development & growth',
          '30% operations (API costs, infra)',
          '20% burn (buy CLARP → burn address)',
          'Transparent on-chain tracking',
        ],
        icon: <TrendingUp size={18} />,
      },
      {
        name: 'daily CLARP burn',
        status: 'in-progress',
        description: '20% of fees buy and burn daily',
        details: [
          'Buy CLARP on Bags.fm',
          'Send to burn address',
          'Every tx verifiable on Solscan',
          'Supply shrinks every day',
        ],
        icon: <AlertTriangle size={18} />,
      },
      {
        name: 'tokenomics dashboard',
        status: 'planned',
        description: 'real-time fee and burn tracking',
        details: [
          'Live fee distribution display',
          'Burn history and total burned',
          'Supply metrics and charts',
          'Revenue transparency',
        ],
        icon: <Eye size={18} />,
      },
    ],
    eta: 'building now',
    snarkyNote: 'hold the token. use the product. supply shrinks. simple.',
  },
  {
    id: 'v3',
    version: '3',
    title: 'Staking Program',
    status: 'planned',
    description: 'stake $CLARP. earn fee share. tier-based access.',
    longDescription: 'Custom Anchor staking program on Solana. Stake CLARP for 7/30/90 days. Longer locks earn higher APY. Stakers get fee share from platform revenue.',
    features: [
      {
        name: 'on-chain staking',
        status: 'planned',
        description: 'custom Anchor program on Solana',
        details: [
          'Stake CLARP tokens to vault PDA',
          'Lock periods: 7, 30, or 90 days',
          'Tier-based multipliers (1x / 1.5x / 2x)',
          'Rewards from Bags.fm creator fees',
        ],
        icon: <Shield size={18} />,
      },
      {
        name: 'staking tiers',
        status: 'planned',
        description: 'longer lock = higher rewards',
        details: [
          '7 days: 1.0x base APY',
          '30 days: 1.5x boosted APY',
          '90 days: 2.0x maximum APY',
          'Reduces sell pressure via lock-ups',
        ],
        icon: <Award size={18} />,
      },
      {
        name: 'staking dashboard',
        status: 'planned',
        description: 'manage stakes and claim rewards',
        details: [
          'Stake/unstake interface',
          'Real-time reward accrual',
          'Tier status and benefits display',
          'Historical earnings tracking',
        ],
        icon: <FileText size={18} />,
      },
    ],
    eta: 'q1',
    snarkyNote: 'stake it. lock it. earn from the platform you use.',
  },
  {
    id: 'v4',
    version: '4',
    title: 'Rebrand Detection',
    status: 'planned',
    description: 'same team. new name. we see you.',
    longDescription: 'You can rebrand. You can\'t hide your wallet history. Serial ruggers tracked across projects.',
    features: [
      {
        name: 'serial rugger database',
        status: 'planned',
        description: 'track repeat offenders across projects',
        details: [
          'Database of failed/rugged project identifiers',
          'Track team wallet addresses across projects',
          'Flag when same wallets appear in new projects',
          'Alert users before they ape',
        ],
        icon: <AlertTriangle size={18} />,
      },
      {
        name: 'team wallet tracking',
        status: 'planned',
        description: 'follow the money across projects',
        details: [
          'On-chain analysis of deployer wallets',
          'Cross-reference with known rug wallets',
          'Detect wallet clustering patterns',
        ],
        icon: <Coins size={18} />,
      },
      {
        name: 'KOL accountability',
        status: 'planned',
        description: 'who shilled what. with receipts.',
        details: [
          'Track influencer → project relationships',
          'Cross-reference with project outcomes',
          'Build KOL reliability scores',
        ],
        icon: <Award size={18} />,
      },
    ],
    eta: 'q1/q2',
    snarkyNote: 'you can rebrand. you can\'t hide your wallet history.',
  },
  {
    id: 'v5',
    version: '5',
    title: 'Community Intel',
    status: 'future',
    description: 'snitch mode. bounties. hall of shame.',
    longDescription: 'Stake $CLARP to submit intel. Earn bounties for catching rugs early. Hall of shame archives every rug. Community verification with slashing.',
    features: [
      {
        name: 'snitch mode',
        status: 'planned',
        description: 'anonymous reporting with bounties',
        details: [
          'Submit intel on suspicious projects',
          'Stake $CLARP to submit (skin in game)',
          'Bounties for accurate reports',
          'Early warning system',
        ],
        icon: <AlertTriangle size={18} />,
      },
      {
        name: 'hall of shame v2',
        status: 'planned',
        description: 'historical rug archive',
        details: [
          'Comprehensive rugged project database',
          'Pattern analysis across rugs',
          'Searchable by wallet, name, team',
        ],
        icon: <Database size={18} />,
      },
      {
        name: 'community verification',
        status: 'planned',
        description: 'stake $CLARP to validate intel',
        details: [
          'Vote on submitted intel validity',
          'Rewards for accurate verification',
          'Slashing for wrong votes',
        ],
        icon: <Shield size={18} />,
      },
    ],
    eta: 'q2',
    snarkyNote: 'trust no one. verify everything. snitch often.',
  },
];

const getStatusBadge = (status: RoadmapPhase['status']) => {
  switch (status) {
    case 'live': return { bg: 'bg-larp-green/20', border: 'border-larp-green', text: 'text-larp-green', label: 'shipped' };
    case 'building': return { bg: 'bg-danger-orange/20', border: 'border-danger-orange', text: 'text-danger-orange', label: 'building' };
    case 'planned': return { bg: 'bg-danger-orange/20', border: 'border-danger-orange', text: 'text-danger-orange', label: 'planned' };
    case 'future': return { bg: 'bg-slate-light/20', border: 'border-slate-light', text: 'text-slate-light', label: 'copium' };
  }
};

const getFeatureStatus = (status: 'done' | 'in-progress' | 'planned') => {
  switch (status) {
    case 'done': return { icon: <CheckCircle size={16} />, color: 'text-larp-green', label: 'shipped' };
    case 'in-progress': return { icon: <Zap size={16} />, color: 'text-danger-orange', label: 'building' };
    case 'planned': return { icon: <Clock size={16} />, color: 'text-slate-light', label: 'planned' };
  }
};

// Highlight keywords in detail text
const HighlightedText = ({ text }: { text: string }) => {
  const keywords = /\b(GitHub API|Grok|Polymarket|LARP score|GitHub|API)\b/g;
  const numbers = /(\d+%|\d+ days?|\d+\/\d+|24\/7)/g;
  const quotes = /"([^"]+)"/g;

  // Split by all patterns and rebuild with highlights
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Combined regex to find all matches in order
  const combined = new RegExp(`(${keywords.source})|(${numbers.source})|(${quotes.source})`, 'g');
  let match;

  while ((match = combined.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Determine which type of match
    if (match[1]) {
      // Keyword match
      parts.push(<span key={key++} className="font-bold text-slate-dark">{match[1]}</span>);
    } else if (match[2]) {
      // Number match
      parts.push(<span key={key++} className="font-mono text-danger-orange font-bold">{match[2]}</span>);
    } else if (match[3]) {
      // Quote match (includes the quotes)
      parts.push(<span key={key++} className="font-mono bg-slate-dark/5 px-1">{match[3]}</span>);
    }

    lastIndex = combined.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
};

export default function RoadmapPage() {
  const { navigateWithFade } = usePageTransition();
  const [mounted, setMounted] = useState(false);
  const [bootMessages, setBootMessages] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['v1'])); // v1 = terminal (shipped)

  // Easter egg states
  const [asciiClicks, setAsciiClicks] = useState(0);
  const [totalPhaseClicks, setTotalPhaseClicks] = useState(0);
  const [progressClicks, setProgressClicks] = useState(0);
  const [_progressHoverMsg, setProgressHoverMsg] = useState('');
  const [showPhaseClickMsg, setShowPhaseClickMsg] = useState(false);
  const [phaseClickMsg, setPhaseClickMsg] = useState('');
  const [showSmoke, setShowSmoke] = useState(false);
  const [smokePhaseId, setSmokePhaseId] = useState<string | null>(null);
  const [glitchPhaseId, setGlitchPhaseId] = useState<string | null>(null);

  // Calculate progress - only shipped features count
  const totalFeatures = ROADMAP_PHASES.reduce((acc, phase) => acc + phase.features.length, 0);
  const completedFeatures = ROADMAP_PHASES.reduce((acc, phase) =>
    acc + phase.features.filter(f => f.status === 'done').length, 0);
  const inProgressFeatures = ROADMAP_PHASES.reduce((acc, phase) =>
    acc + phase.features.filter(f => f.status === 'in-progress').length, 0);
  // 0% until something actually ships. no credit for "building".
  const progressPercent = Math.round((completedFeatures / totalFeatures) * 100);

  // Boot sequence
  useEffect(() => {
    setMounted(true);

    // Reset state in case of StrictMode double-run
    setBootMessages([]);
    setBootComplete(false);

    const timeoutIds: NodeJS.Timeout[] = [];

    BOOT_MESSAGES.forEach(({ text, delay }) => {
      const id = setTimeout(() => {
        setBootMessages(prev => [...prev, text]);
      }, delay);
      timeoutIds.push(id);
    });

    const completeId = setTimeout(() => {
      setBootComplete(true);
    }, 2000);
    timeoutIds.push(completeId);

    // Cursor blink
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      clearInterval(cursorInterval);
    };
  }, []);

  // ASCII click easter egg
  const handleAsciiClick = () => {
    setAsciiClicks(prev => prev + 1);
  };

  const getAsciiArt = () => {
    if (asciiClicks >= 7) return ROADMAP_ASCII_COPE;
    if (asciiClicks >= 4) return ROADMAP_ASCII_LIES;
    return ROADMAP_ASCII;
  };

  const getAsciiLabel = () => {
    if (asciiClicks >= 7) return 'COPE';
    if (asciiClicks >= 4) return 'LIES';
    return 'ROADMAP';
  };

  // Phase click handler with effects
  const handlePhaseClick = useCallback((phaseId: string) => {
    // Glitch effect
    setGlitchPhaseId(phaseId);
    setTimeout(() => setGlitchPhaseId(null), 150);

    // Smoke effect
    setShowSmoke(true);
    setSmokePhaseId(phaseId);
    setTimeout(() => {
      setShowSmoke(false);
      setSmokePhaseId(null);
    }, 600);

    // Increment counter
    setTotalPhaseClicks(prev => {
      const newCount = prev + 1;
      // Show snarky message every few clicks
      if (newCount % 3 === 0) {
        const msg = PHASE_CLICK_MESSAGES[Math.floor(Math.random() * PHASE_CLICK_MESSAGES.length)];
        setPhaseClickMsg(msg);
        setShowPhaseClickMsg(true);
        setTimeout(() => setShowPhaseClickMsg(false), 2000);
      }
      return newCount;
    });

    // Toggle expansion
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  // Progress bar click
  const handleProgressClick = () => {
    setProgressClicks(prev => prev + 1);
    const msg = PROGRESS_HOVER_MESSAGES[Math.floor(Math.random() * PROGRESS_HOVER_MESSAGES.length)];
    setProgressHoverMsg(msg);
  };

  const getProgressDisplay = () => {
    if (progressClicks >= 10) return { percent: `${progressPercent}%`, message: 'stop clicking. go scan something.' };
    if (progressClicks >= 5) return { percent: `${progressPercent}%`, message: 'clicking won\'t make it ship faster' };
    if (progressClicks >= 1) return { percent: `${progressPercent}%`, message: 'terminal is live. token gate building.' };
    return { percent: `${progressPercent}%`, message: progressPercent > 0 ? 'shipping.' : '' };
  };

  if (!mounted) return null;

  const progressDisplay = getProgressDisplay();

  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Hero with Terminal */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 overflow-hidden">
        {/* Layered background texture */}
        <div className="absolute inset-0 bg-grid bg-[size:24px_24px] opacity-40" />
        <div className="absolute inset-0 bg-noise opacity-50" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Terminal with ASCII */}
            <div className="order-2 lg:order-1">
              <Terminal title="roadmap.exe" canMaximize={false}>
                <div className="min-h-[280px] sm:min-h-[320px]">
                  {/* ASCII Logo */}
                  <pre
                    className={`ascii-art text-danger-orange mb-4 hidden md:block cursor-pointer hover:text-larp-red transition-colors ${
                      asciiClicks >= 4 ? 'animate-[glitch_0.1s_ease-in-out_infinite]' : ''
                    }`}
                    onClick={handleAsciiClick}
                  >
                    {getAsciiArt()}
                  </pre>
                  {/* Mobile fallback */}
                  <div
                    className="md:hidden text-2xl font-bold text-danger-orange mb-4 cursor-pointer"
                    onClick={handleAsciiClick}
                  >
                    {getAsciiLabel()}
                  </div>

                  {/* Boot messages */}
                  <div className="space-y-1">
                    {bootMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`font-mono text-sm ${
                          msg.includes('LOCKED') || msg.includes('ONLINE') ? 'text-larp-green font-bold' :
                          msg.includes('found') ? 'text-danger-orange' :
                          'text-ivory-light/70'
                        }`}
                      >
                        {msg}
                      </div>
                    ))}
                    {!bootComplete && (
                      <span className={`inline-block w-2 h-4 bg-danger-orange ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
                    )}
                    {bootComplete && (
                      <div className="mt-4 pt-4 border-t border-ivory-light/10">
                        <span className="text-larp-green">&gt;</span>{' '}
                        <span className="text-ivory-light font-bold">you're early.</span>
                        <span className={`inline-block w-2 h-4 bg-larp-green ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                    )}
                  </div>

                  {asciiClicks >= 2 && (
                    <p className="text-xs text-ivory-light/30 font-mono mt-4">
                      {asciiClicks >= 7 ? 'maximum cope.' : asciiClicks >= 4 ? 'truth unlocked.' : `clicked ${asciiClicks}x`}
                    </p>
                  )}
                </div>
              </Terminal>
            </div>

            {/* Right: Hero copy */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-dark leading-tight mb-6">
                THE <span className="text-danger-orange">ROADMAP</span>
              </h1>

              <p className="text-xl sm:text-2xl text-slate-dark font-bold mb-3">
                trust intelligence for crypto
              </p>
              <p className="text-lg text-slate-light mb-6">
                scan projects. scan people. <span className="text-danger-orange font-bold">trust with receipts.</span>
              </p>

              {/* Progress Card */}
              <div
                className="bg-white border-2 border-slate-dark p-4 sm:p-5 cursor-pointer hover:border-danger-orange transition-colors"
                style={{ boxShadow: '4px 4px 0 #0a0a09' }}
                onClick={handleProgressClick}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono text-slate-dark font-bold">
                    PROGRESS
                  </span>
                  <span className={`text-lg font-mono font-bold ${
                    progressClicks >= 1 ? 'text-danger-orange' : 'text-danger-orange'
                  }`}>
                    {progressDisplay.percent}
                  </span>
                </div>

                <div className="h-3 bg-ivory-dark border border-slate-dark/20 overflow-hidden relative">
                  {progressPercent === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-mono text-slate-light/50 tracking-widest">EMPTY</span>
                    </div>
                  )}
                  <div
                    className={`h-full transition-all duration-500 ${
                      progressClicks >= 1 ? 'bg-danger-orange animate-pulse' : 'bg-danger-orange'
                    }`}
                    style={{ width: progressPercent === 0 ? '0%' : `${progressPercent}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-light">{completedFeatures} done / {inProgressFeatures} building / {totalFeatures - completedFeatures - inProgressFeatures} planned</span>
                  {progressDisplay.message && (
                    <span className="text-danger-orange font-bold">{progressDisplay.message}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <WarningTicker
        messages={['TERMINAL LIVE', 'OSINT + AI', 'TRUST SCORES', 'SHIPPING']}
        direction="left"
      />

      {/* Roadmap Phases */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-slate-dark relative">
        {/* Texture overlay */}
        <div className="absolute inset-0 bg-noise opacity-30" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          {ROADMAP_PHASES.map((phase) => {
            const isExpanded = expandedPhases.has(phase.id);
            const statusBadge = getStatusBadge(phase.status);
            const isGlitching = glitchPhaseId === phase.id;
            const hasSmokeEffect = showSmoke && smokePhaseId === phase.id;

            return (
              <div
                key={phase.id}
                className={`relative ${isGlitching ? 'animate-[glitch_0.1s_ease-in-out_2]' : ''}`}
              >
                {/* Smoke particles */}
                {hasSmokeEffect && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                    {[...Array(6)].map((_, i) => (
                      <span
                        key={i}
                        className="absolute text-danger-orange/60 font-mono animate-[smoke-rise_0.6s_ease-out_forwards]"
                        style={{
                          left: `${15 + Math.random() * 70}%`,
                          top: '50%',
                          animationDelay: `${i * 0.05}s`,
                          fontSize: `${10 + Math.random() * 6}px`,
                        }}
                      >
                        ░░
                      </span>
                    ))}
                  </div>
                )}

                {/* Phase Header */}
                <div
                  className={`border-2 p-5 sm:p-8 cursor-pointer transition-all ${
                    isExpanded
                      ? 'bg-ivory-light border-danger-orange'
                      : 'bg-ivory-light/5 border-ivory-light/30 hover:border-danger-orange/50'
                  }`}
                  style={{
                    boxShadow: isExpanded ? '6px 6px 0 #FF6B35' : '4px 4px 0 rgba(250,249,245,0.1)'
                  }}
                  onClick={() => handlePhaseClick(phase.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-mono text-xl sm:text-2xl font-bold border-2 shrink-0 ${
                          isExpanded
                            ? 'bg-danger-orange border-slate-dark text-ivory-light'
                            : phase.status === 'building'
                            ? 'bg-danger-orange/20 border-danger-orange text-danger-orange'
                            : 'bg-ivory-light/10 border-ivory-light/50 text-ivory-light'
                        }`}
                        style={{
                          boxShadow: isExpanded
                            ? '4px 4px 0 #141413'
                            : phase.status === 'building'
                            ? '3px 3px 0 #FF6B35'
                            : '3px 3px 0 rgba(250,249,245,0.2)'
                        }}
                      >
                        {phase.version}
                      </div>
                      <div>
                        <h2 className={`text-xl sm:text-2xl font-bold uppercase tracking-wide preserve-case ${isExpanded ? 'text-slate-dark' : 'text-ivory-light'}`}>
                          {phase.title}
                        </h2>
                        <p className={`text-base sm:text-lg mt-2 ${isExpanded ? 'text-slate-dark font-bold' : 'text-ivory-light/80'}`}>
                          {phase.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                      <span className={`px-4 py-1.5 text-xs font-mono font-bold uppercase border-2 ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                      <span className={`text-sm font-mono font-bold ${isExpanded ? 'text-slate-light' : 'text-ivory-light/50'}`}>
                        {phase.eta}
                      </span>
                      <ChevronDown
                        size={24}
                        className={`transition-transform ${isExpanded ? 'rotate-180 text-danger-orange' : 'text-ivory-light/40'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-2 border-t-0 border-danger-orange bg-ivory-light" style={{ boxShadow: '6px 6px 0 #FF6B35' }}>
                    {/* Long description with highlighted keywords */}
                    <div className="p-5 sm:p-8 border-b-2 border-slate-dark/20">
                      <div className="text-lg sm:text-xl text-slate-dark leading-relaxed space-y-4">
                        {phase.id === 'v1' && (
                          <>
                            <p>
                              The CLARP Terminal is <span className="text-larp-green font-bold">live.</span>
                            </p>
                            <p>
                              Paste any <span className="font-bold">token address, X handle, GitHub URL, website,</span> or search query.
                            </p>
                            <p>
                              Get an evidence-backed trust report. <span className="bg-danger-orange/30 px-1 font-bold">Score 0-100.</span>
                            </p>
                            <p className="pt-2 border-t border-slate-dark/10">
                              9 free OSINT sources + Grok AI analysis. <span className="text-danger-orange font-bold">One report.</span>
                            </p>
                          </>
                        )}
                        {phase.id === 'v2' && (
                          <>
                            <p>
                              Hold <span className="font-mono bg-slate-dark text-danger-orange px-2 py-0.5">100K $CLARP</span> to access the terminal.
                            </p>
                            <p>
                              No subscriptions. <span className="font-bold">Hold the token, use the product.</span>
                            </p>
                            <p>
                              1% creator fee on all trades: <span className="text-danger-orange font-bold">50% dev, 30% ops, 20% burn.</span>
                            </p>
                            <p className="text-larp-green font-bold">
                              Supply shrinks daily. Every burn on Solscan.
                            </p>
                          </>
                        )}
                        {phase.id === 'v3' && (
                          <>
                            <p>
                              Stake <span className="font-mono bg-slate-dark text-danger-orange px-2 py-0.5">$CLARP</span> for 7, 30, or 90 days.
                            </p>
                            <p>
                              Longer locks = <span className="font-bold">higher APY.</span>
                            </p>
                            <p>
                              Rewards funded by Bags.fm creator fees.
                            </p>
                            <p className="text-danger-orange font-bold text-xl">
                              Custom Anchor program on Solana.
                            </p>
                          </>
                        )}
                        {phase.id === 'v4' && (
                          <>
                            <p>
                              Same wallets. <span className="font-bold">Different names.</span>
                            </p>
                            <p>
                              You can rebrand.
                            </p>
                            <p className="text-danger-orange font-bold text-xl">
                              You can't hide your wallet history.
                            </p>
                            <p className="bg-larp-red/20 px-3 py-2 inline-block font-bold">
                              Serial ruggers tracked across projects.
                            </p>
                          </>
                        )}
                        {phase.id === 'v5' && (
                          <>
                            <p>
                              Stake <span className="font-mono bg-slate-dark text-danger-orange px-2 py-0.5">$CLARP</span> to submit intel.
                            </p>
                            <p>
                              <span className="font-bold">Earn bounties</span> for catching rugs early.
                            </p>
                            <p className="bg-larp-red/20 px-3 py-2 inline-block font-bold">
                              Hall of shame archives every rug.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                      {phase.features.map((feature, idx) => {
                        const featureStatus = getFeatureStatus(feature.status);

                        return (
                          <div
                            key={idx}
                            className="border-2 border-slate-dark/30 p-4 sm:p-5 bg-white hover:border-danger-orange transition-colors"
                            style={{ boxShadow: '3px 3px 0 rgba(10,10,9,0.15)' }}
                          >
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div className="flex items-start gap-3">
                                <span className={`mt-1 ${feature.status === 'done' ? 'text-larp-green' : 'text-danger-orange'}`}>
                                  {feature.icon}
                                </span>
                                <div>
                                  <h3 className={`font-mono text-base sm:text-lg font-bold ${feature.status === 'done' ? 'text-larp-green' : 'text-slate-dark'}`}>
                                    {feature.name}
                                    {feature.status === 'done' && <span className="ml-2">✓</span>}
                                  </h3>
                                  <p className="text-sm sm:text-base text-slate-medium font-medium mt-1">{feature.description}</p>
                                </div>
                              </div>
                              <span className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border ${
                                feature.status === 'done' ? 'border-larp-green bg-larp-green/10' :
                                feature.status === 'in-progress' ? 'border-danger-orange bg-danger-orange/10' :
                                'border-slate-light/50 bg-slate-light/10'
                              } ${featureStatus.color}`}>
                                {featureStatus.icon}
                                <span className="hidden sm:inline uppercase">{featureStatus.label}</span>
                              </span>
                            </div>

                            <ul className="ml-7 space-y-2.5">
                              {feature.details.map((detail, i) => (
                                  <li key={i} className="text-sm flex items-start gap-2.5 group">
                                    <span className={`shrink-0 font-bold mt-0.5 ${feature.status === 'done' ? 'text-larp-green' : 'text-danger-orange group-hover:scale-125 transition-transform'}`}>
                                      {feature.status === 'done' ? '✓' : '▸'}
                                    </span>
                                    <span className={`${feature.status === 'done' ? 'text-slate-light line-through' : 'text-slate-dark'}`}>
                                      <HighlightedText text={detail} />
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 sm:p-6 bg-slate-dark border-t-2 border-danger-orange">
                      <p className="text-base sm:text-lg font-mono text-ivory-light">
                        <span className="text-danger-orange font-bold">//</span> <span className="font-bold">{phase.snarkyNote}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Click counter easter egg */}
          {totalPhaseClicks >= 5 && (
            <div className="text-center pt-4">
              <p className="text-xs font-mono text-ivory-light/30">
                {totalPhaseClicks >= 20
                  ? `${totalPhaseClicks} clicks. you're more thorough than most vcs.`
                  : totalPhaseClicks >= 10
                  ? `${totalPhaseClicks} clicks. doing actual research?`
                  : `clicked ${totalPhaseClicks} times. curious one, aren't you.`
                }
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Snarky toast message */}
      {showPhaseClickMsg && (
        <div
          className="fixed left-2 sm:left-4 z-50 animate-slide-in"
          style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div
            className="bg-ivory-light border-2 border-slate-dark px-3 py-2 font-mono text-xs w-[280px] sm:w-[320px]"
            style={{ boxShadow: '4px 4px 0 var(--slate-dark)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-danger-orange text-danger-orange">
                !
              </span>
              <span className="text-slate-light text-[9px] uppercase tracking-wider">alpha</span>
            </div>
            <p className="text-slate-dark leading-tight">
              <span className="text-danger-orange font-bold">$</span> {phaseClickMsg}
            </p>
          </div>
        </div>
      )}

      {/* Ticker */}
      <WarningTicker
        messages={['9 OSINT SOURCES', 'GROK AI', 'TRUST SCORES', 'EVIDENCE > VIBES']}
        direction="right"
      />

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-grid bg-[size:24px_24px] opacity-30" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-dark mb-6 uppercase tracking-wide">
            {totalPhaseClicks >= 15
              ? 'YOU DID THE RESEARCH'
              : 'SCAN ANYTHING'
            }
          </h2>
          <p className="text-xl sm:text-2xl text-slate-dark font-bold mb-3">
            {totalPhaseClicks >= 15
              ? 'most won\'t read this far.'
              : 'trust intelligence for crypto.'
            }
          </p>
          <p className="text-lg text-slate-light mb-8">
            {totalPhaseClicks >= 15
              ? <><span className="text-danger-orange font-bold">you're early.</span></>
              : <>terminal is <span className="text-larp-green font-bold">live</span>. token gate <span className="text-danger-orange font-bold">building now</span>.</>
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/terminal"
              onClick={(e) => { e.preventDefault(); navigateWithFade('/terminal'); }}
              className="btn-primary inline-flex items-center justify-center gap-2 text-base px-8 py-4 cursor-pointer"
            >
              <TerminalIcon size={20} />
              LAUNCH TERMINAL
            </a>
            <a
              href="https://dexscreener.com/solana/GtwMkjRY8Vi5oGaLaEsd1xnsr3AkZ6ZYBqsG5ipTBAGS"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center justify-center gap-2 text-base px-8 py-4"
            >
              DEXSCREENER
            </a>
          </div>

          <p className="text-base text-slate-dark font-mono mt-10">
            scan projects. scan people. <span className="text-danger-orange font-bold">trust with receipts.</span>
          </p>
        </div>
      </section>

      {/* Final Ticker */}
      <WarningTicker
        messages={['BUILDING NOW', 'TOKEN GATE', 'STAKING', 'SHIPPING']}
        direction="left"
      />

      <Footer />

      {/* Smoke animation styles */}
      <style jsx global>{`
        @keyframes smoke-rise {
          0% {
            opacity: 0.8;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px) scale(1.5);
          }
        }
      `}</style>
    </main>
  );
}
