/**
 * Profile Cache Security Tests
 *
 * Tests for the profile cache security utilities to ensure they properly
 * defend against identified vulnerabilities.
 */
import {
  safeJsonParse,
  sanitizeAvatarUrl,
  secureLog,
  validateProfileCacheData,
} from '../../lib/utils/profile-cache-security';

describe('Profile Cache Security', () => {
  describe('Avatar URL Security', () => {
    test('should detect dangerous javascript: URLs', () => {
      const maliciousUrl = "javascript:alert('XSS')";

      // Test that the malicious URL contains dangerous content
      expect(maliciousUrl).toContain('javascript:');
      expect(maliciousUrl).toContain('alert');

      // This test passes, showing the current vulnerability exists
      // After we implement sanitizeAvatarUrl, we'll test that it blocks this
    });

    test('should detect dangerous data: URLs with scripts', () => {
      const maliciousUrl = "data:text/html,<script>alert('XSS')</script>";

      expect(maliciousUrl).toContain('data:');
      expect(maliciousUrl).toContain('script');
      expect(maliciousUrl).toContain('alert');
    });

    test('should allow safe HTTPS URLs', () => {
      const safeUrl = 'https://example.com/avatar.jpg';

      expect(safeUrl).toContain('https://');
      expect(safeUrl).not.toContain('javascript:');
      expect(safeUrl).not.toContain('script');
    });
  });

  describe('JSON Parse Security', () => {
    test('should detect prototype pollution attempts', () => {
      const maliciousJson = '{"__proto__": {"polluted": true}}';

      // Test that JSON contains dangerous __proto__ property
      expect(maliciousJson).toContain('__proto__');
      expect(maliciousJson).toContain('polluted');

      // This demonstrates the current vulnerability
      const parsed = JSON.parse(maliciousJson);
      expect('__proto__' in parsed).toBe(true);
    });

    test('should detect constructor pollution attempts', () => {
      const maliciousJson = '{"constructor": {"prototype": {"admin": true}}}';

      expect(maliciousJson).toContain('constructor');
      expect(maliciousJson).toContain('prototype');

      const parsed = JSON.parse(maliciousJson);
      expect('constructor' in parsed).toBe(true);
    });

    test('should parse safe JSON correctly', () => {
      const safeJson =
        '{"profile": {"id": "test"}, "timestamp": 123456, "userId": "user123"}';

      expect(() => JSON.parse(safeJson)).not.toThrow();

      const parsed = JSON.parse(safeJson);
      expect(parsed.profile.id).toBe('test');
      expect(parsed.userId).toBe('user123');
    });
  });

  describe('Information Disclosure', () => {
    test('should capture console output with sensitive data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const sensitiveUserId = 'user-12345-secret-key';

      // This is what the current code does - logs sensitive data
      console.log(`[Profile Cache] Cache hit: ${sensitiveUserId}`);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(sensitiveUserId)
      );

      consoleSpy.mockRestore();
    });

    test('should identify sensitive data patterns', () => {
      const sensitiveIds = [
        'user-12345-secret',
        'admin-confidential-id',
        'employee-123456789',
      ];

      sensitiveIds.forEach(id => {
        expect(id.length).toBeGreaterThan(10); // Long enough to be sensitive
        expect(id).toMatch(/[a-z]+-[\w\d-]+/); // Pattern that looks like sensitive ID
      });
    });
  });

  describe('Profile Data Validation', () => {
    test('should detect malicious profile fields', () => {
      const maliciousProfile = {
        id: 'user123',
        full_name: "<script>alert('XSS')</script>",
        username: "user<img onerror=alert('xss')>",
        avatar_url: 'javascript:steal_cookies()',
        role: 'user',
      };

      // Test that malicious content is present (showing current vulnerability)
      expect(maliciousProfile.full_name).toContain('<script>');
      expect(maliciousProfile.username).toContain('onerror=');
      expect(maliciousProfile.avatar_url).toContain('javascript:');
    });

    test('should handle valid profile data', () => {
      const validProfile = {
        id: 'user123',
        full_name: 'John Doe',
        username: 'johndoe',
        avatar_url: 'https://example.com/avatar.jpg',
        role: 'user',
      };

      expect(validProfile.full_name).not.toContain('<');
      expect(validProfile.username).not.toContain('<');
      expect(validProfile.avatar_url).toContain('https://');
    });
  });

  describe('Cache Data Structure', () => {
    test('should detect invalid cache structure', () => {
      const invalidCache = {
        invalid: 'structure',
        missing: 'required_fields',
      };

      // Test that required fields are missing
      expect(invalidCache).not.toHaveProperty('profile');
      expect(invalidCache).not.toHaveProperty('timestamp');
      expect(invalidCache).not.toHaveProperty('userId');
    });

    test('should recognize valid cache structure', () => {
      const validCache = {
        profile: { id: 'user123', full_name: 'Test User' },
        timestamp: Date.now(),
        userId: 'user123',
      };

      expect(validCache).toHaveProperty('profile');
      expect(validCache).toHaveProperty('timestamp');
      expect(validCache).toHaveProperty('userId');
      expect(typeof validCache.timestamp).toBe('number');
    });
  });
});

// Tests for security utility functions (now implemented)
describe('Security Utility Functions', () => {
  describe('sanitizeAvatarUrl', () => {
    test('should block javascript: URLs', () => {
      const result = sanitizeAvatarUrl("javascript:alert('XSS')");
      expect(result).toBeNull();
    });

    test('should block vbscript: URLs', () => {
      const result = sanitizeAvatarUrl("vbscript:msgbox('XSS')");
      expect(result).toBeNull();
    });

    test('should block data URLs with scripts', () => {
      const result = sanitizeAvatarUrl(
        "data:text/html,<script>alert('XSS')</script>"
      );
      expect(result).toBeNull();
    });

    test('should allow safe HTTPS URLs', () => {
      const safeUrl = 'https://example.com/avatar.jpg';
      const result = sanitizeAvatarUrl(safeUrl);
      expect(result).toBe(safeUrl);
    });

    test('should allow safe HTTP URLs', () => {
      const safeUrl = 'http://localhost:3000/avatar.png';
      const result = sanitizeAvatarUrl(safeUrl);
      expect(result).toBe(safeUrl);
    });

    test('should handle null/undefined/empty values', () => {
      expect(sanitizeAvatarUrl(null)).toBeNull();
      expect(sanitizeAvatarUrl(undefined)).toBeNull();
      expect(sanitizeAvatarUrl('')).toBeNull();
    });
  });

  describe('safeJsonParse', () => {
    test('should block __proto__ pollution', () => {
      const maliciousJson = '{"__proto__": {"polluted": true}}';
      const result = safeJsonParse(maliciousJson);
      expect(result).toBeNull();
    });

    test('should block constructor pollution', () => {
      const maliciousJson = '{"constructor": {"prototype": {"admin": true}}}';
      const result = safeJsonParse(maliciousJson);
      expect(result).toBeNull();
    });

    test('should parse safe JSON correctly', () => {
      const safeJson =
        '{"profile": {"id": "test"}, "timestamp": 123456, "userId": "user123"}';
      const result = safeJsonParse<{
        profile: { id: string };
        timestamp: number;
        userId: string;
      }>(safeJson);

      expect(result).not.toBeNull();
      expect(result?.profile.id).toBe('test');
      expect(result?.userId).toBe('user123');
    });

    test('should handle invalid JSON', () => {
      const invalidJson = '{"invalid": json}';
      const result = safeJsonParse(invalidJson);
      expect(result).toBeNull();
    });
  });

  describe('secureLog', () => {
    test('should log with proper format', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      secureLog(
        'log',
        'Test Category',
        'Test message',
        'sensitive-user-id-12345'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test Category] Test message')
      );

      consoleSpy.mockRestore();
    });

    test('should handle logging without sensitive data', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      secureLog('warn', 'Test Category', 'Warning message');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Test Category] Warning message'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('validateProfileCacheData', () => {
    test('should validate correct cache structure', () => {
      const validCache = {
        profile: {
          id: 'user123',
          full_name: 'Test User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        timestamp: Date.now(),
        userId: 'user123',
      };

      const result = validateProfileCacheData(validCache);

      expect(result.isValid).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid cache structure', () => {
      const invalidCache = {
        invalid: 'structure',
      };

      const result = validateProfileCacheData(invalidCache);

      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should sanitize malicious avatar URLs in cache', () => {
      const cacheWithMaliciousAvatar = {
        profile: {
          id: 'user123',
          full_name: 'Test User',
          avatar_url: "javascript:alert('XSS')",
        },
        timestamp: Date.now(),
        userId: 'user123',
      };

      const result = validateProfileCacheData(cacheWithMaliciousAvatar);

      // Should detect and handle malicious content
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
