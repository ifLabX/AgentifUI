'use client';

import { createClient } from '@lib/supabase/client';
import { cn } from '@lib/utils';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * SSO processing page
 *
 * used to display SSO login processing status, replacing the jump to login page
 * contains loading indicator and status information
 */

export default function SSOProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('pages.auth.sso.processing');

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    'processing'
  );
  const [message, setMessage] = useState(t('processing'));
  const [error, setError] = useState<string>('');

  const hasProcessedRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const handleSSOProcessing = async () => {
      // prevent duplicate processing
      if (hasProcessedRef.current || isProcessingRef.current) {
        return;
      }

      hasProcessedRef.current = true;
      isProcessingRef.current = true;

      try {
        // get URL parameters
        const ssoLogin = searchParams.get('sso_login');
        const welcome = searchParams.get('welcome');
        const redirectTo = searchParams.get('redirect_to') || '/chat';
        const userId = searchParams.get('user_id');
        const userEmail = searchParams.get('user_email');

        if (ssoLogin !== 'success' || !userId || !userEmail) {
          throw new Error(t('errors.missingParams'));
        }

        setMessage(t('welcome', { name: welcome || 'User' }));

        // read SSO user data cookie
        const ssoUserCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('sso_user_data='));

        if (!ssoUserCookie) {
          throw new Error(t('errors.userDataNotFound'));
        }

        // extract cookie value (remove cookie name part)
        let cookieValue = ssoUserCookie.split('=')[1];

        // debug: output cookie original value
        console.log('Raw cookie value:', cookieValue);
        console.log('Cookie value starts with %:', cookieValue.startsWith('%'));

        // try URL decoding (if needed)
        if (cookieValue.startsWith('%')) {
          cookieValue = decodeURIComponent(cookieValue);
          console.log('After decodeURIComponent:', cookieValue);
        }

        const ssoUserData = JSON.parse(cookieValue);

        // check if data has expired
        if (Date.now() > ssoUserData.expiresAt) {
          throw new Error(t('errors.sessionExpired'));
        }

        setMessage(t('verifying'));

        // call SSO login API
        const response = await fetch('/api/auth/sso-signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail,
            ssoUserData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || t('errors.loginFailed'));
        }

        const { session } = await response.json();

        if (session) {
          setMessage(t('sessionCheck'));

          // verify if session is really established
          const supabase = createClient();
          const {
            data: { user },
            error: getUserError,
          } = await supabase.auth.getUser();

          if (getUserError || !user) {
            throw new Error(t('errors.sessionValidationFailed'));
          }

          console.log('Session verification successful, user ID:', user.id);

          // clean up session cookie
          document.cookie =
            'sso_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          // Note: sso_user_data_secure is httpOnly and cannot be cleared by JavaScript
          // It will be automatically cleared by the server or expire after 10 minutes

          setStatus('success');
          setMessage(t('success'));

          // jump to target page
          setTimeout(() => {
            console.log(`Preparing to jump to: ${redirectTo}`);
            router.replace(redirectTo);
          }, 1000);
        } else {
          throw new Error(t('errors.noValidSessionData'));
        }
      } catch (err: unknown) {
        console.error('SSO processing failed:', err);
        let errorMessage = t('errors.processingFailed');

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }

        setStatus('error');
        setError(errorMessage);
        setMessage(t('failed'));

        // clean up possible session cookie
        document.cookie =
          'sso_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // jump to login page after 3 seconds
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      } finally {
        isProcessingRef.current = false;
      }
    };

    handleSSOProcessing();
  }, [searchParams, router, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 dark:bg-stone-800">
      <div className="mx-4 w-full max-w-md space-y-6 rounded-xl border border-stone-200 bg-stone-50 p-8 text-center shadow-lg dark:border-stone-800 dark:bg-stone-900">
        {/* --- title --- */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text py-1 text-2xl leading-normal font-bold text-transparent">
            {t('title')}
          </h1>
        </div>

        {/* --- status indicator --- */}
        <div className="space-y-4">
          {status === 'processing' && (
            <div className="flex items-center justify-center space-x-3">
              <SpinnerIcon size={32} />
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center justify-center">
              <svg
                className="h-8 w-8 text-stone-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center justify-center">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>

        {/* --- status message --- */}
        <div className="space-y-2">
          <p
            className={cn(
              'text-lg font-medium',
              status === 'success'
                ? 'text-stone-600'
                : status === 'error'
                  ? 'text-stone-600'
                  : 'text-stone-700 dark:text-stone-300'
            )}
          >
            {message}
          </p>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {status === 'error' && (
            <p className="mt-4 text-xs text-stone-600 dark:text-stone-400">
              {t('redirecting')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SpinnerIconProps {
  size?: number;
}

function SpinnerIcon({ size = 24 }: SpinnerIconProps) {
  return (
    <svg
      className="animate-spin text-stone-600 dark:text-stone-300"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
