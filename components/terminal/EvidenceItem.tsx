'use client';

import {
  type Evidence,
  EVIDENCE_TYPE_LABELS,
  getSeverityColor,
} from '@/types/terminal';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';

interface EvidenceItemProps {
  evidence: Evidence;
}

const SEVERITY_ICONS = {
  critical: <AlertCircle size={14} />,
  warning: <AlertTriangle size={14} />,
  info: <Info size={14} />,
};

export default function EvidenceItem({ evidence }: EvidenceItemProps) {
  const severityColor = getSeverityColor(evidence.severity);

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-slate-dark/30 border border-ivory-light/10 hover:border-ivory-light/20 transition-colors">
      {/* Severity icon */}
      <span style={{ color: severityColor }} className="shrink-0 mt-0.5">
        {SEVERITY_ICONS[evidence.severity]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type badge */}
          <span
            className="text-xs font-mono px-2 py-0.5 border"
            style={{
              borderColor: severityColor,
              color: severityColor,
              backgroundColor: `${severityColor}15`,
            }}
          >
            {EVIDENCE_TYPE_LABELS[evidence.type]}
          </span>

          {/* Timestamp */}
          <span className="text-xs font-mono text-ivory-light/40">
            {formatTimestamp(evidence.timestamp)}
          </span>
        </div>

        {/* Summary */}
        <p className="text-sm text-ivory-light/80 mt-2 leading-relaxed">
          {evidence.summary}
        </p>

        {/* Link */}
        {evidence.url && (
          <a
            href={evidence.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-mono text-danger-orange hover:text-danger-orange/80 mt-2"
          >
            View source
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
