'use client';

import { Trophy, TrendingUp, Code, Coins, Users } from 'lucide-react';
import Link from 'next/link';

const LEADERBOARD_CATEGORIES = [
  {
    title: 'Top KOLs',
    description: 'Highest trust score influencers with best call track records',
    href: '/terminal/leaderboard/kols',
    icon: Users,
    color: '#9B59B6',
    stat: '2,847 tracked',
  },
  {
    title: 'Verified Builders',
    description: 'Developers with verified shipping history and clean records',
    href: '/terminal/leaderboard/builders',
    icon: Code,
    color: '#22c55e',
    stat: '384 verified',
  },
  {
    title: 'Rising Tokens',
    description: 'Tokens with positive momentum and trusted promoters',
    href: '/terminal/leaderboard/tokens',
    icon: Coins,
    color: '#eab308',
    stat: '12.4K scanned',
  },
  {
    title: 'Hot Calls',
    description: 'Recent KOL calls that are currently pumping',
    href: '/terminal/leaderboard/calls',
    icon: TrendingUp,
    color: '#f97316',
    stat: '48 active',
  },
];

export default function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={28} className="text-larp-yellow" />
        <div>
          <h1 className="text-xl font-mono font-bold text-ivory-light">Leaderboards</h1>
          <p className="text-xs font-mono text-ivory-light/50">
            Rankings based on automated trust scoring
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LEADERBOARD_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.href}
              href={category.href}
              className="group p-5 bg-ivory-light/5 border border-ivory-light/10 hover:border-danger-orange/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 flex items-center justify-center border"
                  style={{
                    backgroundColor: `${category.color}15`,
                    borderColor: `${category.color}40`,
                  }}
                >
                  <Icon size={20} style={{ color: category.color }} />
                </div>
                <span className="font-mono text-[10px] text-ivory-light/40">
                  {category.stat}
                </span>
              </div>
              <h2 className="font-mono font-bold text-ivory-light group-hover:text-danger-orange transition-colors mb-1">
                {category.title}
              </h2>
              <p className="font-mono text-xs text-ivory-light/50">
                {category.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 p-4 border border-ivory-light/10 bg-ivory-light/5 text-center">
        <p className="font-mono text-xs text-ivory-light/40">
          Full leaderboard data coming soon. Currently displaying mock data.
        </p>
      </div>
    </div>
  );
}
