// Simple in-memory storage for recent scans and rate limiting
// In production, you'd use Redis or a database

export interface RecentScan {
  repoName: string;
  score: number;
  verdict: string;
  tag: string;
  scannedAt: string;
}

// In-memory storage (resets on server restart)
const recentScans: RecentScan[] = [];
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_RECENT_SCANS = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 scans per hour per IP

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function checkRateLimit(clientId: string): void {
  const now = Date.now();
  const existing = rateLimitMap.get(clientId);

  if (!existing || now > existing.resetAt) {
    // Reset or create new entry
    rateLimitMap.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    const minutesLeft = Math.ceil((existing.resetAt - now) / 60000);
    throw new RateLimitError(
      `Rate limit exceeded. You can scan ${RATE_LIMIT_MAX_REQUESTS} repos per hour. Try again in ${minutesLeft} minutes.`
    );
  }

  existing.count++;
}

export function saveRecentScan(scan: RecentScan): void {
  // Add to beginning of array
  recentScans.unshift(scan);

  // Keep only the most recent scans
  if (recentScans.length > MAX_RECENT_SCANS) {
    recentScans.pop();
  }
}

export function getRecentScans(): RecentScan[] {
  return [...recentScans];
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes
