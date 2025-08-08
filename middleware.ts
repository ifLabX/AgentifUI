import {
  createCorsHeaders,
  handleCorsPreflightRequest,
} from '@lib/config/cors-config';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { CookieOptions, createServerClient } from '@supabase/ssr';

// This middleware intercepts all requests.
// Uses Supabase authentication logic for route protection.
export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Prioritize CORS preflight requests
  if (request.method === 'OPTIONS') {
    console.log(`[Middleware] CORS preflight request: ${pathname}`);
    return handleCorsPreflightRequest(request);
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Automatically add CORS headers to all API routes
  // This ensures that all APIs receive uniform CORS protection, without manual addition
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const corsHeaders = createCorsHeaders(origin);

    // Add CORS headers to the response
    corsHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });

    console.log(
      `[Middleware] Add CORS headers to API route: ${pathname}${origin ? ` (Origin: ${origin})` : ' (No Origin header)'}`
    );
  }

  // Highest priority: If the user directly accesses /chat, redirect to /chat/new
  // This ensures that always starts from a clear new conversation state.
  if (pathname === '/chat') {
    const newChatUrl = new URL('/chat/new', request.url);
    console.log(
      `[Middleware] Exact /chat match. Redirecting to ${newChatUrl.toString()}`
    );
    return NextResponse.redirect(newChatUrl);
  }

  // Check if it is an SSO login success callback, if so, temporarily skip authentication check
  // Allow the frontend to handle the SSO session establishment
  const ssoLoginSuccess = url.searchParams.get('sso_login') === 'success';
  const hasSsoUserCookie = request.cookies.get('sso_user_data');
  const hasSsoSecureCookie = request.cookies.get('sso_user_data_secure');

  // If it is an SSO login success callback or there is an SSO user data cookie, temporarily skip authentication check
  // Allow the frontend component to establish a Supabase session
  if (ssoLoginSuccess || hasSsoUserCookie || hasSsoSecureCookie) {
    console.log(
      `[Middleware] SSO session detected, allowing request to ${pathname}`
    );
    return response;
  }

  // Create Supabase client
  const cookieStore = {
    get: (name: string) => {
      return request.cookies.get(name)?.value;
    },
    set: (name: string, value: string, options: CookieOptions) => {
      // Setting cookies in the middleware requires through response
      response.cookies.set(name, value, options);
    },
    remove: (name: string, options: CookieOptions) => {
      // Deleting cookies in the middleware requires through response
      response.cookies.set({
        name,
        value: '',
        ...options,
        maxAge: 0,
      });
    },
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore,
    }
  );

  // 🔒 Security fix: Use getUser() instead of getSession()
  // getUser() will verify the authenticity of the JWT token with the Supabase Auth server
  // Prevent privilege escalation attacks caused by tampering with local cookies
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Handle authentication errors
  if (authError) {
    console.log(`[Middleware] Auth verification failed: ${authError.message}`);
  }

  // Route protection logic based on user session status
  // In sso mode, prohibit registration-related routes
  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isAdminRoute = pathname.startsWith('/admin');

  // Authentication-related page definitions (pages that should not be accessed by logged-in users)
  const isAuthPage =
    pathname === '/login' ||
    pathname.startsWith('/register') ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/phone-login';

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/about' ||
    pathname.startsWith('/sso/processing') ||
    (process.env.NEXT_PUBLIC_SSO_ONLY_MODE !== 'true' && isAuthPage) ||
    (process.env.NEXT_PUBLIC_SSO_ONLY_MODE === 'true' && pathname === '/login');

  // Enable route protection logic, ensuring that users who are not logged in cannot access protected routes
  if (!user && !isAuthRoute && !isApiRoute && !isPublicRoute) {
    console.log(
      `[Middleware] User not authenticated, redirecting protected route ${pathname} to /login`
    );
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 🔒 Secure admin route permission check
  // Use user.id that has been verified by the server instead of session.user.id that may be tampered with
  if (user && isAdminRoute) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id) // 🔒 Use user.id that has been verified by the server
        .single();

      if (error || !profile || profile.role !== 'admin') {
        console.log(
          `[Middleware] Non-admin user attempting to access admin route ${pathname}, redirecting to /`
        );
        return NextResponse.redirect(new URL('/', request.url));
      }
      console.log(`[Middleware] Admin user accessing ${pathname}`);
    } catch (error) {
      console.error(`[Middleware] Error checking admin permissions:`, error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // When a logged-in user accesses the root directory or authentication page, redirect to the new chat page
  if (user && (pathname === '/' || isAuthPage)) {
    console.log(
      `[Middleware] User logged in, redirecting ${pathname} to /chat/new`
    );
    return NextResponse.redirect(new URL('/chat/new', request.url));
  }

  return response;
}

// Configure the paths matched by the middleware
export const config = {
  matcher: [
    // Exclude static files and server-side APIs
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/chat', // Ensure /chat is intercepted to redirect
    '/chat/:path*', // Intercept all paths under /chat
    '/admin/:path*', // Intercept all paths under /admin
  ],
};
