'use client';

import {
  type LarpScore,
  getScoreColor,
  getScoreLabel,
  getRiskLevelColor,
  getConfidenceLabel,
} from '@/types/terminal';

interface ScoreDisplayProps {
  score: LarpScore;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

export default function ScoreDisplay({ score, size = 'md', showBreakdown = false }: ScoreDisplayProps) {
  const scoreColor = getScoreColor(score.score);
  const riskColor = getRiskLevelColor(score.riskLevel);

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      score: 'text-3xl',
      label: 'text-xs',
      badge: 'text-xs px-2 py-0.5',
    },
    md: {
      container: 'gap-3',
      score: 'text-5xl',
      label: 'text-sm',
      badge: 'text-xs px-3 py-1',
    },
    lg: {
      container: 'gap-4',
      score: 'text-7xl',
      label: 'text-base',
      badge: 'text-sm px-4 py-1.5',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col ${classes.container}`}>
      {/* Score number */}
      <div className="flex items-baseline gap-2">
        <span
          className={`font-mono font-bold ${classes.score}`}
          style={{ color: scoreColor }}
        >
          {score.score}
        </span>
        <span className="text-ivory-light/40 font-mono text-lg">/100</span>
      </div>

      {/* Score label */}
      <div className={`font-mono ${classes.label} text-ivory-light/70`}>
        {getScoreLabel(score.score)}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {/* Risk level */}
        <span
          className={`font-mono font-bold uppercase ${classes.badge} border`}
          style={{
            borderColor: riskColor,
            color: riskColor,
            backgroundColor: `${riskColor}15`,
          }}
        >
          {score.riskLevel} risk
        </span>

        {/* Confidence */}
        <span
          className={`font-mono ${classes.badge} border border-ivory-light/30 text-ivory-light/60`}
        >
          {getConfidenceLabel(score.confidence)}
        </span>
      </div>

      {/* Top tags */}
      {score.topTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {score.topTags.map((tag, i) => (
            <span
              key={i}
              className="font-mono text-xs px-2 py-1 bg-danger-orange/10 text-danger-orange border border-danger-orange/30"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Breakdown preview */}
      {showBreakdown && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="flex items-center justify-between px-2 py-1 bg-ivory-light/5 border border-ivory-light/10">
            <span className="text-ivory-light/50">Identity</span>
            <span style={{ color: getScoreColor(score.breakdown.identity.score) }}>
              {score.breakdown.identity.score}
            </span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 bg-ivory-light/5 border border-ivory-light/10">
            <span className="text-ivory-light/50">X Behavior</span>
            <span style={{ color: getScoreColor(score.breakdown.xBehavior.score) }}>
              {score.breakdown.xBehavior.score}
            </span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 bg-ivory-light/5 border border-ivory-light/10">
            <span className="text-ivory-light/50">Wallet</span>
            <span style={{ color: getScoreColor(score.breakdown.wallet.score) }}>
              {score.breakdown.wallet.score}
            </span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 bg-ivory-light/5 border border-ivory-light/10">
            <span className="text-ivory-light/50">Liquidity</span>
            <span style={{ color: getScoreColor(score.breakdown.liquidity.score) }}>
              {score.breakdown.liquidity.score}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
