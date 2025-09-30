import { SSOUserService } from '@lib/services/admin/user/sso-user-service';

/**
 * Unit tests for SSOUserService - Email resolution logic
 */

// Mock Supabase dependencies before importing service
jest.mock('@lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
}));

describe('SSOUserService - Email resolution', () => {
  describe('resolveUserEmail', () => {
    it('should prioritize valid extracted email', () => {
      const result = SSOUserService['resolveUserEmail'](
        'user@sso.com',
        '12345',
        'company.com'
      );

      expect(result).toBe('user@sso.com');
    });

    it('should fall back to constructed email when extracted email is invalid', () => {
      const result = SSOUserService['resolveUserEmail'](
        'invalid-email',
        '12345',
        'company.com'
      );

      expect(result).toBe('12345@company.com');
    });

    it('should handle empty string extracted email', () => {
      const result = SSOUserService['resolveUserEmail'](
        '',
        '12345',
        'company.com'
      );

      expect(result).toBe('12345@company.com');
    });

    it('should handle undefined extracted email', () => {
      const result = SSOUserService['resolveUserEmail'](
        undefined,
        '12345',
        'company.com'
      );

      expect(result).toBe('12345@company.com');
    });

    it('should trim extracted email whitespace', () => {
      const result = SSOUserService['resolveUserEmail'](
        '  user@sso.com  ',
        '12345',
        'company.com'
      );

      expect(result).toBe('user@sso.com');
    });

    it('should construct email with employee number and domain', () => {
      const result = SSOUserService['resolveUserEmail'](
        undefined,
        'emp001',
        'example.org'
      );

      expect(result).toBe('emp001@example.org');
    });

    it('should reject email without @ symbol', () => {
      const result = SSOUserService['resolveUserEmail'](
        'invalidemail',
        '12345',
        'company.com'
      );

      expect(result).toBe('12345@company.com');
    });

    it('should reject email without domain', () => {
      const result = SSOUserService['resolveUserEmail'](
        'user@',
        '12345',
        'company.com'
      );

      expect(result).toBe('12345@company.com');
    });
  });

  describe('isValidEmail', () => {
    it('should validate standard email format', () => {
      expect(SSOUserService['isValidEmail']('user@example.com')).toBe(true);
      expect(SSOUserService['isValidEmail']('test@domain.org')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(SSOUserService['isValidEmail']('invalid')).toBe(false);
      expect(SSOUserService['isValidEmail']('')).toBe(false);
      expect(SSOUserService['isValidEmail']('user@')).toBe(false);
      expect(SSOUserService['isValidEmail']('@domain.com')).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(SSOUserService['isValidEmail']('  user@example.com  ')).toBe(true);
      expect(SSOUserService['isValidEmail']('   ')).toBe(false);
    });

    it('should validate emails with subdomains', () => {
      expect(SSOUserService['isValidEmail']('user@mail.example.com')).toBe(
        true
      );
    });

    it('should validate emails with plus addressing', () => {
      expect(SSOUserService['isValidEmail']('user+tag@example.com')).toBe(true);
    });

    it('should validate emails with dots', () => {
      expect(SSOUserService['isValidEmail']('first.last@example.com')).toBe(
        true
      );
    });
  });
});
