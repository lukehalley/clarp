import {
  resolveEntity,
  isValidSolanaAddress,
  isValidEVMAddress,
  isValidXHandle,
  isValidENS,
  isValidDomain,
  extractXHandle,
  formatEntity,
  getSuggestions,
} from '@/lib/terminal/entity-resolver';

describe('Entity Resolver', () => {
  describe('resolveEntity', () => {
    // Ticker tests
    it('should resolve ticker with $ prefix', () => {
      const result = resolveEntity('$CLARP');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('ticker');
      expect(result?.normalized).toBe('CLARP');
    });

    it('should resolve ticker with # prefix', () => {
      const result = resolveEntity('#SOL');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('ticker');
      expect(result?.normalized).toBe('SOL');
    });

    it('should resolve lowercase ticker', () => {
      const result = resolveEntity('$eth');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('ticker');
      expect(result?.normalized).toBe('ETH');
    });

    // Solana address tests
    it('should resolve Solana address', () => {
      const solanaAddr = 'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y';
      const result = resolveEntity(solanaAddr);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('contract');
      expect(result?.chain).toBe('solana');
    });

    it('should resolve short Solana address (32 chars)', () => {
      const shortAddr = '11111111111111111111111111111111';
      const result = resolveEntity(shortAddr);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('contract');
      expect(result?.chain).toBe('solana');
    });

    // EVM address tests
    it('should resolve EVM address', () => {
      const evmAddr = '0x1234567890123456789012345678901234567890';
      const result = resolveEntity(evmAddr);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('contract');
      expect(result?.chain).toBe('ethereum');
    });

    it('should normalize EVM address to lowercase', () => {
      const evmAddr = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      const result = resolveEntity(evmAddr);
      expect(result?.normalized).toBe(evmAddr.toLowerCase());
    });

    // X handle tests
    it('should resolve X handle with @ prefix', () => {
      const result = resolveEntity('@CLARPAgent');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('x_handle');
      expect(result?.normalized).toBe('clarpagent');
    });

    it('should resolve X URL', () => {
      const result = resolveEntity('https://x.com/elonmusk');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('x_handle');
      expect(result?.normalized).toBe('elonmusk');
    });

    it('should resolve Twitter URL', () => {
      const result = resolveEntity('twitter.com/vitalikbuterin');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('x_handle');
      expect(result?.normalized).toBe('vitalikbuterin');
    });

    // ENS tests
    it('should resolve ENS name', () => {
      const result = resolveEntity('vitalik.eth');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('ens');
      expect(result?.chain).toBe('ethereum');
    });

    it('should normalize ENS to lowercase', () => {
      const result = resolveEntity('Vitalik.ETH');
      expect(result?.normalized).toBe('vitalik.eth');
    });

    // Domain tests
    it('should resolve domain', () => {
      const result = resolveEntity('example.com');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('domain');
    });

    it('should resolve subdomain', () => {
      const result = resolveEntity('app.uniswap.org');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('domain');
    });

    // Edge cases
    it('should return null for empty string', () => {
      const result = resolveEntity('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace only', () => {
      const result = resolveEntity('   ');
      expect(result).toBeNull();
    });

    it('should treat ambiguous strings as x_handle (without $ prefix)', () => {
      // Ambiguous strings without $ prefix are treated as X handles first
      // Users should use $CLARP for tickers
      const result = resolveEntity('ClArP');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('x_handle');
      expect(result?.normalized).toBe('clarp');
    });
  });

  describe('Validation functions', () => {
    it('isValidSolanaAddress should validate correct addresses', () => {
      expect(isValidSolanaAddress('SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y')).toBe(true);
      expect(isValidSolanaAddress('0xinvalid')).toBe(false);
    });

    it('isValidEVMAddress should validate correct addresses', () => {
      expect(isValidEVMAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidEVMAddress('0x123')).toBe(false);
    });

    it('isValidXHandle should validate correct handles', () => {
      expect(isValidXHandle('@vitalik')).toBe(true);
      expect(isValidXHandle('elonmusk')).toBe(true);
      expect(isValidXHandle('this_handle_is_way_too_long')).toBe(false);
    });

    it('isValidENS should validate correct names', () => {
      expect(isValidENS('vitalik.eth')).toBe(true);
      expect(isValidENS('test.com')).toBe(false);
    });

    it('isValidDomain should validate correct domains', () => {
      expect(isValidDomain('example.com')).toBe(true);
      expect(isValidDomain('nodot')).toBe(false);
    });
  });

  describe('extractXHandle', () => {
    it('should extract handle from URL', () => {
      expect(extractXHandle('https://x.com/user')).toBe('user');
    });

    it('should extract handle from @ format', () => {
      expect(extractXHandle('@user')).toBe('user');
    });

    it('should handle plain handle', () => {
      expect(extractXHandle('user')).toBe('user');
    });

    it('should return null for invalid input', () => {
      expect(extractXHandle('not a handle at all with spaces')).toBeNull();
    });
  });

  describe('formatEntity', () => {
    it('should format ticker with $', () => {
      const entity = { type: 'ticker' as const, value: 'ETH', normalized: 'ETH' };
      expect(formatEntity(entity)).toBe('$ETH');
    });

    it('should format handle with @', () => {
      const entity = { type: 'x_handle' as const, value: 'user', normalized: 'user' };
      expect(formatEntity(entity)).toBe('@user');
    });

    it('should truncate contract', () => {
      const entity = {
        type: 'contract' as const,
        value: '0x1234567890123456789012345678901234567890',
        normalized: '0x1234567890123456789012345678901234567890',
      };
      expect(formatEntity(entity)).toBe('0x1234...7890');
    });
  });

  describe('getSuggestions', () => {
    it('should suggest ticker format', () => {
      const suggestions = getSuggestions('ETH');
      expect(suggestions).toContain('$ETH');
    });

    it('should suggest handle format', () => {
      const suggestions = getSuggestions('user');
      expect(suggestions).toContain('@user');
    });

    it('should return empty for empty query', () => {
      expect(getSuggestions('')).toHaveLength(0);
    });
  });
});
