import { getCurrentUserProfile } from '@lib/db';
import { useSupabaseAuth } from '@lib/supabase/hooks';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

export interface AdminAuthResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to check if the current user is an admin.
 * Uses the new data service and Result type.
 *
 * @returns Admin permission check result
 *
 * @example
 * ```tsx
 * const { isAdmin, isLoading, error } = useAdminAuth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!isAdmin) return <AccessDenied />;
 *
 * // Admin page content
 * ```
 */
export function useAdminAuth(
  redirectOnFailure: boolean = true
): AdminAuthResult {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSupabaseAuth();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for session to finish loading
        if (sessionLoading) {
          return;
        }

        // Check if there is a valid user session
        if (!session?.user) {
          // If user is not logged in, set as not admin
          setIsAdmin(false);

          // If redirect is needed and not already redirected, go to login page
          if (redirectOnFailure && !hasRedirected) {
            setHasRedirected(true);
            router.push(
              '/login?redirect=' + encodeURIComponent(window.location.pathname)
            );
          }
          return;
        }

        // Use the new data service to get current user profile
        // getCurrentUserProfile already includes cache and error handling
        const result = await getCurrentUserProfile();

        if (result.success && result.data) {
          // Check if the role is admin
          const isUserAdmin = result.data.role === 'admin';

          setIsAdmin(isUserAdmin);

          // If not admin and redirect is needed
          if (!isUserAdmin && redirectOnFailure && !hasRedirected) {
            setHasRedirected(true);
            // Logged in but not admin, redirect to home page
            router.push('/');
          }
        } else if (result.success && !result.data) {
          // User profile does not exist
          setIsAdmin(false);
          throw new Error('User profile does not exist');
        } else {
          // Query failed
          throw new Error(
            result.error?.message || 'Error checking admin status'
          );
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(
          err instanceof Error ? err : new Error('Error checking admin status')
        );
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [session, sessionLoading, router, redirectOnFailure, hasRedirected]);

  return { isAdmin, isLoading, error };
}
