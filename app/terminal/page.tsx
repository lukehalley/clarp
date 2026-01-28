'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Filter,
  CheckCircle,
  AlertTriangle,
  Shield,
  ArrowUpDown,
  RotateCcw,
  Boxes,
  User,
  Building2,
} from 'lucide-react';
import IntelCard from '@/components/terminal/IntelCard';
import WalletGate from '@/components/auth/WalletGate';
import type { Project, EntityType } from '@/types/project';

// ============================================================================
// TYPES
// ============================================================================

type EntityFilter = 'project' | 'person' | 'organization';
type CategoryFilter = 'all' | 'verified' | 'high-risk' | 'low-risk';
type SortOption = 'score-high' | 'score-low' | 'recent' | 'name-asc';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'score-high', label: 'Trust: High to Low' },
  { id: 'score-low', label: 'Trust: Low to High' },
  { id: 'recent', label: 'Recently Scanned' },
  { id: 'name-asc', label: 'Name: A to Z' },
];

const ENTITY_FILTERS: { id: EntityFilter; label: string; shortLabel: string; icon: React.ReactNode; color: string }[] = [
  { id: 'project', label: 'Projects', shortLabel: 'Projects', icon: <Boxes size={14} />, color: 'text-danger-orange' },
  { id: 'person', label: 'People', shortLabel: 'People', icon: <User size={14} />, color: 'text-larp-purple' },
  { id: 'organization', label: 'Orgs', shortLabel: 'Orgs', icon: <Building2 size={14} />, color: 'text-larp-yellow' },
];

const CATEGORY_FILTERS: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Filter size={14} /> },
  { id: 'verified', label: 'Verified', icon: <CheckCircle size={14} /> },
  { id: 'high-risk', label: 'High Risk', icon: <AlertTriangle size={14} /> },
  { id: 'low-risk', label: 'Trusted', icon: <Shield size={14} /> },
];


// ============================================================================
// ENTITY TYPE TABS
// ============================================================================

function EntityTypeTabs({
  entityFilter,
  setEntityFilter,
  counts,
}: {
  entityFilter: EntityFilter;
  setEntityFilter: (e: EntityFilter) => void;
  counts: { project: number; person: number; organization: number };
}) {
  return (
    <div className="border-b-2 border-ivory-light/10">
      <div className="flex">
        {ENTITY_FILTERS.map((filter, index) => {
          const isActive = entityFilter === filter.id;
          const count = counts[filter.id];

          return (
            <button
              key={filter.id}
              onClick={() => setEntityFilter(filter.id)}
              className={`
                relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4
                font-mono text-[11px] sm:text-xs transition-all duration-200
                border-b-2 -mb-[2px]
                ${isActive
                  ? `${filter.color} border-current font-bold bg-current/5`
                  : 'text-ivory-light/40 border-transparent hover:text-ivory-light/60 hover:bg-ivory-light/[0.02]'
                }
                ${index === 0 ? '' : 'border-l border-ivory-light/5'}
              `}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {filter.icon}
              </span>
              <span className="hidden xs:inline">{filter.label}</span>
              <span className="xs:hidden">{filter.shortLabel}</span>
              {count > 0 && (
                <span className={`
                  ml-1 px-1.5 py-0.5 text-[9px] sm:text-[10px] rounded-sm
                  ${isActive
                    ? 'bg-current/20 text-current'
                    : 'bg-ivory-light/10 text-ivory-light/40'
                  }
                `}>
                  {count}
                </span>
              )}
              {/* Active indicator glow */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] blur-sm"
                  style={{
                    backgroundColor: filter.id === 'project' ? '#FF6B35'
                      : filter.id === 'person' ? '#9B59B6'
                      : '#FFD93D'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// FILTER BAR
// ============================================================================

function FilterBar({
  category,
  setCategory,
  sortBy,
  setSortBy,
  verifiedOnly,
  setVerifiedOnly,
  hasActiveFilters,
  onReset,
}: {
  category: CategoryFilter;
  setCategory: (c: CategoryFilter) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3 py-4 border-b border-ivory-light/10">
      {/* Row 1: Category filters - scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
        <div className="flex items-center gap-1 min-w-max sm:min-w-0">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCategory(filter.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 font-mono text-[11px] sm:text-xs transition-colors border whitespace-nowrap ${
                category === filter.id
                  ? 'bg-danger-orange text-black font-bold border-danger-orange'
                  : 'bg-transparent border-ivory-light/20 text-ivory-light/60 hover:text-ivory-light hover:border-ivory-light/40'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Sort + Verified + Reset */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Sort */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ArrowUpDown size={12} className="text-ivory-light/40 sm:w-3.5 sm:h-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-1.5 sm:px-2 py-1.5 bg-transparent border border-ivory-light/20 text-ivory-light/60 font-mono text-[11px] sm:text-xs focus:border-danger-orange/50 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id} className="bg-slate-dark">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Verified toggle */}
        <button
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 font-mono text-[11px] sm:text-xs transition-colors border ${
            verifiedOnly
              ? 'bg-larp-green/20 border-larp-green/50 text-larp-green'
              : 'bg-transparent border-ivory-light/20 text-ivory-light/40 hover:text-ivory-light/60'
          }`}
        >
          <CheckCircle size={11} className="sm:w-3 sm:h-3" />
          <span className="hidden xs:inline">Verified</span>
          <span className="xs:hidden">✓</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reset */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 font-mono text-[11px] sm:text-xs text-ivory-light/40 hover:text-ivory-light/60 transition-colors"
          >
            <RotateCcw size={11} className="sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STATES
// ============================================================================

function LoadingState() {
  return (
    <div className="py-16 flex items-center justify-center gap-3">
      <Loader2 size={18} className="animate-spin text-ivory-light/40" />
      <span className="font-mono text-sm text-ivory-light/40">Loading projects...</span>
    </div>
  );
}

function EmptyState({ onRequestScan }: { onRequestScan: () => void }) {
  return (
    <div className="py-16 text-center border-2 border-ivory-light/10 bg-ivory-light/[0.02]">
      <p className="font-mono text-sm text-ivory-light/40 mb-4">
        No projects match your filters
      </p>
      <button
        onClick={onRequestScan}
        className="font-mono text-sm text-danger-orange hover:text-danger-orange/80 transition-colors"
      >
        Search and scan a project
      </button>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

const ITEMS_PER_PAGE = 10;

export default function TerminalPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('project');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('score-high');
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Calculate entity counts
  const entityCounts = {
    project: projects.filter(p => p.entityType === 'project' || !p.entityType).length,
    person: projects.filter(p => p.entityType === 'person').length,
    organization: projects.filter(p => p.entityType === 'organization').length,
  };

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/projects?limit=50&orderBy=last_scan_at&order=desc');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('[TerminalPage] Failed to fetch projects:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestScan = () => {
    router.push('/terminal/scan');
  };

  const resetFilters = () => {
    setEntityFilter('project');
    setCategory('all');
    setSortBy('score-high');
    setScoreRange([0, 100]);
    setVerifiedOnly(false);
  };

  const hasActiveFilters =
    entityFilter !== 'project' ||
    category !== 'all' ||
    sortBy !== 'score-high' ||
    scoreRange[0] !== 0 ||
    scoreRange[1] !== 100 ||
    verifiedOnly;

  // Filter and sort projects
  const filteredProjects = projects
    .filter((project) => {
      const score = project.trustScore?.score ?? 50;

      // Entity type filter
      const projectType = project.entityType || 'project'; // Default to project if not set
      if (entityFilter !== projectType) return false;

      // Category filter
      if (category === 'verified' && project.trustScore?.tier !== 'verified') return false;
      if (category === 'high-risk' && score >= 40) return false;
      if (category === 'low-risk' && score < 70) return false;

      // Score range filter
      if (score < scoreRange[0] || score > scoreRange[1]) return false;

      // Verified filter
      if (verifiedOnly && project.trustScore?.tier !== 'verified') return false;

      return true;
    })
    .sort((a, b) => {
      const scoreA = a.trustScore?.score ?? 50;
      const scoreB = b.trustScore?.score ?? 50;

      switch (sortBy) {
        case 'score-high':
          return scoreB - scoreA;
        case 'score-low':
          return scoreA - scoreB;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'recent':
        default:
          return new Date(b.lastScanAt).getTime() - new Date(a.lastScanAt).getTime();
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [entityFilter, category, sortBy, verifiedOnly]);

  // Get label for results count
  const getResultsLabel = () => {
    if (entityFilter === 'person') return filteredProjects.length === 1 ? 'person' : 'people';
    if (entityFilter === 'organization') return filteredProjects.length === 1 ? 'org' : 'orgs';
    return filteredProjects.length === 1 ? 'project' : 'projects';
  };

  return (
    <WalletGate showPreview={true}>
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Entity Type Tabs */}
          <EntityTypeTabs
          entityFilter={entityFilter}
          setEntityFilter={setEntityFilter}
          counts={entityCounts}
        />

        {/* Filter Bar */}
        <FilterBar
          category={category}
          setCategory={setCategory}
          sortBy={sortBy}
          setSortBy={setSortBy}
          verifiedOnly={verifiedOnly}
          setVerifiedOnly={setVerifiedOnly}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
        />

        {/* Results count */}
        <div className="flex items-center justify-between py-4">
          <span className="font-mono text-xs text-ivory-light/40">
            {filteredProjects.length} {getResultsLabel()}
          </span>
        </div>

        {/* Project List */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <div className="py-16 text-center">
            <p className="font-mono text-sm text-larp-red/80">{error}</p>
            <button
              onClick={fetchProjects}
              className="mt-4 font-mono text-xs text-ivory-light/40 hover:text-ivory-light/60 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState onRequestScan={handleRequestScan} />
        ) : (
          <>
            <div className="space-y-4">
              {paginatedProjects.map((project) => (
                <IntelCard key={project.id} project={project} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-ivory-light/10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 font-mono text-xs border border-ivory-light/20 text-ivory-light/60 hover:text-ivory-light hover:border-ivory-light/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 font-mono text-xs transition-colors ${
                        currentPage === page
                          ? 'bg-danger-orange text-black font-bold'
                          : 'border border-ivory-light/20 text-ivory-light/60 hover:text-ivory-light hover:border-ivory-light/40'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 font-mono text-xs border border-ivory-light/20 text-ivory-light/60 hover:text-ivory-light hover:border-ivory-light/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Bottom hint */}
        {filteredProjects.length > 0 && (
          <div className="mt-8 pt-6 border-t border-ivory-light/5 text-center">
            <p className="font-mono text-xs text-ivory-light/30">
              Can&apos;t find what you&apos;re looking for?{' '}
              <button
                onClick={handleRequestScan}
                className="text-danger-orange hover:text-danger-orange/80 transition-colors"
              >
                Search and scan
              </button>
            </p>
          </div>
        )}
        </div>
      </div>
    </WalletGate>
  );
}
