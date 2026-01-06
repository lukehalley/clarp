'use client';

import { useState } from 'react';
import Terminal from './Terminal';
import Badge from './Badge';

const DOCS_TABS = [
  {
    id: 'quickstart',
    label: 'quick start',
    content: {
      title: 'installation',
      description: 'npm install nothing. that\'s it. that\'s the tutorial.',
      code: `$ npm install @clarp/sdk

npm ERR! 404 '@clarp/sdk' is not in the npm registry

$ npm install @clarp/core

npm ERR! 404

$ npm install literally-anything-from-clarp

npm ERR! have you tried buying the token instead`,
      notes: [
        'there\'s nothing to install',
        'there never was',
        'thanks for checking though',
      ],
    },
  },
  {
    id: 'api',
    label: 'api reference',
    content: {
      title: 'endpoints',
      description: 'all available api endpoints are listed below.',
      code: `// endpoints:





// end of documentation`,
      notes: [
        'this page is intentionally blank',
        'like most whitepapers',
        'but at least we\'re honest about it',
      ],
    },
  },
  {
    id: 'examples',
    label: 'examples',
    content: {
      title: 'code samples',
      description: 'real working examples from our production codebase.',
      code: `// example 1: basic setup
// [this section intentionally left blank]

// example 2: advanced usage
// [this section intentionally left blank]

// example 3: production deployment
// [this section intentionally left blank]

// example 4: the actual code
console.log("coming soon");`,
      notes: [
        'console.log is production-ready',
        'trust the process',
        'shipping q4 2087',
      ],
    },
  },
  {
    id: 'faq',
    label: 'faq',
    content: {
      title: 'frequently asked',
      description: 'questions and their answers.',
      code: `q: when launch?
a: soon

q: when actually?
a: soon

q: is this real?
a: define real

q: should i buy?
a: this is not financial advice

q: is that a no?
a: this is not financial advice

q: what does clarp actually do?
a: it's a framework for building next-gen
   [CONNECTION TIMED OUT]`,
      notes: [
        'these are all the questions',
        'and all the answers',
        'thank you for your interest in clarp',
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
        <span className="badge badge-error mb-3 sm:mb-4">documentation</span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-dark mb-3 sm:mb-4 font-display">
          documentation
        </h2>
        <p className="text-sm sm:text-base text-slate-light max-w-2xl mx-auto px-2">
          everything you need to get started with clarp.
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
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* left: description */}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-dark mb-3 sm:mb-4">
                  {activeContent.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-light mb-4 sm:mb-6">
                  {activeContent.description}
                </p>

                {/* notes */}
                <div className="space-y-2 sm:space-y-3">
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
              <div className="order-first lg:order-last">
                <Terminal title={`the-truth.js`}>
                  <pre className="text-[10px] sm:text-xs text-ivory-light/90 whitespace-pre-wrap overflow-x-auto">
                    {activeContent.code}
                  </pre>
                </Terminal>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
