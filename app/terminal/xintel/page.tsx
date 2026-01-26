'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Radar, AlertTriangle, Users, Sparkles } from 'lucide-react';
import ScanStepper from '@/components/terminal/xintel/ScanStepper';
import { ScanStatus, formatHandle, isValidHandle } from '@/types/xintel';
import { getAvailableHandles } from '@/lib/terminal/xintel/mock-data';

function XIntelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('queued');
  const [scanError, setScanError] = useState('');
  const [availableHandles, setAvailableHandles] = useState<string[]>([]);
  const hasAutoSubmitted = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setAvailableHandles(getAvailableHandles());
  }, []);

  // Sync input from URL query param on mount
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && !hasAutoSubmitted.current) {
      setInput(query.startsWith('@') ? query : `@${query}`);
      hasAutoSubmitted.current = true;
      // Auto-submit after setting the input
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 100);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setScanError('');

    const handle = formatHandle(input);

    if (!isValidHandle(handle)) {
      setError('Invalid handle format. X handles must be 4-15 characters (letters, numbers, underscore).');
      return;
    }

    // Update URL with query param for shareable links
    const newUrl = `/terminal/xintel?q=${encodeURIComponent(handle)}`;
    window.history.replaceState({}, '', newUrl);

    setIsScanning(true);
    setScanStatus('queued');

    try {
      const response = await fetch('/api/xintel/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      if (data.cached) {
        // Report already cached, go directly
        router.push(`/terminal/xintel/${handle}`);
        return;
      }

      // Poll for completion
      const jobId = data.jobId;
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/xintel/scan?jobId=${jobId}`);
          const statusData = await statusResponse.json();

          setScanStatus(statusData.status);

          if (statusData.status === 'complete') {
            clearInterval(pollInterval);
            setTimeout(() => {
              router.push(`/terminal/xintel/${handle}`);
            }, 500);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            setScanError(statusData.error || 'Scan failed');
            setIsScanning(false);
          }
        } catch {
          clearInterval(pollInterval);
          setScanError('Failed to check scan status');
          setIsScanning(false);
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
      setIsScanning(false);
    }
  };

  const handleQuickScan = (handle: string) => {
    setInput(`@${handle}`);
    // Auto-submit after a brief delay
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 100);
  };

  return (
    <div className="min-h-[calc(100dvh-16rem)] flex flex-col items-center justify-center">
      <div className="w-full space-y-6">
      {/* Hero Section */}
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Radar size={40} className="text-danger-orange" />
          <h1 className="text-3xl sm:text-4xl font-mono font-bold text-ivory-light">X Profile Intel</h1>
        </div>
        <p className="text-ivory-light/60 font-mono text-lg max-w-xl mx-auto">
          "Know the founder before you ape."
        </p>
        <p className="text-ivory-light/40 font-mono text-sm mt-2">
          Evidence-backed reputation scans for crypto founders & KOLs
        </p>
      </div>

      {/* Main Scanner */}
      {!isScanning ? (
        <div className="max-w-2xl mx-auto">
          {/* Input Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory-light/40"
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="@handle or x.com/handle"
                  className="w-full pl-12 pr-4 py-4 bg-ivory-light/5 border-2 border-ivory-light/20 text-ivory-light font-mono text-lg placeholder:text-ivory-light/30 focus:outline-none focus:border-danger-orange/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-8 py-4 bg-danger-orange text-black font-mono font-bold text-lg border-2 border-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '4px 4px 0 black' }}
              >
                SCAN
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-larp-red/10 border border-larp-red/30">
                <p className="font-mono text-sm text-larp-red flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {error}
                </p>
              </div>
            )}
          </form>

          {/* Demo Handles */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-larp-yellow" />
              <span className="font-mono text-sm text-ivory-light/50">
                Try demo profiles:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableHandles.map((handle) => (
                <button
                  key={handle}
                  onClick={() => handleQuickScan(handle)}
                  className="px-3 py-1.5 border border-ivory-light/20 text-ivory-light/60 font-mono text-sm hover:border-danger-orange/50 hover:text-ivory-light transition-colors"
                >
                  @{handle}
                </button>
              ))}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border border-ivory-light/10 bg-ivory-light/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-danger-orange" />
                <span className="font-mono font-bold text-ivory-light">
                  Backlash Detection
                </span>
              </div>
              <p className="font-mono text-xs text-ivory-light/50">
                Surface controversies and accusations with citations to original posts
              </p>
            </div>
            <div className="p-4 border border-ivory-light/10 bg-ivory-light/5">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-larp-purple" />
                <span className="font-mono font-bold text-ivory-light">
                  Shill Mapping
                </span>
              </div>
              <p className="font-mono text-xs text-ivory-light/50">
                Track tokens promoted with timing, intensity, and example posts
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <ScanStepper status={scanStatus} error={scanError} />

          <div className="mt-4 text-center">
            <p className="font-mono text-xs text-ivory-light/40">
              Scanning @{formatHandle(input)}...
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="max-w-2xl mx-auto mt-6 p-4 border border-ivory-light/10 bg-ivory-light/5">
        <p className="font-mono text-xs text-ivory-light/40 text-center">
          <strong className="text-ivory-light/60">Disclaimer:</strong> Automated analysis may be incorrect.
          Results show signals and indicators, not definitive judgments. Always verify sources and
          do your own research before making investment decisions.
        </p>
      </div>
      </div>
    </div>
  );
}

export default function XIntelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100dvh-16rem)] flex items-center justify-center">
        <div className="text-ivory-light/40 font-mono">Loading...</div>
      </div>
    }>
      <XIntelContent />
    </Suspense>
  );
}
