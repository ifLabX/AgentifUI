/**
 * generic SSO logout handler
 * handle logout requests for any CAS provider
 */
import { CASConfigService } from '@lib/services/sso/generic-cas-service';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const requestUrl = new URL(request.url);
  const returnUrl = requestUrl.searchParams.get('returnUrl') || '/login';
  const { providerId } = await params;

  console.log(
    `SSO logout initiated for provider ${providerId}, return URL: ${returnUrl}`
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }

  try {
    // create generic CAS service instance
    const casService = await CASConfigService.createCASService(providerId);
    const casConfig = casService.getConfig();

    // generate CAS logout URL
    const logoutUrl = casService.generateLogoutURL(
      new URL(returnUrl, appUrl).toString()
    );

    console.log(
      `Redirecting to CAS logout for ${casConfig.name}: ${logoutUrl}`
    );

    return NextResponse.redirect(logoutUrl);
  } catch (error) {
    console.error(`SSO logout failed for provider ${providerId}:`, error);

    // even if CAS logout fails, clean up local session
    return NextResponse.redirect(new URL(returnUrl, appUrl));
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;
  console.log(`Processing SSO logout POST request for provider ${providerId}`);

  try {
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

    // sign out Supabase session
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signout error:', error);
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    // create generic CAS service instance
    const casService = await CASConfigService.createCASService(providerId);
    const casConfig = casService.getConfig();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL is not configured');
    }

    // generate CAS logout URL
    const logoutUrl = casService.generateLogoutURL(
      new URL('/login', appUrl).toString()
    );

    console.log(`Generated CAS logout URL for ${casConfig.name}: ${logoutUrl}`);

    return NextResponse.json({
      success: true,
      logoutUrl: logoutUrl,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error(
      `SSO logout processing failed for provider ${providerId}:`,
      error
    );

    return NextResponse.json(
      {
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
