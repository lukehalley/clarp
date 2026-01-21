'use client';

import { useState } from 'react';

const SHAME_ENTRIES = [
  {
    name: 'project alpha',
    raised: '$47m',
    shipped: 'landing page',
    status: 'coming q2',
    timeline: '2 years',
    excuse: 'refining tokenomics',
    highlight: 'raised',
  },
  {
    name: 'defi protocol x',
    raised: '$120m',
    shipped: 'medium articles',
    status: 'pivoting',
    timeline: '18 months',
    excuse: 'market conditions',
    highlight: 'shipped',
  },
  {
    name: 'ai agent wrapper',
    raised: '$80m',
    shipped: 'chatgpt api call',
    status: 'shipping v2',
    timeline: '6 months',
    excuse: 'shipping v2',
    highlight: 'status',
  },
  {
    name: 'modular l3',
    raised: '$200m',
    shipped: 'whitepaper (no math)',
    status: 'testnet soon',
    timeline: '3 years',
    excuse: 'security first',
    highlight: 'timeline',
  },
  {
    name: 'restaking primitive',
    raised: '$65m',
    shipped: 'recursive ponzinomics',
    status: 'cascade pending',
    timeline: '8 months',
    excuse: 'capital efficiency',
    highlight: 'excuse',
  },
  {
    name: 'intent protocol',
    raised: '$95m',
    shipped: 'blog posts',
    status: 'mainnet q∞',
    timeline: '2.5 years',
    excuse: 'building different',
    highlight: 'raised',
  },
];

export default function HallOfShame() {
  const [hoveredEntry, setHoveredEntry] = useState<number | null>(null);

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <span className="inline-block px-3 py-1 text-xs font-mono bg-larp-red text-black mb-3 sm:mb-4">
            hall of shame
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-3 sm:mb-4 font-display">
            raised millions. shipped vibes.
          </h2>
          <p className="text-sm sm:text-base text-slate-light max-w-2xl mx-auto px-2">
            a tribute to the vaporware that came before us. names changed to protect the guilty.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {SHAME_ENTRIES.map((entry, i) => (
            <div
              key={i}
              className="relative bg-slate-dark border-2 border-larp-red/30 p-4 sm:p-6 transition-all duration-300 hover:border-larp-red cursor-crosshair h-full flex flex-col"
              style={{
                boxShadow: hoveredEntry === i ? '0 0 20px rgba(239, 68, 68, 0.3)' : '4px 4px 0 var(--slate-dark)',
              }}
              onMouseEnter={() => setHoveredEntry(i)}
              onMouseLeave={() => setHoveredEntry(null)}
            >
              {/* Redacted name effect */}
              <div className="flex items-center gap-2 mb-4">
                <span className="font-mono text-xs text-larp-red">[REDACTED]</span>
                <span className="text-ivory-light/30 font-mono text-xs line-through">{entry.name}</span>
              </div>

              <div className="space-y-3 flex-grow">
                <div className="flex justify-between items-center">
                  <span className="text-ivory-light/50 text-xs font-mono">raised:</span>
                  <span className={`font-mono font-bold ${entry.highlight === 'raised' ? 'text-danger-orange' : 'text-ivory-light'}`}>
                    {entry.raised}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-ivory-light/50 text-xs font-mono">shipped:</span>
                  <span className={`font-mono text-sm text-right ${entry.highlight === 'shipped' ? 'text-danger-orange' : 'text-ivory-light/80'}`}>
                    {entry.shipped}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-ivory-light/50 text-xs font-mono">status:</span>
                  <span className={`font-mono text-sm ${entry.highlight === 'status' ? 'text-larp-red' : 'text-ivory-light/80'}`}>
                    {entry.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-ivory-light/50 text-xs font-mono">timeline:</span>
                  <span className={`font-mono text-sm ${entry.highlight === 'timeline' ? 'text-danger-orange' : 'text-ivory-light/80'}`}>
                    {entry.timeline}
                  </span>
                </div>
              </div>

              {/* Excuse section - pushed to bottom */}
              <div className="pt-3 mt-3 border-t border-larp-red/20">
                <span className="text-ivory-light/40 text-xs font-mono">excuse:</span>
                <p className={`font-mono text-sm italic mt-1 ${entry.highlight === 'excuse' ? 'text-danger-orange' : 'text-ivory-light/60'}`}>
                  "{entry.excuse}"
                </p>
              </div>

              {/* Shame badge */}
              {hoveredEntry === i && (
                <div className="absolute -top-2 -right-2 bg-larp-red text-black px-2 py-0.5 font-mono text-[10px] font-bold border border-black">
                  ngmi
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-slate-light/60 font-mono text-xs">
            * any resemblance to actual projects is purely intentional
          </p>
          <p className="text-slate-light/40 font-mono text-[10px] mt-2">
            if you're offended, you're probably on this list
          </p>
        </div>
      </div>
    </section>
  );
}
