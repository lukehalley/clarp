'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ScoreDisplay from '@/components/terminal/ScoreDisplay';
import RiskCard from '@/components/terminal/RiskCard';
import { getProjectById, getMockScore } from '@/lib/terminal/mock-data';
import type { Project, LarpScore } from '@/types/terminal';
import ChainIcon from '@/components/terminal/ChainIcon';
import {
  Copy,
  Check,
  ExternalLink,
  Bookmark,
  Bell,
  Share2,
  RefreshCw,
  ArrowLeft,
  Twitter,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [score, setScore] = useState<LarpScore | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const p = getProjectById(resolvedParams.id);
    if (p) {
      setProject(p);
      setScore(getMockScore(p.id));
    }
    setLoading(false);
  }, [resolvedParams.id]);

  const handleCopy = () => {
    if (project?.contract) {
      navigator.clipboard.writeText(project.contract);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setScore(getMockScore(project?.id || ''));
      setRefreshing(false);
    }, 1000);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/terminal/report/${project?.id}`;
    navigator.clipboard.writeText(url);
    alert('Report link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-danger-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project || !score) {
    return (
      <div className="text-center py-12">
        <p className="text-ivory-light/50 font-mono text-lg mb-4">Project not found</p>
        <Link
          href="/terminal"
          className="text-danger-orange font-mono hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-ivory-light/50 hover:text-ivory-light font-mono text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="border-2 border-ivory-light/20 bg-ivory-light/5 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Project info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-ivory-light">
                {project.name}
              </h1>
              {project.ticker && (
                <span className="font-mono text-xl text-danger-orange">
                  ${project.ticker}
                </span>
              )}
              <ChainIcon chain={project.chain} size={24} />
              {project.verified && (
                <span className="text-sm font-mono px-3 py-1 bg-larp-green/20 text-larp-green border border-larp-green/30">
                  Verified
                </span>
              )}
            </div>

            {/* Contract */}
            {project.contract && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm font-mono text-ivory-light/50 hover:text-ivory-light/70 transition-colors"
              >
                <span className="truncate max-w-[200px] sm:max-w-[300px]">
                  {project.contract}
                </span>
                {copied ? (
                  <Check size={14} className="text-larp-green shrink-0" />
                ) : (
                  <Copy size={14} className="shrink-0" />
                )}
              </button>
            )}

            {/* Links */}
            <div className="flex items-center gap-4">
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-mono text-ivory-light/50 hover:text-danger-orange transition-colors"
                >
                  <ExternalLink size={14} />
                  Website
                </a>
              )}
              {project.xHandle && (
                <a
                  href={`https://x.com/${project.xHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-mono text-ivory-light/50 hover:text-danger-orange transition-colors"
                >
                  <Twitter size={14} />
                  @{project.xHandle}
                </a>
              )}
            </div>
          </div>

          {/* Right: Score */}
          <div className="lg:ml-auto">
            <ScoreDisplay score={score} size="lg" align="right" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-ivory-light/10">
          <button className="flex items-center gap-2 px-4 py-2 bg-danger-orange text-black font-mono font-bold text-sm hover:bg-danger-orange/90 transition-colors">
            <Bookmark size={16} />
            Watch
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-ivory-light/30 text-ivory-light font-mono text-sm hover:border-danger-orange/50 transition-colors">
            <Bell size={16} />
            Create Alert
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 border border-ivory-light/30 text-ivory-light font-mono text-sm hover:border-danger-orange/50 transition-colors"
          >
            <Share2 size={16} />
            Share Report
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-ivory-light/30 text-ivory-light/70 font-mono text-sm hover:border-ivory-light/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Last updated */}
        <div className="mt-4 text-xs font-mono text-ivory-light/40">
          Last updated: {score.lastUpdated.toLocaleString()}
        </div>
      </div>

      {/* Risk Breakdown */}
      <section>
        <h2 className="font-mono font-bold text-ivory-light text-xl mb-4">
          Risk Breakdown
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <RiskCard module={score.breakdown.identity} defaultExpanded />
          <RiskCard module={score.breakdown.xBehavior} />
          <RiskCard module={score.breakdown.wallet} />
          <RiskCard module={score.breakdown.liquidity} />
        </div>
      </section>

      {/* View profile link */}
      {project.xHandle && (
        <div className="p-4 border border-ivory-light/10 bg-ivory-light/5">
          <Link
            href={`/terminal/profile/${project.xHandle}`}
            className="flex items-center justify-between text-ivory-light hover:text-danger-orange transition-colors"
          >
            <span className="font-mono">
              View @{project.xHandle} profile analysis
            </span>
            <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
