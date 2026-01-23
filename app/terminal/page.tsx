'use client';

import { useState, useEffect } from 'react';
import IntelCard from '@/components/terminal/IntelCard';
import IntelCarousel from '@/components/terminal/IntelCarousel';
import {
  MOCK_PROJECTS,
  getRiskSpikes,
  getTrendingRisky,
  getTrustedProjects,
  getRecentlyVerified,
} from '@/lib/terminal/mock-data';
import { Shield, AlertTriangle, TrendingUp, Activity, Zap, Eye } from 'lucide-react';

export default function TerminalDashboard() {
  const [mounted, setMounted] = useState(false);
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

  // Stats
  const totalProjects = MOCK_PROJECTS.length;
  const verifiedCount = MOCK_PROJECTS.filter((p) => p.verified).length;
  const criticalCount = trendingRisky.filter((p) => p.score.score >= 70).length;
  const lowRiskCount = trustedProjects.length;

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Header */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-ivory-light">
              intel dashboard
            </h1>
            <p className="text-sm sm:text-base font-mono text-ivory-light/50 mt-2">
              real-time risk intelligence. trust no one. verify everything.
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-danger-orange/50 bg-slate-dark">
            <div className="w-2 h-2 bg-larp-green animate-pulse" />
            <span className="text-xs font-mono text-ivory-light/70">
              scanning {totalProjects} projects
            </span>
          </div>
        </div>

        {/* Stats bar - dark brutalist cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div className="p-4 bg-slate-dark border-2 border-ivory-light/20" style={{ boxShadow: '3px 3px 0 rgba(250,249,245,0.1)' }}>
            <div className="flex items-center gap-2 text-ivory-light/50 mb-1">
              <Eye size={14} />
              <span className="text-[10px] sm:text-xs font-mono uppercase">tracked</span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-ivory-light">
              {totalProjects}
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-ivory-light/40">projects</div>
          </div>

          <div className="p-4 bg-slate-dark border-2 border-larp-green/50" style={{ boxShadow: '3px 3px 0 var(--larp-green)' }}>
            <div className="flex items-center gap-2 text-larp-green mb-1">
              <Shield size={14} />
              <span className="text-[10px] sm:text-xs font-mono uppercase">verified</span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-larp-green">
              {verifiedCount}
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-ivory-light/40">
              kyc teams
            </div>
          </div>

          <div className="p-4 bg-slate-dark border-2 border-larp-green/50" style={{ boxShadow: '3px 3px 0 var(--larp-green)' }}>
            <div className="flex items-center gap-2 text-larp-green mb-1">
              <Zap size={14} />
              <span className="text-[10px] sm:text-xs font-mono uppercase">safe</span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-larp-green">
              {lowRiskCount}
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-ivory-light/40">
              low risk
            </div>
          </div>

          <div className="p-4 bg-slate-dark border-2 border-larp-red/50" style={{ boxShadow: '3px 3px 0 var(--larp-red)' }}>
            <div className="flex items-center gap-2 text-larp-red mb-1">
              <AlertTriangle size={14} />
              <span className="text-[10px] sm:text-xs font-mono uppercase">critical</span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-larp-red">
              {criticalCount}
            </div>
            <div className="text-[10px] sm:text-xs font-mono text-ivory-light/40">
              high risk
            </div>
          </div>
        </div>
      </div>

      {/* Verified Projects Carousel */}
      {verifiedProjects.length > 0 && (
        <section>
          <IntelCarousel
            title="verified projects"
            subtitle="kyc verified teams. still dyor."
            icon={<Shield size={24} />}
            variant="safe"
          >
            {verifiedProjects.map(({ project, score }) => (
              <IntelCard key={project.id} project={project} score={score} />
            ))}
          </IntelCarousel>
        </section>
      )}

      {/* Risk Spikes Carousel */}
      {riskSpikes.length > 0 && (
        <section>
          <IntelCarousel
            title="risk spikes (24h)"
            subtitle="biggest score increases. something changed."
            icon={<TrendingUp size={24} />}
            variant="danger"
            autoScroll
            autoScrollInterval={6000}
          >
            {riskSpikes.map(({ project, score, delta }) => (
              <IntelCard
                key={project.id}
                project={project}
                score={score}
                scoreDelta24h={delta}
              />
            ))}
          </IntelCarousel>
        </section>
      )}

      {/* High Risk Carousel */}
      {trendingRisky.length > 0 && (
        <section>
          <IntelCarousel
            title="high risk projects"
            subtitle="trending + red flags. proceed with caution (or don't proceed)."
            icon={<AlertTriangle size={24} />}
            variant="danger"
          >
            {trendingRisky.map(({ project, score }) => (
              <IntelCard key={project.id} project={project} score={score} />
            ))}
          </IntelCarousel>
        </section>
      )}

      {/* Low Risk Carousel */}
      {trustedProjects.length > 0 && (
        <section>
          <IntelCarousel
            title="low risk projects"
            subtitle="appears legitimate. but we've been wrong before."
            icon={<Shield size={24} />}
            variant="safe"
          >
            {trustedProjects.map(({ project, score }) => (
              <IntelCard key={project.id} project={project} score={score} />
            ))}
          </IntelCarousel>
        </section>
      )}

      {/* Activity Feed - dark brutalist */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Activity size={24} className="text-danger-orange" />
          <div>
            <h2 className="text-lg sm:text-xl font-mono font-bold text-ivory-light">
              recent activity
            </h2>
            <p className="text-xs font-mono text-ivory-light/50">
              latest intel across all projects
            </p>
          </div>
        </div>

        <div className="bg-slate-dark border-2 border-ivory-light/20 overflow-hidden" style={{ boxShadow: '4px 4px 0 rgba(250,249,245,0.1)' }}>
          {[
            {
              time: '2m ago',
              event: 'score increased',
              project: 'TROVE',
              delta: '+8',
              type: 'warning' as const,
            },
            {
              time: '15m ago',
              event: 'new shill cluster detected',
              project: 'Hype Machine',
              delta: null,
              type: 'critical' as const,
            },
            {
              time: '1h ago',
              event: 'lp lock extended',
              project: 'Shadow Protocol',
              delta: null,
              type: 'positive' as const,
            },
            {
              time: '2h ago',
              event: 'team wallet → cex',
              project: 'CyberYield',
              delta: null,
              type: 'critical' as const,
            },
            {
              time: '4h ago',
              event: 'verification approved',
              project: 'DeFi Pulse',
              delta: null,
              type: 'positive' as const,
            },
            {
              time: '6h ago',
              event: 'suspicious flow detected',
              project: 'Neural Net Token',
              delta: null,
              type: 'critical' as const,
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 hover:bg-ivory-light/5 transition-colors ${
                i !== 5 ? 'border-b border-ivory-light/10' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-ivory-light/40 w-16 shrink-0">
                  {item.time}
                </span>
                <span className="font-mono text-sm text-ivory-light">{item.event}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-danger-orange">{item.project}</span>
                {item.delta && (
                  <span className="text-xs font-mono text-larp-red">{item.delta}</span>
                )}
                <span
                  className={`w-3 h-3 ${
                    item.type === 'critical'
                      ? 'bg-larp-red'
                      : item.type === 'warning'
                      ? 'bg-danger-orange'
                      : 'bg-larp-green'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-mono text-ivory-light/30 mt-3 text-center">
          showing last 6 events. click a project to see full history. (jk, that doesn't work yet)
        </p>
      </section>
    </div>
  );
}
