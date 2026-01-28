'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cpu, CheckCircle2, X } from 'lucide-react';

interface ScanProgressIndicatorProps {
  scanJobId: string | null;
  onComplete?: () => void;
  onDismiss?: () => void;
}

const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ERRORS = 5; // Dismiss after 5 consecutive errors

export default function ScanProgressIndicator({
  scanJobId,
  onComplete,
  onDismiss,
}: ScanProgressIndicatorProps) {
  const [status, setStatus] = useState<'analyzing' | 'complete' | 'failed' | 'dismissed'>('analyzing');
  const [glitchFrame, setGlitchFrame] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [errorCount, setErrorCount] = useState(0);

  // Handle transition to complete state
  const transitionToComplete = useCallback(() => {
    setStatus('complete');
    // Auto-dismiss after showing completion message
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setStatus('dismissed');
        onComplete?.();
      }, 300);
    }, 2500);
  }, [onComplete]);

  // Poll for scan completion
  const checkStatus = useCallback(async () => {
    if (!scanJobId || status !== 'analyzing') return;

    try {
      const res = await fetch(`/api/xintel/scan?jobId=${scanJobId}`);

      // Handle 404 - job not found (could be server restart, treat as complete)
      if (res.status === 404) {
        console.log('[ScanProgress] Job not found, treating as complete');
        transitionToComplete();
        return;
      }

      if (!res.ok) {
        setErrorCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_POLL_ERRORS) {
            console.log('[ScanProgress] Max errors reached, dismissing');
            transitionToComplete();
          }
          return newCount;
        });
        return;
      }

      // Reset error count on successful response
      setErrorCount(0);

      const data = await res.json();
      if (data.status === 'complete' || data.status === 'cached') {
        transitionToComplete();
      } else if (data.status === 'failed') {
        // Handle failed status - show completion (user can see error on project page)
        console.log('[ScanProgress] Job failed:', data.error);
        transitionToComplete();
      }
    } catch (err) {
      console.error('[ScanProgress] Poll error:', err);
      setErrorCount(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_POLL_ERRORS) {
          console.log('[ScanProgress] Max errors reached, dismissing');
          transitionToComplete();
        }
        return newCount;
      });
    }
  }, [scanJobId, status, transitionToComplete]);

  // Polling effect
  useEffect(() => {
    if (!scanJobId || status !== 'analyzing') return;

    // Start polling immediately, then every POLL_INTERVAL
    checkStatus();
    const interval = setInterval(checkStatus, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [scanJobId, status, checkStatus]);

  // Glitch effect for cyberpunk feel
  useEffect(() => {
    if (status !== 'analyzing') return;

    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        setGlitchFrame((prev) => prev + 1);
        setTimeout(() => setGlitchFrame((prev) => prev + 1), 60);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [status]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setStatus('dismissed');
      onDismiss?.();
    }, 300);
  };

  if (!scanJobId || status === 'dismissed') return null;

  const isComplete = status === 'complete';

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{
        transform: glitchFrame % 2 === 1 ? 'translateX(1px)' : undefined,
      }}
    >
      <div
        className={`
          relative overflow-hidden
          bg-slate-dark border
          ${isComplete ? 'border-larp-green/40' : 'border-danger-orange/30'}
          shadow-2xl shadow-black/50
        `}
        style={{
          minWidth: '280px',
        }}
      >
        {/* Animated top border - scanning line */}
        {!isComplete && (
          <div
            className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-danger-orange to-transparent animate-scan-line"
            style={{ width: '50%' }}
          />
        )}

        {/* Success top border */}
        {isComplete && (
          <div
            className="absolute top-0 left-0 right-0 h-[2px] bg-larp-green animate-expand-line"
          />
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon with animation */}
            <div className="relative shrink-0">
              {isComplete ? (
                <div className="animate-pop-in">
                  <CheckCircle2 size={20} className="text-larp-green" />
                </div>
              ) : (
                <div className="relative">
                  {/* Pulsing ring */}
                  <div
                    className="absolute inset-0 rounded-full border border-danger-orange/50 animate-ping-slow"
                    style={{ width: 20, height: 20 }}
                  />
                  <div className="animate-spin-slow">
                    <Cpu size={20} className="text-danger-orange" />
                  </div>
                </div>
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-medium uppercase tracking-wider ${
                    isComplete ? 'text-larp-green' : 'text-danger-orange'
                  }`}
                >
                  {isComplete ? 'Analysis Complete' : 'AI Analysis'}
                </span>
              </div>

              <p className="text-[11px] text-ivory-light/50 mt-1 font-mono">
                {isComplete
                  ? 'Refreshing project data...'
                  : 'Processing intel in background...'}
              </p>

              {/* Activity indicator */}
              {!isComplete && (
                <div className="flex items-center gap-1.5 mt-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-danger-orange/70 animate-wave"
                      style={{
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                  <span className="text-[10px] text-ivory-light/30 font-mono ml-2">
                    PROCESSING
                  </span>
                </div>
              )}
            </div>

            {/* Close button - only show when complete */}
            {isComplete && (
              <button
                onClick={handleDismiss}
                className="shrink-0 p-1 text-ivory-light/30 hover:text-ivory-light/60 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-ivory-light/10 to-transparent" />

        {/* Corner accents */}
        <div
          className={`absolute bottom-0 left-0 w-3 h-3 border-l border-b ${
            isComplete ? 'border-larp-green/30' : 'border-danger-orange/30'
          }`}
        />
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 border-r border-b ${
            isComplete ? 'border-larp-green/30' : 'border-danger-orange/30'
          }`}
        />

        {/* Subtle noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  );
}
