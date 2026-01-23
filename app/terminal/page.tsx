'use client';

import { useState, useEffect } from 'react';
import IntelCard from '@/components/terminal/IntelCard';
import {
  getRiskSpikes,
  getTrendingRisky,
  getTrustedProjects,
  getRecentlyVerified,
} from '@/lib/terminal/mock-data';
import { CHAIN_INFO } from '@/types/terminal';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Filter,
  RotateCcw,
} from 'lucide-react';

type CategoryFilter = 'all' | 'verified' | 'risk-spikes' | 'high-risk' | 'low-risk';

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

  const filteredProjects = getBaseProjects().filter(({ project, score }) => {
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
  });

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    selectedChains.length > 0 ||
    scoreRange[0] !== 0 ||
    scoreRange[1] !== 100 ||
    verifiedOnly;

  return (
    <div className="flex gap-6">
      {/* Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 space-y-6">
          {/* Category */}
          <div className="border-2 border-ivory-light/20 bg-ivory-light/5">
            <div className="px-4 py-3 border-b border-ivory-light/10">
              <span className="font-mono font-bold text-ivory-light text-sm">Category</span>
            </div>
            <div className="p-2">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setCategoryFilter(filter.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 font-mono text-xs transition-colors ${
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
            <div className="px-4 py-3 border-b border-ivory-light/10">
              <span className="font-mono font-bold text-ivory-light text-sm">Chain</span>
            </div>
            <div className="p-2 space-y-1">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => toggleChain(chain.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 font-mono text-xs transition-colors ${
                    selectedChains.includes(chain.id)
                      ? 'bg-ivory-light/10 text-ivory-light'
                      : 'text-ivory-light/50 hover:text-ivory-light hover:bg-ivory-light/5'
                  }`}
                >
                  <span
                    className={`w-2 h-2 ${selectedChains.includes(chain.id) ? '' : 'opacity-50'}`}
                    style={{ backgroundColor: chain.color }}
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
            <div className="px-4 py-3 border-b border-ivory-light/10">
              <span className="font-mono font-bold text-ivory-light text-sm">Risk Score</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ivory-light/50">Min</span>
                <span className="font-mono text-xs text-danger-orange">{scoreRange[0]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[0]}
                onChange={(e) => setScoreRange([parseInt(e.target.value), scoreRange[1]])}
                className="w-full accent-danger-orange"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ivory-light/50">Max</span>
                <span className="font-mono text-xs text-danger-orange">{scoreRange[1]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={scoreRange[1]}
                onChange={(e) => setScoreRange([scoreRange[0], parseInt(e.target.value)])}
                className="w-full accent-danger-orange"
              />
            </div>
          </div>

          {/* Verified Toggle */}
          <div className="border-2 border-ivory-light/20 bg-ivory-light/5">
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <span className="font-mono text-sm text-ivory-light">Verified Only</span>
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
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCategoryFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 font-mono text-xs whitespace-nowrap transition-colors ${
                categoryFilter === filter.id
                  ? 'bg-danger-orange text-black font-bold'
                  : 'bg-slate-dark border border-ivory-light/20 text-ivory-light/70'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="flex-1 min-w-0">
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
