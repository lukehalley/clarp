'use client';

import { AlertTriangle, Skull, TrendingDown, ShieldAlert, Clock } from 'lucide-react';

// Mock warnings data
const MOCK_WARNINGS = [
  {
    id: '1',
    type: 'rug' as const,
    handle: '@cryptoscammer',
    title: 'Rug Pull Detected',
    description: 'Token $FAKE liquidity pulled. Multiple users report losses.',
    severity: 'critical' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    affected: '$1.2M',
  },
  {
    id: '2',
    type: 'trust_drop' as const,
    handle: '@shadykol',
    title: 'Trust Score Dropped',
    description: 'Trust score fell from 72 to 28 after multiple failed calls.',
    severity: 'high' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    affected: '3 tokens',
  },
  {
    id: '3',
    type: 'suspicious' as const,
    handle: '$NEWTOKEN',
    title: 'Suspicious Activity',
    description: 'Top 10 holders control 85% of supply. Insider wallet detected.',
    severity: 'medium' as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    affected: '234 holders',
  },
];

const SEVERITY_CONFIG = {
  critical: {
    icon: Skull,
    color: '#dc2626',
    bg: 'bg-larp-red/10',
    border: 'border-larp-red/30',
    label: 'CRITICAL',
  },
  high: {
    icon: AlertTriangle,
    color: '#f97316',
    bg: 'bg-danger-orange/10',
    border: 'border-danger-orange/30',
    label: 'HIGH',
  },
  medium: {
    icon: ShieldAlert,
    color: '#eab308',
    bg: 'bg-larp-yellow/10',
    border: 'border-larp-yellow/30',
    label: 'MEDIUM',
  },
};

const TYPE_ICONS = {
  rug: Skull,
  trust_drop: TrendingDown,
  suspicious: ShieldAlert,
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function WarningsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle size={28} className="text-larp-red" />
          <div>
            <h1 className="text-xl font-mono font-bold text-ivory-light">Active Warnings</h1>
            <p className="text-xs font-mono text-ivory-light/50">
              Real-time alerts for rugs, trust drops, and suspicious activity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-larp-red/10 border border-larp-red/30">
          <span className="w-2 h-2 bg-larp-red animate-pulse" />
          <span className="font-mono text-xs text-larp-red">{MOCK_WARNINGS.length} ACTIVE</span>
        </div>
      </div>

      {/* Warnings List */}
      <div className="space-y-3">
        {MOCK_WARNINGS.map((warning) => {
          const severityConfig = SEVERITY_CONFIG[warning.severity];
          const TypeIcon = TYPE_ICONS[warning.type];
          const SeverityIcon = severityConfig.icon;

          return (
            <div
              key={warning.id}
              className={`p-4 border ${severityConfig.bg} ${severityConfig.border}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${severityConfig.color}15`,
                    borderColor: `${severityConfig.color}40`,
                  }}
                >
                  <TypeIcon size={20} style={{ color: severityConfig.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-ivory-light">
                      {warning.title}
                    </span>
                    <span
                      className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono font-bold border ${severityConfig.bg} ${severityConfig.border}`}
                      style={{ color: severityConfig.color }}
                    >
                      <SeverityIcon size={10} />
                      {severityConfig.label}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-ivory-light/70 mb-2">
                    {warning.description}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-ivory-light/40">
                    <span className="text-danger-orange">{warning.handle}</span>
                    <span>Affected: {warning.affected}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimeAgo(warning.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 border border-ivory-light/10 bg-ivory-light/5">
        <p className="font-mono text-xs text-ivory-light/40 text-center">
          Warnings are automatically generated by scanning X activity, on-chain data, and trust score changes.
          <br />
          Subscribe to alerts to get notified in real-time.
        </p>
      </div>
    </div>
  );
}
