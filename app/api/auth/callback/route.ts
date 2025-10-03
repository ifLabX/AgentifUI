import { validateRedirectUrl } from '@lib/utils/redirect-validation';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { CookieOptions, createServerClient } from '@supabase/ssr';

/**
 * GET handler for the OAuth callback.
 * This endpoint is responsible for exchanging the authorization code for a session.
 * @param request - The NextRequest object.
 * @returns A NextResponse object that redirects the user to a secure page.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    try {
      // use authorization code to exchange session, get user info
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('OAuth callback error:', error);
        // redirect to login page and show error
        return NextResponse.redirect(
          new URL('/login?error=oauth_failed', request.url)
        );
      }

      // check if user has profile, if not, create it
      // OAuth user's profile will be automatically created by database trigger, but we need to update the authentication source
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, auth_source')
          .eq('id', data.user.id)
          .single();

        if (profile && !profile.auth_source) {
          // update authentication source to oauth
          await supabase
            .from('profiles')
            .update({
              auth_source: 'oauth',
              last_login: new Date().toISOString(),
            })
            .eq('id', data.user.id);
        }
      }
    } catch (err) {
      console.error('OAuth processing failed:', err);
      return NextResponse.redirect(
        new URL('/login?error=oauth_failed', request.url)
      );
    }
  }

  // 🔒 Security: Validate redirect URL to prevent open redirect attacks
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/chat/new';
  const validatedRedirectUrl = validateRedirectUrl(
    redirectTo,
    request.url,
    '/chat/new'
  );

  // redirect to validated secure page
  return NextResponse.redirect(new URL(validatedRedirectUrl, request.url));
}
