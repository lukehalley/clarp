import type { ModuleScore, Evidence, EvidenceType, EvidenceSeverity } from '@/types/terminal';

interface IdentityData {
  xAccountAge?: number; // days
  domainAge?: number; // days
  hasVerifiedLinks?: boolean;
  linksConsistent?: boolean;
  hasWebsite?: boolean;
  hasGithub?: boolean;
  teamAnonymous?: boolean;
  kycVerified?: boolean;
}

const MODULE_WEIGHT = 0.25;

/**
 * Team & Identity Risk Module
 * Analyzes account age, domain age, verified links, and consistency
 */
export function calculateIdentityScore(data: IdentityData): ModuleScore {
  const evidence: Evidence[] = [];
  let score = 0;

  // Account age scoring (0-30 points)
  if (data.xAccountAge !== undefined) {
    if (data.xAccountAge < 30) {
      score += 30;
      evidence.push(createEvidence(
        'account_age',
        'critical',
        `X account is only ${data.xAccountAge} days old - high risk indicator`,
        `https://x.com/account`
      ));
    } else if (data.xAccountAge < 90) {
      score += 20;
      evidence.push(createEvidence(
        'account_age',
        'warning',
        `X account is ${data.xAccountAge} days old - relatively new`,
        `https://x.com/account`
      ));
    } else if (data.xAccountAge < 180) {
      score += 10;
      evidence.push(createEvidence(
        'account_age',
        'info',
        `X account is ${data.xAccountAge} days old`,
        `https://x.com/account`
      ));
    }
  }

  // Domain age scoring (0-25 points)
  if (data.domainAge !== undefined) {
    if (data.domainAge < 30) {
      score += 25;
      evidence.push(createEvidence(
        'domain_age',
        'critical',
        `Domain registered only ${data.domainAge} days ago - typical rug pattern`,
        `https://whois.domaintools.com/`
      ));
    } else if (data.domainAge < 90) {
      score += 15;
      evidence.push(createEvidence(
        'domain_age',
        'warning',
        `Domain is ${data.domainAge} days old - recently registered`,
        `https://whois.domaintools.com/`
      ));
    } else if (data.domainAge < 365) {
      score += 5;
      evidence.push(createEvidence(
        'domain_age',
        'info',
        `Domain is ${data.domainAge} days old`,
        `https://whois.domaintools.com/`
      ));
    }
  } else if (data.hasWebsite === false) {
    score += 20;
    evidence.push(createEvidence(
      'domain_age',
      'warning',
      'No website found - project lacks online presence',
      ''
    ));
  }

  // Verified links scoring (0-20 points)
  if (data.hasVerifiedLinks === false) {
    score += 20;
    evidence.push(createEvidence(
      'verified_links',
      'warning',
      'No verified links between social accounts and website',
      ''
    ));
  } else if (data.hasVerifiedLinks === true) {
    evidence.push(createEvidence(
      'verified_links',
      'info',
      'Verified links found between social accounts',
      ''
    ));
  }

  // Consistency scoring (0-15 points)
  if (data.linksConsistent === false) {
    score += 15;
    evidence.push(createEvidence(
      'consistency',
      'warning',
      'Inconsistent information found across sources',
      ''
    ));
  }

  // Team anonymity (0-10 points)
  if (data.teamAnonymous === true && data.kycVerified !== true) {
    score += 10;
    evidence.push(createEvidence(
      'consistency',
      'info',
      'Team is anonymous with no KYC verification',
      ''
    ));
  }

  return {
    name: 'Team & Identity Risk',
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
