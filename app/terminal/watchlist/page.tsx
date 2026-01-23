'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/terminal/ProjectCard';
import { MOCK_WATCHLIST, MOCK_PROJECTS, getMockScore } from '@/lib/terminal/mock-data';
import type { WatchlistItem, Chain } from '@/types/terminal';
import {
  Bookmark,
  Filter,
  Trash2,
  Bell,
  Search,
  AlertTriangle,
} from 'lucide-react';

const WATCHLIST_KEY = 'clarp-watchlist';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filter, setFilter] = useState<{
    chain: Chain | 'all';
    scoreMin: number;
    scoreMax: number;
  }>({
    chain: 'all',
    scoreMin: 0,
    scoreMax: 100,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Load watchlist from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      try {
        const ids = JSON.parse(stored) as string[];
        const items: WatchlistItem[] = ids
          .map(id => {
            const project = MOCK_PROJECTS.find(p => p.id === id);
            if (!project) return null;
            const score = getMockScore(id);
            return {
              projectId: id,
              project,
              score,
              addedAt: new Date(),
              scoreDelta24h: Math.floor(Math.random() * 20) - 5,
            };
          })
          .filter((item): item is WatchlistItem => item !== null);
        setWatchlist(items.length > 0 ? items : MOCK_WATCHLIST);
      } catch {
        setWatchlist(MOCK_WATCHLIST);
      }
    } else {
      setWatchlist(MOCK_WATCHLIST);
    }
  }, []);

  // Save watchlist to localStorage
  const saveWatchlist = (items: WatchlistItem[]) => {
    const ids = items.map(item => item.projectId);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
    setWatchlist(items);
  };

  // Remove item from watchlist
  const removeItem = (projectId: string) => {
    const updated = watchlist.filter(item => item.projectId !== projectId);
    saveWatchlist(updated);
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  };

  // Remove selected items
  const removeSelected = () => {
    const updated = watchlist.filter(item => !selectedItems.has(item.projectId));
    saveWatchlist(updated);
    setSelectedItems(new Set());
  };

  // Toggle item selection
  const toggleSelect = (projectId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // Filter watchlist
  const filteredWatchlist = watchlist.filter(item => {
    if (filter.chain !== 'all' && item.project.chain !== filter.chain) return false;
    if (item.score.score < filter.scoreMin || item.score.score > filter.scoreMax) return false;
    return true;
  });

  // Sort by score delta (biggest movers first)
  const sortedWatchlist = [...filteredWatchlist].sort(
    (a, b) => Math.abs(b.scoreDelta24h) - Math.abs(a.scoreDelta24h)
  );

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-ivory-light flex items-center gap-3">
            <Bookmark size={28} className="text-larp-yellow" />
            Watchlist
          </h1>
          <p className="text-ivory-light/50 font-mono text-sm mt-1">
            {watchlist.length} project{watchlist.length !== 1 ? 's' : ''} tracked
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border font-mono text-sm transition-colors ${
              showFilters
                ? 'border-danger-orange bg-danger-orange/10 text-danger-orange'
                : 'border-ivory-light/20 text-ivory-light/70 hover:border-ivory-light/30'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
          {selectedItems.size > 0 && (
            <>
              <button
                onClick={removeSelected}
                className="flex items-center gap-2 px-4 py-2 border border-larp-red/50 text-larp-red font-mono text-sm hover:bg-larp-red/10 transition-colors"
              >
                <Trash2 size={16} />
                Remove ({selectedItems.size})
              </button>
              <Link
                href="/terminal/alerts"
                className="flex items-center gap-2 px-4 py-2 bg-danger-orange text-black font-mono font-bold text-sm hover:bg-danger-orange/90 transition-colors"
              >
                <Bell size={16} />
                Set Alerts
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border border-ivory-light/20 bg-ivory-light/5 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Chain filter */}
            <div>
              <label className="block text-xs font-mono text-ivory-light/50 mb-2">Chain</label>
              <select
                value={filter.chain}
                onChange={(e) => setFilter({ ...filter, chain: e.target.value as Chain | 'all' })}
                className="w-full px-3 py-2 bg-slate-dark border border-ivory-light/20 text-ivory-light font-mono text-sm focus:border-danger-orange outline-none"
              >
                <option value="all">All Chains</option>
                <option value="solana">Solana</option>
                <option value="ethereum">Ethereum</option>
                <option value="base">Base</option>
                <option value="arbitrum">Arbitrum</option>
              </select>
            </div>

            {/* Score range */}
            <div>
              <label className="block text-xs font-mono text-ivory-light/50 mb-2">
                Min Score: {filter.scoreMin}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={filter.scoreMin}
                onChange={(e) => setFilter({ ...filter, scoreMin: Number(e.target.value) })}
                className="w-full accent-danger-orange"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-ivory-light/50 mb-2">
                Max Score: {filter.scoreMax}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={filter.scoreMax}
                onChange={(e) => setFilter({ ...filter, scoreMax: Number(e.target.value) })}
                className="w-full accent-danger-orange"
              />
            </div>
          </div>

          <button
            onClick={() => setFilter({ chain: 'all', scoreMin: 0, scoreMax: 100 })}
            className="text-xs font-mono text-ivory-light/50 hover:text-ivory-light"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Watchlist */}
      {sortedWatchlist.length > 0 ? (
        <div className="space-y-3">
          {sortedWatchlist.map((item) => (
            <div key={item.projectId} className="flex items-start gap-4">
              {/* Checkbox */}
              <div className="pt-4">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.projectId)}
                  onChange={() => toggleSelect(item.projectId)}
                  className="w-4 h-4 accent-danger-orange"
                />
              </div>

              {/* Project card */}
              <div className="flex-1">
                <ProjectCard
                  project={item.project}
                  score={item.score}
                  scoreDelta24h={item.scoreDelta24h}
                  showActions
                  onWatch={() => removeItem(item.projectId)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="p-8 border border-ivory-light/10 text-center">
          <Bookmark size={32} className="mx-auto text-ivory-light/20 mb-4" />
          <p className="text-ivory-light/50 font-mono text-sm">Your watchlist is empty</p>
          <p className="text-ivory-light/30 font-mono text-xs mt-2">
            Add projects to your watchlist to track their risk scores
          </p>
          <Link
            href="/terminal/search"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-danger-orange text-black font-mono font-bold text-sm hover:bg-danger-orange/90"
          >
            <Search size={16} />
            Find Projects
          </Link>
        </div>
      ) : (
        <div className="p-8 border border-ivory-light/10 text-center">
          <AlertTriangle size={32} className="mx-auto text-ivory-light/20 mb-4" />
          <p className="text-ivory-light/50 font-mono text-sm">No projects match your filters</p>
          <button
            onClick={() => setFilter({ chain: 'all', scoreMin: 0, scoreMax: 100 })}
            className="text-danger-orange font-mono text-sm mt-2 hover:underline"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Add to watchlist hint */}
      {watchlist.length > 0 && watchlist.length < 5 && (
        <div className="p-4 border border-ivory-light/10 bg-ivory-light/5 text-center">
          <p className="text-sm text-ivory-light/50 font-mono">
            Track more projects?{' '}
            <Link href="/terminal/search" className="text-danger-orange hover:underline">
              Search for projects
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
