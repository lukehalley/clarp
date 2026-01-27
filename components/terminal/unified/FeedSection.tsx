'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { UnifiedEntity } from '@/types/unified-terminal';
import EntityCard from './EntityCard';

interface FeedSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  entities: UnifiedEntity[];
  viewAllHref?: string;
  emptyMessage?: string;
  compact?: boolean;
}

export default function FeedSection({
  title,
  icon,
  iconColor,
  entities,
  viewAllHref,
  emptyMessage = 'No data yet',
  compact = false
}: FeedSectionProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-ivory-light/10">
        <div className="flex items-center gap-1.5">
          <span style={{ color: iconColor }}>{icon}</span>
          <h3 className="font-mono text-[10px] font-bold text-ivory-light uppercase tracking-wider">
            {title}
          </h3>
          <span className="px-1 py-0.5 text-[8px] font-mono bg-ivory-light/10 text-ivory-light/50">
            {entities.length}
          </span>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-[9px] font-mono text-ivory-light/40 hover:text-danger-orange transition-colors"
          >
            ALL
            <ChevronRight size={10} />
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {entities.length > 0 ? (
          <div className="space-y-1">
            {entities.map((entity) => (
              <EntityCard key={entity.id} entity={entity} compact={compact} showMetrics={!compact} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 text-ivory-light/30 font-mono text-[10px]">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
