import { NextRequest, NextResponse } from 'next/server';
import { getProfileByHandle, MOCK_PROJECTS } from '@/lib/terminal/mock-data';
import { calculateLarpScore } from '@/lib/terminal/scoring/calculate-score';
import type { ProfileResponse, ProfileBadge, TimelineEvent, Amplifier } from '@/types/terminal';

// Cache duration: 5-15 minutes
const CACHE_DURATION = 5 * 60;

// Mock amplifiers
const MOCK_AMPLIFIERS: Amplifier[] = [
  { handle: 'crypto_whale_01', followers: 150000, retweetCount: 45, suspiciousScore: 85 },
  { handle: 'defi_chad', followers: 80000, retweetCount: 38, suspiciousScore: 72 },
  { handle: 'moon_signals', followers: 45000, retweetCount: 32, suspiciousScore: 90 },
];

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const params = await context.params;
    const { handle } = params;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    const profile = getProfileByHandle(handle);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Calculate profile score
    const score = calculateLarpScore({
      identity: {
        xAccountAge: profile.accountAgeDays,
        hasVerifiedLinks: profile.verified,
      },
      xBehavior: {
        engagementRate: profile.accountAgeDays < 30 ? 40 : 10,
        burstPattern: profile.accountAgeDays < 30,
        followerGrowthRate: profile.accountAgeDays < 60 ? 100 : 15,
      },
    });

    // Generate badges
    const badges: ProfileBadge[] = [];
    if (profile.accountAgeDays < 30) {
      badges.push({
        id: 'new-account',
        label: 'New Account',
        description: `Account is only ${profile.accountAgeDays} days old`,
        severity: 'critical',
      });
    } else if (profile.accountAgeDays < 90) {
      badges.push({
        id: 'recent-account',
        label: 'Recent Account',
        description: `Account is ${profile.accountAgeDays} days old`,
        severity: 'warning',
      });
    }

    if (profile.verified) {
      badges.push({
        id: 'verified',
        label: 'Verified',
        description: 'Account is verified on X',
        severity: 'info',
      });
    }

    // Generate timeline
    const timeline: TimelineEvent[] = [
      {
        id: 'created',
        type: 'created',
        timestamp: profile.createdAt,
        description: 'Account created',
      },
    ];

    if (profile.verified) {
      timeline.push({
        id: 'verified',
        type: 'verified',
        timestamp: new Date(profile.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
        description: 'Account verified',
      });
    }

    // Find related projects
    const relatedProjects = MOCK_PROJECTS.filter(
      p => p.xHandle?.toLowerCase() === profile.xHandle.toLowerCase()
    );

    const response: ProfileResponse = {
      profile,
      score,
      badges,
      timeline,
      amplifiers: MOCK_AMPLIFIERS,
      relatedProjects,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
