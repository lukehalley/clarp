'use client';

import { useState, useEffect } from 'react';
import IntelCard from '@/components/terminal/IntelCard';
import {
  getRiskSpikes,
  getTrendingRisky,
  getTrustedProjects,
  getRecentlyVerified,
} from '@/lib/terminal/mock-data';
import { CHAIN_INFO, Chain } from '@/types/terminal';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Filter,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';
import ChainIcon from '@/components/terminal/ChainIcon';

type CategoryFilter = 'all' | 'verified' | 'risk-spikes' | 'high-risk' | 'low-risk';
type SortOption = 'score-high' | 'score-low' | 'name-asc' | 'name-desc';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'score-high', label: 'Risk: High to Low' },
  { id: 'score-low', label: 'Risk: Low to High' },
  { id: 'name-asc', label: 'Name: A to Z' },
  { id: 'name-desc', label: 'Name: Z to A' },
];

const CATEGORY_FILTERS: { id: CategoryFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Projects', icon: <Filter size={14} /> },
  { id: 'verified', label: 'Verified', icon: <CheckCircle size={14} /> },
  { id: 'risk-spikes', label: 'Risk Spikes', icon: <TrendingUp size={14} /> },
  { id: 'high-risk', label: 'High Risk', icon: <AlertTriangle size={14} /> },
  { id: 'low-risk', label: 'Low Risk', icon: <Shield size={14} /> },
];

const CHAINS = Object.entries(CHAIN_INFO).map(([id, info]) => ({
  id,
  name: info.shortName,
  color: info.color,
}));

export default function TerminalDashboard() {
  const [mounted, setMounted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('score-high');

  const [riskSpikes, setRiskSpikes] = useState<ReturnType<typeof getRiskSpikes>>([]);
  const [trendingRisky, setTrendingRisky] = useState<ReturnType<typeof getTrendingRisky>>([]);
  const [trustedProjects, setTrustedProjects] = useState<ReturnType<typeof getTrustedProjects>>([]);
  const [verifiedProjects, setVerifiedProjects] = useState<ReturnType<typeof getRecentlyVerified>>([]);

  useEffect(() => {
    setMounted(true);
    setRiskSpikes(getRiskSpikes());
    setTrendingRisky(getTrendingRisky());
    setTrustedProjects(getTrustedProjects());
    setVerifiedProjects(getRecentlyVerified());
  }, []);

  if (!mounted) return null;

  const toggleChain = (chainId: string) => {
    setSelectedChains((prev) =>
      prev.includes(chainId) ? prev.filter((c) => c !== chainId) : [...prev, chainId]
    );
  };

  const resetFilters = () => {
    setCategoryFilter('all');
    setSelectedChains([]);
    setScoreRange([0, 100]);
    setVerifiedOnly(false);
    setSortBy('score-high');
  };

  const getBaseProjects = () => {
    switch (categoryFilter) {
      case 'verified':
        return verifiedProjects;
      case 'risk-spikes':
        return riskSpikes.map(({ project, score, delta }) => ({ project, score, delta }));
      case 'high-risk':
        return trendingRisky;
      case 'low-risk':
        return trustedProjects;
      case 'all':
      default:
        // Combine all unique projects
        const allProjects = new Map();
        [...verifiedProjects, ...trendingRisky, ...trustedProjects].forEach(({ project, score }) => {
          if (!allProjects.has(project.id)) {
            allProjects.set(project.id, { project, score });
          }
        });
        return Array.from(allProjects.values());
    }
  };

  const filteredProjects = getBaseProjects()
    .filter(({ project, score }) => {
      // Chain filter
      if (selectedChains.length > 0 && !selectedChains.includes(project.chain)) {
        return false;
      }
      // Score range filter
      if (score.score < scoreRange[0] || score.score > scoreRange[1]) {
        return false;
      }
      // Verified filter
      if (verifiedOnly && !project.verified) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score-high':
          return b.score.score - a.score.score;
        case 'score-low':
          return a.score.score - b.score.score;
        case 'name-asc':
          return a.project.name.localeCompare(b.project.name);
        case 'name-desc':
          return b.project.name.localeCompare(a.project.name);
        default:
          return 0;
      }
    });

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    selectedChains.length > 0 ||
    scoreRange[0] !== 0 ||
    scoreRange[1] !== 100 ||
    verifiedOnly ||
    sortBy !== 'score-high';

  return (
    <div className="flex gap-6">
      {/* Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide pb-4">
          {/* Sort By */}
          <div className="border-2 border-ivory-light/20 bg-ivory-light/5">
            <div className="px-4 py-3 flex items-center gap-2">
              <ArrowUpDown size={14} className="text-danger-orange" />
              <span className="font-mono font-bold text-ivory-light text-sm">Sort By</span>
            </div>
            <div className="px-4 pb-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 bg-slate-dark border-2 border-ivory-light/20 text-ivory-light font-mono text-xs focus:border-danger-orange focus:outline-none cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23FF6B35' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div className="border-2 border-ivory-light/20 bg-ivory-light/5">
            <div className="px-3 py-2 border-b border-ivory-light/10">
              <span className="font-mono font-bold text-ivory-light text-xs">Category</span>
            </div>
            <div className="p-1">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setCategoryFilter(filter.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 font-mono text-xs transition-colors ${
                    categoryFilter === filter.id
                      ? 'bg-danger-orange text-black font-bold'
                      : 'text-ivory-light/70 hover:text-ivory-light hover:bg-ivory-light/5'
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chains */}
          <div className="border-2 border-ivory-light/20 bg-ivory-light/5">
            <div className="px-3 py-2 border-b border-ivory-light/10">
              <span className="font-mono font-bold text-ivory-light text-xs">Chain</span>
            </div>
            <div className="p-1">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => toggleChain(chain.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 font-mono text-xs transition-colors ${
                    selectedChains.includes(chain.id)
                      ? 'bg-ivory-light/10 text-ivory-light'
                      : 'text-ivory-light/50 hover:text-ivory-light hover:bg-ivory-light/5'
                  }`}
                >
                  <ChainIcon
                    chain={chain.id as Chain}
                    size={16}
                    className={selectedChains.includes(chain.id) ? '' : 'opacity-50'}
                  />
                  {chain.name}
                  {selectedChains.includes(chain.id) && (
                    <CheckCircle size={12} className="ml-auto text-larp-green" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Score Range */}
          <div className="border-2 border-ivory-light/20 bg-ivory-light/5">
            <div className="px-3 py-2 border-b border-ivory-light/10">
              <span className="font-mono font-bold text-ivory-light text-xs">Risk Score</span>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-ivory-light/50">Min</span>
                <span className="font-mono text-[10px] text-danger-orange">{scoreRange[0]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[0]}
                onChange={(e) => setScoreRange([parseInt(e.target.value), scoreRange[1]])}
                className="w-full accent-danger-orange h-1"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-ivory-light/50">Max</span>
                <span className="font-mono text-[10px] text-danger-orange">{scoreRange[1]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[1]}
                onChange={(e) => setScoreRange([scoreRange[0], parseInt(e.target.value)])}
                className="w-full accent-danger-orange h-1"
              />
            </div>
          </div>

          {/* Verified Toggle */}
          <div className="border-2 border-ivory-light/20 bg-ivory-light/5">
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="w-full flex items-center justify-between px-3 py-2"
            >
              <span className="font-mono text-xs text-ivory-light">Verified Only</span>
              <div
                className={`w-10 h-5 border-2 transition-colors relative shrink-0 ${
                  verifiedOnly ? 'bg-larp-green border-larp-green' : 'bg-transparent border-ivory-light/30'
                }`}
              >
                <div
                  className="absolute top-0.5 w-3 h-3 transition-all"
                  style={{
                    left: verifiedOnly ? '22px' : '2px',
                    backgroundColor: verifiedOnly ? 'black' : 'rgba(250,249,245,0.5)',
                  }}
                />
              </div>
            </button>
          </div>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-ivory-light/20 text-ivory-light/70 hover:text-ivory-light hover:border-danger-orange/50 font-mono text-xs transition-colors"
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Filter Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-dark/95 backdrop-blur-sm border-t-2 border-ivory-light/20 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCategoryFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs whitespace-nowrap transition-colors border-2 ${
                categoryFilter === filter.id
                  ? 'bg-danger-orange text-black font-bold border-danger-orange'
                  : 'bg-slate-dark border-ivory-light/30 text-ivory-light/70'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        {filteredProjects.length > 0 ? (
          <div className="space-y-4">
            {filteredProjects.map(({ project, score, delta }) => (
              <IntelCard
                key={project.id}
                project={project}
                score={score}
                scoreDelta24h={delta}
              />
            ))}
          </div>
        ) : (
          <div className="border-2 border-ivory-light/20 bg-ivory-light/5 p-8 text-center">
            <p className="text-ivory-light/50 font-mono">No projects match your filters</p>
            <button
              onClick={resetFilters}
              className="mt-4 text-danger-orange font-mono text-sm hover:underline"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
