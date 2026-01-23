'use client';

import { useState } from 'react';
import {
  type ModuleScore,
  getScoreColor,
} from '@/types/terminal';
import EvidenceItem from './EvidenceItem';
import {
  User,
  Twitter,
  Wallet,
  Droplets,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RiskCardProps {
  module: ModuleScore;
  defaultExpanded?: boolean;
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  'Team & Identity Risk': <User size={20} />,
  'Narrative Manipulation Risk': <Twitter size={20} />,
  'Wallet Behavior Risk': <Wallet size={20} />,
  'Token & Liquidity Risk': <Droplets size={20} />,
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  'Team & Identity Risk': 'Account age, domain age, verified links, consistency between sources',
  'Narrative Manipulation Risk': 'Engagement anomalies, burst patterns, shill clusters, suspicious amplification',
  'Wallet Behavior Risk': 'Fresh wallet funding, suspicious flows, CEX deposits from team wallets',
  'Token & Liquidity Risk': 'LP changes, holder concentration, unlock schedules',
};

export default function RiskCard({ module, defaultExpanded = false }: RiskCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const scoreColor = getScoreColor(module.score);
  const hasEvidence = module.evidence.length > 0;

  // Calculate contribution bar width
  const contributionPercent = Math.min(100, Math.max(0, (module.score * module.weight) / 25 * 100));

  return (
    <div className="border-2 border-ivory-light/20 bg-ivory-light/5 hover:border-danger-orange/30 transition-colors">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 sm:p-5 text-left"
        disabled={!hasEvidence}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-danger-orange shrink-0 mt-1">
              {MODULE_ICONS[module.name] || <User size={20} />}
            </span>
            <div className="min-w-0">
              <h3 className="font-mono font-bold text-ivory-light text-sm sm:text-base">
                {module.name}
              </h3>
              <p className="text-xs text-ivory-light/50 mt-1 line-clamp-2">
                {MODULE_DESCRIPTIONS[module.name] || 'Risk assessment module'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Score */}
            <span
              className="font-mono font-bold text-2xl sm:text-3xl"
              style={{ color: scoreColor }}
            >
              {module.score}
            </span>

            {/* Expand/collapse */}
            {hasEvidence && (
              <span className="text-ivory-light/40">
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </span>
            )}
          </div>
        </div>

        {/* Score contribution bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-ivory-light/40">Contribution to total score</span>
            <span className="text-ivory-light/60">{Math.round(module.score * module.weight)}pts</span>
          </div>
          <div className="h-1.5 bg-slate-dark/50 overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${contributionPercent}%`,
                backgroundColor: scoreColor,
              }}
            />
          </div>
        </div>

        {/* Evidence count badge */}
        {hasEvidence && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-mono text-ivory-light/40">
              {module.evidence.length} evidence item{module.evidence.length !== 1 ? 's' : ''}
            </span>
            {!expanded && (
              <span className="text-xs font-mono text-danger-orange">Click to expand</span>
            )}
          </div>
        )}
      </button>

      {/* Expanded evidence list */}
      {expanded && hasEvidence && (
        <div className="border-t border-ivory-light/10 px-4 sm:px-5 py-4 space-y-3">
          {module.evidence.map((evidence) => (
            <EvidenceItem key={evidence.id} evidence={evidence} />
          ))}
        </div>
      )}
    </div>
  );
}
