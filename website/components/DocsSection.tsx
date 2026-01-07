'use client';

import { useState } from 'react';
import Terminal from './Terminal';
import Badge from './Badge';

const DOCS_TABS = [
  {
    id: 'quickstart',
    label: 'quick start',
    content: {
      title: 'bonding curve casino',
      description: 'step 1: ape.\nstep 2: cope.\nthere is no step 3.',
      code: `$ clarp launch --pumpfun

> deploying bonding curve...
> kol bundle: 80% allocated
> telegram raid: scheduled
> product: none

WARN: 98.6% of tokens rug within 2-12hrs
WARN: you are exit liquidity
WARN: ser this is a casino

$ clarp --jeet-status

> checking paper hands...
> your sell threshold: -5%
> recommendation: ngmi`,
      notes: [
        'bonding curve = casino with extra steps',
        'soft rug in progress (always)',
        'at least we told you',
      ],
    },
  },
  {
    id: 'api',
    label: 'audit theater',
    content: {
      title: 'security',
      description: 'we paid $200k for a pdf. it says we\'re fine.',
      code: `// CERTIK AUDIT RESULTS v1.0.0

CRITICAL: 7 findings
HIGH: 12 findings
MEDIUM: 23 findings
LOW: 47 findings

STATUS: all ignored

// CERTIK SCORE: 87/100
// (score sponsored by project treasury)

// see also: nothing changed
// see also: we shipped anyway`,
      notes: [
        'audited ≠ safe',
        'badge goes on website regardless',
        '0 exploits found (so far)',
      ],
    },
  },
  {
    id: 'examples',
    label: 'tokenomics',
    content: {
      title: 'supply distribution',
      description: 'fair launch* (*terms and conditions apply)',
      code: `// $CLARP TOKENOMICS

team:        20% (vested until rug)
kol bundle:  30% (instant unlock)
treasury:    25% ("ecosystem growth")
liquidity:   15% (locked 7 days lol)
community:   10% (you are here)

// vesting schedule:
// - team: unlocks when you stop watching
// - advisor: already dumped
// - community: permanent liquidity`,
      notes: [
        'you are the 10%',
        'they are the 90%',
        'math checks out',
      ],
    },
  },
  {
    id: 'faq',
    label: 'faq',
    content: {
      title: 'frequently coped',
      description: 'questions and their answers.',
      code: `q: when launch?
a: q2 (the q2 that never ends)

q: wen product?
a: vibes only. roadmap: vibes only.

q: is this a rug?
a: it's vaporware-as-a-service
   (technically different)

q: dev do something?
a: *becomes exit liquidity*

q: wen product?
a: shipping v2. we're so back.

q: ngmi?
a: correct.`,
      notes: [
        'these are all the questions',
        'these are all the answers',
        'cope accordingly',
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
        <span className="badge badge-error mb-3 sm:mb-4">cope manual</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ivory-light mb-3 sm:mb-4 font-display">
          documentation
        </h2>
        <p className="text-sm sm:text-base text-ivory-light/70 max-w-2xl mx-auto px-2">
          everything you need to get rekt with clarp.
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
