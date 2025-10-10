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
  describe('updateUserFromSSO', () => {
    let mockSupabaseClient: {
      from: jest.Mock;
      update: jest.Mock;
      eq: jest.Mock;
      select: jest.Mock;
      single: jest.Mock;
    };

    beforeEach(async () => {
      // Reset mocks before each test
      jest.clearAllMocks();

      // Mock Supabase client
      mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      // Use dynamic import for mocking
      const { createClient } = await import('@lib/supabase/server');
      (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);
    });

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
});
