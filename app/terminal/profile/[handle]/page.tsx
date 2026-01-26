'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ScoreDisplay from '@/components/terminal/ScoreDisplay';
import ProjectCard from '@/components/terminal/ProjectCard';
import { calculateLarpScore } from '@/lib/terminal/scoring/calculate-score';
import type { Project, LarpScore, Profile, ProfileBadge, Amplifier } from '@/types/terminal';

// Stubs - TODO: Replace with real data source
function getProfileByHandle(_handle: string): Profile | null { return null; }
function getMockScore(_id: string): LarpScore | undefined { return undefined; }
const MOCK_PROJECTS: Project[] = [];
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Users,
  UserPlus,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ handle: string }>;
}

// Mock amplifiers data
const MOCK_AMPLIFIERS: Amplifier[] = [
  { handle: 'crypto_whale_01', followers: 150000, retweetCount: 45, suspiciousScore: 85 },
  { handle: 'defi_chad', followers: 80000, retweetCount: 38, suspiciousScore: 72 },
  { handle: 'moon_signals', followers: 45000, retweetCount: 32, suspiciousScore: 90 },
  { handle: 'alpha_hunter', followers: 25000, retweetCount: 28, suspiciousScore: 65 },
  { handle: 'gem_finder', followers: 12000, retweetCount: 22, suspiciousScore: 78 },
];

export default function ProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [score, setScore] = useState<LarpScore | null>(null);
  const [badges, setBadges] = useState<ProfileBadge[]>([]);
  const [relatedProjects, setRelatedProjects] = useState<typeof MOCK_PROJECTS>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = getProfileByHandle(resolvedParams.handle);
    if (p) {
      setProfile(p);

      // Calculate profile-specific score
      const profileScore = calculateLarpScore({
        identity: {
          xAccountAge: p.accountAgeDays,
          hasVerifiedLinks: p.verified,
        },
        xBehavior: {
          engagementRate: p.accountAgeDays < 30 ? 40 : 10,
          burstPattern: p.accountAgeDays < 30,
          followerGrowthRate: p.accountAgeDays < 60 ? 100 : 15,
        },
      });
      setScore(profileScore);

      // Generate badges
      const profileBadges: ProfileBadge[] = [];
      if (p.accountAgeDays < 30) {
        profileBadges.push({
          id: 'new-account',
          label: 'New Account',
          description: `Account is only ${p.accountAgeDays} days old`,
          severity: 'critical',
        });
      } else if (p.accountAgeDays < 90) {
        profileBadges.push({
          id: 'recent-account',
          label: 'Recent Account',
          description: `Account is ${p.accountAgeDays} days old`,
          severity: 'warning',
        });
      } else {
        profileBadges.push({
          id: 'established',
          label: 'Established',
          description: `Account is ${p.accountAgeDays} days old`,
          severity: 'info',
        });
      }

      if (p.followers > 100000) {
        profileBadges.push({
          id: 'high-followers',
          label: 'High Followers',
          description: `${p.followers.toLocaleString()} followers`,
          severity: 'info',
        });
      }

      if (p.followers / (p.following || 1) > 100) {
        profileBadges.push({
          id: 'influencer-ratio',
          label: 'Influencer Ratio',
          description: 'High follower to following ratio',
          severity: 'info',
        });
      }

      setBadges(profileBadges);

      // Find related projects
      const related = MOCK_PROJECTS.filter(
        project => project.xHandle?.toLowerCase() === p.xHandle.toLowerCase()
      );
      setRelatedProjects(related);
    }
    setLoading(false);
  }, [resolvedParams.handle]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-danger-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile || !score) {
    return (
      <div className="text-center py-12">
        <p className="text-ivory-light/50 font-mono text-lg mb-4">Profile not found</p>
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

      {/* Profile Header */}
      <div className="border-2 border-ivory-light/20 bg-ivory-light/5 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Profile info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-ivory-light">
                @{profile.xHandle}
              </h1>
              {profile.verified && (
                <span className="text-sm font-mono px-3 py-1 bg-larp-green/20 text-larp-green border border-larp-green/30">
                  Verified
                </span>
              )}
            </div>

            {profile.displayName && (
              <p className="text-lg text-ivory-light/70">{profile.displayName}</p>
            )}

            {profile.bio && (
              <p className="text-ivory-light/50 max-w-lg">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm font-mono">
              <div className="flex items-center gap-2 text-ivory-light/60">
                <Users size={16} />
                <span className="text-ivory-light">{profile.followers.toLocaleString()}</span>
                <span>followers</span>
              </div>
              <div className="flex items-center gap-2 text-ivory-light/60">
                <UserPlus size={16} />
                <span className="text-ivory-light">{profile.following.toLocaleString()}</span>
                <span>following</span>
              </div>
              <div className="flex items-center gap-2 text-ivory-light/60">
                <Calendar size={16} />
                <span className="text-ivory-light">{profile.accountAgeDays}</span>
                <span>days old</span>
              </div>
            </div>

            {/* Link */}
            <a
              href={`https://x.com/${profile.xHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-danger-orange hover:text-danger-orange/80 font-mono text-sm"
            >
              View on X <ExternalLink size={14} />
            </a>
          </div>

          {/* Right: Score */}
          <div className="lg:text-right">
            <p className="text-xs font-mono text-ivory-light/40 mb-2">Profile LARP Score</p>
            <ScoreDisplay score={score} size="md" />
          </div>
        </div>
      </div>

      {/* Badges */}
      <section>
        <h2 className="font-mono font-bold text-ivory-light text-lg mb-4 flex items-center gap-2">
          <Shield size={18} />
          Behavior Badges
        </h2>
        <div className="flex flex-wrap gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`px-4 py-3 border ${
                badge.severity === 'critical'
                  ? 'border-larp-red bg-larp-red/10'
                  : badge.severity === 'warning'
                  ? 'border-danger-orange bg-danger-orange/10'
                  : 'border-ivory-light/30 bg-ivory-light/5'
              }`}
            >
              <div className={`font-mono font-bold text-sm ${
                badge.severity === 'critical'
                  ? 'text-larp-red'
                  : badge.severity === 'warning'
                  ? 'text-danger-orange'
                  : 'text-ivory-light'
              }`}>
                {badge.label}
              </div>
              <p className="text-xs text-ivory-light/50 mt-1">{badge.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Timeline */}
      <section>
        <h2 className="font-mono font-bold text-ivory-light text-lg mb-4 flex items-center gap-2">
          <Clock size={18} />
          Trust Timeline
        </h2>
        <div className="border border-ivory-light/20 divide-y divide-ivory-light/10">
          <div className="p-4 flex items-start gap-4">
            <div className="w-8 h-8 flex items-center justify-center bg-larp-green/20 text-larp-green shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <p className="font-mono text-ivory-light">Account created</p>
              <p className="text-sm text-ivory-light/50 mt-1">
                {new Date(profile.createdAt).toLocaleDateString()} ({profile.accountAgeDays} days ago)
              </p>
            </div>
          </div>
          {profile.accountAgeDays < 60 && (
            <div className="p-4 flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-danger-orange/20 text-danger-orange shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="font-mono text-ivory-light">Rapid follower growth</p>
                <p className="text-sm text-ivory-light/50 mt-1">
                  Account gained significant followers in short time
                </p>
              </div>
            </div>
          )}
          {!profile.verified && (
            <div className="p-4 flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-larp-yellow/20 text-larp-yellow shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="font-mono text-ivory-light">Not verified</p>
                <p className="text-sm text-ivory-light/50 mt-1">
                  Account lacks X verification
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Amplifiers */}
      <section>
        <h2 className="font-mono font-bold text-ivory-light text-lg mb-4 flex items-center gap-2">
          <Users size={18} />
          Top Amplifiers / Shill Ring
        </h2>
        <div className="border border-ivory-light/20 divide-y divide-ivory-light/10">
          {MOCK_AMPLIFIERS.slice(0, 5).map((amp) => (
            <div key={amp.handle} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <a
                  href={`https://x.com/${amp.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-ivory-light hover:text-danger-orange"
                >
                  @{amp.handle}
                </a>
                <span className="text-xs text-ivory-light/40 font-mono">
                  {amp.followers.toLocaleString()} followers
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-ivory-light/50">
                  {amp.retweetCount} RTs
                </span>
                <span
                  className={`text-xs font-mono px-2 py-1 border ${
                    amp.suspiciousScore >= 80
                      ? 'border-larp-red text-larp-red'
                      : amp.suspiciousScore >= 60
                      ? 'border-danger-orange text-danger-orange'
                      : 'border-ivory-light/30 text-ivory-light/50'
                  }`}
                >
                  {amp.suspiciousScore}% sus
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section>
          <h2 className="font-mono font-bold text-ivory-light text-lg mb-4">
            Related Projects
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                score={getMockScore(project.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
