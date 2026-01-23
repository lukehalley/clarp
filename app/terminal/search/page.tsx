'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProjectCard from '@/components/terminal/ProjectCard';
import SearchInput from '@/components/terminal/SearchInput';
import { resolveEntity } from '@/lib/terminal/entity-resolver';
import {
  MOCK_PROJECTS,
  getMockScore,
  getProjectByTicker,
  getProjectByContract,
  getProfileByHandle,
} from '@/lib/terminal/mock-data';
import type { SearchResult } from '@/types/terminal';
import { Search, Hash, Wallet, AtSign, Globe, Sparkles } from 'lucide-react';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Simulate search delay
    const timer = setTimeout(() => {
      const searchResults: SearchResult[] = [];
      const entity = resolveEntity(query);

      if (entity) {
        // Search based on entity type
        switch (entity.type) {
          case 'ticker': {
            const project = getProjectByTicker(entity.normalized);
            if (project) {
              searchResults.push({
                entity,
                project,
                score: getMockScore(project.id).score,
              });
            }
            break;
          }
          case 'contract': {
            const project = getProjectByContract(entity.normalized);
            if (project) {
              searchResults.push({
                entity,
                project,
                score: getMockScore(project.id).score,
              });
            }
            break;
          }
          case 'x_handle': {
            const profile = getProfileByHandle(entity.normalized);
            if (profile) {
              searchResults.push({
                entity,
                profile,
              });
            }
            // Also check for matching projects
            const projectMatch = MOCK_PROJECTS.find(
              p => p.xHandle?.toLowerCase() === entity.normalized
            );
            if (projectMatch) {
              searchResults.push({
                entity,
                project: projectMatch,
                score: getMockScore(projectMatch.id).score,
              });
            }
            break;
          }
          default:
            break;
        }
      }

      // Also do fuzzy matching on project names
      const fuzzyMatches = MOCK_PROJECTS.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.ticker?.toLowerCase().includes(query.toLowerCase())
      );

      for (const project of fuzzyMatches) {
        if (!searchResults.some(r => r.project?.id === project.id)) {
          searchResults.push({
            entity: { type: 'ticker', value: query, normalized: query },
            project,
            score: getMockScore(project.id).score,
          });
        }
      }

      setResults(searchResults);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const ENTITY_ICONS = {
    ticker: <Hash size={16} />,
    contract: <Wallet size={16} />,
    x_handle: <AtSign size={16} />,
    domain: <Globe size={16} />,
    ens: <Sparkles size={16} />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-mono font-bold text-ivory-light">
          Search
        </h1>
        <p className="text-ivory-light/50 font-mono text-sm mt-1">
          Search by ticker, contract, @handle, domain, or ENS
        </p>
      </div>

      {/* Search bar */}
      <SearchInput initialValue={query} />

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-danger-orange border-t-transparent rounded-full animate-spin" />
        </div>
      ) : query ? (
        <div className="space-y-4">
          {/* Query info */}
          <div className="flex items-center gap-2 text-sm font-mono text-ivory-light/60">
            <Search size={14} />
            <span>
              {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
            </span>
          </div>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result, i) => (
                <div key={i}>
                  {result.project ? (
                    <ProjectCard
                      project={result.project}
                      score={getMockScore(result.project.id)}
                      showActions
                    />
                  ) : result.profile ? (
                    <Link
                      href={`/terminal/profile/${result.profile.xHandle}`}
                      className="block p-4 sm:p-5 border-2 border-ivory-light/20 bg-ivory-light/5 hover:border-danger-orange/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-danger-orange">
                              {ENTITY_ICONS[result.entity.type]}
                            </span>
                            <span className="font-mono font-bold text-ivory-light">
                              @{result.profile.xHandle}
                            </span>
                            {result.profile.verified && (
                              <span className="text-xs font-mono px-2 py-0.5 bg-larp-green/20 text-larp-green border border-larp-green/30">
                                Verified
                              </span>
                            )}
                          </div>
                          {result.profile.displayName && (
                            <p className="text-ivory-light/70 mt-1">
                              {result.profile.displayName}
                            </p>
                          )}
                          <p className="text-sm text-ivory-light/50 mt-2">
                            {result.profile.followers.toLocaleString()} followers
                            {' • '}
                            Account age: {result.profile.accountAgeDays} days
                          </p>
                        </div>
                        <span className="text-xs font-mono text-ivory-light/40 shrink-0">
                          X Profile
                        </span>
                      </div>
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-ivory-light/10 text-center">
              <Search size={32} className="mx-auto text-ivory-light/20 mb-4" />
              <p className="text-ivory-light/50 font-mono text-sm">
                No results found for &quot;{query}&quot;
              </p>
              <p className="text-ivory-light/30 font-mono text-xs mt-2">
                Try searching by ticker ($CLARP), contract address, or @handle
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 border border-ivory-light/10 text-center">
          <Search size={32} className="mx-auto text-ivory-light/20 mb-4" />
          <p className="text-ivory-light/50 font-mono text-sm">
            Enter a search query above
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-xs font-mono px-3 py-1 bg-ivory-light/5 text-ivory-light/40 border border-ivory-light/10">
              $TICKER
            </span>
            <span className="text-xs font-mono px-3 py-1 bg-ivory-light/5 text-ivory-light/40 border border-ivory-light/10">
              @handle
            </span>
            <span className="text-xs font-mono px-3 py-1 bg-ivory-light/5 text-ivory-light/40 border border-ivory-light/10">
              0x...
            </span>
            <span className="text-xs font-mono px-3 py-1 bg-ivory-light/5 text-ivory-light/40 border border-ivory-light/10">
              name.eth
            </span>
          </div>
        </div>
      )}

      {/* Browse all projects */}
      <section className="pt-8 border-t border-ivory-light/10">
        <h2 className="font-mono font-bold text-ivory-light text-lg mb-4">
          Browse All Projects
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {MOCK_PROJECTS.slice(0, 6).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              score={getMockScore(project.id)}
              compact
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-danger-orange border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
