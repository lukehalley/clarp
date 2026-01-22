// GitHub API utility for fetching repo metadata
// No auth required for public repos (60 requests/hour limit)
// With GITHUB_TOKEN: 5000 requests/hour

export interface RepoMetadata {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  language: string | null;
  defaultBranch: string;
  size: number; // KB
  hasIssues: boolean;
  hasWiki: boolean;
  archived: boolean;
  disabled: boolean;
  topics: string[];
}

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
  email: string;
}

export interface ContributorInfo {
  login: string;
  contributions: number;
  type: string; // User or Bot
}

export interface RepoAnalysis {
  metadata: RepoMetadata;
  commits: CommitInfo[];
  contributors: ContributorInfo[];
  files: FileTreeItem[];
  readmeContent: string | null;
  readmeLength: number;
  codeFileCount: number;
  testFileCount: number;
  totalFiles: number;
  hasPackageJson: boolean;
  hasTests: boolean;
  hasCICD: boolean;
  languageBreakdown: Record<string, number>;
  lastCommitDaysAgo: number;
  uniqueContributors: number;
  commitFrequency: string; // e.g., "3 commits/month"
  suspiciousPatterns: string[];
}

export interface FileTreeItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

const GITHUB_API = 'https://api.github.com';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CLARP-Vapourware-Detector',
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/\?#]+)/,
    /^([^\/]+)\/([^\/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }

  return null;
}

async function fetchGitHub<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: getHeaders(),
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found');
    }
    if (response.status === 403) {
      throw new Error('Rate limit exceeded. Try again later.');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

export async function getRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
  const data = await fetchGitHub<any>(`/repos/${owner}/${repo}`);

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at,
    language: data.language,
    defaultBranch: data.default_branch,
    size: data.size,
    hasIssues: data.has_issues,
    hasWiki: data.has_wiki,
    archived: data.archived,
    disabled: data.disabled,
    topics: data.topics || [],
  };
}

export async function getRecentCommits(owner: string, repo: string, count = 30): Promise<CommitInfo[]> {
  const data = await fetchGitHub<any[]>(`/repos/${owner}/${repo}/commits?per_page=${count}`);

  return data.map(commit => ({
    sha: commit.sha,
    message: commit.commit.message,
    date: commit.commit.author.date,
    author: commit.commit.author.name,
    email: commit.commit.author.email,
  }));
}

export async function getContributors(owner: string, repo: string): Promise<ContributorInfo[]> {
  try {
    const data = await fetchGitHub<any[]>(`/repos/${owner}/${repo}/contributors?per_page=30`);

    return data.map(contributor => ({
      login: contributor.login,
      contributions: contributor.contributions,
      type: contributor.type,
    }));
  } catch {
    // Some repos don't have contributors endpoint accessible
    return [];
  }
}

export async function getFileTree(owner: string, repo: string, branch: string): Promise<FileTreeItem[]> {
  try {
    const data = await fetchGitHub<any>(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

    return (data.tree || []).slice(0, 500).map((item: any) => ({
      path: item.path,
      type: item.type,
      size: item.size,
    }));
  } catch {
    return [];
  }
}

export async function getReadme(owner: string, repo: string): Promise<string | null> {
  try {
    const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
      headers: {
        ...getHeaders(),
        'Accept': 'application/vnd.github.v3.raw',
      },
    });

    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

export async function getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  try {
    return await fetchGitHub<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
  } catch {
    return {};
  }
}

export async function analyzeRepo(owner: string, repo: string): Promise<RepoAnalysis> {
  // Fetch all data in parallel
  const [metadata, commits, contributors, languages, readme] = await Promise.all([
    getRepoMetadata(owner, repo),
    getRecentCommits(owner, repo, 50),
    getContributors(owner, repo),
    getLanguages(owner, repo),
    getReadme(owner, repo),
  ]);

  // Get file tree
  const files = await getFileTree(owner, repo, metadata.defaultBranch);

  // Analyze files
  const codeExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rs', '.sol', '.java', '.cpp', '.c', '.rb', '.php'];
  const testPatterns = ['test', 'spec', '__tests__', '.test.', '.spec.'];
  const cicdPatterns = ['.github/workflows', '.gitlab-ci', 'Jenkinsfile', '.circleci', '.travis'];

  const codeFiles = files.filter(f =>
    f.type === 'blob' && codeExtensions.some(ext => f.path.endsWith(ext))
  );

  const testFiles = files.filter(f =>
    f.type === 'blob' && testPatterns.some(p => f.path.toLowerCase().includes(p))
  );

  const hasPackageJson = files.some(f => f.path === 'package.json');
  const hasCICD = files.some(f => cicdPatterns.some(p => f.path.includes(p)));

  // Calculate last commit days ago
  const lastCommitDate = commits[0]?.date ? new Date(commits[0].date) : new Date();
  const lastCommitDaysAgo = Math.floor((Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate commit frequency
  const commitDates = commits.map(c => new Date(c.date).getTime());
  const oldestCommit = Math.min(...commitDates);
  const newestCommit = Math.max(...commitDates);
  const timeSpanMonths = Math.max(1, (newestCommit - oldestCommit) / (1000 * 60 * 60 * 24 * 30));
  const commitsPerMonth = Math.round(commits.length / timeSpanMonths);

  // Detect suspicious patterns
  const suspiciousPatterns: string[] = [];

  // Check for bulk initial commit
  if (commits.length > 0) {
    const firstCommit = commits[commits.length - 1];
    if (firstCommit?.message.toLowerCase().includes('initial commit')) {
      // Check if it's a bulk commit (many files at once)
      const secondCommit = commits[commits.length - 2];
      if (!secondCommit || new Date(firstCommit.date).getTime() === new Date(secondCommit?.date || 0).getTime()) {
        suspiciousPatterns.push('bulk_initial_commit');
      }
    }
  }

  // Check for same-time commits
  const commitTimes = commits.map(c => new Date(c.date).getTime());
  const duplicateTimes = commitTimes.filter((t, i) => commitTimes.indexOf(t) !== i);
  if (duplicateTimes.length > 3) {
    suspiciousPatterns.push('many_same_time_commits');
  }

  // Check for single contributor
  const uniqueAuthors = new Set(commits.map(c => c.email)).size;
  if (uniqueAuthors === 1 && commits.length > 10) {
    suspiciousPatterns.push('single_contributor');
  }

  // Check for late night commits (might be bot activity)
  const lateNightCommits = commits.filter(c => {
    const hour = new Date(c.date).getUTCHours();
    return hour >= 1 && hour <= 5;
  });
  if (lateNightCommits.length > commits.length * 0.5) {
    suspiciousPatterns.push('mostly_late_night_commits');
  }

  // Check for README bloat
  const readmeLength = readme?.length || 0;
  const totalCodeSize = codeFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  if (readmeLength > 5000 && readmeLength > totalCodeSize * 0.5) {
    suspiciousPatterns.push('readme_bloat');
  }

  // Check for no tests
  if (testFiles.length === 0 && codeFiles.length > 5) {
    suspiciousPatterns.push('no_tests');
  }

  // Check for buzzword-heavy topics
  const buzzwords = ['ai', 'blockchain', 'web3', 'defi', 'nft', 'metaverse', 'quantum', 'revolutionary'];
  const buzzwordTopics = metadata.topics.filter(t => buzzwords.some(b => t.toLowerCase().includes(b)));
  if (buzzwordTopics.length >= 3) {
    suspiciousPatterns.push('buzzword_overload');
  }

  return {
    metadata,
    commits,
    contributors,
    files,
    readmeContent: readme,
    readmeLength,
    codeFileCount: codeFiles.length,
    testFileCount: testFiles.length,
    totalFiles: files.length,
    hasPackageJson,
    hasTests: testFiles.length > 0,
    hasCICD,
    languageBreakdown: languages,
    lastCommitDaysAgo,
    uniqueContributors: uniqueAuthors,
    commitFrequency: `${commitsPerMonth} commits/month`,
    suspiciousPatterns,
  };
}
