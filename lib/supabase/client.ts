import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Global singleton Supabase client instance.
 * Prevents creating multiple client instances.
 */
let supabaseInstance: SupabaseClient | null = null;

/**
 * Create or get the Supabase browser client.
 * Uses singleton pattern to ensure only one client instance is created for the entire app.
 * For accessing Supabase services in client components.
 */
export const createClient = () => {
  // Return the instance if it already exists
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create a new instance if it does not exist
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabaseInstance;
};
