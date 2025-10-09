// SSO User Management Service
// Handles creation, lookup, and management of SSO users
import { createAdminClient, createClient } from '@lib/supabase/server';
import type { Profile } from '@lib/types/database';
import { isValidEmail, normalizeEmail } from '@lib/utils/validation';

// Data required to create an SSO user
export interface CreateSSOUserData {
  employeeNumber: string; // Employee number
  username: string; // Username
  ssoProviderId: string; // SSO provider ID
  ssoProviderName: string; // SSO provider name
  emailDomain: string; // Email domain
  extractedEmail?: string; // Email extracted from SSO (new field)
  fullName?: string; // Full name (optional)
}

// SSO user lookup result
export interface SSOUserLookupResult {
  user: Profile | null;
  exists: boolean;
  isActive: boolean;
}

// SSO User Service class
export class SSOUserService {
  /**
   * Resolve user email with priority logic: extracted email > constructed email
   * Normalizes email to lowercase for consistent storage and comparison
   * @private
   * @param extractedEmail email extracted from SSO response
   * @param employeeNumber employee number for construction
   * @param emailDomain email domain for construction
   * @returns resolved and normalized email address (lowercase)
   */
  private static resolveUserEmail(
    extractedEmail: string | undefined,
    employeeNumber: string,
    emailDomain: string
  ): string {
    // If SSO extracted valid email, normalize and use it
    if (extractedEmail) {
      const normalized = normalizeEmail(extractedEmail);
      if (normalized) {
        return normalized;
      }
    }

    // Otherwise construct email and normalize it
    const constructedEmail = `${employeeNumber}@${emailDomain}`;
    return constructedEmail.toLowerCase();
  }

  /**
   * Find user by employee number (actually by email)
   * @param employeeNumber Employee number
   * @returns User profile or null
   */
  static async findUserByEmployeeNumber(
    employeeNumber: string,
    emailDomain?: string
  ): Promise<Profile | null> {
    if (!employeeNumber || typeof employeeNumber !== 'string') {
      throw new Error('Employee number is required and must be a string');
    }

    try {
      const supabase = await createClient();

      // Construct SSO user's email address using provided domain or environment variable fallback
      // Normalize to lowercase for consistent comparison
      const domain = emailDomain || process.env.DEFAULT_SSO_EMAIL_DOMAIN;
      const email = `${employeeNumber.trim()}@${domain}`.toLowerCase();

      // First try to find user with normal client (subject to RLS)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // If not found, try with admin client (bypass RLS)
          // This is important for SSO user lookup as RLS may block access
          try {
            const adminSupabase = await createAdminClient();
            const { data: adminData, error: adminError } = await adminSupabase
              .from('profiles')
              .select('*')
              .eq('email', email)
              .single();

            if (adminError) {
              if (adminError.code === 'PGRST116') {
                return null;
              }
              console.error(
                'Error finding user by email via admin client:',
                adminError
              );
              throw adminError;
            }

            if (adminData) {
              return adminData as Profile;
            }
          } catch (adminError) {
            console.warn(
              'Admin client lookup failed, user may not exist:',
              adminError
            );
            return null;
          }
        } else {
          console.error('Error finding user by email:', error);
          throw error;
        }
      }

      if (data) {
        return data as Profile;
      }

      return null;
    } catch (error) {
      console.error(
        'Failed to find user by employee number (via email):',
        error
      );
      throw new Error(
        `Failed to find user: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find user by ID directly (using admin client, bypassing RLS)
   * @param userId User ID
   * @returns User profile or null
   */
  static async findUserByIdWithAdmin(userId: string): Promise<Profile | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const adminSupabase = await createAdminClient();

      const { data, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error finding user by ID:', error);
        throw error;
      }

      if (data) {
        return data as Profile;
      }

      return null;
    } catch (error) {
      console.error('Failed to find user by ID:', error);
      throw new Error(
        `Failed to find user by ID: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create SSO user - uses Supabase Admin API
   * @param userData User data
   * @returns Created user profile
   */
  static async createSSOUser(userData: CreateSSOUserData): Promise<Profile> {
    // Validate input data
    if (
      !userData.employeeNumber ||
      !userData.username ||
      !userData.ssoProviderId
    ) {
      throw new Error(
        'Employee number, username, and SSO provider ID are required'
      );
    }

    try {
      // Use normal client to lookup user, admin client to create user
      const supabase = await createClient();
      const adminSupabase = await createAdminClient();

      console.log(
        `Creating SSO user: ${userData.username} (${userData.employeeNumber})`
      );

      // Check if user already exists (by email)
      const existingUser = await this.findUserByEmployeeNumber(
        userData.employeeNumber
      );
      if (existingUser) {
        return existingUser;
      }

      // Create auth.users record using Supabase Admin API
      // This will also trigger creation of profiles record via trigger
      const emailDomain =
        userData.emailDomain || process.env.DEFAULT_SSO_EMAIL_DOMAIN;

      // Validate email domain is configured
      if (!emailDomain) {
        throw new Error(
          'Email domain is required for SSO user creation. ' +
            'Configure emailDomain in SSO provider settings or set DEFAULT_SSO_EMAIL_DOMAIN environment variable.'
        );
      }

      // Use new email resolution logic: extracted email > constructed email
      const email = this.resolveUserEmail(
        userData.extractedEmail,
        userData.employeeNumber,
        emailDomain
      );

      console.log(
        `Email resolved for ${userData.employeeNumber}: ${email} (source: ${userData.extractedEmail && isValidEmail(userData.extractedEmail) ? 'SSO extracted' : 'constructed'})`
      );

      const { data: authUser, error: authError } =
        await adminSupabase.auth.admin.createUser({
          email,
          user_metadata: {
            full_name: userData.fullName || userData.username,
            username: userData.username,
            employee_number: userData.employeeNumber,
            auth_source: `${userData.ssoProviderName.toLowerCase().replace(/\s+/g, '_')}_sso`,
            sso_provider_id: userData.ssoProviderId,
          },
          app_metadata: {
            provider: `${userData.ssoProviderName.toLowerCase().replace(/\s+/g, '_')}_sso`,
            employee_number: userData.employeeNumber,
          },
          email_confirm: true, // SSO users auto-confirm email
        });

      // Handle email conflict
      // If email already exists, user is already registered, try to find existing user
      if (authError && authError.message.includes('already been registered')) {
        // Strategy 1: Lookup user again, using enhanced method (including admin client)
        const existingUser = await this.findUserByEmployeeNumber(
          userData.employeeNumber
        );
        if (existingUser) {
          return existingUser;
        }

        // Strategy 2: If email lookup fails, try to get user ID from Auth API, then lookup profile directly
        try {
          // Use Admin API to list auth.users
          const { data: authUsers, error: authLookupError } =
            await adminSupabase.auth.admin.listUsers();

          if (!authLookupError && authUsers?.users) {
            const authUser = authUsers.users.find(user => user.email === email);
            if (authUser) {
              // Lookup profile by ID
              const profileUser = await this.findUserByIdWithAdmin(authUser.id);
              if (profileUser) {
                return profileUser;
              } else {
                // If auth.users exists but profiles does not, create profiles record
                const { data: newProfile, error: createError } =
                  await adminSupabase
                    .from('profiles')
                    .insert({
                      id: authUser.id,
                      employee_number: userData.employeeNumber,
                      username: userData.username,
                      full_name: userData.fullName || userData.username,
                      auth_source: `${userData.ssoProviderName.toLowerCase().replace(/\s+/g, '_')}_sso`,
                      sso_provider_id: userData.ssoProviderId,
                      email: email,
                      status: 'active',
                      role: 'user',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      last_login: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (createError) {
                  console.error(
                    'Failed to create missing profile:',
                    createError
                  );
                  throw new Error('PROFILE_CREATION_FAILED');
                }

                return newProfile as Profile;
              }
            }
          }
        } catch (lookupError) {
          console.warn('Failed to lookup auth user:', lookupError);
        }

        // If all strategies fail, throw error
        console.error(
          'Auth user exists but no corresponding profile found and could not create one'
        );
        throw new Error('ACCOUNT_DATA_INCONSISTENT');
      }

      // If other auth error, throw
      if (authError) {
        console.error('Error creating auth user:', authError);
        throw authError;
      }

      if (!authUser.user) {
        throw new Error('Failed to create auth user: no user returned');
      }

      // Wait for trigger to create profiles record, then lookup user by email
      // Use retry mechanism; lookup by email is more reliable than by ID
      let profile = null;
      let retryCount = 0;
      const maxRetries = 3; // Reduce retry count

      while (retryCount < maxRetries) {
        try {
          // Wait for trigger to execute
          await new Promise(resolve => setTimeout(resolve, 500));

          // Lookup user by email, as email field will be set correctly by trigger
          profile = await this.findUserByEmployeeNumber(
            userData.employeeNumber
          );

          if (profile) {
            // Update SSO-specific fields (employee_number, sso_provider_id, etc.)

            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update({
                employee_number: userData.employeeNumber,
                auth_source: `${userData.ssoProviderName.toLowerCase().replace(/\s+/g, '_')}_sso`,
                sso_provider_id: userData.ssoProviderId,
                full_name: userData.fullName || userData.username,
                username: userData.username,
                email: email, // Ensure email is set correctly
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id)
              .select()
              .single();

            if (updateError) {
              console.warn(
                'Failed to update SSO fields, but user exists:',
                updateError
              );
              // Do not block process, return original profile
            } else {
              profile = updatedProfile;
            }

            break; // Success, exit retry loop
          } else {
            retryCount++;
          }
        } catch (error) {
          retryCount++;
          console.warn(`Profile lookup attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            break; // Exit retry, enter fallback
          }
        }
      }

      // Fallback: if trigger-created record cannot be found by email, use admin client to lookup and update
      if (!profile) {
        try {
          const adminSupabaseForProfile = await createAdminClient();

          // Use admin client to lookup profiles by ID (bypass RLS)
          const { data: existingProfile, error: findError } =
            await adminSupabaseForProfile
              .from('profiles')
              .select('*')
              .eq('id', authUser.user.id)
              .single();

          if (!findError && existingProfile) {
            // Update SSO fields in existing record

            const { data: updatedProfile, error: updateError } =
              await adminSupabaseForProfile
                .from('profiles')
                .update({
                  employee_number: userData.employeeNumber,
                  auth_source: `${userData.ssoProviderName.toLowerCase().replace(/\s+/g, '_')}_sso`,
                  sso_provider_id: userData.ssoProviderId,
                  full_name: userData.fullName || userData.username,
                  username: userData.username,
                  email: email, // Ensure email is set correctly
                  status: 'active', // Ensure status is active
                  updated_at: new Date().toISOString(),
                })
                .eq('id', authUser.user.id)
                .select()
                .single();

            if (updateError) {
              console.error('Failed to update existing profile:', updateError);
              throw updateError;
            }

            profile = updatedProfile;
          } else {
            // If no profiles record, create a new one

            const { data: newProfile, error: createError } =
              await adminSupabaseForProfile
                .from('profiles')
                .insert({
                  id: authUser.user.id,
                  employee_number: userData.employeeNumber,
                  username: userData.username,
                  full_name: userData.fullName || userData.username,
                  auth_source: `${userData.ssoProviderName.toLowerCase().replace(/\s+/g, '_')}_sso`,
                  sso_provider_id: userData.ssoProviderId,
                  email: email,
                  status: 'active',
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_login: new Date().toISOString(),
                })
                .select()
                .single();

            if (createError) {
              console.error(
                'Failed to create new profile with admin client:',
                createError
              );
              throw createError;
            }

            profile = newProfile;
          }
        } catch (adminError) {
          const errorMsg = 'Failed to handle profile with admin client';
          console.error(errorMsg, adminError);

          // Cleanup created auth user
          try {
            await adminSupabase.auth.admin.deleteUser(authUser.user.id);
          } catch (cleanupError) {
            console.error('Failed to cleanup auth user:', cleanupError);
          }

          throw new Error(errorMsg);
        }
      }

      console.log(`SSO user created successfully: ${profile.username}`);
      return profile;
    } catch (error) {
      console.error('Failed to create SSO user:', error);
      throw new Error(
        `Failed to create SSO user: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update user's last login time
   * @param userId User ID
   * @returns Whether update was successful
   */
  static async updateLastLogin(userId: string): Promise<boolean> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const supabase = await createClient();

      // Use database function to update login time
      const { data: success, error } = await supabase.rpc(
        'update_sso_user_login',
        {
          user_uuid: userId,
        }
      );

      if (error) {
        console.error('Error updating user last login:', error);
        throw error;
      }

      return success === true;
    } catch (error) {
      console.error('Failed to update user last login:', error);
      throw new Error(
        `Failed to update last login: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update existing user profile with fresh SSO-provided information
   *
   * This method ensures that user profiles are kept up-to-date with the latest
   * information from SSO providers. For example, if a user initially had a
   * constructed email (e.g., employee123@company.com) and the SSO provider
   * now provides their actual email (e.g., john.doe@company.com), this method
   * will update the profile with the real email address.
   *
   * @param userId - User's unique identifier
   * @param data - SSO-extracted user data to update
   * @param data.email - Email address from SSO provider (optional)
   * @param data.fullName - Full name from SSO provider (optional)
   * @returns Updated user profile or null if update fails
   */
  static async updateUserFromSSO(
    userId: string,
    data: {
      email?: string;
      fullName?: string;
    }
  ): Promise<Profile | null> {
    if (!userId) {
      console.error('User ID is required for SSO profile update');
      return null;
    }

    try {
      const supabase = await createClient();
      const updates: Partial<Profile> = {
        updated_at: new Date().toISOString(),
      };

      // Update email if provided and valid, normalize to lowercase
      if (data.email) {
        const normalized = normalizeEmail(data.email);
        if (normalized) {
          updates.email = normalized;
        }
      }

      // Update full name if provided and non-empty
      if (data.fullName && data.fullName.trim()) {
        updates.full_name = data.fullName.trim();
      }

      // Only perform update if there are actual changes beyond updated_at
      if (Object.keys(updates).length > 1) {
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          console.error('Failed to update SSO user profile:', error);
          return null;
        }

        return updatedProfile as Profile;
      }

      return null;
    } catch (error) {
      console.error('Error updating SSO user profile:', error);
      return null;
    }
  }

  /**
   * Get detailed SSO user lookup result
   * @param employeeNumber Employee number
   * @returns Lookup result including user profile and status
   */
  static async lookupSSOUser(
    employeeNumber: string
  ): Promise<SSOUserLookupResult> {
    try {
      const user = await this.findUserByEmployeeNumber(employeeNumber);

      return {
        user,
        exists: user !== null,
        isActive: user?.status === 'active' || false,
      };
    } catch (error) {
      console.error('Failed to lookup SSO user:', error);
      return {
        user: null,
        exists: false,
        isActive: false,
      };
    }
  }

  /**
   * Get SSO provider info by name
   * @param providerName Provider name
   * @returns SSO provider info
   */
  static async getSSOProviderByName(providerName: string): Promise<{
    id: string;
    name: string;
    protocol: string;
  } | null> {
    try {
      const supabase = await createClient();

      // Lookup specified SSO provider config
      const { data, error } = await supabase
        .from('sso_providers')
        .select('id, name, protocol')
        .eq('name', providerName)
        .eq('enabled', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          console.warn(`SSO provider '${providerName}' not found in database`);
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Failed to get SSO provider '${providerName}':`, error);
      return null;
    }
  }

  /**
   * Batch update SSO user info (admin feature)
   * @param updates Array of update data
   * @returns Update result
   */
  static async batchUpdateSSOUsers(
    updates: Array<{ employeeNumber: string; data: Partial<Profile> }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of updates) {
      try {
        const user = await this.findUserByEmployeeNumber(update.employeeNumber);
        if (!user) {
          result.failed++;
          result.errors.push(
            `User with employee number ${update.employeeNumber} not found`
          );
          continue;
        }

        const supabase = await createClient();
        const { error } = await supabase
          .from('profiles')
          .update({
            ...update.data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) {
          result.failed++;
          result.errors.push(
            `Failed to update ${update.employeeNumber}: ${error.message}`
          );
        } else {
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Error processing ${update.employeeNumber}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return result;
  }
}
