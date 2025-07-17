/**
 * Database query functions related to user profiles.
 *
 * This file contains all database operations related to the profiles table.
 * Updated to use the unified data service and Result type.
 */
import { CacheKeys, cacheService } from '@lib/services/db/cache-service';
import { dataService } from '@lib/services/db/data-service';
import { SubscriptionKeys } from '@lib/services/db/realtime-service';
import { Profile } from '@lib/types/database';
import { Result, failure, success } from '@lib/types/result';

import { createClient } from '../supabase/client';

// For compatibility with existing code, while using the new data service.
const supabase = createClient();

/**
 * Get the current user's profile (optimized version).
 * @returns Result of the user profile object, or null if not found.
 */
export async function getCurrentUserProfile(): Promise<Result<Profile | null>> {
  // First get the current user ID, then query the user profile.
  // Uses the new data service and cache mechanism.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return success(null);
  }

  return getUserProfileById(user.id);
}

/**
 * Get user profile by ID (optimized version).
 * @param userId User ID
 * @returns Result of the user profile object, or null if not found.
 */
export async function getUserProfileById(
  userId: string
): Promise<Result<Profile | null>> {
  return dataService.findOne<Profile>(
    'profiles',
    { id: userId },
    {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes cache
      subscribe: true,
      subscriptionKey: SubscriptionKeys.userProfile(userId),
      onUpdate: () => {
        // Clear cache when user profile is updated
        cacheService.delete(CacheKeys.userProfile(userId));
      },
    }
  );
}

/**
 * Get user profile by username (optimized version).
 * @param username Username
 * @returns Result of the user profile object, or null if not found.
 */
export async function getUserProfileByUsername(
  username: string
): Promise<Result<Profile | null>> {
  return dataService.findOne<Profile>(
    'profiles',
    { username },
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
    }
  );
}

/**
 * Get all admin users (optimized version).
 * @returns Result of the admin user list.
 */
export async function getAdminUsers(): Promise<Result<Profile[]>> {
  return dataService.findMany<Profile>(
    'profiles',
    { role: 'admin' },
    { column: 'created_at', ascending: false },
    undefined,
    {
      cache: true,
      cacheTTL: 15 * 60 * 1000, // 15 minutes cache
    }
  );
}

/**
 * Update user profile (optimized version).
 * @param userId User ID
 * @param updates Fields to update
 * @returns Result of the updated user profile object, or error if update fails.
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Result<Profile>> {
  // Add automatic update timestamp
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const result = await dataService.update<Profile>(
    'profiles',
    userId,
    updateData
  );

  // Clear related cache
  if (result.success) {
    cacheService.delete(CacheKeys.userProfile(userId));
    // If username is updated, also clear username-related cache
    if (updates.username) {
      cacheService.deletePattern(`profiles:*username*`);
    }
  }

  return result;
}

/**
 * Set user as admin (optimized version).
 * @param userId User ID
 * @returns Result indicating whether the operation was successful.
 */
export async function setUserAsAdmin(userId: string): Promise<Result<boolean>> {
  const result = await dataService.update<Profile>('profiles', userId, {
    role: 'admin',
    updated_at: new Date().toISOString(),
  });

  if (result.success) {
    // Clear related cache
    cacheService.delete(CacheKeys.userProfile(userId));
    cacheService.deletePattern('profiles:*role*admin*');
    return success(true);
  }

  return success(false);
}

/**
 * Check if user is admin (optimized version).
 * @param userId User ID
 * @returns Result indicating whether the user is admin.
 */
export async function isUserAdmin(userId: string): Promise<Result<boolean>> {
  const result = await dataService.findOne<Profile>(
    'profiles',
    { id: userId },
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache, permission check needs fresh data
    }
  );

  if (result.success && result.data) {
    return success(result.data.role === 'admin');
  }

  if (result.success && !result.data) {
    return success(false); // User does not exist, not admin
  }

  return failure(result.error || new Error('Failed to check user role'));
}

// Compatibility functions, keep compatibility with existing code.
// These functions will gradually migrate to use the Result type.
/**
 * Get the current user's profile (legacy version).
 * @deprecated Please use getCurrentUserProfile() and handle the Result type.
 */
export async function getCurrentUserProfileLegacy(): Promise<Profile | null> {
  const result = await getCurrentUserProfile();
  return result.success ? result.data : null;
}

/**
 * Get user profile by ID (legacy version).
 * @deprecated Please use getUserProfileById() and handle the Result type.
 */
export async function getUserProfileByIdLegacy(
  userId: string
): Promise<Profile | null> {
  const result = await getUserProfileById(userId);
  return result.success ? result.data : null;
}

/**
 * Get user profile by username (legacy version).
 * @deprecated Please use getUserProfileByUsername() and handle the Result type.
 */
export async function getUserProfileByUsernameLegacy(
  username: string
): Promise<Profile | null> {
  const result = await getUserProfileByUsername(username);
  return result.success ? result.data : null;
}

/**
 * Get all admin users (legacy version).
 * @deprecated Please use getAdminUsers() and handle the Result type.
 */
export async function getAdminUsersLegacy(): Promise<Profile[]> {
  const result = await getAdminUsers();
  return result.success ? result.data : [];
}

/**
 * Update user profile (legacy version).
 * @deprecated Please use updateUserProfile() and handle the Result type.
 */
export async function updateUserProfileLegacy(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile | null> {
  const result = await updateUserProfile(userId, updates);
  return result.success ? result.data : null;
}

/**
 * Set user as admin (legacy version).
 * @deprecated Please use setUserAsAdmin() and handle the Result type.
 */
export async function setUserAsAdminLegacy(userId: string): Promise<boolean> {
  const result = await setUserAsAdmin(userId);
  return result.success ? result.data : false;
}

/**
 * Check if user is admin (legacy version).
 * @deprecated Please use isUserAdmin() and handle the Result type.
 */
export async function isUserAdminLegacy(userId: string): Promise<boolean> {
  const result = await isUserAdmin(userId);
  return result.success ? result.data : false;
}

// Note: User organization-related functions have been removed, use the group system instead.
