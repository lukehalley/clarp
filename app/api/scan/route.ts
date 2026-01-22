import { NextRequest, NextResponse } from 'next/server';
import { parseGitHubUrl, analyzeRepo } from '@/lib/github';
import { analyzeWithClaude, getVerdictColor, getVerdictIcon } from '@/lib/analyzer';
import { saveRecentScan, getRecentScans, RateLimitError, checkRateLimit } from '@/lib/storage';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for analysis

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid GitHub URL' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format. Try: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Check rate limit (simple IP-based)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    try {
      checkRateLimit(clientIp);
    } catch (e) {
      if (e instanceof RateLimitError) {
        return NextResponse.json(
          { error: e.message },
          { status: 429 }
        );
      }
      throw e;
    }

    // Analyze repository
    console.log(`Analyzing repo: ${owner}/${repo}`);
    const repoAnalysis = await analyzeRepo(owner, repo);

    // Get AI verdict
    console.log('Running Claude analysis...');
    const verdict = await analyzeWithClaude(repoAnalysis);

    // Build response
    const result = {
      repoName: repoAnalysis.metadata.name,
      repoFullName: repoAnalysis.metadata.fullName,
      repoUrl: `https://github.com/${owner}/${repo}`,
      score: verdict.score,
      verdict: verdict.verdict,
      verdictColor: getVerdictColor(verdict.score),
      verdictIcon: getVerdictIcon(verdict.score),
      summary: verdict.summary,
      findings: verdict.findings,
      recommendation: verdict.recommendation,
      ropiScore: verdict.ropiScore,
      metadata: {
        stars: repoAnalysis.metadata.stars,
        forks: repoAnalysis.metadata.forks,
        language: repoAnalysis.metadata.language,
        codeFiles: repoAnalysis.codeFileCount,
        testFiles: repoAnalysis.testFileCount,
        lastCommitDaysAgo: repoAnalysis.lastCommitDaysAgo,
        uniqueContributors: repoAnalysis.uniqueContributors,
        readmeLength: repoAnalysis.readmeLength,
      },
      scannedAt: new Date().toISOString(),
    };

    // Save to recent scans
    saveRecentScan({
      repoName: result.repoFullName,
      score: result.score,
      verdict: result.verdict,
      tag: verdict.summary.slice(0, 50),
      scannedAt: result.scannedAt,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Scan error:', error);

    if (error.message === 'Repository not found') {
      return NextResponse.json(
        { error: 'Repository not found. Make sure it exists and is public.' },
        { status: 404 }
      );
    }

    if (error.message?.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'GitHub API rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze repository. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return recent scans
  const recentScans = getRecentScans();
  return NextResponse.json({ scans: recentScans });
}
