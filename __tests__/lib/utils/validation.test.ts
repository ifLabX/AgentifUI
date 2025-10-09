import { isValidEmail, normalizeEmail } from '@lib/utils/validation';

/**
 * Unit tests for validation utilities
 */

describe('Validation utilities', () => {
  describe('isValidEmail', () => {
    it('should validate standard email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test@domain.org')).toBe(true);
      expect(isValidEmail('contact@company.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@@domain.com')).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
      expect(isValidEmail('   ')).toBe(false);
      expect(isValidEmail('\t\n')).toBe(false);
    });

    it('should validate emails with subdomains', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
      expect(isValidEmail('admin@internal.corp.company.com')).toBe(true);
    });

    it('should validate emails with plus addressing', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('name+filter@domain.org')).toBe(true);
    });

    it('should validate emails with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true);
      expect(isValidEmail('john.doe.smith@company.org')).toBe(true);
    });

    it('should validate emails with numbers and hyphens', () => {
      expect(isValidEmail('user123@example.com')).toBe(true);
      expect(isValidEmail('john-doe@my-company.com')).toBe(true);
    });

    it('should reject emails with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@exam ple.com')).toBe(false);
      expect(isValidEmail('user name@example.com')).toBe(false);
    });

    it('should handle null and undefined gracefully', () => {
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });

    it('should handle non-string inputs', () => {
      expect(isValidEmail(123 as unknown as string)).toBe(false);
      expect(isValidEmail({} as unknown as string)).toBe(false);
      expect(isValidEmail([] as unknown as string)).toBe(false);
    });

    // Edge case tests for enhanced validation
    describe('Edge cases - Enhanced validation', () => {
      it('should reject consecutive dots in local part', () => {
        expect(isValidEmail('user..name@example.com')).toBe(false);
        expect(isValidEmail('test...user@domain.org')).toBe(false);
        expect(isValidEmail('a..b@test.com')).toBe(false);
      });

      it('should reject consecutive dots in domain part', () => {
        expect(isValidEmail('user@example..com')).toBe(false);
        expect(isValidEmail('user@domain...org')).toBe(false);
        expect(isValidEmail('test@mail..example.com')).toBe(false);
      });

      it('should reject local part starting with dot', () => {
        expect(isValidEmail('.user@example.com')).toBe(false);
        expect(isValidEmail('.test@domain.org')).toBe(false);
      });

      it('should reject local part ending with dot', () => {
        expect(isValidEmail('user.@example.com')).toBe(false);
        expect(isValidEmail('test.@domain.org')).toBe(false);
      });

      it('should reject emails exceeding RFC 5321 local part length (64 chars)', () => {
        // 65 character local part
        const longLocalPart = 'a'.repeat(65) + '@example.com';
        expect(isValidEmail(longLocalPart)).toBe(false);

        // Exactly 64 characters should pass
        const maxLocalPart = 'a'.repeat(64) + '@example.com';
        expect(isValidEmail(maxLocalPart)).toBe(true);
      });

      it('should reject emails exceeding RFC 5321 domain part length (255 chars)', () => {
        // Domain with total length > 255 chars (considering RFC 1035 label limits)
        // Create domain with multiple 63-char labels to exceed 255 total
        const label63 = 'a'.repeat(63);
        const longDomain = `user@${label63}.${label63}.${label63}.${label63}.com`; // 63*4 + 4 + 3 = 259 chars
        expect(isValidEmail(longDomain)).toBe(false);

        // Valid long domain within 255 chars
        const validLongDomain = `user@${label63}.${label63}.${label63}.com`; // 63*3 + 3 + 3 = 198 chars
        expect(isValidEmail(validLongDomain)).toBe(true);
      });

      it('should reject multiple consecutive @ symbols', () => {
        expect(isValidEmail('user@@example.com')).toBe(false);
        expect(isValidEmail('test@@@domain.org')).toBe(false);
      });

      it('should accept intranet emails (single-label domains per RFC 5321)', () => {
        // Single-label domains are valid for intranet use
        expect(isValidEmail('user@domain')).toBe(true);
        expect(isValidEmail('admin@localhost')).toBe(true);
        expect(isValidEmail('test@internal')).toBe(true);
        expect(isValidEmail('employee@server')).toBe(true);
      });

      it('should accept .local domains (RFC 6762)', () => {
        // .local is reserved for multicast DNS (mDNS)
        expect(isValidEmail('user@server.local')).toBe(true);
        expect(isValidEmail('admin@mail.local')).toBe(true);
        expect(isValidEmail('test@sso.local')).toBe(true);
      });

      it('should validate edge case valid emails', () => {
        // Special characters in local part
        expect(isValidEmail('user!name@example.com')).toBe(true);
        expect(isValidEmail('test#tag@domain.org')).toBe(true);
        expect(isValidEmail('user$name@example.com')).toBe(true);
        expect(isValidEmail('test%percent@domain.org')).toBe(true);

        // Hyphen in domain
        expect(isValidEmail('user@my-domain.com')).toBe(true);
        expect(isValidEmail('test@example-mail.org')).toBe(true);

        // Multiple subdomains
        expect(isValidEmail('user@mail.internal.company.com')).toBe(true);
      });
    });
  });

  describe('normalizeEmail', () => {
    it('should convert email to lowercase', () => {
      expect(normalizeEmail('User@Example.Com')).toBe('user@example.com');
      expect(normalizeEmail('ADMIN@LOCALHOST')).toBe('admin@localhost');
      expect(normalizeEmail('Test.User@Domain.ORG')).toBe(
        'test.user@domain.org'
      );
    });

    it('should trim and normalize email', () => {
      expect(normalizeEmail('  User@Example.Com  ')).toBe('user@example.com');
      expect(normalizeEmail('\tADMIN@LOCALHOST\n')).toBe('admin@localhost');
    });

    it('should normalize emails with special characters', () => {
      expect(normalizeEmail('Test.User+Tag@Domain.ORG')).toBe(
        'test.user+tag@domain.org'
      );
      expect(normalizeEmail('User!Name#123@Example.COM')).toBe(
        'user!name#123@example.com'
      );
    });

    it('should normalize intranet emails', () => {
      expect(normalizeEmail('ADMIN@LOCALHOST')).toBe('admin@localhost');
      expect(normalizeEmail('User@Internal')).toBe('user@internal');
      expect(normalizeEmail('Test@Server.LOCAL')).toBe('test@server.local');
    });

    it('should return empty string for invalid emails', () => {
      expect(normalizeEmail('invalid')).toBe('');
      expect(normalizeEmail('user@')).toBe('');
      expect(normalizeEmail('@domain.com')).toBe('');
      expect(normalizeEmail('user@@domain.com')).toBe('');
      expect(normalizeEmail('user..name@domain.com')).toBe('');
    });

    it('should return empty string for empty or null inputs', () => {
      expect(normalizeEmail('')).toBe('');
      expect(normalizeEmail('   ')).toBe('');
      expect(normalizeEmail(null as unknown as string)).toBe('');
      expect(normalizeEmail(undefined as unknown as string)).toBe('');
    });

    it('should return empty string for non-string inputs', () => {
      expect(normalizeEmail(123 as unknown as string)).toBe('');
      expect(normalizeEmail({} as unknown as string)).toBe('');
      expect(normalizeEmail([] as unknown as string)).toBe('');
    });

    it('should handle mixed case complex emails', () => {
      expect(normalizeEmail('First.Last+Tag@Mail.Example.COM')).toBe(
        'first.last+tag@mail.example.com'
      );
      expect(normalizeEmail('EMPLOYEE123@Company.Internal.DOMAIN')).toBe(
        'employee123@company.internal.domain'
      );
    });

    it('should preserve valid format while normalizing', () => {
      // Test that normalization doesn't break valid email formats
      const emails = [
        'User@Example.Com',
        'ADMIN@localhost',
        'Test.User+Tag@Domain.ORG',
        'Employee@Company.CO.UK',
      ];

      emails.forEach(email => {
        const normalized = normalizeEmail(email);
        expect(normalized).toBeTruthy();
        expect(normalized).toBe(normalized.toLowerCase());
        expect(isValidEmail(normalized)).toBe(true);
      });
    });

    it('should be idempotent (normalizing twice gives same result)', () => {
      const email = 'User@Example.Com';
      const normalized1 = normalizeEmail(email);
      const normalized2 = normalizeEmail(normalized1);
      expect(normalized1).toBe(normalized2);
      expect(normalized1).toBe('user@example.com');
    });
  });
});
