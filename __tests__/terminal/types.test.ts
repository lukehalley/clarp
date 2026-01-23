import {
  getRiskLevel,
  getScoreColor,
  getScoreLabel,
  getRiskLevelColor,
  getConfidenceLabel,
  getSeverityColor,
  CHAIN_INFO,
  EVIDENCE_TYPE_LABELS,
  ALERT_RULE_TYPE_LABELS,
  ALERT_CHANNEL_LABELS,
  ENTITY_TYPE_LABELS,
} from '@/types/terminal';

describe('Type Utilities', () => {
  describe('getRiskLevel', () => {
    it('should return critical for score >= 70', () => {
      expect(getRiskLevel(70)).toBe('critical');
      expect(getRiskLevel(85)).toBe('critical');
      expect(getRiskLevel(100)).toBe('critical');
    });

    it('should return high for score 50-69', () => {
      expect(getRiskLevel(50)).toBe('high');
      expect(getRiskLevel(60)).toBe('high');
      expect(getRiskLevel(69)).toBe('high');
    });

    it('should return medium for score 30-49', () => {
      expect(getRiskLevel(30)).toBe('medium');
      expect(getRiskLevel(40)).toBe('medium');
      expect(getRiskLevel(49)).toBe('medium');
    });

    it('should return low for score < 30', () => {
      expect(getRiskLevel(0)).toBe('low');
      expect(getRiskLevel(15)).toBe('low');
      expect(getRiskLevel(29)).toBe('low');
    });
  });

  describe('getScoreColor', () => {
    it('should return dark red for score >= 90', () => {
      expect(getScoreColor(90)).toBe('#7f1d1d');
      expect(getScoreColor(100)).toBe('#7f1d1d');
    });

    it('should return red for score 70-89', () => {
      expect(getScoreColor(70)).toBe('#dc2626');
      expect(getScoreColor(85)).toBe('#dc2626');
    });

    it('should return orange for score 50-69', () => {
      expect(getScoreColor(50)).toBe('#f97316');
      expect(getScoreColor(65)).toBe('#f97316');
    });

    it('should return yellow for score 30-49', () => {
      expect(getScoreColor(30)).toBe('#eab308');
      expect(getScoreColor(45)).toBe('#eab308');
    });

    it('should return green for score < 30', () => {
      expect(getScoreColor(0)).toBe('#22c55e');
      expect(getScoreColor(25)).toBe('#22c55e');
    });
  });

  describe('getScoreLabel', () => {
    it('should return correct labels for score ranges', () => {
      expect(getScoreLabel(95)).toBe('Confirmed LARP');
      expect(getScoreLabel(75)).toBe('Highly Suspicious');
      expect(getScoreLabel(55)).toBe('Yellow Flags');
      expect(getScoreLabel(35)).toBe('Probably Fine');
      expect(getScoreLabel(15)).toBe('Appears Legitimate');
    });
  });

  describe('getRiskLevelColor', () => {
    it('should return correct colors for risk levels', () => {
      expect(getRiskLevelColor('critical')).toBe('#dc2626');
      expect(getRiskLevelColor('high')).toBe('#f97316');
      expect(getRiskLevelColor('medium')).toBe('#eab308');
      expect(getRiskLevelColor('low')).toBe('#22c55e');
    });
  });

  describe('getConfidenceLabel', () => {
    it('should return correct labels for confidence levels', () => {
      expect(getConfidenceLabel('high')).toBe('High Confidence');
      expect(getConfidenceLabel('medium')).toBe('Medium Confidence');
      expect(getConfidenceLabel('low')).toBe('Low Confidence');
    });
  });

  describe('getSeverityColor', () => {
    it('should return correct colors for severity levels', () => {
      expect(getSeverityColor('critical')).toBe('#dc2626');
      expect(getSeverityColor('warning')).toBe('#f97316');
      expect(getSeverityColor('info')).toBe('#6b7280');
    });
  });

  describe('Constants', () => {
    it('CHAIN_INFO should have all chains', () => {
      expect(CHAIN_INFO).toHaveProperty('solana');
      expect(CHAIN_INFO).toHaveProperty('ethereum');
      expect(CHAIN_INFO).toHaveProperty('base');
      expect(CHAIN_INFO).toHaveProperty('arbitrum');
    });

    it('CHAIN_INFO entries should have required properties', () => {
      Object.values(CHAIN_INFO).forEach(info => {
        expect(info.name).toBeDefined();
        expect(info.shortName).toBeDefined();
        expect(info.color).toBeDefined();
      });
    });

    it('EVIDENCE_TYPE_LABELS should have all evidence types', () => {
      const expectedTypes = [
        'account_age', 'domain_age', 'verified_links', 'consistency',
        'engagement_anomaly', 'burst_pattern', 'shill_cluster', 'follower_spike',
        'fresh_wallet', 'suspicious_flow', 'cex_deposit',
        'lp_change', 'holder_concentration', 'unlock_schedule',
        'link_change', 'bio_change'
      ];
      expectedTypes.forEach(type => {
        expect(EVIDENCE_TYPE_LABELS).toHaveProperty(type);
      });
    });

    it('ALERT_RULE_TYPE_LABELS should have all rule types', () => {
      const expectedTypes = [
        'score_change', 'wallet_cex', 'lp_change',
        'shill_cluster', 'engagement_spike', 'link_change'
      ];
      expectedTypes.forEach(type => {
        expect(ALERT_RULE_TYPE_LABELS).toHaveProperty(type);
      });
    });

    it('ALERT_CHANNEL_LABELS should have all channels', () => {
      expect(ALERT_CHANNEL_LABELS).toHaveProperty('email');
      expect(ALERT_CHANNEL_LABELS).toHaveProperty('telegram');
      expect(ALERT_CHANNEL_LABELS).toHaveProperty('webhook');
    });

    it('ENTITY_TYPE_LABELS should have all entity types', () => {
      const expectedTypes = ['ticker', 'contract', 'x_handle', 'domain', 'ens'];
      expectedTypes.forEach(type => {
        expect(ENTITY_TYPE_LABELS).toHaveProperty(type);
      });
    });
  });
});
