import { calculateIdentityScore } from '@/lib/terminal/scoring/identity';
import { calculateXBehaviorScore } from '@/lib/terminal/scoring/x-behavior';
import { calculateWalletScore } from '@/lib/terminal/scoring/wallet';
import { calculateLiquidityScore } from '@/lib/terminal/scoring/liquidity';
import { calculateLarpScore } from '@/lib/terminal/scoring/calculate-score';

describe('Scoring Modules', () => {
  describe('Identity Module', () => {
    it('should return score between 0-100', () => {
      const result = calculateIdentityScore({
        xAccountAge: 30,
        domainAge: 60,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should have correct module name', () => {
      const result = calculateIdentityScore({});
      expect(result.name).toBe('Team & Identity Risk');
    });

    it('should have correct weight', () => {
      const result = calculateIdentityScore({});
      expect(result.weight).toBe(0.25);
    });

    it('should score high for very new account', () => {
      const result = calculateIdentityScore({ xAccountAge: 5 });
      expect(result.score).toBeGreaterThan(20);
    });

    it('should score low for old account', () => {
      const result = calculateIdentityScore({ xAccountAge: 500 });
      expect(result.score).toBeLessThan(20);
    });

    it('should generate evidence for critical signals', () => {
      const result = calculateIdentityScore({ xAccountAge: 10, domainAge: 5 });
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.evidence.some(e => e.severity === 'critical')).toBe(true);
    });
  });

  describe('X Behavior Module', () => {
    it('should return score between 0-100', () => {
      const result = calculateXBehaviorScore({
        engagementRate: 20,
        burstPattern: false,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should have correct module name', () => {
      const result = calculateXBehaviorScore({});
      expect(result.name).toBe('Narrative Manipulation Risk');
    });

    it('should score high for suspicious engagement', () => {
      const result = calculateXBehaviorScore({
        engagementRate: 70,
        burstPattern: true,
        shillClusterSize: 30,
      });
      expect(result.score).toBeGreaterThan(50);
    });

    it('should score low for normal engagement', () => {
      const result = calculateXBehaviorScore({
        engagementRate: 5,
        burstPattern: false,
        shillClusterSize: 0,
      });
      expect(result.score).toBeLessThan(20);
    });
  });

  describe('Wallet Module', () => {
    it('should return score between 0-100', () => {
      const result = calculateWalletScore({
        deployerAge: 100,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should have correct module name', () => {
      const result = calculateWalletScore({});
      expect(result.name).toBe('Wallet Behavior Risk');
    });

    it('should score high for CEX deposits', () => {
      const result = calculateWalletScore({ cexDepositsDetected: true });
      expect(result.score).toBeGreaterThan(25);
    });

    it('should score high for fresh wallet', () => {
      const result = calculateWalletScore({ deployerAge: 2 });
      expect(result.score).toBeGreaterThan(20);
    });

    it('should score high for known rug connection', () => {
      const result = calculateWalletScore({ knownRugWalletConnection: true });
      expect(result.score).toBeGreaterThan(20);
    });
  });

  describe('Liquidity Module', () => {
    it('should return score between 0-100', () => {
      const result = calculateLiquidityScore({
        lpLocked: true,
        lpLockDuration: 180,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should have correct module name', () => {
      const result = calculateLiquidityScore({});
      expect(result.name).toBe('Token & Liquidity Risk');
    });

    it('should score high for unlocked LP', () => {
      const result = calculateLiquidityScore({ lpLocked: false });
      expect(result.score).toBeGreaterThan(25);
    });

    it('should score high for concentrated holders', () => {
      const result = calculateLiquidityScore({ holderConcentration: 90 });
      expect(result.score).toBeGreaterThan(15);
    });
  });

  describe('Combined Score', () => {
    it('should return score between 0-100', () => {
      const result = calculateLarpScore({
        identity: { xAccountAge: 30 },
        xBehavior: { engagementRate: 20 },
        wallet: { deployerAge: 60 },
        liquidity: { lpLocked: true },
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should calculate risk level correctly', () => {
      const lowRisk = calculateLarpScore({
        identity: { xAccountAge: 500, hasVerifiedLinks: true },
        xBehavior: { engagementRate: 5, shillClusterSize: 0 },
        wallet: { deployerAge: 400, cexDepositsDetected: false },
        liquidity: { lpLocked: true, lpLockDuration: 365 },
      });
      expect(lowRisk.riskLevel).toBe('low');

      const highRisk = calculateLarpScore({
        identity: { xAccountAge: 5, hasWebsite: false },
        xBehavior: { engagementRate: 80, shillClusterSize: 40 },
        wallet: { deployerAge: 2, cexDepositsDetected: true },
        liquidity: { lpLocked: false, holderConcentration: 95 },
      });
      expect(['high', 'critical']).toContain(highRisk.riskLevel);
    });

    it('should generate top tags', () => {
      const result = calculateLarpScore({
        identity: { xAccountAge: 5 },
        xBehavior: { shillClusterSize: 30 },
        wallet: { cexDepositsDetected: true },
        liquidity: { lpLocked: false },
      });
      expect(result.topTags.length).toBeGreaterThan(0);
      expect(result.topTags.length).toBeLessThanOrEqual(6);
    });

    it('should have confidence level', () => {
      const result = calculateLarpScore({
        identity: { xAccountAge: 30, domainAge: 60, hasVerifiedLinks: true },
        xBehavior: { engagementRate: 10, burstPattern: false },
        wallet: { deployerAge: 100 },
        liquidity: { lpLocked: true },
      });
      expect(['low', 'medium', 'high']).toContain(result.confidence);
    });

    it('should have breakdown with all modules', () => {
      const result = calculateLarpScore({});
      expect(result.breakdown).toHaveProperty('identity');
      expect(result.breakdown).toHaveProperty('xBehavior');
      expect(result.breakdown).toHaveProperty('wallet');
      expect(result.breakdown).toHaveProperty('liquidity');
    });

    it('should have lastUpdated timestamp', () => {
      const result = calculateLarpScore({});
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });
  });
});
