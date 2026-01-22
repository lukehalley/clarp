'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import WarningTicker from '@/components/WarningTicker';
import Footer from '@/components/Footer';
import {
  Terminal,
  Bot,
  Scan,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  MessageSquare,
  GitBranch,
  Shield,
  Target,
  Rocket,
  Construction,
  Twitter,
  Code,
  Database,
  Eye,
  DollarSign,
  Award,
  Search,
  FileText,
  Lock,
  Coins,
  Heart
} from 'lucide-react';

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
    id: 'v0',
    version: 'v0.1',
    title: 'vapourware detector',
    status: 'building',
    description: 'paste any github repo. get a verdict. ai recognizes ai.',
    longDescription: 'The foundation of CLARP - a working scanner that analyzes GitHub repositories and returns an honest assessment of whether the project is real or just another AI-generated facade. Uses Claude AI to analyze code patterns, commit history, contributor authenticity, and documentation quality.',
    features: [
      {
        name: 'github repo scanner',
        status: 'in-progress',
        description: 'fetch and analyze any public repository',
        details: [
          'Parses GitHub URLs in multiple formats (full URL, owner/repo shorthand)',
          'Fetches repository metadata via GitHub API (stars, forks, creation date, last push)',
          'Retrieves full file tree structure up to 500 files',
          'Downloads and analyzes README content',
          'Rate-limited to respect GitHub API limits',
        ],
        icon: <GitBranch size={20} />,
      },
      {
        name: 'claude ai analysis',
        status: 'in-progress',
        description: 'ai-powered code quality and authenticity assessment',
        details: [
          'Uses Claude 3.5 Haiku for fast, cost-effective analysis',
          'Custom prompt engineered to detect AI-generated code patterns',
          'Analyzes commit messages for authenticity signals',
          'Evaluates README-to-code ratio for "documentation theater" detection',
          'Returns structured JSON verdict with confidence scores',
        ],
        icon: <Bot size={20} />,
      },
      {
        name: 'LARP score (0-100)',
        status: 'in-progress',
        description: 'quantified assessment of project legitimacy',
        details: [
          '90-100: Confirmed vapourware - obvious AI slop, zero substance',
          '70-89: Highly suspicious - probably abandoned or rugpull material',
          '50-69: Yellow flags - some real code but concerning patterns',
          '30-49: Probably fine - minor concerns but appears legitimate',
          '0-29: Appears legitimate - rare, actual development happening',
        ],
        icon: <Target size={20} />,
      },
      {
        name: 'detection matrix (6 signals)',
        status: 'in-progress',
        description: 'multi-dimensional analysis of red flags',
        details: [
          'AI-generated code: Detects Claude/GPT patterns',
          'README bloat: Docs exceed code substance',
          'Ghost commits: Bulk commits, suspicious patterns',
          'Copy-paste signatures: Stack Overflow code detection',
          'Fake contributors: Single dev claiming team',
          'Test coverage: Zero tests = zero confidence',
        ],
        icon: <Scan size={20} />,
      },
    ],
    eta: 'q1 2025',
    snarkyNote: 'building the thing that detects when others aren\'t building. ironic? maybe. necessary? absolutely.',
  },
  {
    id: 'v1',
    version: 'v1.0',
    title: 'polymarket intelligence layer',
    status: 'planned',
    description: 'polymarket shows what people bet. we show why they\'re wrong.',
    longDescription: 'Polymarket has crypto betting markets - "will X ship?", "will Y refund?". But betting odds don\'t tell you if the project is legit. TROVE had 80% "will raise $20M" odds. They did. Then kept $12.7M. CLARP adds the evidence layer: pull markets, analyze underlying projects, show both together.',
    features: [
      {
        name: 'polymarket API integration',
        status: 'planned',
        description: 'pull all crypto markets (tag_id=21)',
        details: [
          'Connect to Polymarket Gamma API',
          'Filter for crypto-related markets only',
          'Fetch market title, outcomes, prices, volume',
          'Real-time odds data',
          'Daily refresh via Vercel cron',
        ],
        icon: <TrendingUp size={20} />,
      },
      {
        name: 'project mapping system',
        status: 'planned',
        description: 'link markets to underlying projects',
        details: [
          'Map market_id → GitHub, X handle, contract',
          'Manual curation for top 20 markets (MVP)',
          'Extract project identifiers from market text',
          'Flag unmapped markets as "unanalyzed"',
          'Community submissions for new mappings',
        ],
        icon: <Database size={20} />,
      },
      {
        name: 'CLARP analysis overlay',
        status: 'planned',
        description: 'run CLARP scan on each project',
        details: [
          'GitHub analysis (if repo exists)',
          'X/Twitter account analysis (age, activity, patterns)',
          'Contract analysis (fork detection, deployer history)',
          'Rebrand detection (wallet connections)',
          'No code? That\'s a signal itself.',
        ],
        icon: <Search size={20} />,
      },
      {
        name: 'markets dashboard',
        status: 'planned',
        description: '/markets page showing combined data',
        details: [
          'Card layout: market title + odds + CLARP score',
          'Red flags prominently displayed',
          'Filter by: All / High LARP / Low LARP',
          'Sort by: Volume / CLARP Score / Ending Soon',
          'Link to Polymarket for betting',
        ],
        icon: <Eye size={20} />,
      },
      {
        name: 'market detail pages',
        status: 'planned',
        description: 'deep dive on individual markets',
        details: [
          'Full CLARP analysis breakdown',
          'Polymarket odds history',
          'Project background and flags',
          'Related markets',
          'Share button for X',
        ],
        icon: <FileText size={20} />,
      },
    ],
    eta: 'q1 2025',
    snarkyNote: 'polymarket = what people bet. CLARP = what the code says. together = full picture before you ape.',
  },
  {
    id: 'v2',
    version: 'v2.0',
    title: 'enhanced detection',
    status: 'planned',
    description: 'catch serial offenders. nowhere to hide.',
    longDescription: 'Inspired by the TROVE/Space/UFO Gaming pattern - projects that fail, rebrand, and ICO again. You can change your name, but you can\'t hide your wallet history. Enhanced detection catches rebrands, tracks team wallets, and monitors KOL accountability.',
    features: [
      {
        name: 'rebrand detection',
        status: 'planned',
        description: 'catch serial ICO offenders',
        details: [
          'Database of failed/rugged project identifiers',
          'Track team wallet addresses across projects',
          'Flag when same wallets appear in "new" projects',
          'Case study: TROVE = UFO Gaming rebrand',
          'Alert users before they ape',
        ],
        icon: <AlertTriangle size={20} />,
      },
      {
        name: 'logo similarity detection',
        status: 'planned',
        description: 'same asterisk, different name',
        details: [
          'Perceptual hash comparison against known logos',
          'Detect visual similarity with color changes',
          'UFO Gaming → TROVE → Space logo pattern',
          'Community-contributed logo database',
        ],
        icon: <Eye size={20} />,
      },
      {
        name: 'team wallet tracking',
        status: 'planned',
        description: 'follow the money across projects',
        details: [
          'On-chain analysis of deployer wallets',
          'Cross-reference with known rug wallets',
          'Detect wallet clustering patterns',
          '"New team" = old team with new wallets',
        ],
        icon: <Coins size={20} />,
      },
      {
        name: 'KOL accountability tracker',
        status: 'planned',
        description: 'who shilled what. with receipts.',
        details: [
          'Track influencer → project relationships',
          'Cross-reference with project outcomes',
          'Build KOL reliability scores',
          'wale.moca promoted TROVE, now apologizing',
          'Undisclosed paid relationships flagged',
        ],
        icon: <Award size={20} />,
      },
    ],
    eta: 'q2 2025',
    snarkyNote: '$20M raised. $12.7M kept. "transparency" post after the fact. we see the pattern.',
  },
  {
    id: 'v3',
    version: 'v3.0',
    title: 'distribution & community',
    status: 'future',
    description: 'make scanning viral. snitch mode activated.',
    longDescription: 'Expanding access beyond the website. Tag @CLARP on X to scan any project publicly. Use the Claude Code skill for local scanning. Community intel layer with anonymous reporting and bounties for catching rugs early.',
    features: [
      {
        name: 'x bot (@CLARP)',
        status: 'planned',
        description: 'tag to scan any project publicly',
        details: [
          'Mention @CLARP with GitHub URL to scan',
          'Bot replies with LARP score and flags',
          'Public accountability via replies',
          'Queue system for volume spikes',
          '"scanned. larp score: 94. godspeed."',
        ],
        icon: <Twitter size={20} />,
      },
      {
        name: 'claude code skill',
        status: 'planned',
        description: 'scan repos locally via MCP',
        details: [
          'Model Context Protocol skill for Claude Code',
          'Run /clarp-scan on any directory',
          'No API calls - runs locally',
          'Self-audit before shipping',
          'Distribution via Claude marketplace',
        ],
        icon: <Terminal size={20} />,
      },
      {
        name: 'snitch mode',
        status: 'planned',
        description: 'anonymous reporting with bounties',
        details: [
          'Submit intel on suspicious projects',
          'Stake $CLARP to submit (skin in game)',
          'Bounties for accurate reports',
          'Early warning system',
          'Whistleblower protections',
        ],
        icon: <AlertTriangle size={20} />,
      },
      {
        name: 'hall of shame v2',
        status: 'planned',
        description: 'historical rug archive',
        details: [
          'Comprehensive rugged project database',
          'Pattern analysis across rugs',
          'Team connection mapping',
          'Searchable by wallet, name, team',
          '"Learn from history or repeat it"',
        ],
        icon: <Database size={20} />,
      },
    ],
    eta: 'q3 2025',
    snarkyNote: 'trust no one. verify everything. snitch often.',
  },
  {
    id: 'v4',
    version: 'v4.0',
    title: 'charity flywheel',
    status: 'future',
    description: 'buy $CLARP to save ourselves from AI domination.',
    longDescription: 'A fee distribution model that funds AI safety research. Because if we\'re using AI to detect AI-generated scams, we should probably also fund the people trying to make sure AI doesn\'t destroy us all.',
    features: [
      {
        name: 'fee distribution',
        status: 'planned',
        description: 'sustainable tokenomics',
        details: [
          '40% Buyback & burn',
          '30% AI safety charity donations',
          '20% Development funding',
          '10% Community rewards',
          'Transparent on-chain tracking',
        ],
        icon: <Coins size={20} />,
      },
      {
        name: 'verified donations',
        status: 'planned',
        description: 'provable charity contributions',
        details: [
          'MIRI, Future of Life Institute partnerships',
          'On-chain donation receipts',
          'Public donation dashboard',
          'Community governance on recipients',
        ],
        icon: <Heart size={20} />,
      },
      {
        name: 'community verification',
        status: 'planned',
        description: 'stake $CLARP to validate intel',
        details: [
          'Vote on submitted intel validity',
          'Rewards for accurate verification',
          'Slashing for wrong votes',
          'Decentralized threat intelligence',
        ],
        icon: <Shield size={20} />,
      },
    ],
    eta: '2026',
    snarkyNote: 'ai built this page. ai detects the scams. might as well fund ai safety.',
  },
];

const TICKER_MESSAGES = [
  'roadmap loaded. actually.',
  'polymarket + clarp = full picture',
  'odds without evidence is gambling',
  'building in public',
  'judging their code',
  'trust no roadmap except this one',
];

const getStatusColor = (status: RoadmapPhase['status']) => {
  switch (status) {
    case 'live': return 'text-larp-green';
    case 'building': return 'text-danger-orange';
    case 'planned': return 'text-larp-yellow';
    case 'future': return 'text-slate-light';
    default: return 'text-slate-light';
  }
};

const getStatusBadge = (status: RoadmapPhase['status']) => {
  switch (status) {
    case 'live': return 'bg-larp-green/10 border-larp-green/30 text-larp-green';
    case 'building': return 'bg-danger-orange/10 border-danger-orange/30 text-danger-orange';
    case 'planned': return 'bg-larp-yellow/10 border-larp-yellow/30 text-larp-yellow';
    case 'future': return 'bg-slate-light/10 border-slate-light/30 text-slate-light';
    default: return 'bg-slate-light/10 border-slate-light/30 text-slate-light';
  }
};

const getFeatureStatusIcon = (status: 'done' | 'in-progress' | 'planned') => {
  switch (status) {
    case 'done': return <CheckCircle size={16} className="text-larp-green" />;
    case 'in-progress': return <Clock size={16} className="text-danger-orange animate-pulse" />;
    case 'planned': return <Construction size={16} className="text-slate-light" />;
  }
};

const getFeatureStatusText = (status: 'done' | 'in-progress' | 'planned') => {
  switch (status) {
    case 'done': return 'shipped';
    case 'in-progress': return 'building';
    case 'planned': return 'planned';
  }
};

export default function RoadmapPage() {
  const [mounted, setMounted] = useState(false);
  const [terminalText, setTerminalText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setMounted(true);

    const text = '$ clarp --roadmap --verbose --honest';
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i <= text.length) {
        setTerminalText(text.slice(0, i));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 40);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen overflow-x-hidden bg-ivory-light">
      <Navbar />

      {/* Back button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-dark text-ivory-light font-mono text-sm border-2 border-slate-dark hover:bg-danger-orange hover:border-danger-orange hover:text-slate-dark transition-colors"
          style={{ boxShadow: '3px 3px 0 #1a1a2e' }}
        >
          <span>←</span>
          <span>back to main</span>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />

        <div className="max-w-4xl mx-auto relative text-center">
          {/* Terminal prompt */}
          <div className="bg-slate-dark border-2 border-danger-orange p-4 sm:p-6 text-left max-w-2xl mx-auto mb-8" style={{ boxShadow: '6px 6px 0 #FF6B35' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-larp-red/50" />
              <div className="w-3 h-3 rounded-full bg-larp-yellow/50" />
              <div className="w-3 h-3 rounded-full bg-larp-green/50" />
              <span className="ml-2 text-xs text-ivory-light/40 font-mono">roadmap.exe v1.0</span>
            </div>
            <div className="font-mono text-sm text-ivory-light">
              <span className="text-danger-orange">$</span>{' '}
              <span className="text-larp-green">{terminalText}</span>
              <span className={`inline-block w-2 h-4 bg-danger-orange ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            <div className="mt-3 text-xs text-ivory-light/60 font-mono space-y-1">
              <div><span className="text-larp-green">✓</span> autonomous trust pilot initialized...</div>
              <div><span className="text-larp-green">✓</span> polymarket integration planned</div>
              <div><span className="text-larp-green">✓</span> evidence layer: active</div>
              <div><span className="text-danger-orange">!</span> warning: we might actually keep you safe</div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-dark leading-tight mb-6 font-display">
            the <span className="text-danger-orange">roadmap</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-light mb-4 font-mono">
            the first autonomous trust pilot for crypto.
          </p>
          <p className="text-sm sm:text-base text-slate-light max-w-2xl mx-auto">
            polymarket shows what people bet. CLARP shows why they're wrong.
            we're building the <span className="text-danger-orange font-bold">evidence layer</span> that keeps you safe from rugs and larps.
          </p>
        </div>
      </section>

      {/* Ticker */}
      <WarningTicker messages={TICKER_MESSAGES} direction="left" />

      {/* Roadmap Phases - Light background, expanded */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          {ROADMAP_PHASES.map((phase, phaseIndex) => (
            <div key={phase.id} className="relative">
              {/* Phase Header */}
              <div className="mb-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-2xl sm:text-3xl font-bold text-danger-orange font-mono">{phase.version}</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-dark font-display">{phase.title}</h2>
                  <span className={`px-3 py-1 text-xs font-mono border ${getStatusBadge(phase.status)}`}>
                    {phase.status}
                  </span>
                </div>
                <p className="text-lg text-slate-light font-mono mb-2">{phase.description}</p>
                <p className="text-sm text-slate-light/80 max-w-3xl">{phase.longDescription}</p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-slate-light">ETA:</span>
                  <span className={`font-mono font-bold ${phase.status === 'live' ? 'text-larp-green' : 'text-slate-dark'}`}>
                    {phase.eta}
                  </span>
                </div>
              </div>

              {/* Features Grid */}
              <div className="space-y-6">
                {phase.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="bg-white border-2 border-slate-dark/10 p-6 hover:border-danger-orange/30 transition-colors"
                    style={{ boxShadow: '4px 4px 0 rgba(10,10,9,0.1)' }}
                  >
                    {/* Feature Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-slate-dark/5 text-slate-dark">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-dark font-mono">{feature.name}</h3>
                          <p className="text-sm text-slate-light">{feature.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getFeatureStatusIcon(feature.status)}
                        <span className={`text-xs font-mono ${
                          feature.status === 'done' ? 'text-larp-green' :
                          feature.status === 'in-progress' ? 'text-danger-orange' :
                          'text-slate-light'
                        }`}>
                          {getFeatureStatusText(feature.status)}
                        </span>
                      </div>
                    </div>

                    {/* Feature Details */}
                    <div className="ml-14 pl-4 border-l-2 border-slate-dark/10">
                      <ul className="space-y-2">
                        {feature.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-2 text-sm text-slate-light">
                            <span className="text-danger-orange shrink-0 mt-1">▸</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Snarky Note */}
              <div className="mt-6 p-4 bg-danger-orange/5 border-l-4 border-danger-orange">
                <p className="text-sm text-slate-dark font-mono">
                  <span className="text-danger-orange font-bold">note:</span> {phase.snarkyNote}
                </p>
              </div>

              {/* Divider (except for last phase) */}
              {phaseIndex < ROADMAP_PHASES.length - 1 && (
                <div className="mt-16 flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-dark/10" />
                  <span className="text-xs text-slate-light font-mono">next phase</span>
                  <div className="flex-1 h-px bg-slate-dark/10" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Ticker */}
      <WarningTicker messages={['autonomous trust pilot', 'polymarket odds + clarp evidence', 'keeping you safe from rugs', 'actually building']} direction="right" />

      {/* Mission Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ivory-light mb-4 font-display">
              the <span className="text-danger-orange">mission</span>
            </h2>
            <p className="text-lg text-ivory-light/60 font-mono">
              the first autonomous trust pilot for crypto
            </p>
          </div>

          <div className="space-y-6 font-mono text-base sm:text-lg">
            <div className="flex items-start gap-4 p-6 bg-ivory-light/5 border border-ivory-light/10">
              <span className="text-danger-orange shrink-0 text-xl">▸</span>
              <p className="text-ivory-light/80">
                <span className="text-danger-orange font-bold">rugchecker</span> tells you if the contract will drain your wallet.
              </p>
            </div>
            <div className="flex items-start gap-4 p-6 bg-ivory-light/5 border border-ivory-light/10">
              <span className="text-larp-green shrink-0 text-xl">▸</span>
              <p className="text-ivory-light/80">
                <span className="text-larp-green font-bold">$CLARP</span> tells you if there's anything behind the contract at all.
              </p>
            </div>
            <div className="flex items-start gap-4 p-6 bg-ivory-light/5 border border-ivory-light/10">
              <span className="text-larp-yellow shrink-0 text-xl">▸</span>
              <p className="text-ivory-light/80">
                <span className="text-larp-yellow font-bold">polymarket</span> tells you what people bet. <span className="text-danger-orange font-bold">CLARP</span> tells you why they're wrong.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-ivory-light/40 text-sm font-mono mb-8">
              autonomous trust pilot. keeping you safe from rugs and larps.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vapourware-detector" className="btn-primary">
                try the detector
              </Link>
              <a
                href="https://x.com/i/communities/2013904367188132011"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                join on x
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom note */}
      <section className="py-8 px-4 sm:px-6 bg-ivory-light">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-slate-light/60 font-mono">
            this roadmap will be updated as we build. unlike most roadmaps, which are updated never.
          </p>
        </div>
      </section>

      {/* Final ticker */}
      <WarningTicker messages={['autonomous trust pilot', 'evidence over odds', 'safe from rugs', 'building continues']} direction="left" />

      <Footer />
    </main>
  );
}
