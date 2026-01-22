// Claude AI analyzer for vapourware detection
import Anthropic from '@anthropic-ai/sdk';
import { RepoAnalysis } from './github';

export interface VapourwareVerdict {
  score: number; // 0-100, higher = more vapourware
  verdict: string; // e.g., "CONFIRMED VAPOURWARE"
  summary: string; // One-line summary
  findings: Finding[];
  recommendation: string;
  ropiScore: number; // "Return on Perceived Investment" - satirical metric
}

export interface Finding {
  label: string;
  value: string;
  severity: 'critical' | 'warning' | 'info' | 'good';
}

const client = new Anthropic();

function buildAnalysisPrompt(analysis: RepoAnalysis): string {
  const readmePreview = analysis.readmeContent
    ? analysis.readmeContent.slice(0, 3000)
    : 'No README found';

  const recentCommitMessages = analysis.commits
    .slice(0, 15)
    .map(c => `- "${c.message.split('\n')[0]}" by ${c.author}`)
    .join('\n');

  const topLanguages = Object.entries(analysis.languageBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang, bytes]) => `${lang}: ${Math.round(bytes / 1024)}KB`)
    .join(', ');

  return `You are C(LARP) AGENT - a snarky AI that analyzes GitHub repos to detect if they're real projects or just vapourware/AI-generated slop.

Analyze this repository and return a JSON verdict. Be brutally honest and funny. This is satirical - roast bad projects mercilessly.

## Repository Data

**Name:** ${analysis.metadata.fullName}
**Description:** ${analysis.metadata.description || 'None provided'}
**Topics/Tags:** ${analysis.metadata.topics.join(', ') || 'None'}
**Stars:** ${analysis.metadata.stars} | **Forks:** ${analysis.metadata.forks}
**Created:** ${analysis.metadata.createdAt} | **Last Push:** ${analysis.metadata.pushedAt}
**Primary Language:** ${analysis.metadata.language || 'Unknown'}
**Languages:** ${topLanguages || 'Unknown'}
**Repo Size:** ${analysis.metadata.size}KB
**Archived:** ${analysis.metadata.archived}

## Code Metrics
- Total files: ${analysis.totalFiles}
- Code files: ${analysis.codeFileCount}
- Test files: ${analysis.testFileCount}
- Has package.json: ${analysis.hasPackageJson}
- Has CI/CD: ${analysis.hasCICD}
- README length: ${analysis.readmeLength} characters

## Commit Analysis
- Total recent commits analyzed: ${analysis.commits.length}
- Unique contributors: ${analysis.uniqueContributors}
- Commit frequency: ${analysis.commitFrequency}
- Last commit: ${analysis.lastCommitDaysAgo} days ago
- Suspicious patterns detected: ${analysis.suspiciousPatterns.join(', ') || 'None'}

Recent commits:
${recentCommitMessages}

## Contributors
${analysis.contributors.slice(0, 5).map(c => `- ${c.login}: ${c.contributions} commits`).join('\n') || 'No contributor data'}

## README Preview
\`\`\`
${readmePreview}
\`\`\`

## Sample Files
${analysis.files.slice(0, 30).map(f => f.path).join('\n')}

---

Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "score": <number 0-100, higher = more vapourware>,
  "verdict": "<short verdict like 'CONFIRMED VAPOURWARE' or 'PROBABLY LEGITIMATE' - all caps>",
  "summary": "<one snarky sentence summarizing the project>",
  "findings": [
    {"label": "ai-generated code", "value": "<percentage or assessment>", "severity": "critical|warning|info|good"},
    {"label": "readme-to-code ratio", "value": "<ratio or assessment>", "severity": "critical|warning|info|good"},
    {"label": "test coverage", "value": "<assessment>", "severity": "critical|warning|info|good"},
    {"label": "commit authenticity", "value": "<assessment>", "severity": "critical|warning|info|good"},
    {"label": "contributor diversity", "value": "<assessment>", "severity": "critical|warning|info|good"},
    {"label": "buzzword density", "value": "<assessment>", "severity": "critical|warning|info|good"}
  ],
  "recommendation": "<snarky recommendation for potential investors/users>",
  "ropiScore": <number 0-100, satirical 'Return on Perceived Investment' score>
}

Scoring guide:
- 90-100: Confirmed vapourware, obvious AI slop, zero substance
- 70-89: Highly suspicious, probably a rugpull or abandoned project
- 50-69: Suspicious patterns but might have some real code
- 30-49: Probably fine, some yellow flags
- 0-29: Appears to be a legitimate project (rare!)

Be extra suspicious of:
- Buzzword-heavy descriptions (AI, blockchain, web3, revolutionary)
- README longer than actual code
- No tests
- Single contributor claiming to be a "team"
- Commits all at the same time (bulk dump)
- Generic AI-generated commit messages
- Projects that are just wrappers around ChatGPT/Claude APIs`;
}

export async function analyzeWithClaude(repoAnalysis: RepoAnalysis): Promise<VapourwareVerdict> {
  const prompt = buildAnalysisPrompt(repoAnalysis);

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse the JSON response
    const jsonText = content.text.trim();
    const verdict = JSON.parse(jsonText) as VapourwareVerdict;

    // Validate and sanitize
    verdict.score = Math.max(0, Math.min(100, Math.round(verdict.score)));
    verdict.ropiScore = Math.max(0, Math.min(100, Math.round(verdict.ropiScore)));

    return verdict;
  } catch (error) {
    console.error('Claude analysis error:', error);

    // Return a fallback verdict if Claude fails
    return {
      score: 50,
      verdict: 'ANALYSIS FAILED',
      summary: 'Our AI had a meltdown trying to analyze this repo. Probably says something.',
      findings: [
        { label: 'analysis status', value: 'failed', severity: 'warning' },
        { label: 'repo exists', value: 'yes', severity: 'good' },
        { label: 'stars', value: String(repoAnalysis.metadata.stars), severity: 'info' },
        { label: 'code files', value: String(repoAnalysis.codeFileCount), severity: 'info' },
        { label: 'test files', value: String(repoAnalysis.testFileCount), severity: repoAnalysis.testFileCount > 0 ? 'good' : 'warning' },
        { label: 'last commit', value: `${repoAnalysis.lastCommitDaysAgo} days ago`, severity: repoAnalysis.lastCommitDaysAgo > 90 ? 'warning' : 'info' },
      ],
      recommendation: 'Our AI broke. DYOR. Or don\'t. We\'re not your financial advisor.',
      ropiScore: 50,
    };
  }
}

// Determine verdict color based on score
export function getVerdictColor(score: number): string {
  if (score >= 80) return 'larp-red';
  if (score >= 60) return 'larp-yellow';
  if (score >= 40) return 'danger-orange';
  return 'larp-green';
}

// Determine verdict icon based on score
export function getVerdictIcon(score: number): string {
  if (score >= 90) return 'skull';
  if (score >= 70) return 'alert-triangle';
  if (score >= 50) return 'alert-circle';
  if (score >= 30) return 'check-circle';
  return 'sparkles';
}
