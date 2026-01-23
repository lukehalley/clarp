'use client';

import Link from 'next/link';
import {
  type Project,
  type LarpScore,
  CHAIN_INFO,
  getScoreColor,
  getScoreLabel,
  getRiskLevelColor,
} from '@/types/terminal';
import {
  Share2,
  ExternalLink,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';

interface ReportContentProps {
  project: Project;
  score: LarpScore;
}

export default function ReportContent({ project, score }: ReportContentProps) {
  const [copied, setCopied] = useState(false);

  const chainInfo = CHAIN_INFO[project.chain];
  const scoreColor = getScoreColor(score.score);
  const riskColor = getRiskLevelColor(score.riskLevel);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `${project.name} LARP Score: ${score.score}/100\nRisk: ${score.riskLevel.toUpperCase()}\n${score.topTags.slice(0, 3).join(' • ')}\n\n`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title: `${project.name} LARP Score`, text, url });
    } else {
      navigator.clipboard.writeText(text + url);
      alert('Report link copied to clipboard!');
    }
  };

  // Collect top evidence items
  const topEvidence = [
    ...score.breakdown.identity.evidence,
    ...score.breakdown.xBehavior.evidence,
    ...score.breakdown.wallet.evidence,
    ...score.breakdown.liquidity.evidence,
  ]
    .filter(e => e.severity === 'critical' || e.severity === 'warning')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-dark">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/terminal"
            className="inline-flex items-center gap-2 text-ivory-light/50 hover:text-ivory-light font-mono text-sm mb-6"
          >
            <span className="text-danger-orange font-bold">CLARP</span> TERMINAL
          </Link>
        </div>

        {/* Report Card - optimized for screenshots */}
        <div
          className="border-2 border-ivory-light/20 bg-ivory-light/5 p-6 sm:p-8"
          style={{ boxShadow: '8px 8px 0 rgba(250,249,245,0.1)' }}
        >
          {/* Project info */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-ivory-light">
                {project.name}
              </h1>
              {project.ticker && (
                <span className="font-mono text-xl text-danger-orange">
                  ${project.ticker}
                </span>
              )}
            </div>

            <span
              className="inline-block text-sm font-mono px-3 py-1 border mt-2"
              style={{ borderColor: chainInfo.color, color: chainInfo.color }}
            >
              {chainInfo.name}
            </span>
          </div>

          {/* Score - large and prominent */}
          <div className="text-center mb-8">
            <div className="inline-block">
              <div className="flex items-baseline justify-center gap-2">
                <span
                  className="font-mono font-bold text-7xl sm:text-8xl"
                  style={{ color: scoreColor }}
                >
                  {score.score}
                </span>
                <span className="font-mono text-2xl text-ivory-light/40">/100</span>
              </div>

              <p className="font-mono text-lg text-ivory-light/70 mt-2">
                {getScoreLabel(score.score)}
              </p>

              <div className="flex items-center justify-center gap-3 mt-4">
                <span
                  className="font-mono font-bold text-sm uppercase px-4 py-2 border"
                  style={{
                    borderColor: riskColor,
                    color: riskColor,
                    backgroundColor: `${riskColor}15`,
                  }}
                >
                  {score.riskLevel} RISK
                </span>
                <span className="font-mono text-sm text-ivory-light/50 px-3 py-2 border border-ivory-light/20">
                  {score.confidence} confidence
                </span>
              </div>
            </div>
          </div>

          {/* Top risk tags */}
          {score.topTags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {score.topTags.slice(0, 5).map((tag, i) => (
                <span
                  key={i}
                  className="font-mono text-sm px-3 py-1.5 bg-danger-orange/10 text-danger-orange border border-danger-orange/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Top red flags */}
          {topEvidence.length > 0 && (
            <div className="border-t border-ivory-light/10 pt-6">
              <h2 className="font-mono text-sm text-ivory-light/50 mb-4 text-center">
                TOP RED FLAGS
              </h2>
              <ul className="space-y-3">
                {topEvidence.map((evidence, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      className={`shrink-0 mt-0.5 ${
                        evidence.severity === 'critical' ? 'text-larp-red' : 'text-danger-orange'
                      }`}
                    />
                    <span className="text-sm text-ivory-light/80">{evidence.summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Last updated */}
          <div className="border-t border-ivory-light/10 pt-4 mt-6 text-center">
            <p className="text-xs font-mono text-ivory-light/40">
              Last updated: {score.lastUpdated.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-danger-orange text-black font-mono font-bold hover:bg-danger-orange/90 transition-colors"
          >
            <Share2 size={18} />
            Share on X
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-ivory-light/30 text-ivory-light font-mono hover:border-ivory-light/50 transition-colors"
          >
            {copied ? <Check size={18} className="text-larp-green" /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <Link
            href={`/terminal/project/${project.id}`}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-ivory-light/30 text-ivory-light font-mono hover:border-danger-orange/50 transition-colors"
          >
            <ExternalLink size={18} />
            Full Analysis
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 border border-ivory-light/10 text-center">
          <p className="text-xs font-mono text-ivory-light/40">
            This report is for informational purposes only and does not constitute financial advice.
            <br />
            Always do your own research before making investment decisions.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-ivory-light/30">
            Powered by{' '}
            <Link href="/" className="text-danger-orange hover:underline">
              CLARP Terminal
            </Link>
            {' • '}
            First autonomous trust pilot
          </p>
        </div>
      </div>
    </div>
  );
}
