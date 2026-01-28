'use client';

/**
 * TokenomicsDashboard
 *
 * Real-time display of CLARP tokenomics:
 * - Revenue from Bags.fm creator fees
 * - 50/30/20 distribution split
 * - Burn history with Solscan links
 *
 * Brutalist design matching CLARP Terminal aesthetic
 */

import { useEffect, useState } from 'react';
import { PieChart, Flame, DollarSign, TrendingUp, ExternalLink, RefreshCw, Zap } from 'lucide-react';

interface BurnTransaction {
  signature: string;
  clarpAmount: number;
  solSpent: number;
  timestamp: number;
}

interface TokenomicsData {
  lifetimeFees: number;
  claimed: number;
  unclaimed: number;
  totalDistributed: {
    profit: number;
    operations: number;
    burn: number;
  };
  distributionCount: number;
  burns: {
    totalClarpBurned: number;
    totalSolSpent: number;
    transactionCount: number;
    recent: BurnTransaction[];
  };
  revenueSplit: {
    profit: number;
    operations: number;
    burn: number;
  };
  lastUpdated: string;
  lastDistribution?: string;
}

function formatNumber(num: number, decimals = 2): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(decimals).replace(/\.?0+$/, '') + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(decimals).replace(/\.?0+$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(decimals).replace(/\.?0+$/, '') + 'K';
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function truncateSignature(sig: string): string {
  if (sig.length <= 12) return sig;
  return `${sig.slice(0, 6)}...${sig.slice(-4)}`;
}

export default function TokenomicsDashboard() {
  const [data, setData] = useState<TokenomicsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchTokenomics() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/tokenomics');
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || 'failed to fetch');
      }
    } catch (err) {
      console.error('failed to fetch tokenomics:', err);
      setError('network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchTokenomics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTokenomics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-dark border-2 border-danger-orange p-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-danger-orange border-t-transparent animate-spin" />
          <span className="font-mono text-sm text-ivory-light/60">loading tokenomics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-dark border-2 border-larp-red p-6">
        <div className="flex items-center gap-3 text-larp-red">
          <span className="font-mono text-sm">error: {error || 'no data'}</span>
          <button
            onClick={fetchTokenomics}
            className="ml-auto hover:text-danger-orange transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-mono text-lg text-ivory-light">
          <PieChart className="w-5 h-5 text-danger-orange" />
          tokenomics
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-ivory-light/40">
            updated {data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '—'}
          </span>
          <button
            onClick={fetchTokenomics}
            disabled={refreshing}
            className="text-ivory-light/40 hover:text-danger-orange transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="lifetime fees"
          value={`${formatNumber(data.lifetimeFees, 4)} SOL`}
          subValue={data.unclaimed > 0 ? `${formatNumber(data.unclaimed, 4)} unclaimed` : undefined}
          color="text-larp-green"
          borderColor="border-larp-green/50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="distributions"
          value={data.distributionCount.toString()}
          subValue={data.lastDistribution ? `last: ${formatTimestamp(new Date(data.lastDistribution).getTime() / 1000)}` : 'none yet'}
          color="text-cyan-400"
          borderColor="border-cyan-400/50"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="total burned"
          value={`${formatNumber(data.burns.totalClarpBurned)} CLARP`}
          subValue={`${data.burns.transactionCount} burns`}
          color="text-danger-orange"
          borderColor="border-danger-orange/50"
        />
      </div>

      {/* Revenue Split */}
      <div className="bg-slate-dark border-2 border-ivory-light/20 p-4 space-y-3">
        <h3 className="font-mono text-xs text-ivory-light/60 tracking-wider">revenue split</h3>

        {/* Bar */}
        <div className="h-6 flex overflow-hidden border-2 border-ivory-light/20">
          <div
            className="bg-larp-green flex items-center justify-center transition-all"
            style={{ width: `${data.revenueSplit.profit * 100}%` }}
          >
            <span className="font-mono text-[10px] text-black font-bold">
              {Math.round(data.revenueSplit.profit * 100)}%
            </span>
          </div>
          <div
            className="bg-cyan-500 flex items-center justify-center transition-all"
            style={{ width: `${data.revenueSplit.operations * 100}%` }}
          >
            <span className="font-mono text-[10px] text-black font-bold">
              {Math.round(data.revenueSplit.operations * 100)}%
            </span>
          </div>
          <div
            className="bg-danger-orange flex items-center justify-center transition-all"
            style={{ width: `${data.revenueSplit.burn * 100}%` }}
          >
            <span className="font-mono text-[10px] text-black font-bold">
              {Math.round(data.revenueSplit.burn * 100)}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center">
          <LegendItem color="bg-larp-green" label="profit" value={`${formatNumber(data.totalDistributed.profit, 4)} SOL`} />
          <LegendItem color="bg-cyan-500" label="operations" value={`${formatNumber(data.totalDistributed.operations, 4)} SOL`} />
          <LegendItem color="bg-danger-orange" label="burn" value={`${formatNumber(data.totalDistributed.burn, 4)} SOL`} />
        </div>
      </div>

      {/* Recent Burns */}
      <div className="bg-slate-dark border-2 border-ivory-light/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-xs text-ivory-light/60 tracking-wider flex items-center gap-2">
            <Flame className="w-3 h-3 text-danger-orange" />
            recent burns
          </h3>
          <span className="font-mono text-[10px] text-ivory-light/40">
            {data.burns.transactionCount} total
          </span>
        </div>

        {data.burns.recent.length === 0 ? (
          <div className="py-6 text-center">
            <Zap className="w-8 h-8 text-ivory-light/20 mx-auto mb-2" />
            <p className="font-mono text-sm text-ivory-light/40">no burns yet</p>
            <p className="font-mono text-[10px] text-ivory-light/30 mt-1">
              first burn coming soon
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {data.burns.recent.map((burn) => (
              <a
                key={burn.signature}
                href={`https://solscan.io/tx/${burn.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2 px-3
                           bg-slate-medium/30 border border-transparent
                           hover:border-danger-orange/50 hover:bg-slate-medium/50
                           transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-4 h-4 text-danger-orange" />
                  <div>
                    <span className="font-mono text-sm text-danger-orange">
                      {formatNumber(burn.clarpAmount)} CLARP
                    </span>
                    <span className="font-mono text-[10px] text-ivory-light/40 ml-2">
                      ({formatNumber(burn.solSpent, 4)} SOL)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-ivory-light/40">
                    {formatTimestamp(burn.timestamp)}
                  </span>
                  <span className="font-mono text-[10px] text-ivory-light/30 group-hover:text-cyan-400 transition-colors">
                    {truncateSignature(burn.signature)}
                  </span>
                  <ExternalLink className="w-3 h-3 text-ivory-light/30 group-hover:text-cyan-400 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="font-mono text-[10px] text-ivory-light/30">
          powered by
        </span>
        <a
          href="https://bags.fm"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-ivory-light/50 hover:text-danger-orange transition-colors flex items-center gap-1"
        >
          bags.fm
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  borderColor: string;
}

function StatCard({ icon, label, value, subValue, color, borderColor }: StatCardProps) {
  return (
    <div className={`bg-slate-dark border-2 ${borderColor} p-4
                    shadow-[4px_4px_0_rgba(255,107,53,0.2)]
                    hover:shadow-[2px_2px_0_rgba(255,107,53,0.3)]
                    hover:translate-x-[2px] hover:translate-y-[2px]
                    transition-all`}>
      <div className={`flex items-center gap-2 ${color} mb-2`}>
        {icon}
        <span className="font-mono text-[10px] tracking-wider uppercase">{label}</span>
      </div>
      <p className="font-mono text-xl text-ivory-light">{value}</p>
      {subValue && (
        <p className="font-mono text-[10px] text-ivory-light/40 mt-1">{subValue}</p>
      )}
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  value: string;
}

function LegendItem({ color, label, value }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 ${color}`} />
      <span className="font-mono text-[10px] text-ivory-light/60">{label}</span>
      <span className="font-mono text-[10px] text-ivory-light/40">{value}</span>
    </div>
  );
}
