'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Hash, Wallet, AtSign, Code, Sparkles } from 'lucide-react';
import type { EntityCategory } from '@/types/unified-terminal';

interface UnifiedSearchProps {
  autoFocus?: boolean;
  size?: 'default' | 'large';
  onSearch?: (query: string, category: EntityCategory | null) => void;
}

const ENTITY_ICONS: Record<EntityCategory, React.ReactNode> = {
  kol: <AtSign size={14} />,
  dev: <Code size={14} />,
  project: <Sparkles size={14} />,
  token: <Hash size={14} />,
};

const ENTITY_COLORS: Record<EntityCategory, string> = {
  kol: 'text-larp-purple bg-larp-purple/20 border-larp-purple/50',
  dev: 'text-larp-green bg-larp-green/20 border-larp-green/50',
  project: 'text-danger-orange bg-danger-orange/20 border-danger-orange/50',
  token: 'text-larp-yellow bg-larp-yellow/20 border-larp-yellow/50',
};

const PLACEHOLDER_ITEMS = [
  { text: '@ansem', category: 'kol' as const },
  { text: '$BONK', category: 'token' as const },
  { text: '@taborj', category: 'dev' as const },
  { text: 'Jupiter', category: 'project' as const },
];

export default function UnifiedSearch({ autoFocus, size = 'default', onSearch }: UnifiedSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_ITEMS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentPlaceholder = PLACEHOLDER_ITEMS[placeholderIndex];

  // Detect entity category from input
  const detectedCategory = useMemo((): EntityCategory | null => {
    if (!query) return null;
    const q = query.trim();
    if (q.startsWith('$') || q.startsWith('#')) return 'token';
    if (q.startsWith('@')) return 'kol'; // Could be dev too, will be determined by scan
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) return 'token'; // Solana address
    return null;
  }, [query]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (onSearch) {
      onSearch(trimmed, detectedCategory);
    } else {
      // Default: navigate to search results
      const encodedQuery = encodeURIComponent(trimmed);
      router.push(`/terminal/search?q=${encodedQuery}`);
    }
  }, [query, detectedCategory, onSearch, router]);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const isLarge = size === 'large';

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`flex items-center gap-3 bg-slate-medium/30 border-2 transition-all duration-150 ${
          isFocused
            ? 'border-danger-orange shadow-[0_0_20px_rgba(255,107,53,0.3)]'
            : 'border-ivory-light/20 hover:border-ivory-light/40'
        } ${isLarge ? 'px-5 py-4' : 'px-4 py-3'}`}
      >
        <Search
          size={isLarge ? 24 : 18}
          className={`shrink-0 transition-colors ${isFocused ? 'text-danger-orange' : 'text-ivory-light/40'}`}
        />

        {detectedCategory && (
          <span className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold border shrink-0 ${ENTITY_COLORS[detectedCategory]}`}>
            {ENTITY_ICONS[detectedCategory]}
            {detectedCategory.toUpperCase()}
          </span>
        )}

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus={autoFocus}
            placeholder=""
            className={`w-full bg-transparent text-ivory-light font-mono outline-none ${
              isLarge ? 'text-xl' : 'text-base'
            }`}
          />
          {/* Animated placeholder */}
          {!query && (
            <div
              className={`absolute inset-0 flex items-center pointer-events-none font-mono text-ivory-light/30 ${
                isLarge ? 'text-xl' : 'text-base'
              }`}
            >
              <span className="transition-opacity duration-300">
                Search {currentPlaceholder.text}
              </span>
              <span className={`ml-2 px-1.5 py-0.5 text-[10px] border ${ENTITY_COLORS[currentPlaceholder.category]} opacity-50`}>
                {currentPlaceholder.category.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-ivory-light/40 hover:text-ivory-light/70 hover:bg-ivory-light/10 transition-colors"
          >
            <X size={16} />
          </button>
        )}

        <button
          type="submit"
          disabled={!query.trim()}
          className={`shrink-0 bg-danger-orange text-black font-mono font-bold border-2 border-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed ${
            isLarge ? 'px-6 py-2 text-base' : 'px-4 py-1.5 text-sm'
          }`}
          style={{ boxShadow: query.trim() ? '3px 3px 0 black' : 'none' }}
        >
          SCAN
        </button>
      </div>

      {/* Quick hints */}
      <div className="flex items-center gap-4 mt-3 px-1">
        <span className="text-[10px] font-mono text-ivory-light/30">Search:</span>
        <div className="flex items-center gap-3 text-[10px] font-mono text-ivory-light/40">
          <span className="flex items-center gap-1">
            {ENTITY_ICONS.kol}
            <span>@handle</span>
          </span>
          <span className="flex items-center gap-1">
            {ENTITY_ICONS.token}
            <span>$TICKER</span>
          </span>
          <span className="flex items-center gap-1">
            <Wallet size={12} />
            <span>address</span>
          </span>
          <span className="flex items-center gap-1">
            {ENTITY_ICONS.project}
            <span>name</span>
          </span>
        </div>
      </div>
    </form>
  );
}
