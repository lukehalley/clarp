import type { ModuleScore, Evidence, EvidenceType, EvidenceSeverity } from '@/types/terminal';

interface WalletData {
  deployerAge?: number; // days since first activity
  freshWalletFunding?: boolean; // funded from fresh wallets
  cexDepositsDetected?: boolean; // team wallets depositing to CEX
  suspiciousFlows?: number; // number of suspicious transaction patterns
  knownRugWalletConnection?: boolean; // connected to known rug wallets
  largeHolderMovements?: boolean; // large holders moving tokens
  teamWalletActivity?: 'normal' | 'suspicious' | 'critical';
}

const MODULE_WEIGHT = 0.25;

/**
 * Wallet Behavior Risk Module
 * Analyzes fresh wallet funding, suspicious flows, CEX deposits
 */
export function calculateWalletScore(data: WalletData): ModuleScore {
  const evidence: Evidence[] = [];
  let score = 0;

  // Fresh wallet scoring (0-25 points)
  if (data.deployerAge !== undefined && data.deployerAge < 7) {
    score += 25;
    evidence.push(createEvidence(
      'fresh_wallet',
      'critical',
      `Deployer wallet is only ${data.deployerAge} days old - typical rug setup`,
      'https://solscan.io/'
    ));
  } else if (data.deployerAge !== undefined && data.deployerAge < 30) {
    score += 15;
    evidence.push(createEvidence(
      'fresh_wallet',
      'warning',
      `Deployer wallet is ${data.deployerAge} days old - relatively new`,
      'https://solscan.io/'
    ));
  }

  // Fresh wallet funding pattern (0-20 points)
  if (data.freshWalletFunding === true) {
    score += 20;
    evidence.push(createEvidence(
      'fresh_wallet',
      'warning',
      'Project funded from fresh/new wallets - possible money laundering',
      'https://solscan.io/'
    ));
  }

  // CEX deposits (0-30 points)
  if (data.cexDepositsDetected === true) {
    score += 30;
    evidence.push(createEvidence(
      'cex_deposit',
      'critical',
      'Team wallets detected depositing to centralized exchanges - potential exit',
      'https://solscan.io/'
    ));
  }

  // Suspicious flows (0-15 points)
  if (data.suspiciousFlows !== undefined && data.suspiciousFlows > 5) {
    score += 15;
    evidence.push(createEvidence(
      'suspicious_flow',
      'warning',
      `${data.suspiciousFlows} suspicious transaction patterns detected`,
      'https://solscan.io/'
    ));
  } else if (data.suspiciousFlows !== undefined && data.suspiciousFlows > 0) {
    score += 8;
    evidence.push(createEvidence(
      'suspicious_flow',
      'info',
      `${data.suspiciousFlows} unusual transaction pattern(s) detected`,
      'https://solscan.io/'
    ));
  }

  // Known rug wallet connection (0-25 points)
  if (data.knownRugWalletConnection === true) {
    score += 25;
    evidence.push(createEvidence(
      'suspicious_flow',
      'critical',
      'Wallet connected to known rug/scam wallets - high risk',
      'https://solscan.io/'
    ));
  }

  // Large holder movements (0-10 points)
  if (data.largeHolderMovements === true) {
    score += 10;
    evidence.push(createEvidence(
      'suspicious_flow',
      'warning',
      'Large token holders making significant movements',
      'https://solscan.io/'
    ));
  }

  // Team wallet activity (0-15 points)
  if (data.teamWalletActivity === 'critical') {
    score += 15;
    evidence.push(createEvidence(
      'suspicious_flow',
      'critical',
      'Critical activity detected in team wallets',
      'https://solscan.io/'
    ));
  } else if (data.teamWalletActivity === 'suspicious') {
    score += 8;
    evidence.push(createEvidence(
      'suspicious_flow',
      'warning',
      'Suspicious activity detected in team wallets',
      'https://solscan.io/'
    ));
  }

  return {
    name: 'Wallet Behavior Risk',
    score: Math.min(100, score),
    weight: MODULE_WEIGHT,
    evidence,
  };
}

function createEvidence(
  type: EvidenceType,
  severity: EvidenceSeverity,
  summary: string,
  url: string
): Evidence {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    severity,
    timestamp: new Date(),
    url,
    summary,
  };
}
