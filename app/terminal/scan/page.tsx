'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ScanStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'failed';
  detail?: string;
}

type ScanPhase = 'idle' | 'scanning' | 'complete' | 'failed' | 'not-crypto';

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================

function StepIndicator({ step, index, isScanning }: { step: ScanStep; index: number; isScanning: boolean }) {
  return (
    <div
      className="group relative flex items-center gap-3 py-2.5 border-b border-ivory-light/5 last:border-b-0"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glowing sweep effect - only on active step */}
      {step.status === 'active' && isScanning && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ animationDelay: `${index * 200}ms` }}
        >
          <div className="scan-sweep-glow" />
        </div>
      )}

      {/* Status icon */}
      <div className="relative z-10 flex-shrink-0">
        {step.status === 'pending' && (
          <div className="w-5 h-5 border border-ivory-light/20 bg-slate-dark/50 flex items-center justify-center">
            <span className="font-mono text-[9px] text-ivory-light/30">{index + 1}</span>
          </div>
        )}
        {step.status === 'active' && (
          <div className="w-5 h-5 border border-danger-orange bg-danger-orange/10 flex items-center justify-center relative">
            <div className="w-1.5 h-1.5 bg-danger-orange animate-pulse" />
            <div className="absolute inset-0 border border-danger-orange animate-ping opacity-30" />
          </div>
        )}
        {step.status === 'complete' && (
          <div className="w-5 h-5 border border-larp-green bg-larp-green/20 flex items-center justify-center">
            <Check size={10} className="text-larp-green" strokeWidth={3} />
          </div>
        )}
        {step.status === 'failed' && (
          <div className="w-5 h-5 border border-larp-red bg-larp-red/20 flex items-center justify-center">
            <X size={10} className="text-larp-red" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={`font-mono text-xs tracking-wide transition-all duration-300 ${
            step.status === 'active'
              ? 'text-ivory-light'
              : step.status === 'complete'
              ? 'text-ivory-light/50'
              : step.status === 'failed'
              ? 'text-larp-red'
              : 'text-ivory-light/25'
          }`}
        >
          {step.label}
        </div>
        {step.detail && step.status !== 'pending' && (
          <div
            className={`font-mono text-[10px] mt-0.5 transition-all duration-300 truncate ${
              step.status === 'active'
                ? 'text-danger-orange/80'
                : step.status === 'complete'
                ? 'text-larp-green/60'
                : step.status === 'failed'
                ? 'text-larp-red/60'
                : 'text-ivory-light/30'
            }`}
          >
            {step.status === 'active' && <span className="inline-block w-1 h-1 bg-danger-orange mr-1.5 animate-pulse" />}
            {step.detail}
          </div>
        )}
      </div>

      {/* Progress indicator for active step */}
      {step.status === 'active' && (
        <div className="flex-shrink-0">
          <Loader2 size={12} className="animate-spin text-danger-orange" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LOADING FALLBACK
// ============================================================================

function ScanLoading() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-[min(500px,90vw)] aspect-square flex items-center justify-center border-2 border-ivory-light/10 bg-slate-dark/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-danger-orange border-t-transparent animate-spin" />
          <span className="font-mono text-xs text-ivory-light/40">initializing...</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT (inner)
// ============================================================================

function ScanPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const forceRescan = searchParams.get('force') === 'true';

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [steps, setSteps] = useState<ScanStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resolvedHandle, setResolvedHandle] = useState<string | null>(null);

  // Detect if input is a token address
  const isTokenAddress = query && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(query.trim());
  const isEVMAddress = query && /^0x[a-fA-F0-9]{40}$/.test(query.trim());
  const isAddress = isTokenAddress || isEVMAddress;

  // Initialize steps based on query type - OSINT first, then AI
  const initSteps = (): ScanStep[] => [
    {
      id: 'resolve',
      label: isAddress ? 'resolving token' : 'identifying entity',
      status: 'pending'
    },
    { id: 'osint', label: 'gathering osint data', status: 'pending' },
    { id: 'social', label: 'discovering social links', status: 'pending' },
    { id: 'analyze', label: 'ai analysis', status: 'pending' },
    { id: 'report', label: 'building trust report', status: 'pending' },
  ];

  // Update a specific step
  const updateStep = (stepId: string, updates: Partial<ScanStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
  };

  // Map API status to our steps - reflects OSINT → AI flow
  const mapStatusToStep = (status: string, _progress: number, message?: string) => {
    switch (status) {
      case 'queued':
        updateStep('resolve', { status: 'active', detail: 'waiting in queue...' });
        break;
      case 'resolving':
        updateStep('resolve', { status: 'active', detail: message || 'detecting input type...' });
        break;
      case 'fetching':
        // OSINT phase - gathering free data
        updateStep('resolve', { status: 'complete', detail: 'entity resolved' });
        updateStep('osint', { status: 'active', detail: message || 'querying RugCheck, DexScreener...' });
        break;
      case 'extracting':
        updateStep('resolve', { status: 'complete', detail: 'entity resolved' });
        updateStep('osint', { status: 'complete', detail: 'security + market data collected' });
        updateStep('social', { status: 'active', detail: message || 'crawling website, finding socials...' });
        break;
      case 'analyzing':
        updateStep('resolve', { status: 'complete', detail: 'entity resolved' });
        updateStep('osint', { status: 'complete', detail: 'security + market data collected' });
        updateStep('social', { status: 'complete', detail: 'social links discovered' });
        updateStep('analyze', { status: 'active', detail: message || 'AI analyzing X activity...' });
        break;
      case 'scoring':
        updateStep('resolve', { status: 'complete', detail: 'entity resolved' });
        updateStep('osint', { status: 'complete', detail: 'security + market data collected' });
        updateStep('social', { status: 'complete', detail: 'social links discovered' });
        updateStep('analyze', { status: 'complete', detail: 'analysis complete' });
        updateStep('report', { status: 'active', detail: message || 'calculating trust score...' });
        break;
      case 'enriching':
        updateStep('resolve', { status: 'complete', detail: 'entity resolved' });
        updateStep('osint', { status: 'complete', detail: 'security + market data collected' });
        updateStep('social', { status: 'complete', detail: 'social links discovered' });
        updateStep('analyze', { status: 'complete', detail: 'analysis complete' });
        updateStep('report', { status: 'active', detail: message || 'enriching with additional data...' });
        break;
      case 'complete':
      case 'cached':
        // All steps complete
        updateStep('resolve', { status: 'complete', detail: 'entity resolved' });
        updateStep('osint', { status: 'complete', detail: 'security + market data collected' });
        updateStep('social', { status: 'complete', detail: 'social links discovered' });
        updateStep('analyze', { status: 'complete', detail: 'analysis complete' });
        updateStep('report', { status: 'complete', detail: 'report generated' });
        break;
    }
  };

  // Start scan
  const startScan = async () => {
    if (!query) return;

    setPhase('scanning');
    setSteps(initSteps());
    setError(null);

    // Start first step
    setTimeout(() => {
      updateStep('resolve', { status: 'active', detail: `resolving "${query.slice(0, 20)}${query.length > 20 ? '...' : ''}"` });
    }, 10);

    try {
      // Pass raw query to API - it accepts any input type
      const res = await fetch('/api/xintel/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: query.trim(), force: forceRescan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start scan');
      }

      // Update resolve step with detected type
      updateStep('resolve', { status: 'complete', detail: `detected: ${data.inputType || 'unknown'}` });

      // If we got immediate OSINT data, show progress
      if (data.osintData) {
        updateStep('osint', { status: 'complete', detail: data.osintData.securityIntel ? 'RugCheck + market data' : 'market data collected' });
        if (data.osintData.xHandle) {
          updateStep('social', { status: 'complete', detail: `found @${data.osintData.xHandle}` });
        }
      }

      if (data.cached || data.status === 'complete') {
        // Fast path - already have data
        setSteps((prev) =>
          prev.map((s) => ({ ...s, status: 'complete', detail: s.detail || 'cached' }))
        );
        setPhase('complete');
        // Redirect to project page using canonicalId (token address for tokens, handle otherwise)
        const projectId = data.canonicalId || query.replace('@', '').toLowerCase();
        setTimeout(() => router.push(`/terminal/project/${projectId}`), 1200);
        return;
      }

      setJobId(data.jobId);
      if (data.canonicalId) {
        setResolvedHandle(data.canonicalId); // Use canonicalId (token address for tokens)
      }

      // If OSINT-only (no X handle to analyze), complete early
      if (data.status === 'complete' && !data.osintData?.xHandle) {
        setSteps((prev) =>
          prev.map((s) => ({ ...s, status: 'complete', detail: s.detail || 'complete' }))
        );
        setPhase('complete');
        const projectId = data.canonicalId || query;
        setTimeout(() => router.push(`/terminal/project/${projectId}`), 1200);
      }
    } catch (err) {
      console.error('[ScanPage] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start scan');
      setPhase('failed');
      updateStep('resolve', { status: 'failed', detail: 'resolution failed' });
    }
  };

  // Poll for updates
  useEffect(() => {
    if (!jobId || phase !== 'scanning') return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/xintel/scan?jobId=${jobId}`);
        if (!res.ok) return;

        const data = await res.json();
        mapStatusToStep(data.status, data.progress, data.statusMessage);

        if (data.status === 'complete') {
          setPhase('complete');
          // Redirect to project page using canonicalId (resolvedHandle) - token address for tokens
          const projectId = resolvedHandle || query.replace('@', '').toLowerCase();
          setTimeout(() => router.push(`/terminal/project/${projectId}`), 1200);
        } else if (data.status === 'failed') {
          setPhase('failed');
          setError(data.error || 'Analysis failed');
        }
      } catch (err) {
        console.error('[ScanPage] Poll error:', err);
      }
    };

    const interval = setInterval(poll, 800);
    return () => clearInterval(interval);
  }, [jobId, phase, router, resolvedHandle, query]);

  // Check for existing active scan on mount (for resume after page refresh)
  const checkExistingScan = async () => {
    if (!query) return false;

    try {
      const normalizedHandle = query.replace('@', '').toLowerCase();
      const res = await fetch(`/api/xintel/scan?handle=${encodeURIComponent(normalizedHandle)}`);

      if (res.ok) {
        const data = await res.json();
        if (data.hasActiveScan && data.status !== 'complete' && data.status !== 'failed') {
          console.log('[ScanPage] Found active scan, resuming:', data.jobId);
          setPhase('scanning');
          setSteps(initSteps());
          setJobId(data.jobId);
          setResolvedHandle(data.handle);
          // Update steps based on current progress
          mapStatusToStep(data.status, data.progress, data.statusMessage);
          return true;
        }
      }
    } catch (err) {
      console.error('[ScanPage] Error checking existing scan:', err);
    }
    return false;
  };

  // Auto-start on mount (or resume existing scan)
  useEffect(() => {
    if (query && phase === 'idle') {
      // First check if there's an existing scan to resume
      checkExistingScan().then(hasExisting => {
        if (!hasExisting) {
          startScan();
        }
      });
    }
  }, [query]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 relative">
      {/* Back button - positioned absolutely so it doesn't affect centering */}
      <button
        onClick={() => router.push('/terminal')}
        className="absolute top-4 left-4 flex items-center gap-2 font-mono text-xs text-ivory-light/40 hover:text-danger-orange transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        back to terminal
      </button>

      {/* Add CSS for the sweep animation */}
      <style jsx global>{`
        @keyframes scan-sweep {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .scan-sweep-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            transparent 20%,
            rgba(255, 107, 53, 0.03) 30%,
            rgba(255, 107, 53, 0.08) 45%,
            rgba(255, 107, 53, 0.15) 50%,
            rgba(255, 107, 53, 0.08) 55%,
            rgba(255, 107, 53, 0.03) 70%,
            transparent 80%,
            transparent 100%
          );
          animation: scan-sweep 2.5s ease-in-out infinite;
        }

        @keyframes border-glow {
          0%, 100% {
            box-shadow:
              inset 0 0 30px rgba(255, 107, 53, 0.05),
              0 0 20px rgba(255, 107, 53, 0.1);
          }
          50% {
            box-shadow:
              inset 0 0 40px rgba(255, 107, 53, 0.1),
              0 0 30px rgba(255, 107, 53, 0.15);
          }
        }

        .scan-container-glow {
          animation: border-glow 3s ease-in-out infinite;
        }

        @keyframes text-flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.8; }
          94% { opacity: 1; }
          96% { opacity: 0.9; }
          97% { opacity: 1; }
        }

        .text-flicker {
          animation: text-flicker 4s infinite;
        }
      `}</style>

      {/* Centered square container */}
      <div
        className="w-full max-w-[min(500px,90vw)]"
      >
        {/* Main square container */}
        <div
          className={`relative border-2 bg-slate-dark/50 p-6 overflow-hidden aspect-square flex flex-col ${
            phase === 'scanning'
              ? 'border-danger-orange/50 scan-container-glow'
              : phase === 'complete'
              ? 'border-larp-green/50'
              : phase === 'failed'
              ? 'border-larp-red/50'
              : 'border-ivory-light/10'
          }`}
        >
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,107,53,0.02)_2px,rgba(255,107,53,0.02)_4px)]" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-danger-orange/30" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-danger-orange/30" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-danger-orange/30" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-danger-orange/30" />

          {/* Header inside box */}
          <div className="relative z-10 mb-4 pb-4 border-b border-ivory-light/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-danger-orange animate-pulse" />
              <span className="font-mono text-[10px] text-ivory-light/40 uppercase tracking-widest">
                {phase === 'scanning' ? 'scanning' : phase === 'complete' ? 'complete' : phase === 'failed' ? 'failed' : 'ready'}
              </span>
            </div>
            <h1 className="font-mono text-lg sm:text-xl text-ivory-light text-flicker truncate">
              {query}
            </h1>
          </div>

          {/* Steps */}
          <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
            {steps.map((step, index) => (
              <StepIndicator
                key={step.id}
                step={step}
                index={index}
                isScanning={phase === 'scanning'}
              />
            ))}

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-larp-red/10 border border-larp-red/30">
                <div className="flex items-start gap-2">
                  <X size={14} className="text-larp-red flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-mono text-xs text-larp-red mb-1">{error}</div>
                    <button
                      onClick={startScan}
                      className="font-mono text-[10px] text-ivory-light/60 hover:text-danger-orange transition-colors underline underline-offset-2"
                    >
                      try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Complete message */}
            {phase === 'complete' && (
              <div className="mt-4 p-3 bg-larp-green/10 border border-larp-green/30">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-larp-green" />
                  <div>
                    <div className="font-mono text-xs text-larp-green">analysis complete</div>
                    <div className="font-mono text-[10px] text-ivory-light/40 mt-0.5">redirecting...</div>
                  </div>
                </div>
              </div>
            )}

            {/* Not crypto message */}
            {phase === 'not-crypto' && (
              <div className="mt-4 p-3 bg-ivory-light/5 border border-ivory-light/10">
                <div className="font-mono text-xs text-ivory-light/60 mb-2">
                  not crypto-related
                </div>
                <button
                  onClick={() => router.push('/terminal')}
                  className="font-mono text-[10px] text-danger-orange hover:text-danger-orange/80 transition-colors"
                >
                  search again →
                </button>
              </div>
            )}
          </div>

          {/* Footer inside box */}
          <div className="relative z-10 mt-4 pt-3 border-t border-ivory-light/10 flex items-center justify-between">
            <p className="font-mono text-[9px] text-ivory-light/20">
              ai-powered analysis
            </p>
            {phase === 'scanning' && (
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 bg-danger-orange animate-pulse" />
                <span className="font-mono text-[9px] text-ivory-light/30">processing</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE EXPORT (with Suspense boundary)
// ============================================================================

export default function ScanPage() {
  return (
    <Suspense fallback={<ScanLoading />}>
      <ScanPageInner />
    </Suspense>
  );
}
