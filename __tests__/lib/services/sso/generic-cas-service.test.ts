import { GenericCASService } from '@lib/services/sso/generic-cas-service';

/**
 * Unit tests for GenericCASService - Email extraction functionality
 */

// Mock Supabase dependencies before importing service
jest.mock('@lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('GenericCASService - Email extraction', () => {
  let casService: GenericCASService;

  beforeEach(() => {
    const mockConfig = {
      id: 'test-cas',
      name: 'Test CAS',
      baseUrl: 'https://cas.example.com',
      serviceUrl: 'https://app.example.com/api/sso/test-cas/callback',
      version: '2.0' as const,
      timeout: 10000,
      endpoints: {
        login: '/login',
        logout: '/logout',
        validate: '/serviceValidate',
      },
      attributesMapping: {
        employee_id: 'cas:user',
        username: 'cas:username',
        full_name: 'cas:name',
        email: 'cas:mail',
      },
      emailDomain: 'example.com',
    };
    casService = new GenericCASService(mockConfig);
  });

  describe('parseValidationResponse - Email extraction', () => {
    it('should extract valid email from CAS response', () => {
      const xmlResponse = `
        <cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
          <cas:authenticationSuccess>
            <cas:user>testuser</cas:user>
            <cas:attributes>
              <cas:mail>user@example.com</cas:mail>
              <cas:name>Test User</cas:name>
            </cas:attributes>
          </cas:authenticationSuccess>
        </cas:serviceResponse>
      `;

      const result = casService['parseValidationResponse'](xmlResponse);

      expect(result.success).toBe(true);
      expect(result.email).toBe('user@example.com');
      expect(result.employeeNumber).toBe('testuser');
    });

    it('should handle missing email field', () => {
      const xmlResponse = `
        <cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
          <cas:authenticationSuccess>
            <cas:user>testuser</cas:user>
            <cas:attributes>
              <cas:name>Test User</cas:name>
            </cas:attributes>
          </cas:authenticationSuccess>
        </cas:serviceResponse>
      `;

      const result = casService['parseValidationResponse'](xmlResponse);

      expect(result.success).toBe(true);
      expect(result.email).toBe('');
      expect(result.employeeNumber).toBe('testuser');
    });

    it('should trim whitespace from email', () => {
      const xmlResponse = `
        <cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas">
          <cas:authenticationSuccess>
            <cas:user>testuser</cas:user>
            <cas:attributes>
              <cas:mail>  user@example.com  </cas:mail>
              <cas:name>Test User</cas:name>
            </cas:attributes>
          </cas:authenticationSuccess>
        </cas:serviceResponse>
      `;

      const result = casService['parseValidationResponse'](xmlResponse);

      expect(result.success).toBe(true);
      expect(result.email).toBe('user@example.com');
    });
  });

  describe('isValidEmail', () => {
    it('should validate standard email formats', () => {
      expect(casService['isValidEmail']('user@example.com')).toBe(true);
      expect(casService['isValidEmail']('test.user@company.org')).toBe(true);
      expect(casService['isValidEmail']('user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(casService['isValidEmail']('invalid')).toBe(false);
      expect(casService['isValidEmail']('user@')).toBe(false);
      expect(casService['isValidEmail']('@domain.com')).toBe(false);
      expect(casService['isValidEmail']('user@@domain.com')).toBe(false);
      expect(casService['isValidEmail']('')).toBe(false);
      expect(casService['isValidEmail']('   ')).toBe(false);
    });

    it('should handle email with whitespace', () => {
      expect(casService['isValidEmail']('  user@example.com  ')).toBe(true);
    });
  });
});
