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

  describe('extractStringAttribute - Type-safe extraction', () => {
    let testAttributes: Record<string, unknown>;

    beforeEach(() => {
      testAttributes = {};
    });

    it('should extract string values directly', () => {
      testAttributes['cas:user'] = 'john_doe';

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:user'
      );

      expect(result).toBe('john_doe');
    });

    it('should trim whitespace from string values', () => {
      testAttributes['cas:name'] = '  John Doe  ';

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:name'
      );

      expect(result).toBe('John Doe');
    });

    it('should extract first element from array', () => {
      // Simulating multiple <cas:mail> tags in XML
      testAttributes['cas:mail'] = [
        'primary@example.com',
        'secondary@example.com',
        'tertiary@example.com',
      ];

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:mail'
      );

      expect(result).toBe('primary@example.com');
    });

    it('should skip empty strings in array and use first non-empty', () => {
      testAttributes['cas:mail'] = ['', '  ', 'valid@example.com'];

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:mail'
      );

      expect(result).toBe('valid@example.com');
    });

    it('should return empty string for array with no valid strings', () => {
      testAttributes['cas:mail'] = ['', '  ', null, undefined, 123];

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:mail'
      );

      expect(result).toBe('');
    });

    it('should convert number to string', () => {
      testAttributes['cas:employeeNumber'] = 12345;

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:employeeNumber'
      );

      expect(result).toBe('12345');
    });

    it('should convert boolean to string', () => {
      testAttributes['cas:active'] = true;

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:active'
      );

      expect(result).toBe('true');
    });

    it('should extract id property from object', () => {
      testAttributes['cas:employee'] = {
        id: '12345',
        department: 'IT',
        location: 'Building A',
      };

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:employee'
      );

      expect(result).toBe('12345');
    });

    it('should extract value property from object if id not found', () => {
      testAttributes['cas:customField'] = {
        value: 'custom_value',
        type: 'string',
      };

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:customField'
      );

      expect(result).toBe('custom_value');
    });

    it('should extract text property from object as fallback', () => {
      testAttributes['cas:description'] = {
        text: 'Description text',
        lang: 'en',
      };

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:description'
      );

      expect(result).toBe('Description text');
    });

    it('should extract #text property from object (XML parser format)', () => {
      testAttributes['cas:note'] = {
        '#text': 'Note content',
        '@_type': 'important',
      };

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:note'
      );

      expect(result).toBe('Note content');
    });

    it('should return empty string for object without extractable properties', () => {
      testAttributes['cas:complex'] = {
        foo: 123,
        bar: true,
        baz: { nested: 'value' },
      };

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:complex'
      );

      expect(result).toBe('');
    });

    it('should return empty string for null value', () => {
      testAttributes['cas:optional'] = null;

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:optional'
      );

      expect(result).toBe('');
    });

    it('should return empty string for undefined value', () => {
      testAttributes['cas:optional'] = undefined;

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:optional'
      );

      expect(result).toBe('');
    });

    it('should return empty string for missing attribute', () => {
      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:nonexistent'
      );

      expect(result).toBe('');
    });

    it('should handle field name without cas: prefix', () => {
      testAttributes['cas:user'] = 'john_doe';

      // Should automatically add cas: prefix
      const result = casService['extractStringAttribute'](
        testAttributes,
        'user'
      );

      expect(result).toBe('john_doe');
    });

    it('should handle complex real-world scenario: multiple emails', () => {
      // Simulating enterprise AD with multiple email addresses
      testAttributes['cas:mail'] = [
        'john.doe@company.com',
        'j.doe@company.com',
        'john@company.com',
      ];

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:mail'
      );

      // Should take first email
      expect(result).toBe('john.doe@company.com');
    });

    it('should handle complex real-world scenario: structured employee data', () => {
      // Simulating CAS 3.0 with structured user object
      testAttributes['cas:employee'] = {
        id: '12345',
        firstName: 'John',
        lastName: 'Doe',
        department: 'Engineering',
        title: 'Senior Developer',
      };

      const result = casService['extractStringAttribute'](
        testAttributes,
        'cas:employee'
      );

      // Should extract id property
      expect(result).toBe('12345');
    });
  });
});
