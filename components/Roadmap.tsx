'use client';

const ROADMAP_PHASES = [
  {
    phase: 'q1 2025',
    title: 'C[LARP] ALPHA',
    items: ['polymarket API integration', 'project mapping system', 'CLARP analysis overlay'],
    status: 'current',
    stamp: 'BUILDING',
    crossedDates: [],
  },
  {
    phase: 'q1 2025',
    title: 'C[LARP] AGENT',
    items: ['autonomous X bot (@CLARP)', 'github repo scanner', 'LARP score (0-100)'],
    status: 'upcoming',
    stamp: 'PLANNED',
    crossedDates: [],
  },
  {
    phase: 'q1/q2 2025',
    title: 'rebrand detection',
    items: ['wallet history tracking', 'logo similarity detection', 'KOL accountability tracker'],
    status: 'upcoming',
    stamp: 'PLANNED',
    crossedDates: [],
  },
  {
    phase: 'q2 2025',
    title: 'snitch mode',
    items: ['anonymous reporting with bounties', 'hall of shame v2', 'community verification'],
    status: 'upcoming',
    stamp: 'PLANNED',
    crossedDates: [],
  },
];

// Coffee stain SVG component
function CoffeeStain({ className = '', size = 80 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ opacity: 0.15 }}
    >
      <ellipse cx="50" cy="50" rx="45" ry="42" fill="none" stroke="#8B4513" strokeWidth="8" />
      <ellipse cx="50" cy="50" rx="38" ry="35" fill="none" stroke="#8B4513" strokeWidth="3" opacity="0.5" />
    </svg>
  );
}

// Stamp component
function Stamp({ text, variant, rotation = -12 }: { text: string; variant: 'approved' | 'rejected' | 'pending' | 'classified'; rotation?: number }) {
  const colors = {
    approved: { border: '#27AE60', text: '#27AE60' },
    rejected: { border: '#E74C3C', text: '#E74C3C' },
    pending: { border: '#F1C40F', text: '#F1C40F' },
    classified: { border: '#E74C3C', text: '#E74C3C' },
  };

  return (
    <div
      className="inline-block px-3 py-1 font-mono text-xs font-bold tracking-wider border-4 uppercase"
      style={{
        borderColor: colors[variant].border,
        color: colors[variant].text,
        transform: `rotate(${rotation}deg)`,
        borderRadius: '4px',
        opacity: 0.85,
      }}
    >
      {text}
    </div>
  );
}

// Paper clip SVG
function PaperClip({ className = '' }: { className?: string }) {
  return (
    <svg width="24" height="60" viewBox="0 0 24 60" className={className}>
      <path
        d="M12 2 C6 2 2 6 2 12 L2 48 C2 54 6 58 12 58 C18 58 22 54 22 48 L22 16 C22 12 19 9 15 9 C11 9 8 12 8 16 L8 44"
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Redacted text component
function Redacted({ width = 60 }: { width?: number }) {
  return (
    <span
      className="inline-block bg-slate-dark mx-1"
      style={{ width, height: '1em', verticalAlign: 'middle' }}
    />
  );
}

export default function Roadmap() {
  return (
    <section id="roadmap" className="py-16 sm:py-24 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-block px-3 py-1 text-xs font-mono bg-larp-red text-white mb-3 sm:mb-4 border border-black">
            leaked document
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-3 sm:mb-4 font-display">
            internal roadmap memo
          </h2>
          <p className="text-sm sm:text-base text-slate-light max-w-xl mx-auto">
            first autonomous trust pilot. polymarket + on-chain analysis.
          </p>
        </div>

        {/* The Document */}
        <div
          className="relative mx-auto"
          style={{
            background: 'linear-gradient(135deg, #f5f5dc 0%, #f0ead6 50%, #e8e0c8 100%)',
            padding: '2rem',
            maxWidth: '800px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 0 60px rgba(0,0,0,0.05)',
          }}
        >
          {/* Paper texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Coffee stain */}
          <div className="absolute bottom-32 right-8 hidden sm:block">
            <CoffeeStain size={90} />
          </div>

          {/* Paper clip */}
          <div className="absolute top-4 -left-3 hidden sm:block">
            <PaperClip />
          </div>


          {/* Document header */}
          <div className="relative border-b-2 border-slate-dark/30 pb-4 mb-6">
            <div className="font-mono text-[10px] sm:text-xs text-slate-dark/60 mb-2">
              CLARP INTERNAL MEMO • DO NOT DISTRIBUTE • PAGE 1 OF 1
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <div className="font-mono text-xs text-slate-dark/70">TO: All Stakeholders</div>
                <div className="font-mono text-xs text-slate-dark/70">FROM: <Redacted width={80} /></div>
                <div className="font-mono text-xs text-slate-dark/70">RE: Product Development Timeline</div>
              </div>
              <div className="font-mono text-xs text-slate-dark/70">
                DATE: Jan 2025
              </div>
            </div>
          </div>

          {/* Opening paragraph */}
          <div className="relative mb-8">
            <p className="font-mono text-sm text-slate-dark leading-relaxed">
              This document outlines our <span className="font-bold">C[LARP]</span> development roadmap for <span className="font-bold">Q1-Q2 2025</span>.
              First autonomous trust pilot for crypto. Polymarket odds + on-chain analysis.
              No one else is building this.
            </p>
          </div>

          {/* Phase entries */}
          <div className="space-y-6">
            {ROADMAP_PHASES.map((phase, i) => (
              <div
                key={i}
                className="relative border-l-4 pl-4 py-2"
                style={{
                  borderColor:
                    phase.status === 'complete' ? '#27AE60' :
                    phase.status === 'current' ? '#FF6B35' :
                    phase.status === 'never' ? '#E74C3C' : '#F1C40F',
                }}
              >
                {/* Phase header */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-slate-dark uppercase tracking-wider">
                    {phase.status === 'never' ? (
                      <>PHASE {i + 1}: <span className="text-larp-red">∞</span></>
                    ) : (
                      <>PHASE {i + 1}: {phase.phase}</>
                    )}
                  </span>

                  {/* Crossed out dates */}
                  {phase.crossedDates.length > 0 && (
                    <span className="font-mono text-[10px] text-slate-dark/40">
                      {phase.crossedDates.map((d, j) => (
                        <span key={j} className="line-through mr-2">{d}</span>
                      ))}
                    </span>
                  )}

                  {/* Status stamp */}
                  <div className="ml-auto">
                    <Stamp
                      text={phase.stamp}
                      variant={
                        phase.status === 'current' ? 'pending' : 'pending'
                      }
                      rotation={[-8, -4, 6, -10][i]}
                    />
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-dark text-lg mb-2 font-display">
                  {phase.title}
                </h3>

                {/* Items as bullet points */}
                <ul className="space-y-1 mb-2">
                  {phase.items.map((item, j) => (
                    <li key={j} className="font-mono text-xs text-slate-dark/80 flex items-start gap-2">
                      <span className="text-slate-dark/40">
                        {phase.status === 'current' ? '▸' : '☐'}
                      </span>
                      <span>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

              </div>
            ))}
          </div>

          {/* Footer section */}
          <div className="mt-8 pt-4 border-t-2 border-slate-dark/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              {/* Signature section */}
              <div className="font-mono text-xs text-slate-dark/70">
                <div className="mb-4">
                  <div>APPROVED BY:</div>
                  <div className="mt-2 border-b border-slate-dark/40 w-40 h-6" />
                  <div className="text-[10px] mt-1">(authorized signature)</div>
                </div>
                <div>
                  <div>DATE: __/__/____</div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="font-mono text-[9px] text-slate-dark/50 max-w-[200px] text-right">
                * All dates are subject to change without notice.
              </div>
            </div>
          </div>

          {/* "VOID" watermark for the last phase */}
          <div
            className="absolute bottom-1/4 left-1/2 -translate-x-1/2 font-mono text-8xl font-bold tracking-widest pointer-events-none select-none hidden sm:block"
            style={{
              color: 'rgba(231, 76, 60, 0.15)',
              transform: 'translate(-50%, 0) rotate(-20deg)',
            }}
          >
            VOID
          </div>

          {/* Corner fold effect */}
          <div
            className="absolute bottom-0 right-0 w-12 h-12 hidden sm:block"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
            }}
          />
        </div>

        {/* Bottom note outside the document */}
        <div className="mt-6 text-center">
          <p className="text-ivory-light/40 font-mono text-xs">
            leaked document
          </p>
        </div>
      </div>
    </section>
  );
}
