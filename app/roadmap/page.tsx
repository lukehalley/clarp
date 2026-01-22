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
          'Rate-limited to respect GitHub API limits (60 req/hr unauthenticated, 5000 with token)',
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
        name: 'vapourware score (0-100)',
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
          'AI-generated code: Detects Claude/GPT patterns, "helpful assistant" energy',
          'README bloat: Flags when documentation exceeds actual code substance',
          'Ghost commits: Bulk commits at odd hours, suspicious "initial commit" dumps',
          'Copy-paste signatures: Identifies Stack Overflow code and common boilerplate',
          'Fake contributors: Single dev claiming team, wallet sybil patterns',
          'Test coverage: Zero tests = zero confidence in the product',
        ],
        icon: <Scan size={20} />,
      },
      {
        name: 'ROPI score (return on perceived investment)',
        status: 'in-progress',
        description: 'satirical metric for expected disappointment',
        details: [
          'Proprietary algorithm measuring gap between marketing and reality',
          'Higher score = higher likelihood of disappointment',
          'Factors in buzzword density, roadmap ambition vs. code reality',
          'Displayed prominently to manage investor expectations',
        ],
        icon: <TrendingUp size={20} />,
      },
      {
        name: 'recent scans feed',
        status: 'planned',
        description: 'community-driven hall of shame',
        details: [
          'Real-time feed of repos scanned by the community',
          'Shows repo name, verdict, and score',
          'Temporary storage (resets on server restart for now)',
          'Public accountability - scans are visible to all',
        ],
        icon: <MessageSquare size={20} />,
      },
    ],
    eta: 'q1 2025',
    snarkyNote: 'building the thing that detects when others aren\'t building. ironic? maybe. necessary? absolutely.',
  },
  {
    id: 'v1',
    version: 'v1.0',
    title: 'distribution layer',
    status: 'building',
    description: 'make scanning frictionless. tag us. we expose.',
    longDescription: 'Expanding access to the vapourware detector beyond the website. The goal is zero-friction scanning - see a suspicious project on X? Tag us. Want to audit before you commit? Use the Claude skill. Building the viral loop that makes CLARP the default DD tool.',
    features: [
      {
        name: 'x bot (@CLARP)',
        status: 'in-progress',
        description: 'tag to scan any project publicly on x',
        details: [
          'Mention @CLARP with a GitHub URL to trigger a scan',
          'Bot replies with verdict in CLARP\'s deadpan voice',
          'Public replies create social accountability',
          'Queue system to handle volume spikes',
          'Rate limiting per user to prevent abuse',
          'Example: "@CLARP scan https://github.com/suspicious/repo"',
          'Response: "scanned. larp score: 94. one contributor. forked from uniswap. last commit: 47 days ago. godspeed."',
        ],
        icon: <Twitter size={20} />,
      },
      {
        name: 'claude skill (MCP)',
        status: 'planned',
        description: 'scan local repos via claude code',
        details: [
          'Model Context Protocol (MCP) skill for Claude Code',
          'Run /clarp-scan on any local directory',
          'No API calls needed - runs entirely locally',
          'Developers can self-audit before shipping',
          'Investors can scan repos before committing capital',
          'Distribution via Claude Code marketplace',
          'Easy win - low complexity, high value',
        ],
        icon: <Terminal size={20} />,
      },
      {
        name: 'x profile scanner',
        status: 'planned',
        description: 'scan social accounts for larp signals',
        details: [
          'Analyze X profiles beyond just GitHub links',
          'Detect AI-generated tweet patterns',
          'Follower/following ratio analysis',
          'Account age vs. activity patterns',
          'Cross-reference promises made in tweets vs. GitHub activity',
          'Team claims verification (do the "co-founders" actually exist?)',
          'Engagement authenticity scoring',
        ],
        icon: <Users size={20} />,
      },
    ],
    eta: 'q1 2025',
    snarkyNote: 'soon. but like, actually soon. not "crypto soon" where it means never.',
  },
  {
    id: 'v2',
    version: 'v2.0',
    title: 'enhanced detection',
    status: 'planned',
    description: 'more signals. better detection. nowhere to hide.',
    longDescription: 'Expanding the detection matrix from 6 signals to 9+, with particular focus on detecting serial offenders. Inspired by the TROVE/Space/UFO Gaming pattern - projects that fail, rebrand, and ICO again. You can change your name, but you can\'t hide your history.',
    features: [
      {
        name: 'rebrand detection',
        status: 'planned',
        description: 'catch serial ICO offenders who rebrand and try again',
        details: [
          'Build database of failed/rugged project identifiers',
          'Track team wallet addresses across projects',
          'Detect when same wallets appear in "new" projects',
          'Flag projects with connections to known bad actors',
          'Case study: TROVE raised $20M, kept $12.7M - same team as failed UFO Gaming',
          'Alert users to historical connections before they ape',
        ],
        icon: <AlertTriangle size={20} />,
      },
      {
        name: 'logo similarity detection',
        status: 'planned',
        description: 'same asterisk, different name',
        details: [
          'Perceptual hash comparison against database of known project logos',
          'Detect visual similarity even with color/minor changes',
          'Flag suspicious visual branding overlap',
          'Example: UFO Gaming → TROVE → Space all used asterisk logo variants',
          'Build community-contributed logo database of rugged projects',
        ],
        icon: <Eye size={20} />,
      },
      {
        name: 'team wallet tracking',
        status: 'planned',
        description: 'follow the money across projects',
        details: [
          'On-chain analysis of deployer and team wallets',
          'Cross-reference with wallets from known rugs',
          'Detect wallet clustering patterns',
          'Identify when "new team" is actually old team with new wallets',
          'Integration with existing wallet tracking services',
        ],
        icon: <Database size={20} />,
      },
      {
        name: 'KOL tracking',
        status: 'planned',
        description: 'who shilled what. with receipts.',
        details: [
          'Track which influencers promote which projects',
          'Cross-reference with project outcomes (ship vs. rug)',
          'Build influencer reliability scores',
          'Case study: wale.moca promoted TROVE, now apologizing for undisclosed paid relationship',
          'Help users evaluate promoter credibility',
        ],
        icon: <Award size={20} />,
      },
      {
        name: 'composite LARP score',
        status: 'planned',
        description: '9 weighted signals, normalized 0-1',
        details: [
          'Originality: Clone/fork similarity detection',
          'Contributor distribution: Single-wallet dev vs. real team',
          'Commit patterns: Pre-launch bursts, abandonment signals',
          'Dependency hygiene: Outdated/vulnerable packages',
          'Documentation quality: Substance vs. marketing fluff',
          'Test presence: Actual coverage, not just existence',
          'Bus factor: Maintainer risk assessment',
          'Security signals: Audit status, known vulnerabilities',
          'Rebrand detection: Serial offender flagging',
          'Weights tuned based on historical rug data',
        ],
        icon: <Target size={20} />,
      },
    ],
    eta: 'q2 2025',
    snarkyNote: '$20M raised. $12.7M kept. "transparency" post after the fact. we see the pattern.',
  },
  {
    id: 'v3',
    version: 'v3.0',
    title: 'prediction markets',
    status: 'future',
    description: 'put your money where your mouth is.',
    longDescription: 'Static analysis tells you how a project looks right now. Prediction markets tell you what the crowd believes will happen. Auto-resolving markets with no oracle trust required - outcomes verified directly via GitHub API. Crowdsourced conviction with skin in the game.',
    features: [
      {
        name: 'ship market',
        status: 'planned',
        description: '"will this repo publish a release in the next 30/60 days?"',
        details: [
          'Binary market: YES/NO on release publication',
          'Automatically resolves by checking GitHub releases API',
          'No oracle needed - outcome is programmatically verifiable',
          'Timeframes: 30 days, 60 days, 90 days',
          'Market makers incentivized to provide liquidity',
        ],
        icon: <Rocket size={20} />,
      },
      {
        name: 'sustain market',
        status: 'planned',
        description: '"will repo have ≥N external contributors in 60 days?"',
        details: [
          'Measures genuine community contribution',
          'Defines "external" as non-core team contributors',
          'Resolves via GitHub contributors API',
          'Tests claim of "growing community"',
          'Higher bar than just having a Discord',
        ],
        icon: <Users size={20} />,
      },
      {
        name: 'deliver market',
        status: 'planned',
        description: '"will milestone X be completed by date Y?"',
        details: [
          'Tied to GitHub milestones (if project uses them)',
          'Resolves when milestone is closed or deadline passes',
          'Tests roadmap credibility with real stakes',
          'Projects with no milestones can\'t participate (feature, not bug)',
        ],
        icon: <CheckCircle size={20} />,
      },
      {
        name: 'quality market',
        status: 'planned',
        description: '"will ≥K PRs from non-core contributors be merged by date Y?"',
        details: [
          'Measures actual open-source health',
          'Non-core = not in initial team wallets/accounts',
          'Merged PRs indicate real collaboration',
          'Resolves via GitHub PR API',
        ],
        icon: <Code size={20} />,
      },
      {
        name: 'auto-resolution engine',
        status: 'planned',
        description: 'github api verification. no oracle trust required.',
        details: [
          'All market outcomes verifiable via public APIs',
          'Smart contract reads GitHub API at resolution time',
          'No centralized oracle making judgment calls',
          'Fully transparent resolution logic',
          'Appeals process for edge cases',
        ],
        icon: <Zap size={20} />,
      },
    ],
    eta: 'q3 2025',
    snarkyNote: 'CLARP would be first token on BAGS with prediction markets. probably.',
  },
  {
    id: 'v4',
    version: 'v4.0',
    title: 'charity flywheel + community intel',
    status: 'future',
    description: 'buy $CLARP to save ourselves from AI domination.',
    longDescription: 'Two components: a fee distribution model that funds AI safety research, and a community intelligence layer for decentralized due diligence. Snitch mode activated - anonymous reporting with bounties for catching rugs early.',
    features: [
      {
        name: 'charity flywheel',
        status: 'planned',
        description: 'fee distribution to AI safety organizations',
        details: [
          'Buy $CLARP → Generate fees → Distribute:',
          '40% Buyback & burn (deflationary pressure)',
          '30% AI safety charity donations',
          '20% Development funding',
          '10% Community rewards',
          'Transparent on-chain donation tracking',
          'Potential partners: MIRI, Future of Life Institute, AI safety research orgs',
        ],
        icon: <Heart size={20} />,
      },
      {
        name: 'snitch mode',
        status: 'planned',
        description: 'anonymous reporting with bounties',
        details: [
          'Submit intel on suspicious projects anonymously',
          'Stake $CLARP to submit (skin in the game)',
          'Bounties for reports that prove accurate',
          'Whistleblower protections',
          'Early warning system for the community',
        ],
        icon: <AlertTriangle size={20} />,
      },
      {
        name: 'community verification',
        status: 'planned',
        description: 'stake $CLARP to validate intel',
        details: [
          'Community votes on submitted intel validity',
          'Stakers rewarded for accurate verification',
          'Slashing for consistently wrong votes',
          'Decentralized curation of threat intelligence',
        ],
        icon: <Shield size={20} />,
      },
      {
        name: 'hall of shame v2',
        status: 'planned',
        description: 'historical rug archive with analytics',
        details: [
          'Comprehensive database of rugged projects',
          'Patterns and commonalities analysis',
          'Team connection mapping',
          'Searchable by wallet, team member, project name',
          '"Learn from history or repeat it"',
        ],
        icon: <Database size={20} />,
      },
    ],
    eta: '2026',
    snarkyNote: 'trust no one. verify everything. snitch often. donate to prevent skynet.',
  },
];

const TICKER_MESSAGES = [
  'roadmap loaded. actually.',
  'building features not vapourware',
  'progress that moves',
  'building in public',
  'judging in private',
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
              <div><span className="text-larp-green">✓</span> loading comprehensive roadmap...</div>
              <div><span className="text-larp-green">✓</span> no empty promises detected</div>
              <div><span className="text-larp-green">✓</span> verbose mode enabled</div>
              <div><span className="text-danger-orange">!</span> warning: we might actually ship all of this</div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-dark leading-tight mb-6 font-display">
            the <span className="text-danger-orange">roadmap</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-light mb-4 font-mono">
            a roadmap with details. revolutionary.
          </p>
          <p className="text-sm sm:text-base text-slate-light max-w-2xl mx-auto">
            unlike your last 47 crypto investments, we tell you exactly what we're building,
            how it works, and <span className="text-danger-orange font-bold">then actually build it</span>.
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
      <WarningTicker messages={['we\'ll ship. they won\'t.', 'roadmap !== whitepaper', 'details matter', 'actually building']} direction="right" />

      {/* Mission Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ivory-light mb-4 font-display">
              the <span className="text-danger-orange">mission</span>
            </h2>
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
          </div>

          <div className="mt-12 text-center">
            <p className="text-ivory-light/40 text-sm font-mono mb-8">
              trustpilot for crypto. but honest.
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
      <WarningTicker messages={['roadmap documented', 'details included', 'no empty promises', 'building continues']} direction="left" />

      <Footer />
    </main>
  );
}
