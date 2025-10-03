/**
 * generic SSO login entry
 * handle any CAS provider SSO login request, redirect to corresponding CAS server
 */
import { CASConfigService } from '@lib/services/sso/generic-cas-service';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { providerId } = await params;

  try {
    // get query params
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/chat';

    console.log(
      `SSO login initiated for provider: ${providerId}, return URL: ${returnUrl}`
    );

    // validate returnUrl security, prevent open redirect attacks
    const allowedReturnUrls = [
      '/chat',
      '/dashboard',
      '/settings',
      '/apps',
      '/', // home page
    ];

    // check returnUrl is relative path and in allowed list
    const isValidReturnUrl =
      returnUrl.startsWith('/') &&
      (allowedReturnUrls.includes(returnUrl) || returnUrl.startsWith('/chat/'));

    const safeReturnUrl = isValidReturnUrl ? returnUrl : '/chat';

    if (returnUrl !== safeReturnUrl) {
      console.warn(
        `Invalid return URL rejected: ${returnUrl}, using default: ${safeReturnUrl}`
      );
    }

    // create generic CAS service instance
    const casService = await CASConfigService.createCASService(providerId);

    // generate login URL and redirect
    const loginUrl = casService.generateLoginURL(safeReturnUrl);

    console.log(
      `Redirecting to CAS login: ${loginUrl.replace(/service=[^&]+/, 'service=***')}`
    );

    // add detailed debug info
    console.log(`Full login URL (for debugging): ${loginUrl}`);
    console.log(`User Agent: ${request.headers.get('user-agent')}`);
    console.log(`Referer: ${request.headers.get('referer')}`);

    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error(`SSO login failed for provider ${providerId}:`, error);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.redirect(
      new URL(
        `/login?error=sso_config_error&message=${encodeURIComponent(`SSO configuration error: ${errorMessage}`)}`,
        appUrl
      )
    );
  }
}
