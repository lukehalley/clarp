'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Hash, Wallet, AtSign, Globe, Sparkles } from 'lucide-react';
import type { EntityType } from '@/types/terminal';

interface SearchInputProps {
  compact?: boolean;
  initialValue?: string;
  onSearch?: (query: string) => void;
}

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
  ticker: <Hash size={14} />,
  contract: <Wallet size={14} />,
  x_handle: <AtSign size={14} />,
  domain: <Globe size={14} />,
  ens: <Sparkles size={14} />,
};

const RECENT_SEARCHES_KEY = 'clarp-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchInput({ compact, initialValue = '', onSearch }: SearchInputProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save search to recent
  const saveRecentSearch = useCallback((search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  }, [recentSearches]);

  // Handle search submission
  const handleSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setIsFocused(false);

    if (onSearch) {
      onSearch(trimmed);
    } else {
      router.push(`/terminal/search?q=${encodeURIComponent(trimmed)}`);
    }
  }, [onSearch, router, saveRecentSearch]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Handle recent search click
  const handleRecentClick = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect entity type from query
  const getDetectedType = (q: string): EntityType | null => {
    if (!q) return null;
    if (q.startsWith('$') || q.startsWith('#')) return 'ticker';
    if (q.startsWith('@') || q.includes('x.com/') || q.includes('twitter.com/')) return 'x_handle';
    if (q.endsWith('.eth')) return 'ens';
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) return 'contract'; // Solana
    if (/^0x[a-fA-F0-9]{40}$/.test(q)) return 'contract'; // EVM
    if (q.includes('.') && !q.includes(' ')) return 'domain';
    return null;
  };

  const detectedType = getDetectedType(query);

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center gap-2 bg-slate-medium/50 border transition-colors ${
            isFocused
              ? 'border-danger-orange'
              : 'border-ivory-light/20 hover:border-ivory-light/30'
          } ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
        >
          <Search size={compact ? 16 : 18} className="text-ivory-light/40 shrink-0" />

          {detectedType && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-danger-orange/20 text-danger-orange text-xs font-mono shrink-0">
              {ENTITY_ICONS[detectedType]}
              {detectedType}
            </span>
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Search ticker, contract, @handle, domain, or ENS..."
            className={`flex-1 bg-transparent text-ivory-light placeholder:text-ivory-light/40 font-mono outline-none ${
              compact ? 'text-sm' : 'text-base'
            }`}
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-ivory-light/40 hover:text-ivory-light/60"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {isFocused && (recentSearches.length > 0 || query) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-slate-dark border border-ivory-light/20 z-50 max-h-64 overflow-y-auto"
        >
          {/* Recent searches */}
          {recentSearches.length > 0 && !query && (
            <div className="p-2">
              <div className="text-xs font-mono text-ivory-light/40 px-2 py-1">Recent</div>
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentClick(search)}
                  className="w-full text-left px-3 py-2 font-mono text-sm text-ivory-light/70 hover:bg-ivory-light/5 hover:text-ivory-light flex items-center gap-2"
                >
                  <Search size={14} className="text-ivory-light/30" />
                  {search}
                </button>
              ))}
            </div>
          )}

          {/* Search hints */}
          {query && (
            <div className="p-2">
              <button
                onClick={() => handleSearch(query)}
                className="w-full text-left px-3 py-2 font-mono text-sm text-ivory-light hover:bg-danger-orange/10 flex items-center gap-2"
              >
                <Search size={14} className="text-danger-orange" />
                Search for &quot;{query}&quot;
              </button>
            </div>
          )}

          {/* Entity type hints */}
          <div className="p-2 border-t border-ivory-light/10">
            <div className="text-xs font-mono text-ivory-light/40 px-2 py-1">Search by</div>
            <div className="grid grid-cols-2 gap-1 text-xs font-mono text-ivory-light/50 px-2">
              <span className="flex items-center gap-1">{ENTITY_ICONS.ticker} $TICKER</span>
              <span className="flex items-center gap-1">{ENTITY_ICONS.x_handle} @handle</span>
              <span className="flex items-center gap-1">{ENTITY_ICONS.contract} 0x... / Sol...</span>
              <span className="flex items-center gap-1">{ENTITY_ICONS.ens} name.eth</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
