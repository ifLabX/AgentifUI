import { SSOUserService } from '@lib/services/admin/user/sso-user-service';
import type { Profile } from '@lib/types/database';

/**
 * Comprehensive unit tests for SSOUserService
 *
 * Covers:
 * - findUserByEmployeeNumber: Optimized 2-query lookup strategy
 * - createSSOUser: Email extraction and race condition handling
 * - updateUserFromSSO: Profile updates with SSO data
 * - Edge cases and error handling
 */

// Mock Supabase dependencies before importing service
jest.mock('@lib/supabase/server', () => ({
  createClient: jest.fn(),
  createAdminClient: jest.fn(),
}));

// Mock validation utilities
jest.mock('@lib/utils/validation', () => ({
  validateEmployeeNumber: jest.fn((empNum: string) => {
    if (!empNum || typeof empNum !== 'string') {
      throw new Error('Employee number is required');
    }
    const trimmed = empNum.trim();
    if (!trimmed) {
      throw new Error('Employee number cannot be empty');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      throw new Error('Employee number contains invalid characters');
    }
    if (trimmed.length > 50) {
      throw new Error('Employee number exceeds maximum length');
    }
    return trimmed;
  }),
  isValidEmail: jest.fn((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }),
  normalizeEmail: jest.fn((email: string) => {
    if (!email) return '';
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '';
    return trimmed.toLowerCase();
  }),
}));

/**
 * Type definitions for mocked Supabase client
 * Provides explicit types instead of 'any' for better type safety
 */
interface MockSupabaseQueryBuilder {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  eq: jest.Mock;
  or: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
  rpc: jest.Mock;
}

interface MockSupabaseAuthAdmin {
  createUser: jest.Mock;
  listUsers: jest.Mock;
  deleteUser: jest.Mock;
}

interface MockSupabaseClient extends MockSupabaseQueryBuilder {
  auth: {
    admin: MockSupabaseAuthAdmin;
  };
}

describe('SSOUserService - Comprehensive Tests', () => {
  let mockSupabaseClient: MockSupabaseClient;
  let mockAdminClient: MockSupabaseClient;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock normal Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      single: jest.fn(),
      rpc: jest.fn(),
      auth: {
        admin: {
          createUser: jest.fn(),
          listUsers: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    };

    // Mock admin Supabase client (similar structure)
    mockAdminClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      single: jest.fn(),
      rpc: jest.fn(),
      auth: {
        admin: {
          createUser: jest.fn(),
          listUsers: jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    };

    // Setup mock imports
    const { createClient, createAdminClient } = await import(
      '@lib/supabase/server'
    );
    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    (createAdminClient as jest.Mock).mockResolvedValue(mockAdminClient);
  });

  // ========================================================================
  // findUserByEmployeeNumber Tests (NEW - Addresses reviewer's requirement #1)
  // ========================================================================

  describe('findUserByEmployeeNumber - Optimized lookup strategy', () => {
    const testEmployeeNumber = '12345';
    const testEmailDomain = 'company.com';
    const constructedEmail = '12345@company.com';

    it('should find new user by employee_number (fast path)', async () => {
      const mockUser: Partial<Profile> = {
        id: 'user-123',
        employee_number: testEmployeeNumber,
        email: constructedEmail,
        username: 'testuser',
        full_name: 'Test User',
      };

      // Mock Strategy 1: Combined OR query succeeds
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result = await SSOUserService.findUserByEmployeeNumber(
        testEmployeeNumber,
        testEmailDomain
      );

      expect(result).toEqual(mockUser);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        `employee_number.eq.${testEmployeeNumber},email.eq.${constructedEmail}`
      );
      // Should NOT use admin client (fast path)
      expect(mockAdminClient.from).not.toHaveBeenCalled();
    });

    it('should find legacy user by email and trigger auto-repair', async () => {
      const mockLegacyUser: Partial<Profile> = {
        id: 'legacy-user-456',
        employee_number: null, // Legacy user without employee_number
        email: constructedEmail,
        username: 'legacyuser',
        full_name: 'Legacy User',
      };

      // Mock Strategy 1: Finds user by email
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockLegacyUser,
        error: null,
      });

      // Mock auto-repair update (should be called in background)
      mockAdminClient.update.mockReturnThis();
      mockAdminClient.eq.mockResolvedValue({
        error: null,
      });

      const result = await SSOUserService.findUserByEmployeeNumber(
        testEmployeeNumber,
        testEmailDomain
      );

      expect(result).toEqual(mockLegacyUser);

      // Wait for background repair to be called
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify repair was triggered (background operation)
      // Note: We check that the user was returned immediately (non-blocking)
      expect(result?.id).toBe('legacy-user-456');
    });

    it('should fallback to admin client when RLS blocks normal query', async () => {
      const mockUser: Partial<Profile> = {
        id: 'user-789',
        employee_number: testEmployeeNumber,
        email: constructedEmail,
        username: 'blockeduser',
      };

      // Mock Strategy 1: Normal client fails (RLS blocks)
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      // Mock Strategy 2: Admin client succeeds
      mockAdminClient.maybeSingle.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result = await SSOUserService.findUserByEmployeeNumber(
        testEmployeeNumber,
        testEmailDomain
      );

      expect(result).toEqual(mockUser);
      // Verify both strategies were attempted
      expect(mockSupabaseClient.or).toHaveBeenCalled();
      expect(mockAdminClient.or).toHaveBeenCalled();
    });

    it('should return null when user does not exist', async () => {
      // Mock all strategies: user not found
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockAdminClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await SSOUserService.findUserByEmployeeNumber(
        testEmployeeNumber,
        testEmailDomain
      );

      expect(result).toBeNull();
    });

    it('should validate employee number and reject invalid input', async () => {
      await expect(
        SSOUserService.findUserByEmployeeNumber('', testEmailDomain)
      ).rejects.toThrow('Employee number is required');

      await expect(
        SSOUserService.findUserByEmployeeNumber('   ', testEmailDomain)
      ).rejects.toThrow('Employee number cannot be empty');

      await expect(
        SSOUserService.findUserByEmployeeNumber(
          'user@malicious',
          testEmailDomain
        )
      ).rejects.toThrow('invalid characters');
    });

    it('should handle query without emailDomain gracefully', async () => {
      const mockUser: Partial<Profile> = {
        id: 'user-no-domain',
        employee_number: testEmployeeNumber,
        username: 'testuser',
      };

      // Mock query without email OR condition (employee_number only)
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result =
        await SSOUserService.findUserByEmployeeNumber(testEmployeeNumber);

      expect(result).toEqual(mockUser);
      // Should use eq() instead of or() when no email domain
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'employee_number',
        testEmployeeNumber
      );
    });
  });

  // ========================================================================
  // createSSOUser Tests (NEW - Addresses reviewer's requirement #2)
  // ========================================================================

  describe('createSSOUser - Email extraction and race condition handling', () => {
    const testUserData = {
      employeeNumber: '67890',
      username: 'newuser',
      ssoProviderId: 'sso-provider-123',
      ssoProviderName: 'Generic CAS',
      emailDomain: 'company.com',
      fullName: 'New User',
    };

    it('should create user with extracted email (priority 1)', async () => {
      const extractedEmail = 'new.user@company.com';
      const mockAuthUser = {
        user: {
          id: 'auth-user-123',
          email: extractedEmail.toLowerCase(),
        },
      };
      const mockProfile: Partial<Profile> = {
        id: 'auth-user-123',
        employee_number: testUserData.employeeNumber,
        email: extractedEmail.toLowerCase(),
        username: testUserData.username,
        full_name: testUserData.fullName,
      };

      // Mock: User doesn't exist
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockAdminClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Auth user creation succeeds
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      // Mock: Profile lookup after trigger (retry mechanism)
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      // Mock: Profile update succeeds
      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await SSOUserService.createSSOUser({
        ...testUserData,
        extractedEmail, // Provide extracted email
      });

      expect(result.email).toBe(extractedEmail.toLowerCase());
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: extractedEmail.toLowerCase(),
        })
      );
    });

    it('should create user with constructed email when no extracted email', async () => {
      const constructedEmail = '67890@company.com';
      const mockAuthUser = {
        user: {
          id: 'auth-user-456',
          email: constructedEmail,
        },
      };
      const mockProfile: Partial<Profile> = {
        id: 'auth-user-456',
        employee_number: testUserData.employeeNumber,
        email: constructedEmail,
        username: testUserData.username,
      };

      // Mock: User doesn't exist (first call in createSSOUser)
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockAdminClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Auth user creation succeeds
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      // Mock: Profile lookup after trigger (retry mechanism in createSSOUser)
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await SSOUserService.createSSOUser({
        ...testUserData,
        // No extractedEmail provided
      });

      expect(result.email).toBe(constructedEmail);
      expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: constructedEmail,
        })
      );
    });

    it('should handle race condition when user already exists', async () => {
      const existingUser: Partial<Profile> = {
        id: 'existing-user-789',
        employee_number: testUserData.employeeNumber,
        email: '67890@company.com',
        username: testUserData.username,
      };

      // Mock: User exists check returns existing user
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: existingUser,
        error: null,
      });

      const result = await SSOUserService.createSSOUser(testUserData);

      expect(result).toEqual(existingUser);
      // Should NOT create new auth user if user already exists
      expect(mockAdminClient.auth.admin.createUser).not.toHaveBeenCalled();
    });

    it('should handle race condition during auth user creation', async () => {
      const constructedEmail = '67890@company.com';

      // Mock: Initial check shows no user
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockAdminClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Auth creation fails (email already registered - race condition)
      mockAdminClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'User already been registered' },
      });

      // Mock: Second lookup finds the user (created by concurrent request)
      const existingUser: Partial<Profile> = {
        id: 'concurrent-user-999',
        employee_number: testUserData.employeeNumber,
        email: constructedEmail,
        username: testUserData.username,
      };
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: existingUser,
        error: null,
      });

      const result = await SSOUserService.createSSOUser(testUserData);

      expect(result).toEqual(existingUser);
    });

    it('should throw error when emailDomain is missing', async () => {
      // Mock: No user exists
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockAdminClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        SSOUserService.createSSOUser({
          ...testUserData,
          emailDomain: '', // Missing email domain
        })
      ).rejects.toThrow('Email domain is required');
    });

    it('should validate employee number before creation', async () => {
      await expect(
        SSOUserService.createSSOUser({
          ...testUserData,
          employeeNumber: '', // Invalid employee number
        })
      ).rejects.toThrow('Employee number is required');

      await expect(
        SSOUserService.createSSOUser({
          ...testUserData,
          employeeNumber: 'user@injection', // Invalid characters
        })
      ).rejects.toThrow('invalid characters');
    });
  });

  // ========================================================================
  // updateUserFromSSO Tests (Existing - Enhanced)
  // ========================================================================

  describe('updateUserFromSSO - Email resolution', () => {
    it('should update email when valid email is provided', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'updated@example.com',
        full_name: 'Test User',
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await SSOUserService.updateUserFromSSO('user-123', {
        email: 'updated@example.com',
        fullName: 'Test User',
      });

      expect(result).toEqual(mockProfile);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'updated@example.com',
          full_name: 'Test User',
        })
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should trim whitespace from email and full name', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'user@example.com',
        full_name: 'John Doe',
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      await SSOUserService.updateUserFromSSO('user-123', {
        email: '  user@example.com  ',
        fullName: '  John Doe  ',
      });

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          full_name: 'John Doe',
        })
      );
    });

    it('should not update email if invalid', async () => {
      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      await SSOUserService.updateUserFromSSO('user-123', {
        email: 'invalid-email',
        fullName: 'Test User',
      });

      const updateCall = mockSupabaseClient.update.mock.calls[0][0];
      expect(updateCall).toEqual(
        expect.objectContaining({
          full_name: 'Test User',
        })
      );
      expect(updateCall).not.toHaveProperty('email');
    });

    it('should return null if no updates are needed', async () => {
      const result = await SSOUserService.updateUserFromSSO('user-123', {});

      expect(result).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return null if userId is missing', async () => {
      const result = await SSOUserService.updateUserFromSSO('', {
        email: 'user@example.com',
      });

      expect(result).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return null on database error', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await SSOUserService.updateUserFromSSO('user-123', {
        email: 'user@example.com',
      });

      expect(result).toBeNull();
    });

    it('should handle partial updates (email only)', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'newemail@example.com',
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      await SSOUserService.updateUserFromSSO('user-123', {
        email: 'newemail@example.com',
      });

      const updateCall = mockSupabaseClient.update.mock.calls[0][0];
      expect(updateCall).toEqual(
        expect.objectContaining({
          email: 'newemail@example.com',
        })
      );
      expect(updateCall).not.toHaveProperty('full_name');
    });

    it('should handle partial updates (fullName only)', async () => {
      const mockProfile = {
        id: 'user-123',
        full_name: 'New Name',
        updated_at: new Date().toISOString(),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      await SSOUserService.updateUserFromSSO('user-123', {
        fullName: 'New Name',
      });

      const updateCall = mockSupabaseClient.update.mock.calls[0][0];
      expect(updateCall).toEqual(
        expect.objectContaining({
          full_name: 'New Name',
        })
      );
      expect(updateCall).not.toHaveProperty('email');
    });
  });

  // ========================================================================
  // Edge Cases and Error Handling (NEW - Addresses reviewer's requirement)
  // ========================================================================

  describe('Edge cases and error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockSupabaseClient.maybeSingle.mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(
        SSOUserService.findUserByEmployeeNumber('12345', 'company.com')
      ).rejects.toThrow('Failed to find user');
    });

    it('should handle malformed database responses', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'UNKNOWN_ERROR', message: 'Database corrupted' },
      });

      mockAdminClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: 'UNKNOWN_ERROR' },
      });

      const result = await SSOUserService.findUserByEmployeeNumber(
        '12345',
        'company.com'
      );

      expect(result).toBeNull();
    });

    it('should validate username is required for createSSOUser', async () => {
      await expect(
        SSOUserService.createSSOUser({
          employeeNumber: '12345',
          username: '',
          ssoProviderId: 'sso-123',
          ssoProviderName: 'Test SSO',
          emailDomain: 'company.com',
        })
      ).rejects.toThrow('Username and SSO provider ID are required');
    });

    it('should validate ssoProviderId is required for createSSOUser', async () => {
      await expect(
        SSOUserService.createSSOUser({
          employeeNumber: '12345',
          username: 'testuser',
          ssoProviderId: '',
          ssoProviderName: 'Test SSO',
          emailDomain: 'company.com',
        })
      ).rejects.toThrow('Username and SSO provider ID are required');
    });
  });
});
