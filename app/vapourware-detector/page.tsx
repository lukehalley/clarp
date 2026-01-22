'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import WarningTicker from '@/components/WarningTicker';
import Footer from '@/components/Footer';
import { Skull, AlertTriangle, AlertCircle, CheckCircle, Sparkles, Bot, FileText, Ghost, ClipboardCopy, Users, FlaskConical, Loader2, ExternalLink } from 'lucide-react';

interface Finding {
  label: string;
  value: string;
  severity: 'critical' | 'warning' | 'info' | 'good';
}

interface ScanResult {
  repoName: string;
  repoFullName: string;
  repoUrl: string;
  score: number;
  verdict: string;
  verdictColor: string;
  verdictIcon: string;
  summary: string;
  findings: Finding[];
  recommendation: string;
  ropiScore: number;
  metadata: {
    stars: number;
    forks: number;
    language: string | null;
    codeFiles: number;
    testFiles: number;
    lastCommitDaysAgo: number;
    uniqueContributors: number;
    readmeLength: number;
  };
  scannedAt: string;
}

interface RecentScan {
  repoName: string;
  score: number;
  verdict: string;
  tag: string;
  scannedAt: string;
}

const TICKER_MESSAGES = [
  'ai recognizes ai',
  'scanning github repos live',
  'detecting vapourware professionally',
  'trust no readme',
  'your portfolio is a warning sign',
  'due diligence is cope',
];

const VerdictIcon = ({ icon, className = '' }: { icon: string; className?: string }) => {
  const iconProps = { size: 24, className };
  switch (icon) {
    case 'skull': return <Skull {...iconProps} />;
    case 'alert-triangle': return <AlertTriangle {...iconProps} />;
    case 'alert-circle': return <AlertCircle {...iconProps} />;
    case 'check-circle': return <CheckCircle {...iconProps} />;
    case 'sparkles': return <Sparkles {...iconProps} />;
    default: return <AlertCircle {...iconProps} />;
  }
};

const DetectionIcon = ({ icon, className = '' }: { icon: string; className?: string }) => {
  const iconProps = { size: 32, className };
  switch (icon) {
    case 'bot': return <Bot {...iconProps} />;
    case 'file-text': return <FileText {...iconProps} />;
    case 'ghost': return <Ghost {...iconProps} />;
    case 'clipboard-copy': return <ClipboardCopy {...iconProps} />;
    case 'users': return <Users {...iconProps} />;
    case 'flask': return <FlaskConical {...iconProps} />;
    default: return <AlertCircle {...iconProps} />;
  }
};

const getSeverityColor = (severity: Finding['severity']): string => {
  switch (severity) {
    case 'critical': return 'text-larp-red';
    case 'warning': return 'text-larp-yellow';
    case 'good': return 'text-larp-green';
    default: return 'text-ivory-light/60';
  }
};

export default function VapourwareDetector() {
  const [mounted, setMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanStep, setCurrentScanStep] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [tweetCopied, setTweetCopied] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const SCAN_STEPS = [
    'connecting to github api...',
    'fetching repository metadata...',
    'analyzing commit history...',
    'scanning file structure...',
    'downloading readme...',
    'detecting ai-generated patterns...',
    'evaluating code quality metrics...',
    'calculating buzzword density...',
    'cross-referencing contributor data...',
    'generating ai verdict...',
    'compiling final report...',
  ];

  useEffect(() => {
    setMounted(true);
    fetchRecentScans();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [currentScanStep, scanProgress, scanResult]);

  const fetchRecentScans = async () => {
    try {
      const response = await fetch('/api/scan');
      if (response.ok) {
        const data = await response.json();
        setRecentScans(data.scans || []);
      }
    } catch {
      // Silently fail - recent scans are non-critical
    }
  };

  const runScan = async () => {
    if (isScanning || !inputValue.trim()) return;

    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    setScanProgress(0);
    setCurrentScanStep('');
    setScanCount(prev => prev + 1);

    // Animate progress steps
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < SCAN_STEPS.length - 1) {
        setCurrentScanStep(SCAN_STEPS[stepIndex]);
        setScanProgress(Math.min(((stepIndex + 1) / SCAN_STEPS.length) * 90, 89));
        stepIndex++;
      }
    }, 800);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputValue.trim() }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan failed');
      }

      const result: ScanResult = await response.json();

      setCurrentScanStep('scan complete.');
      setScanProgress(100);

      setTimeout(() => {
        setScanResult(result);
        setIsScanning(false);
        fetchRecentScans(); // Refresh recent scans
      }, 500);

    } catch (error: any) {
      clearInterval(stepInterval);
      setScanError(error.message || 'Failed to scan repository');
      setCurrentScanStep('scan failed.');
      setScanProgress(0);
      setIsScanning(false);
    }
  };

  const copyTweet = () => {
    const repoUrl = scanResult?.repoUrl || 'https://github.com/example/repo';
    const tweet = `@CLARP scan ${repoUrl}`;
    navigator.clipboard.writeText(tweet);
    setTweetCopied(true);
    setTimeout(() => setTweetCopied(false), 2000);
  };

  const clearScan = () => {
    setScanResult(null);
    setScanError(null);
    setInputValue('');
    setScanProgress(0);
    setCurrentScanStep('');
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />

      {/* back button */}
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

      {/* hero section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid bg-grid opacity-30" />

        <div className="max-w-4xl mx-auto relative text-center">
          {/* badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-larp-green/10 border border-larp-green/30 text-larp-green font-mono text-xs mb-6">
            <span className="animate-pulse">●</span>
            live - powered by claude ai
          </div>

          {/* title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-dark leading-tight mb-6 font-display">
            vapourware
            <br />
            <span className="text-danger-orange">detector</span>
          </h1>

          {/* tagline */}
          <p className="text-xl sm:text-2xl text-slate-light mb-4 font-mono">
            ai recognizes ai.
          </p>
          <p className="text-base sm:text-lg text-danger-orange font-mono font-bold mb-8">
            scan any github repo. expose the slop.
          </p>

          <p className="text-sm sm:text-base text-slate-light max-w-2xl mx-auto mb-12">
            paste any <span className="text-danger-orange font-bold">github url</span> below.
            our ai will scan the codebase, analyze commits, and tell you if it's real or just another
            <span className="text-larp-red"> chatgpt wrapper with extra steps</span>.
          </p>

          {/* how it works preview */}
          <div className="bg-slate-dark border-2 border-danger-orange p-6 sm:p-8 text-left max-w-xl mx-auto mb-12" style={{ boxShadow: '6px 6px 0 #FF6B35' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-danger-orange">$</span>
              <span className="text-ivory-light font-mono text-sm">how it works</span>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-start gap-3">
                <span className="text-larp-green shrink-0">1.</span>
                <span className="text-ivory-light/80">paste github url in the scanner below</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-larp-green shrink-0">2.</span>
                <span className="text-ivory-light/80">we fetch repo data via github api</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-larp-green shrink-0">3.</span>
                <span className="text-ivory-light/80">claude ai analyzes code, commits, readme</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-larp-green shrink-0">4.</span>
                <span className="text-ivory-light/80">receive verdict. question your life choices.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ticker */}
      <WarningTicker messages={TICKER_MESSAGES} direction="left" />

      {/* what we detect section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-dark text-ivory-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-error mb-4">detection matrix</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 font-display">
              what we <span className="text-danger-orange">detect</span>
            </h2>
            <p className="text-sm sm:text-base text-ivory-light/60 max-w-2xl mx-auto">
              our ai has been trained on thousands of failed projects. it knows the signs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: 'bot', title: 'ai-generated code', desc: 'detects claude/gpt patterns. the "helpful assistant" energy is unmistakable.' },
              { icon: 'file-text', title: 'readme bloat', desc: 'when the readme is longer than the actual code, that\'s a red flag.' },
              { icon: 'ghost', title: 'ghost commits', desc: 'bulk commits at 3am. "initial commit" with 10k lines. sus.' },
              { icon: 'clipboard-copy', title: 'copy-paste signatures', desc: 'we know that stack overflow code. we\'ve seen it 47,000 times.' },
              { icon: 'users', title: 'fake contributors', desc: 'all commits from the same wallet? "team of 12" with 1 actual dev?' },
              { icon: 'flask', title: 'test coverage: 0%', desc: 'no tests = no product = no point. next.' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-ivory-light/5 border border-ivory-light/10 p-6 hover:border-danger-orange/50 transition-colors group"
              >
                <div className="mb-4 text-ivory-light/60 group-hover:text-danger-orange group-hover:animate-pulse transition-colors">
                  <DetectionIcon icon={item.icon} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-danger-orange font-mono">{item.title}</h3>
                <p className="text-sm text-ivory-light/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ticker */}
      <WarningTicker messages={['scanning for truth in a sea of lies', 'your due diligence starts here', 'ai vs ai: the final boss']} direction="right" />

      {/* live scanner section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-warning mb-4">live scanner</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-4 font-display">
              scan a <span className="text-danger-orange">repo</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-light">
              paste any public github url. get a real ai-powered verdict.
            </p>
          </div>

          {/* input terminal */}
          <div className="terminal mb-8">
            <div className="terminal-header">
              <div className="terminal-dot bg-larp-red opacity-50" />
              <div className="terminal-dot bg-larp-yellow opacity-50" />
              <div className="terminal-dot bg-larp-green opacity-50" />
              <span className="ml-3 text-xs text-ivory-light/50 font-mono">vapourware-detector v1.0.0</span>
            </div>
            <div ref={terminalRef} className="terminal-body min-h-[250px] max-h-[500px] overflow-y-auto">
              {/* input row */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-danger-orange shrink-0">$</span>
                <span className="text-larp-green shrink-0">scan</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 bg-transparent border-none outline-none text-ivory-light font-mono text-sm placeholder:text-ivory-light/30"
                  onKeyDown={(e) => e.key === 'Enter' && runScan()}
                  disabled={isScanning}
                />
              </div>

              {/* scan progress */}
              {isScanning && (
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2 text-ivory-light/60">
                    <Loader2 className="w-4 h-4 animate-spin text-danger-orange" />
                    <span>{currentScanStep}</span>
                  </div>
                  <div className="w-full bg-slate-medium h-2 overflow-hidden">
                    <div
                      className="h-full bg-danger-orange transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="text-ivory-light/40 text-xs">{Math.floor(scanProgress)}% complete</div>
                </div>
              )}

              {/* error display */}
              {scanError && (
                <div className="animate-fade-in border-t border-ivory-light/20 pt-4 mt-4">
                  <div className="flex items-center gap-3 text-larp-red">
                    <AlertTriangle size={20} />
                    <span className="font-mono text-sm">{scanError}</span>
                  </div>
                </div>
              )}

              {/* results display */}
              {scanResult && (
                <div className="animate-fade-in">
                  <div className="border-t border-ivory-light/20 pt-4 mt-4">
                    {/* verdict header */}
                    <div className="flex items-center gap-3 mb-4">
                      <VerdictIcon icon={scanResult.verdictIcon} className={`text-${scanResult.verdictColor}`} />
                      <div>
                        <div className={`text-${scanResult.verdictColor} font-bold text-lg`}>
                          {scanResult.verdict}
                        </div>
                        <div className="text-ivory-light/40 text-xs">
                          vapourware score: {scanResult.score}/100
                        </div>
                      </div>
                    </div>

                    {/* repo info */}
                    <div className="mb-4 p-3 bg-ivory-light/5 border border-ivory-light/10">
                      <a
                        href={scanResult.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-danger-orange hover:underline font-mono text-sm"
                      >
                        <span>{scanResult.repoFullName}</span>
                        <ExternalLink size={14} />
                      </a>
                      <div className="text-ivory-light/60 text-xs mt-1 italic">
                        "{scanResult.summary}"
                      </div>
                    </div>

                    {/* findings grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      {scanResult.findings.map((finding, i) => (
                        <div key={i} className="flex justify-between items-center py-1 border-b border-ivory-light/10">
                          <span className="text-ivory-light/60">{finding.label}</span>
                          <span className={getSeverityColor(finding.severity)}>{finding.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* metadata */}
                    <div className="grid grid-cols-4 gap-2 text-xs mb-4 p-3 bg-ivory-light/5 border border-ivory-light/10">
                      <div className="text-center">
                        <div className="text-ivory-light/40">stars</div>
                        <div className="text-ivory-light font-bold">{scanResult.metadata.stars}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-ivory-light/40">code files</div>
                        <div className="text-ivory-light font-bold">{scanResult.metadata.codeFiles}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-ivory-light/40">test files</div>
                        <div className={`font-bold ${scanResult.metadata.testFiles > 0 ? 'text-larp-green' : 'text-larp-red'}`}>
                          {scanResult.metadata.testFiles}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-ivory-light/40">contributors</div>
                        <div className="text-ivory-light font-bold">{scanResult.metadata.uniqueContributors}</div>
                      </div>
                    </div>

                    {/* recommendation */}
                    <div className="pt-4 border-t border-ivory-light/20">
                      <div className="text-danger-orange text-xs">recommendation:</div>
                      <div className="text-ivory-light/80 text-sm mt-1">
                        {scanResult.recommendation}
                      </div>
                    </div>

                    {/* ROPI score */}
                    <div className="mt-4 p-3 bg-danger-orange/10 border border-danger-orange/30">
                      <div className="text-xs text-danger-orange">return on perceived investment (ROPI™)</div>
                      <div className="text-2xl font-bold text-danger-orange">{scanResult.ropiScore}/100</div>
                      <div className="text-xs text-ivory-light/40">
                        {scanResult.ropiScore > 70 ? 'high likelihood of disappointment' :
                         scanResult.ropiScore > 40 ? 'manage your expectations' :
                         'might actually be worth looking at'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* cursor */}
              {!isScanning && !scanResult && !scanError && (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-4 bg-danger-orange animate-blink" />
                </div>
              )}
            </div>
          </div>

          {/* action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={runScan}
              disabled={isScanning || !inputValue.trim()}
              className={`btn-primary ${(isScanning || !inputValue.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isScanning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  scanning...
                </span>
              ) : scanCount > 3 ? 'scan another' : 'run scan'}
            </button>
            <button
              onClick={clearScan}
              className="btn-secondary"
            >
              clear
            </button>
          </div>

          {scanCount > 5 && (
            <p className="text-center text-xs text-slate-light/50 mt-4 font-mono">
              you've run {scanCount} scans. finding lots of vapourware out there?
            </p>
          )}
        </div>
      </section>

      {/* ticker */}
      <WarningTicker messages={['real scans. real verdicts.', 'powered by claude ai', 'github api integration active']} direction="left" />

      {/* recent scans */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-dark text-ivory-light">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-error mb-4">live feed</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 font-display">
              recent <span className="text-danger-orange">scans</span>
            </h2>
            <p className="text-sm sm:text-base text-ivory-light/60">
              repos analyzed by the community. the hall of shame updates in real time.
            </p>
          </div>

          {recentScans.length > 0 ? (
            <div className="space-y-3">
              {recentScans.map((scan, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-ivory-light/5 border border-ivory-light/10 hover:border-danger-orange/30 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-danger-orange shrink-0">▸</span>
                    <span className="font-mono text-sm truncate">{scan.repoName}</span>
                    <span className="hidden sm:inline text-xs px-2 py-0.5 bg-larp-red/20 text-larp-red border border-larp-red/30 shrink-0 truncate max-w-[150px]">
                      {scan.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-ivory-light/40">score:</span>
                    <span className={`font-mono font-bold ${scan.score > 80 ? 'text-larp-red' : scan.score > 50 ? 'text-larp-yellow' : 'text-larp-green'}`}>
                      {scan.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-ivory-light/10">
              <p className="text-ivory-light/40 font-mono text-sm">no scans yet. be the first to expose some vapourware.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <p className="text-xs text-ivory-light/30 font-mono">
              scans are stored temporarily and reset on server restart
            </p>
          </div>
        </div>
      </section>

      {/* cta section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-6 font-display">
            share your <span className="text-danger-orange">findings</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-light mb-8">
            found some vapourware? share it with the <span className="text-danger-orange font-bold">$CLARP</span> community on x.
          </p>

          {/* tweet template */}
          <div className="bg-slate-dark border-2 border-danger-orange p-6 text-left max-w-md mx-auto mb-8" style={{ boxShadow: '4px 4px 0 #FF6B35' }}>
            <div className="text-xs text-ivory-light/40 mb-2 font-mono">share on x:</div>
            <div className="font-mono text-sm text-ivory-light mb-4">
              <span className="text-danger-orange">@CLARP</span> scan {scanResult?.repoUrl || 'https://github.com/example/repo'}
            </div>
            <button
              onClick={copyTweet}
              className="btn-outline text-xs w-full"
            >
              {tweetCopied ? 'copied!' : 'copy to clipboard'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://x.com/i/communities/2013904367188132011"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              join $CLARP on x
            </a>
            <Link href="/" className="btn-secondary">
              back to main site
            </Link>
          </div>

          <p className="text-xs text-slate-light/50 mt-8 font-mono">
            rate limit: 10 scans per hour. don't abuse the detector. we're watching.
          </p>
        </div>
      </section>

      {/* final ticker */}
      <WarningTicker messages={['ai recognizes ai', 'trust no readme', 'dyor means nothing if the code is fake', 'vapourware detector: now live']} direction="right" />

      <Footer />
    </main>
  );
}
