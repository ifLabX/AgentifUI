import { encryptApiKey } from '@lib/utils/encryption';

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { CookieOptions, createServerClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for server-side operations.
 * This is a helper function to abstract the client creation process.
 * @returns A Supabase client instance.
 */
function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await (await cookieStore).get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          (await cookieStore).set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          (await cookieStore).set({ name, value: '', ...options });
        },
      },
    }
  );
}

/**
 * POST handler for encrypting an API key.
 * This endpoint is for admin use only.
 * @param request - The NextRequest object.
 * @returns A NextResponse object with the encrypted key or an error message.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // authenticate user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // get request data
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
    }

    // get encryption key from environment variables
    const masterKey = process.env.API_ENCRYPTION_KEY;

    if (!masterKey) {
      console.error('API_ENCRYPTION_KEY environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error: encryption key not set' },
        { status: 500 }
      );
    }

    // encrypt the API key
    const encryptedKey = encryptApiKey(apiKey, masterKey);

    // return the encrypted key
    return NextResponse.json({ encryptedKey });
  } catch (error) {
    console.error('Error encrypting API key:', error);
    return NextResponse.json(
      { error: 'Error encrypting API key' },
      { status: 500 }
    );
  }
}
