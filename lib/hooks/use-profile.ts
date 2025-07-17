import { createClient } from '@lib/supabase/client';
import { useSupabaseAuth } from '@lib/supabase/hooks';
import type { UserRole } from '@lib/types/database';

import { useEffect, useState } from 'react';

import { PageKey, useLoadingStore } from '../stores/loading-store';

/**
 * Profile type definition
 * - employee_number: optional, only available for SSO users
 * - auth_last_sign_in_at: from auth.users, for settings page display
 */
export interface Profile {
  id: string;
  full_name: string | null | undefined;
  username: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string | null;
  created_at: string | null;
  employee_number?: string | null;
  auth_last_sign_in_at?: string | null;
}

// Profile cache configuration
// Use sessionStorage for better security, auto-cleared on tab close
// Shorten cache expiry to reduce sensitive data exposure
const PROFILE_CACHE_KEY = 'user_profile_cache';
const CACHE_EXPIRY_TIME = 2 * 60 * 1000; // 2 minutes cache expiry for higher security

// Profile cache data structure
interface ProfileCache {
  profile: Profile;
  timestamp: number;
  userId: string;
}

// Utility: get profile from cache
const getProfileFromCache = (userId: string): Profile | null => {
  try {
    if (typeof window === 'undefined') return null; // SSR safety check

    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;

    const cacheData: ProfileCache = JSON.parse(cached);

    // Strict userId check to prevent cross-user data pollution
    if (cacheData.userId !== userId) {
      console.warn(
        `[Profile Cache] User ID mismatch, clearing cache (cache:${cacheData.userId}, current:${userId})`
      );
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    // Check if cache expired
    if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_TIME) {
      console.log(`[Profile Cache] Cache expired, clearing`);
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }

    console.log(`[Profile Cache] Cache hit: ${userId}`);
    return cacheData.profile;
  } catch (error) {
    console.warn('[Profile Cache] Failed to read profile cache:', error);
    // Clean up corrupted cache
    try {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {}
    return null;
  }
};

// Utility: set profile to cache
const setProfileToCache = (profile: Profile, userId: string): void => {
  try {
    if (typeof window === 'undefined') return; // SSR safety check

    const cacheData: ProfileCache = {
      profile,
      timestamp: Date.now(),
      userId,
    };

    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    console.log(`[Profile Cache] Cached user profile: ${userId}`);
  } catch (error) {
    console.warn('[Profile Cache] Failed to save profile cache:', error);
  }
};

/**
 * Clear profile cache (for use in other components)
 * Now clears sessionStorage
 */
export const clearProfileCache = (): void => {
  try {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
    console.log('[Profile Cache] Cleared user profile cache');
  } catch (error) {
    console.warn('[Profile Cache] Failed to clear profile cache:', error);
  }
};

/**
 * Update profile cache (for use in settings page)
 */
export const updateProfileCache = (profile: Profile, userId: string): void => {
  setProfileToCache(profile, userId);
};

// Hook return type definition
interface UseProfileResult {
  profile: Profile | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => Promise<void>;
}

/**
 * Custom hook to get user profile
 * Uses sessionStorage cache, prefers cache to avoid loading flicker
 * Uses new data service and Result type
 * @param userId Optional user ID, if not provided, gets current logged-in user's profile
 * @returns Object with profile data, loading state, error, and refresh method
 */
export function useProfile(userId?: string): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Initial value is false

  // Get current user info from auth hook
  const { session } = useSupabaseAuth();

  // Use global loading state
  const setPageLoading = useLoadingStore(state => state.setPageLoading);

  // Function to load profile
  const loadProfile = async () => {
    try {
      setError(null);

      // Get user ID (current user or specified user)
      let targetUserId = userId;

      if (!targetUserId) {
        // If no userId provided, use current logged-in user
        if (!session?.user) {
          throw new Error('Not logged in, cannot get user profile');
        }
        targetUserId = session.user.id;
      }

      // Try to load from cache first
      const cachedProfile = getProfileFromCache(targetUserId);
      if (cachedProfile) {
        setProfile(cachedProfile);
        // If cache exists, do not show loading, but still fetch latest data in background
      } else {
        // Show loading only if no cache
        setIsLoading(true);
        setPageLoading('profile', true);
      }

      // Query user profile info
      const supabase = createClient();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message || 'Failed to get user profile');
      }

      if (!profileData) {
        setProfile(null);
        setError(new Error('User profile does not exist'));
        return;
      }

      // Get last_sign_in_at from auth.users
      let authLastSignInAt: string | null = null;
      if (session?.user) {
        authLastSignInAt = session.user.last_sign_in_at || null;
      }

      const newProfile: Profile = {
        id: profileData.id,
        full_name: profileData.full_name,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        role: profileData.role,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        employee_number: profileData.employee_number,
        auth_last_sign_in_at: authLastSignInAt,
      };

      // Update state and cache
      setProfile(newProfile);
      setProfileToCache(newProfile, targetUserId);
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setError(
        err instanceof Error ? err : new Error('Failed to load user profile')
      );
    } finally {
      // Reset loading state
      setIsLoading(false);
      setPageLoading('profile', false);
    }
  };

  // Load profile on first mount and when dependencies change
  useEffect(() => {
    if (session || userId) {
      // Only load if session (current user) or userId is present
      loadProfile();
    }
  }, [userId, session]);

  // Return profile data, loading state, error, and refresh method
  return {
    profile,
    error,
    isLoading,
    mutate: loadProfile,
  };
}
