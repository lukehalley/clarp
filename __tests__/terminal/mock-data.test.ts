import {
  MOCK_PROJECTS,
  MOCK_PROFILES,
  MOCK_WATCHLIST,
  MOCK_ALERT_RULES,
  MOCK_ALERTS,
  getProjectById,
  getProfileByHandle,
  getProjectByTicker,
  getProjectByContract,
  getMockScore,
  getRiskSpikes,
  getTrendingRisky,
} from '@/lib/terminal/mock-data';

describe('Mock Data', () => {
  describe('Data Structure', () => {
    it('should have at least 10 mock projects', () => {
      expect(MOCK_PROJECTS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have at least 5 mock profiles', () => {
      expect(MOCK_PROFILES.length).toBeGreaterThanOrEqual(5);
    });

    it('should have mock watchlist items', () => {
      expect(MOCK_WATCHLIST.length).toBeGreaterThan(0);
    });

    it('should have mock alert rules', () => {
      expect(MOCK_ALERT_RULES.length).toBeGreaterThan(0);
    });

    it('should have mock alerts', () => {
      expect(MOCK_ALERTS.length).toBeGreaterThan(0);
    });
  });

  describe('Project Data', () => {
    it('projects should have required fields', () => {
      MOCK_PROJECTS.forEach(project => {
        expect(project.id).toBeDefined();
        expect(project.name).toBeDefined();
        expect(project.chain).toBeDefined();
        expect(typeof project.verified).toBe('boolean');
        expect(project.createdAt).toBeInstanceOf(Date);
        expect(project.updatedAt).toBeInstanceOf(Date);
      });
    });

    it('projects should have valid chain values', () => {
      const validChains = ['solana', 'ethereum', 'base', 'arbitrum'];
      MOCK_PROJECTS.forEach(project => {
        expect(validChains).toContain(project.chain);
      });
    });
  });

  describe('Profile Data', () => {
    it('profiles should have required fields', () => {
      MOCK_PROFILES.forEach(profile => {
        expect(profile.id).toBeDefined();
        expect(profile.xHandle).toBeDefined();
        expect(typeof profile.followers).toBe('number');
        expect(typeof profile.following).toBe('number');
        expect(typeof profile.accountAgeDays).toBe('number');
        expect(typeof profile.verified).toBe('boolean');
      });
    });
  });

  describe('Helper Functions', () => {
    it('getProjectById should find existing project', () => {
      const project = getProjectById('trove-xyz');
      expect(project).toBeDefined();
      expect(project?.name).toBe('TROVE');
    });

    it('getProjectById should return undefined for non-existent project', () => {
      const project = getProjectById('non-existent');
      expect(project).toBeUndefined();
    });

    it('getProfileByHandle should find existing profile', () => {
      const profile = getProfileByHandle('trove_xyz');
      expect(profile).toBeDefined();
    });

    it('getProfileByHandle should handle @ prefix', () => {
      const profile = getProfileByHandle('@trove_xyz');
      expect(profile).toBeDefined();
    });

    it('getProjectByTicker should find existing project', () => {
      const project = getProjectByTicker('TROVE');
      expect(project).toBeDefined();
    });

    it('getProjectByTicker should handle $ prefix', () => {
      const project = getProjectByTicker('$TROVE');
      expect(project).toBeDefined();
    });

    it('getProjectByTicker should be case insensitive', () => {
      const project = getProjectByTicker('trove');
      expect(project).toBeDefined();
    });

    it('getProjectByContract should find existing project', () => {
      const project = MOCK_PROJECTS.find(p => p.contract);
      if (project?.contract) {
        const found = getProjectByContract(project.contract);
        expect(found).toBeDefined();
        expect(found?.id).toBe(project.id);
      }
    });
  });

  describe('Scoring', () => {
    it('getMockScore should return valid score for all projects', () => {
      MOCK_PROJECTS.forEach(project => {
        const score = getMockScore(project.id);
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);
        expect(score.breakdown).toBeDefined();
        expect(score.topTags).toBeDefined();
        expect(score.confidence).toBeDefined();
        expect(score.riskLevel).toBeDefined();
      });
    });

    it('getMockScore should return different scores for different projects', () => {
      const scores = MOCK_PROJECTS.map(p => getMockScore(p.id).score);
      const uniqueScores = new Set(scores);
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

    it('getMockScore should return default score for unknown project', () => {
      const score = getMockScore('unknown-project');
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Retrieval Functions', () => {
    it('getRiskSpikes should return projects with score changes', () => {
      const spikes = getRiskSpikes();
      expect(Array.isArray(spikes)).toBe(true);
      spikes.forEach(item => {
        expect(item.project).toBeDefined();
        expect(item.score).toBeDefined();
        expect(typeof item.delta).toBe('number');
      });
    });

    it('getTrendingRisky should return high-risk projects', () => {
      const risky = getTrendingRisky();
      expect(Array.isArray(risky)).toBe(true);
      risky.forEach(item => {
        expect(item.project).toBeDefined();
        expect(item.score).toBeDefined();
        expect(item.score.score).toBeGreaterThanOrEqual(50);
      });
    });
  });
});
