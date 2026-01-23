'use client';

import { useState } from 'react';
import Terminal from './Terminal';

const DOCS_TABS = [
  {
    id: 'quickstart',
    label: 'quick start',
    content: {
      title: 'how CLARP works',
      description: 'polymarket shows sentiment.\nwe show evidence.\nfirst of its kind.',
      code: `$ clarp scan --project TROVE

> fetching polymarket odds... 80%
> scanning github repo...
> checking x account age...
> analyzing contract deployer...

SIGNAL: rebrand detected
SIGNAL: same wallets as UFO Gaming
SIGNAL: KOL undisclosed payments

LARP SCORE: 94/100
VERDICT: high risk

$ clarp --why

> polymarket sentiment: bullish
> on-chain evidence: bearish
> recommendation: dyor harder`,
      notes: [
        'polymarket odds + on-chain analysis',
        '6 signal detection matrix',
        'first autonomous trust pilot',
      ],
    },
  },
  {
    id: 'api',
    label: 'detection matrix',
    content: {
      title: 'LARP score signals',
      description: 'we check everything. others check one thing.',
      code: `// CLARP DETECTION MATRIX v1.0.0

SIGNAL 1: AI-generated code
SIGNAL 2: README bloat / doc theater
SIGNAL 3: ghost commits / suspicious patterns
SIGNAL 4: fake contributors
SIGNAL 5: test coverage analysis
SIGNAL 6: contract fork detection

// SCORING
// 90-100: confirmed vaporware
// 70-89: highly suspicious
// 50-69: yellow flags
// 30-49: probably fine
// 0-29: appears legitimate (rare)`,
      notes: [
        'comprehensive analysis',
        'no single point of failure',
        'evidence > vibes',
      ],
    },
  },
  {
    id: 'examples',
    label: 'case study',
    content: {
      title: 'TROVE analysis',
      description: '80% polymarket odds. 95% crash in 10 minutes.',
      code: `// TROVE CASE STUDY

polymarket odds: 80% to raise $20M
actual result: raised $20M
what happened: kept $12.7M

// CLARP SIGNALS (if we existed then)

REBRAND: UFO Gaming -> TROVE
WALLETS: same deployer addresses
LOGO: same asterisk design
KOLS: undisclosed paid promotions

// OUTCOME
token crashed 95% in 10 minutes
sentiment ≠ evidence`,
      notes: [
        'polymarket showed crowd sentiment',
        'CLARP shows on-chain evidence',
        'different signals. both matter.',
      ],
    },
  },
  {
    id: 'faq',
    label: 'faq',
    content: {
      title: 'frequently asked',
      description: 'questions about CLARP.',
      code: `q: what is CLARP?
a: first autonomous trust pilot
   polymarket + on-chain analysis

q: how is it different?
a: others check one thing
   we check everything

q: wen launch?
a: Q1 2025. actually.
   check the roadmap.

q: is this real?
a: we detect vaporware
   that's the whole product

q: why polymarket?
a: sentiment without evidence
   is just vibes. we add receipts.`,
      notes: [
        'CLARP spots LARP',
        'first mover advantage',
        'you\'re early',
      ],
    },
  },
];

export default function DocsSection() {
  const [activeTab, setActiveTab] = useState(DOCS_TABS[0].id);
  const activeContent = DOCS_TABS.find(tab => tab.id === activeTab)?.content;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8 sm:mb-12">
        <span className="badge badge-error mb-3 sm:mb-4">how it works</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-3 sm:mb-4 font-display">
          documentation
        </h2>
        <p className="text-sm sm:text-base text-slate-light max-w-2xl mx-auto px-2">
          polymarket odds + on-chain analysis. first of its kind.
        </p>
      </div>

      <div className="bg-ivory-medium border-2 border-slate-dark overflow-hidden" style={{ boxShadow: '4px 4px 0 var(--slate-dark)' }}>
        {/* tabs */}
        <div className="flex border-b-2 border-slate-dark overflow-x-auto scrollbar-hide">
          {DOCS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-mono whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-danger-orange border-b-2 border-danger-orange bg-ivory-light -mb-[2px]'
                  : 'text-slate-light hover:text-slate-dark hover:bg-ivory-light/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* content */}
        {activeContent && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
              {/* left: description */}
              <div className="flex flex-col min-h-[280px] sm:min-h-[320px]">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-dark mb-3 sm:mb-4">
                  {activeContent.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-light mb-4 sm:mb-6 whitespace-pre-line">
                  {activeContent.description}
                </p>

                {/* notes - pushed to bottom */}
                <div className="space-y-2 sm:space-y-3 mt-auto">
                  {activeContent.notes.map((note, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs sm:text-sm text-slate-dark bg-larp-red/10 px-3 sm:px-4 py-2 border-l-4 border-larp-red"
                    >
                      <span className="text-larp-red font-bold shrink-0">→</span>
                      {note}
                    </div>
                  ))}
                </div>
              </div>

              {/* right: code */}
              <div className="order-first lg:order-last h-[280px] sm:h-[320px]">
                <Terminal title={`the-truth.js`} className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <pre className="text-[10px] sm:text-xs text-ivory-light/90 whitespace-pre-wrap">
                      {activeContent.code}
                    </pre>
                  </div>
                </Terminal>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
