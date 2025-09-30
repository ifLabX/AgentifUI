// SSO login API
// establish Supabase session for verified SSO users
// add request deduplication logic and improved error handling
import { createAdminClient } from '@lib/supabase/server';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// simple memory cache to prevent duplicate requests within a short time
// in production, it is recommended to use Redis or other persistent cache
const processingRequests = new Map<string, Promise<NextResponse>>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestData;

  try {
    requestData = await request.json();
    const { userEmail, ssoUserData } = requestData;

    // 🔒 Security: Read sensitive data from httpOnly cookie
    const cookieStore = await cookies();
    const secureCookie = cookieStore.get('sso_user_data_secure');

    if (!secureCookie) {
      return NextResponse.json(
        { message: 'SSO secure data does not exist or has expired' },
        { status: 401 }
      );
    }

    let sensitiveData;
    try {
      sensitiveData = JSON.parse(secureCookie.value);
    } catch {
      return NextResponse.json(
        { message: 'SSO secure data format error' },
        { status: 401 }
      );
    }

    // Check if SSO data has expired
    if (sensitiveData.expiresAt < Date.now()) {
      return NextResponse.json(
        { message: 'SSO login data has expired, please login again' },
        { status: 401 }
      );
    }

    // Reconstruct complete SSO user data from secure cookie and request
    const completeSsoUserData = {
      ...sensitiveData,
      ...ssoUserData,
    };

    const userId = sensitiveData.userId;

    if (!userId || !userEmail || !completeSsoUserData) {
      return NextResponse.json(
        { message: 'SSO login data is incomplete' },
        { status: 400 }
      );
    }

    // create request unique identifier to prevent duplicate processing of concurrent requests for the same user
    const requestKey = `sso-signin-${userId}-${sensitiveData.loginTime}`;

    // check if there is a request being processed for the same user
    if (processingRequests.has(requestKey)) {
      console.log(
        `Duplicate SSO signin request detected for user: ${userId}, waiting for existing request...`
      );

      try {
        // wait for existing request to complete
        const existingResponse = await processingRequests.get(requestKey);
        console.log(
          `Returning result from existing request for user: ${userId}`
        );
        return existingResponse;
      } catch {
        console.log(
          `Existing request failed for user: ${userId}, proceeding with new request`
        );
        // if existing request fails, clean up cache and continue processing new request
        processingRequests.delete(requestKey);
      }
    }

    // create processing function and add to cache
    const processRequest = async (): Promise<NextResponse> => {
      try {
        // verify if SSO data has expired
        if (Date.now() > completeSsoUserData.expiresAt) {
          return NextResponse.json(
            { message: 'SSO session has expired' },
            { status: 401 }
          );
        }

        // use Admin client to generate session for SSO user
        const adminSupabase = await createAdminClient();

        // verify if user exists in Supabase and get actual email
        const { data: user, error: userError } =
          await adminSupabase.auth.admin.getUserById(userId);

        if (userError || !user) {
          console.error('SSO user not found in Supabase:', userError);
          return NextResponse.json(
            { message: 'User not found' },
            { status: 404 }
          );
        }

        // use the actual email address stored in the database, not the email passed as a URL parameter
        // this solves the authentication failure problem caused by email mismatch
        const actualUserEmail = user.user.email || userEmail;
        if (!actualUserEmail) {
          console.error('No email found for user:', userId);
          return NextResponse.json(
            { message: 'User email information is missing' },
            { status: 400 }
          );
        }
        console.log(
          `Creating session for SSO user: ${userId}, URL email: ${userEmail}, actual email: ${actualUserEmail}`
        );

        // 🔒 Security: Check user account status before creating session using whitelist validation
        // Only 'active' status users are allowed to log in via SSO
        // This prevents bypass via invalid status values (NULL, typos, unexpected enums)
        const { data: profile, error: profileError } = await adminSupabase
          .from('profiles')
          .select('status')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error('Failed to query user profile status:', profileError);
          return NextResponse.json(
            { message: 'Failed to verify user account status' },
            { status: 500 }
          );
        }

        // Reject session creation for non-active users
        if (profile?.status !== 'active') {
          const errorMap: Record<string, string> = {
            suspended: 'account_suspended',
            pending: 'account_pending',
          };
          const errorCode =
            errorMap[profile.status as string] || 'invalid_account';

          console.log(
            `[SSO Authentication] Rejected login attempt for user with status '${profile.status}': ${userId}`
          );
          return NextResponse.json(
            {
              message: errorCode,
              redirect: `/login?error=${errorCode}`,
            },
            { status: 403 }
          );
        }

        console.log(
          `[SSO Authentication] User status verified as 'active' for user: ${userId}`
        );

        // use optimized temporary password method to create session
        // this is the most reliable and simple method
        try {
          console.log('Creating session using temporary password method...');

          // generate stronger temporary password
          const tempPassword = `SSO_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;

          // update user password (temporary)
          const { error: updateError } =
            await adminSupabase.auth.admin.updateUserById(userId, {
              password: tempPassword,
            });

          if (updateError) {
            console.error('Failed to set temporary password:', updateError);
            return NextResponse.json(
              { message: 'Failed to set temporary password' },
              { status: 500 }
            );
          }

          // wait for a short time to ensure password update takes effect
          await new Promise(resolve => setTimeout(resolve, 100));

          // sign in with temporary password and actual email to get session
          const { data: signInData, error: signInError } =
            await adminSupabase.auth.signInWithPassword({
              email: actualUserEmail,
              password: tempPassword,
            });

          if (signInError || !signInData.session) {
            console.error(
              'Failed to sign in with temporary password:',
              signInError
            );
            return NextResponse.json(
              { message: 'Session creation failed' },
              { status: 500 }
            );
          }

          // immediately clean up temporary password
          try {
            await adminSupabase.auth.admin.updateUserById(userId, {
              password: undefined,
            });
          } catch (cleanupError) {
            console.warn('Failed to cleanup temporary password:', cleanupError);
          }

          const processingTime = Date.now() - startTime;
          console.log(
            `[SSO authentication] SSO signin successful for user: ${userId} (processing time: ${processingTime}ms)`
          );

          // SSO login successful, return result
          // note: frontend cache cleanup is handled in SSO button component
          return NextResponse.json({
            success: true,
            session: signInData.session,
            message: 'SSO login successful',
          });
        } catch (authError) {
          console.error('Authentication error:', authError);
          return NextResponse.json(
            {
              message: `Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`,
            },
            { status: 500 }
          );
        }
      } finally {
        // clean up cache after processing (delayed cleanup to prevent race conditions)
        setTimeout(() => {
          processingRequests.delete(requestKey);
        }, 1000);
      }
    };

    // add processing function to cache and execute
    const requestPromise = processRequest();
    processingRequests.set(requestKey, requestPromise);

    return await requestPromise;
  } catch (error) {
    console.error('SSO signin failed:', error);

    // clean up possible cache entries when error occurs
    // Note: Error handling may not have access to sensitiveData, so we try to construct the key from cookie
    try {
      const cookieStore = await cookies();
      const secureCookie = cookieStore.get('sso_user_data_secure');
      if (secureCookie) {
        const sensitiveData = JSON.parse(secureCookie.value);
        const requestKey = `sso-signin-${sensitiveData.userId}-${sensitiveData.loginTime}`;
        processingRequests.delete(requestKey);
      }
    } catch (cleanupError) {
      console.warn(
        'Failed to cleanup processing cache on error:',
        cleanupError
      );
    }

    return NextResponse.json(
      {
        message: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
