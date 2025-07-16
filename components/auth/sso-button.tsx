'use client';

import { Button } from '@components/ui/button';
import { useTheme } from '@lib/hooks/use-theme';
import { createClient } from '@lib/supabase/client';
import type { PublicSsoProvider } from '@lib/types/database';
import { cn } from '@lib/utils';
import { clearCacheOnLogin } from '@lib/utils/cache-cleanup';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface SSOButtonProps {
  returnUrl?: string;
  className?: string;
  variant?: 'gradient' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
  providerId?: string; // specific provider ID
}

export function SSOButton({
  returnUrl,
  className,
  variant = 'gradient',
  size = 'default',
  disabled = false,
  children,
  providerId,
}: SSOButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('pages.auth.sso');

  const handleSSOLogin = async () => {
    try {
      setIsLoading(true);

      clearCacheOnLogin();

      const params = new URLSearchParams();
      if (returnUrl) {
        params.set('returnUrl', returnUrl);
      }

      const ssoLoginUrl = providerId
        ? `/api/sso/${providerId}/login${params.toString() ? '?' + params.toString() : ''}`
        : `/api/sso/cas/login${params.toString() ? '?' + params.toString() : ''}`;
      window.location.href = ssoLoginUrl;
    } catch (error) {
      console.error('[SSO login] failed to start SSO login:', error);
      setIsLoading(false);

      alert(t('startError'));
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        'relative flex w-full items-center justify-center gap-2 font-serif',
        className
      )}
      disabled={disabled || isLoading}
      onClick={handleSSOLogin}
    >
      {isLoading && (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {isLoading ? t('jumpingButton') : children || t('button')}
    </Button>
  );
}

export function SSOCard({
  returnUrl,
  className,
}: {
  returnUrl?: string;
  className?: string;
}) {
  const [providers, setProviders] = useState<PublicSsoProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const t = useTranslations('pages.auth.sso');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        const { data: providers, error } = await supabase
          .from('public_sso_providers')
          .select('*');

        if (error) {
          throw new Error(error.message);
        }

        const sortedProviders = (providers || []).sort((a, b) => {
          if (a.display_order === null && b.display_order === null)
            return a.name.localeCompare(b.name);
          if (a.display_order === null) return 1;
          if (b.display_order === null) return -1;
          return a.display_order - b.display_order;
        });

        setProviders(sortedProviders);
      } catch (err) {
        console.error('Error fetching SSO providers:', err);
        setError(err instanceof Error ? err.message : t('startError'));
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [t]);

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-lg border p-6 shadow-sm',
          'font-serif transition-shadow hover:shadow-md',
          isDark
            ? 'border-stone-700 bg-stone-800 shadow-stone-900/30'
            : 'border-gray-200 bg-white',
          className
        )}
      >
        <div className="space-y-4 text-center">
          <Button variant="outline" disabled className="w-full">
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t('processing.processing')}
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border p-6 shadow-sm',
          'font-serif transition-shadow hover:shadow-md',
          isDark
            ? 'border-stone-700 bg-stone-800 shadow-stone-900/30'
            : 'border-gray-200 bg-white',
          className
        )}
      >
        <div className="space-y-4 text-center">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border p-6 shadow-sm',
          'font-serif transition-shadow hover:shadow-md',
          isDark
            ? 'border-stone-700 bg-stone-800 shadow-stone-900/30'
            : 'border-gray-200 bg-white',
          className
        )}
      >
        <div className="space-y-4 text-center">
          <div
            className={cn(
              'text-sm',
              isDark ? 'text-stone-400' : 'text-gray-500'
            )}
          >
            {t('noProvider')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-6 shadow-sm',
        'font-serif transition-shadow hover:shadow-md',
        isDark
          ? 'border-stone-700 bg-stone-800 shadow-stone-900/30'
          : 'border-gray-200 bg-white',
        className
      )}
    >
      <div className="space-y-4 text-center">
        <div>
          <h3
            className={cn(
              'font-serif text-lg font-semibold',
              isDark ? 'text-stone-100' : 'text-gray-900'
            )}
          >
            {t('title')}
          </h3>
          <p
            className={cn(
              'mt-1 font-serif text-sm',
              isDark ? 'text-stone-300' : 'text-gray-600'
            )}
          >
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {providers.map(provider => {
            // use new settings field, include filtered full config
            const settings = provider.settings as {
              ui?: { displayName?: string; icon?: string };
            };
            const uiSettings = settings?.ui || {};
            const displayName =
              uiSettings?.displayName || provider.button_text || provider.name;
            const icon = uiSettings?.icon || '🏛️';

            return (
              <SSOButton
                key={provider.id}
                returnUrl={returnUrl}
                providerId={provider.id}
                variant="gradient"
                className="w-full font-serif"
              >
                <span className="mr-2">{icon}</span>
                {displayName}
              </SSOButton>
            );
          })}
        </div>

        {/* Help information */}
        <div
          className={cn(
            'font-serif text-xs',
            isDark ? 'text-stone-400' : 'text-gray-500'
          )}
        >
          <p>{t('helpText')}</p>
          <p>{t('contactText')}</p>
        </div>
      </div>
    </div>
  );
}
