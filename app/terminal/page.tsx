'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProjectCard from '@/components/terminal/ProjectCard';
import {
  MOCK_PROJECTS,
  MOCK_WATCHLIST,
  MOCK_ALERTS,
  getMockScore,
  getRiskSpikes,
  getTrendingRisky,
} from '@/lib/terminal/mock-data';
import {
  TrendingUp,
  AlertTriangle,
  Bookmark,
  Bell,
  ChevronRight,
  Activity,
} from 'lucide-react';

export default function TerminalDashboard() {
  const [mounted, setMounted] = useState(false);
  const [riskSpikes, setRiskSpikes] = useState<ReturnType<typeof getRiskSpikes>>([]);
  const [trendingRisky, setTrendingRisky] = useState<ReturnType<typeof getTrendingRisky>>([]);

  useEffect(() => {
    setMounted(true);
    setRiskSpikes(getRiskSpikes());
    setTrendingRisky(getTrendingRisky());
  }, []);

  if (!mounted) return null;

  const unreadAlerts = MOCK_ALERTS.filter(a => !a.read).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-ivory-light">
            Dashboard
          </h1>
          <p className="text-ivory-light/50 font-mono text-sm mt-1">
            Real-time risk intelligence
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/terminal/watchlist"
            className="flex items-center gap-2 px-4 py-2 border border-ivory-light/20 text-ivory-light/70 hover:border-danger-orange/50 hover:text-ivory-light font-mono text-sm transition-colors"
          >
            <Bookmark size={16} />
            Watchlist ({MOCK_WATCHLIST.length})
          </Link>
          <Link
            href="/terminal/alerts"
            className="flex items-center gap-2 px-4 py-2 border border-ivory-light/20 text-ivory-light/70 hover:border-danger-orange/50 hover:text-ivory-light font-mono text-sm transition-colors relative"
          >
            <Bell size={16} />
            Alerts
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-orange text-black text-xs font-bold flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Risk Spikes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-larp-red" />
            <h2 className="font-mono font-bold text-ivory-light text-lg">Risk Spikes (24h)</h2>
          </div>
          <span className="text-xs font-mono text-ivory-light/40">
            Projects with biggest score increase
          </span>
        </div>

        {riskSpikes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {riskSpikes.map(({ project, score, delta }) => (
              <ProjectCard
                key={project.id}
                project={project}
                score={score}
                scoreDelta24h={delta}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="p-6 border border-ivory-light/10 text-center">
            <p className="text-ivory-light/50 font-mono text-sm">
              No significant risk spikes detected
            </p>
          </div>
        )}
      </section>

      {/* Trending + Risky */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-danger-orange" />
            <h2 className="font-mono font-bold text-ivory-light text-lg">Trending + Risky</h2>
          </div>
          <span className="text-xs font-mono text-ivory-light/40">
            High mention velocity + red flags
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trendingRisky.map(({ project, score }) => (
            <ProjectCard
              key={project.id}
              project={project}
              score={score}
              compact
            />
          ))}
        </div>
      </section>

      {/* Watchlist Summary */}
      {MOCK_WATCHLIST.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bookmark size={20} className="text-larp-yellow" />
              <h2 className="font-mono font-bold text-ivory-light text-lg">Your Watchlist</h2>
            </div>
            <Link
              href="/terminal/watchlist"
              className="text-xs font-mono text-danger-orange hover:text-danger-orange/80 flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MOCK_WATCHLIST.slice(0, 3).map(({ project, score, scoreDelta24h }) => (
              <ProjectCard
                key={project.id}
                project={project}
                score={score}
                scoreDelta24h={scoreDelta24h}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Alerts */}
      {MOCK_ALERTS.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-larp-purple" />
              <h2 className="font-mono font-bold text-ivory-light text-lg">Recent Alerts</h2>
            </div>
            <Link
              href="/terminal/alerts"
              className="text-xs font-mono text-danger-orange hover:text-danger-orange/80 flex items-center gap-1"
            >
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-2">
            {MOCK_ALERTS.slice(0, 3).map((alert) => {
              const project = MOCK_PROJECTS.find(p => p.id === alert.projectId);
              return (
                <Link
                  key={alert.id}
                  href={`/terminal/project/${alert.projectId}`}
                  className={`block p-4 border transition-colors ${
                    alert.read
                      ? 'border-ivory-light/10 hover:border-ivory-light/20'
                      : 'border-danger-orange/30 bg-danger-orange/5 hover:border-danger-orange/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {!alert.read && (
                          <span className="w-2 h-2 bg-danger-orange shrink-0" />
                        )}
                        <span className="font-mono font-bold text-ivory-light">
                          {project?.name || 'Unknown'}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 bg-ivory-light/10 text-ivory-light/60">
                          {alert.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-ivory-light/60 mt-1 font-mono">
                        {alert.type === 'score_change'
                          ? `Score changed from ${alert.payload.before} to ${alert.payload.after}`
                          : alert.type === 'wallet_cex'
                          ? 'Team wallet deposited to CEX'
                          : 'Alert triggered'}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-ivory-light/40 shrink-0">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 border border-ivory-light/10 bg-ivory-light/5">
          <span className="text-xs font-mono text-ivory-light/40">Projects Scanned</span>
          <p className="text-2xl font-mono font-bold text-ivory-light mt-1">
            {MOCK_PROJECTS.length}
          </p>
        </div>
        <div className="p-4 border border-ivory-light/10 bg-ivory-light/5">
          <span className="text-xs font-mono text-ivory-light/40">High Risk</span>
          <p className="text-2xl font-mono font-bold text-larp-red mt-1">
            {MOCK_PROJECTS.filter(p => getMockScore(p.id).riskLevel === 'critical').length}
          </p>
        </div>
        <div className="p-4 border border-ivory-light/10 bg-ivory-light/5">
          <span className="text-xs font-mono text-ivory-light/40">Watching</span>
          <p className="text-2xl font-mono font-bold text-larp-yellow mt-1">
            {MOCK_WATCHLIST.length}
          </p>
        </div>
        <div className="p-4 border border-ivory-light/10 bg-ivory-light/5">
          <span className="text-xs font-mono text-ivory-light/40">Active Alerts</span>
          <p className="text-2xl font-mono font-bold text-larp-purple mt-1">
            {unreadAlerts}
          </p>
        </div>
      </section>
    </div>
  );
}
