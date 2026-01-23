import type {
  Project,
  Profile,
  LarpScore,
  WatchlistItem,
  Alert,
  AlertRule,
} from '@/types/terminal';
import { calculateLarpScore } from './scoring/calculate-score';

// ============================================================================
// MOCK PROJECTS
// ============================================================================

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'trove-xyz',
    name: 'TROVE',
    ticker: 'TROVE',
    chain: 'ethereum',
    contract: '0x1234567890123456789012345678901234567890',
    website: 'https://trove.xyz',
    xHandle: 'trove_xyz',
    verified: false,
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'shadow-protocol',
    name: 'Shadow Protocol',
    ticker: 'SHDW',
    chain: 'solana',
    contract: 'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y',
    website: 'https://shadowprotocol.io',
    xHandle: 'shadowprotocol',
    verified: true,
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2025-01-20'),
  },
  {
    id: 'moonbeam-ai',
    name: 'Moonbeam AI',
    ticker: 'MOON',
    chain: 'base',
    contract: '0xabcdef1234567890abcdef1234567890abcdef12',
    website: 'https://moonbeam.ai',
    xHandle: 'moonbeam_ai',
    verified: false,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-21'),
  },
  {
    id: 'defi-pulse',
    name: 'DeFi Pulse',
    ticker: 'PULSE',
    chain: 'arbitrum',
    contract: '0x9876543210987654321098765432109876543210',
    website: 'https://defipulse.xyz',
    xHandle: 'defipulse_xyz',
    verified: true,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2025-01-18'),
  },
  {
    id: 'quantum-swap',
    name: 'Quantum Swap',
    ticker: 'QSWAP',
    chain: 'solana',
    contract: 'QSWAPyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y',
    website: 'https://quantumswap.finance',
    xHandle: 'quantumswap',
    verified: false,
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-22'),
  },
  {
    id: 'cyber-yield',
    name: 'CyberYield',
    ticker: 'CYBER',
    chain: 'ethereum',
    contract: '0xfedcba0987654321fedcba0987654321fedcba09',
    website: 'https://cyberyield.io',
    xHandle: 'cyber_yield',
    verified: false,
    createdAt: new Date('2025-01-18'),
    updatedAt: new Date('2025-01-22'),
  },
  {
    id: 'alpha-dex',
    name: 'Alpha DEX',
    ticker: 'ADEX',
    chain: 'base',
    contract: '0x1111222233334444555566667777888899990000',
    website: 'https://alphadex.trade',
    xHandle: 'alphadex_trade',
    verified: true,
    createdAt: new Date('2024-08-10'),
    updatedAt: new Date('2025-01-19'),
  },
  {
    id: 'neural-net-token',
    name: 'Neural Net Token',
    ticker: 'NNT',
    chain: 'solana',
    contract: 'NNTyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y',
    website: undefined,
    xHandle: 'neural_net_token',
    verified: false,
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-22'),
  },
  {
    id: 'legit-finance',
    name: 'Legit Finance',
    ticker: 'LEGIT',
    chain: 'ethereum',
    contract: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
    website: 'https://legitfinance.org',
    xHandle: 'legitfinance',
    verified: true,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2025-01-20'),
  },
  {
    id: 'hype-machine',
    name: 'Hype Machine',
    ticker: 'HYPE',
    chain: 'arbitrum',
    contract: '0x5555666677778888999900001111222233334444',
    website: 'https://hypemachine.xyz',
    xHandle: 'hype_machine',
    verified: false,
    createdAt: new Date('2025-01-19'),
    updatedAt: new Date('2025-01-22'),
  },
];

// ============================================================================
// MOCK PROFILES
// ============================================================================

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'trove_xyz',
    xHandle: 'trove_xyz',
    displayName: 'TROVE Protocol',
    bio: 'Building the future of decentralized something. NFA. DYOR.',
    followers: 45000,
    following: 120,
    accountAgeDays: 45,
    verified: false,
    createdAt: new Date('2024-12-01'),
  },
  {
    id: 'shadowprotocol',
    xHandle: 'shadowprotocol',
    displayName: 'Shadow Protocol',
    bio: 'Privacy-first DeFi infrastructure on Solana.',
    followers: 128000,
    following: 890,
    accountAgeDays: 580,
    verified: true,
    createdAt: new Date('2023-06-15'),
  },
  {
    id: 'moonbeam_ai',
    xHandle: 'moonbeam_ai',
    displayName: 'Moonbeam AI',
    bio: 'Revolutionary AI-powered trading. Autonomous. Intelligent. Moon soon.',
    followers: 12000,
    following: 50,
    accountAgeDays: 12,
    verified: false,
    createdAt: new Date('2025-01-10'),
  },
  {
    id: 'defipulse_xyz',
    xHandle: 'defipulse_xyz',
    displayName: 'DeFi Pulse',
    bio: 'Tracking DeFi metrics since 2024. Data-driven insights.',
    followers: 89000,
    following: 1200,
    accountAgeDays: 670,
    verified: true,
    createdAt: new Date('2023-03-20'),
  },
  {
    id: 'cyber_yield',
    xHandle: 'cyber_yield',
    displayName: 'CyberYield Protocol',
    bio: '1000% APY. Trust us bro. Launching soon.',
    followers: 8500,
    following: 15,
    accountAgeDays: 4,
    verified: false,
    createdAt: new Date('2025-01-18'),
  },
];

// ============================================================================
// MOCK SCORES
// ============================================================================

export function getMockScore(projectId: string): LarpScore {
  const scoreConfigs: Record<string, Parameters<typeof calculateLarpScore>[0]> = {
    'trove-xyz': {
      identity: {
        xAccountAge: 45,
        domainAge: 60,
        hasVerifiedLinks: false,
        linksConsistent: false,
        teamAnonymous: true,
      },
      xBehavior: {
        engagementRate: 45,
        burstPattern: true,
        shillClusterSize: 25,
        followerGrowthRate: 80,
      },
      wallet: {
        deployerAge: 30,
        freshWalletFunding: true,
        cexDepositsDetected: true,
        suspiciousFlows: 8,
      },
      liquidity: {
        lpLocked: false,
        holderConcentration: 75,
        topHolderPercent: 35,
      },
    },
    'shadow-protocol': {
      identity: {
        xAccountAge: 580,
        domainAge: 500,
        hasVerifiedLinks: true,
        linksConsistent: true,
        teamAnonymous: false,
        kycVerified: true,
      },
      xBehavior: {
        engagementRate: 8,
        burstPattern: false,
        shillClusterSize: 0,
        followerGrowthRate: 5,
      },
      wallet: {
        deployerAge: 400,
        freshWalletFunding: false,
        cexDepositsDetected: false,
        suspiciousFlows: 0,
      },
      liquidity: {
        lpLocked: true,
        lpLockDuration: 365,
        holderConcentration: 25,
        topHolderPercent: 8,
      },
    },
    'moonbeam-ai': {
      identity: {
        xAccountAge: 12,
        domainAge: 15,
        hasVerifiedLinks: false,
        hasWebsite: true,
        teamAnonymous: true,
      },
      xBehavior: {
        engagementRate: 60,
        burstPattern: true,
        shillClusterSize: 18,
        followerGrowthRate: 150,
        recentActivitySpike: true,
      },
      wallet: {
        deployerAge: 5,
        freshWalletFunding: true,
        suspiciousFlows: 3,
      },
      liquidity: {
        lpLocked: true,
        lpLockDuration: 14,
        holderConcentration: 85,
        topHolderPercent: 45,
      },
    },
    'defi-pulse': {
      identity: {
        xAccountAge: 670,
        domainAge: 600,
        hasVerifiedLinks: true,
        linksConsistent: true,
        teamAnonymous: false,
      },
      xBehavior: {
        engagementRate: 12,
        burstPattern: false,
        shillClusterSize: 2,
        followerGrowthRate: 8,
      },
      wallet: {
        deployerAge: 500,
        freshWalletFunding: false,
        cexDepositsDetected: false,
        suspiciousFlows: 1,
      },
      liquidity: {
        lpLocked: true,
        lpLockDuration: 180,
        holderConcentration: 35,
        topHolderPercent: 12,
      },
    },
    'quantum-swap': {
      identity: {
        xAccountAge: 17,
        domainAge: 20,
        hasVerifiedLinks: false,
        teamAnonymous: true,
      },
      xBehavior: {
        engagementRate: 35,
        burstPattern: true,
        shillClusterSize: 12,
        followerGrowthRate: 60,
      },
      wallet: {
        deployerAge: 10,
        freshWalletFunding: true,
        suspiciousFlows: 4,
        knownRugWalletConnection: true,
      },
      liquidity: {
        lpLocked: true,
        lpLockDuration: 30,
        holderConcentration: 65,
        lpRemovalPercent: 15,
      },
    },
    'cyber-yield': {
      identity: {
        xAccountAge: 4,
        domainAge: 3,
        hasVerifiedLinks: false,
        hasWebsite: true,
        teamAnonymous: true,
      },
      xBehavior: {
        engagementRate: 70,
        burstPattern: true,
        shillClusterSize: 30,
        followerGrowthRate: 200,
        suspiciousRetweeters: 60,
      },
      wallet: {
        deployerAge: 2,
        freshWalletFunding: true,
        cexDepositsDetected: true,
        suspiciousFlows: 12,
        teamWalletActivity: 'critical',
      },
      liquidity: {
        lpLocked: false,
        holderConcentration: 92,
        topHolderPercent: 55,
        liquidityDepth: 'critical',
      },
    },
    'alpha-dex': {
      identity: {
        xAccountAge: 530,
        domainAge: 480,
        hasVerifiedLinks: true,
        linksConsistent: true,
        teamAnonymous: false,
        kycVerified: true,
      },
      xBehavior: {
        engagementRate: 6,
        burstPattern: false,
        shillClusterSize: 0,
        followerGrowthRate: 3,
      },
      wallet: {
        deployerAge: 450,
        freshWalletFunding: false,
        cexDepositsDetected: false,
        suspiciousFlows: 0,
      },
      liquidity: {
        lpLocked: true,
        lpLockDuration: 730,
        holderConcentration: 18,
        topHolderPercent: 5,
      },
    },
    'neural-net-token': {
      identity: {
        xAccountAge: 2,
        hasWebsite: false,
        teamAnonymous: true,
      },
      xBehavior: {
        engagementRate: 55,
        burstPattern: true,
        shillClusterSize: 22,
        followerGrowthRate: 300,
      },
      wallet: {
        deployerAge: 1,
        freshWalletFunding: true,
        suspiciousFlows: 6,
      },
      liquidity: {
        lpLocked: false,
        holderConcentration: 88,
        topHolderPercent: 60,
        liquidityDepth: 'shallow',
      },
    },
    'legit-finance': {
      identity: {
        xAccountAge: 960,
        domainAge: 900,
        hasVerifiedLinks: true,
        linksConsistent: true,
        teamAnonymous: false,
        kycVerified: true,
        hasGithub: true,
      },
      xBehavior: {
        engagementRate: 4,
        burstPattern: false,
        shillClusterSize: 0,
        followerGrowthRate: 2,
      },
      wallet: {
        deployerAge: 800,
        freshWalletFunding: false,
        cexDepositsDetected: false,
        suspiciousFlows: 0,
        teamWalletActivity: 'normal',
      },
      liquidity: {
        lpLocked: true,
        lpLockDuration: 1095,
        holderConcentration: 12,
        topHolderPercent: 3,
      },
    },
    'hype-machine': {
      identity: {
        xAccountAge: 3,
        domainAge: 5,
        hasVerifiedLinks: false,
        teamAnonymous: true,
      },
      xBehavior: {
        engagementRate: 80,
        burstPattern: true,
        shillClusterSize: 35,
        followerGrowthRate: 400,
        suspiciousRetweeters: 75,
        recentActivitySpike: true,
      },
      wallet: {
        deployerAge: 3,
        freshWalletFunding: true,
        cexDepositsDetected: true,
        suspiciousFlows: 15,
        knownRugWalletConnection: true,
        teamWalletActivity: 'critical',
      },
      liquidity: {
        lpLocked: false,
        holderConcentration: 95,
        topHolderPercent: 70,
        liquidityDepth: 'critical',
        recentLPChanges: 8,
      },
    },
  };

  const config = scoreConfigs[projectId];
  if (config) {
    return calculateLarpScore(config);
  }

  // Default score for unknown projects
  return calculateLarpScore({
    identity: { teamAnonymous: true },
    xBehavior: { engagementRate: 20 },
    wallet: { deployerAge: 30 },
    liquidity: { holderConcentration: 50 },
  });
}

// ============================================================================
// MOCK WATCHLIST
// ============================================================================

export const MOCK_WATCHLIST: WatchlistItem[] = [
  {
    projectId: 'trove-xyz',
    project: MOCK_PROJECTS[0],
    score: getMockScore('trove-xyz'),
    addedAt: new Date('2025-01-15'),
    scoreDelta24h: 8,
  },
  {
    projectId: 'moonbeam-ai',
    project: MOCK_PROJECTS[2],
    score: getMockScore('moonbeam-ai'),
    addedAt: new Date('2025-01-20'),
    scoreDelta24h: 15,
  },
  {
    projectId: 'cyber-yield',
    project: MOCK_PROJECTS[5],
    score: getMockScore('cyber-yield'),
    addedAt: new Date('2025-01-21'),
    scoreDelta24h: 22,
  },
];

// ============================================================================
// MOCK ALERTS
// ============================================================================

export const MOCK_ALERT_RULES: AlertRule[] = [
  {
    id: 'rule-1',
    projectId: 'trove-xyz',
    type: 'score_change',
    threshold: 10,
    enabled: true,
    channels: ['email'],
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'rule-2',
    projectId: 'moonbeam-ai',
    type: 'wallet_cex',
    enabled: true,
    channels: ['email', 'telegram'],
    createdAt: new Date('2025-01-20'),
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    ruleId: 'rule-1',
    projectId: 'trove-xyz',
    type: 'score_change',
    payload: {
      before: 72,
      after: 85,
      evidence: getMockScore('trove-xyz').breakdown.wallet.evidence.slice(0, 2),
      timestamp: new Date('2025-01-21T10:30:00'),
    },
    read: false,
    createdAt: new Date('2025-01-21T10:30:00'),
  },
  {
    id: 'alert-2',
    ruleId: 'rule-2',
    projectId: 'cyber-yield',
    type: 'wallet_cex',
    payload: {
      before: null,
      after: { exchange: 'Binance', amount: '50,000 USDC' },
      evidence: getMockScore('cyber-yield').breakdown.wallet.evidence.slice(0, 1),
      timestamp: new Date('2025-01-22T08:15:00'),
    },
    read: false,
    createdAt: new Date('2025-01-22T08:15:00'),
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getProjectById(id: string): Project | undefined {
  return MOCK_PROJECTS.find(p => p.id === id);
}

export function getProfileByHandle(handle: string): Profile | undefined {
  const normalized = handle.toLowerCase().replace('@', '');
  return MOCK_PROFILES.find(p => p.xHandle.toLowerCase() === normalized);
}

export function getProjectByTicker(ticker: string): Project | undefined {
  const normalized = ticker.toUpperCase().replace('$', '');
  return MOCK_PROJECTS.find(p => p.ticker?.toUpperCase() === normalized);
}

export function getProjectByContract(contract: string): Project | undefined {
  return MOCK_PROJECTS.find(p => p.contract?.toLowerCase() === contract.toLowerCase());
}

export function getRiskSpikes(): { project: Project; score: LarpScore; delta: number }[] {
  return MOCK_PROJECTS
    .map(p => ({
      project: p,
      score: getMockScore(p.id),
      delta: Math.floor(Math.random() * 25) - 5,
    }))
    .filter(item => item.delta > 5)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);
}

export function getTrendingRisky(): { project: Project; score: LarpScore }[] {
  return MOCK_PROJECTS
    .map(p => ({
      project: p,
      score: getMockScore(p.id),
    }))
    .filter(item => item.score.score >= 50)
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, 6);
}
