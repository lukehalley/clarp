'use client';

import { Bot, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AIOverview } from '@/types/unified-terminal';

interface AIOverviewPanelProps {
  overview: AIOverview | null;
  loading?: boolean;
}

const VERDICT_CONFIG = {
  bullish: {
    icon: TrendingUp,
    color: '#22c55e',
    label: 'BULLISH',
    bg: 'bg-larp-green/10',
    border: 'border-larp-green/30',
  },
  neutral: {
    icon: Minus,
    color: '#6b7280',
    label: 'NEUTRAL',
    bg: 'bg-ivory-light/5',
    border: 'border-ivory-light/20',
  },
  bearish: {
    icon: TrendingDown,
    color: '#f97316',
    label: 'BEARISH',
    bg: 'bg-danger-orange/10',
    border: 'border-danger-orange/30',
  },
  avoid: {
    icon: AlertTriangle,
    color: '#dc2626',
    label: 'AVOID',
    bg: 'bg-larp-red/10',
    border: 'border-larp-red/30',
  },
};

export default function AIOverviewPanel({ overview, loading }: AIOverviewPanelProps) {
  if (loading) {
    return (
      <div className="p-3 bg-slate-medium/30 border border-ivory-light/10 h-full">
        <div className="flex items-center gap-2 mb-2">
          <Bot size={14} className="text-danger-orange animate-pulse" />
          <span className="font-mono text-[10px] text-ivory-light/50 uppercase tracking-wider">
            AI Overview
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 bg-ivory-light/10 animate-pulse w-full" />
          <div className="h-2 bg-ivory-light/10 animate-pulse w-3/4" />
          <div className="h-2 bg-ivory-light/10 animate-pulse w-5/6" />
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-3 bg-slate-medium/30 border border-ivory-light/10 h-full">
        <div className="flex items-center gap-2 mb-2">
          <Bot size={14} className="text-ivory-light/30" />
          <span className="font-mono text-[10px] text-ivory-light/30 uppercase tracking-wider">
            AI Overview
          </span>
        </div>
        <p className="font-mono text-[10px] text-ivory-light/30 text-center py-3">
          Scan an entity to see AI analysis
        </p>
      </div>
    );
  }

  const verdictConfig = VERDICT_CONFIG[overview.verdict];
  const VerdictIcon = verdictConfig.icon;

  return (
    <div className={`p-3 border h-full flex flex-col ${verdictConfig.bg} ${verdictConfig.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-danger-orange" />
          <span className="font-mono text-[10px] text-ivory-light/50 uppercase tracking-wider">
            AI Overview
          </span>
        </div>
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 font-mono text-[9px] font-bold border ${verdictConfig.bg} ${verdictConfig.border}`}
          style={{ color: verdictConfig.color }}
        >
          <VerdictIcon size={10} />
          {verdictConfig.label}
        </div>
      </div>

      {/* Summary */}
      <p className="font-mono text-xs text-ivory-light leading-relaxed mb-2">
        {overview.summary}
      </p>

      {/* Key Points */}
      <div className="grid grid-cols-2 gap-2 mb-2 flex-1 min-h-0">
        {/* Positive Signals */}
        {overview.positiveSignals.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle size={8} className="text-larp-green" />
              <span className="font-mono text-[8px] text-larp-green uppercase">Positives</span>
            </div>
            <ul className="space-y-0.5">
              {overview.positiveSignals.slice(0, 3).map((signal, i) => (
                <li key={i} className="font-mono text-[9px] text-ivory-light/70 pl-2 relative">
                  <span className="absolute left-0 text-larp-green">+</span>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Flags */}
        {overview.riskFlags.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle size={8} className="text-larp-red" />
              <span className="font-mono text-[8px] text-larp-red uppercase">Risks</span>
            </div>
            <ul className="space-y-0.5">
              {overview.riskFlags.slice(0, 2).map((flag, i) => (
                <li key={i} className="font-mono text-[9px] text-ivory-light/70 pl-2 relative">
                  <span className="absolute left-0 text-larp-red">!</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Confidence & timestamp */}
      <div className="flex items-center justify-between pt-1.5 border-t border-ivory-light/10 mt-auto">
        <span className="font-mono text-[8px] text-ivory-light/30">
          {overview.confidence.toUpperCase()}
        </span>
        <span className="font-mono text-[8px] text-ivory-light/30">
          {new Date(overview.generatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
