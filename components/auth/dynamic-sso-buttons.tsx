'use client';

import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { useTheme } from '@lib/hooks/use-theme';
import type { PublicSsoProvider } from '@lib/types/sso/auth-types';
import { cn } from '@lib/utils';
import { Shield } from 'lucide-react';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

export function DynamicSsoButtons() {
  const [providers, setProviders] = useState<PublicSsoProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const t = useTranslations('pages.auth.login');

  const enableDynamicSso =
    process.env.NEXT_PUBLIC_ENABLE_DYNAMIC_SSO === 'true';

  useEffect(() => {
    if (!enableDynamicSso) {
      setIsLoading(false);
      return;
    }

    async function fetchSsoProviders() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/sso/providers');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch SSO providers');
        }
        const data: PublicSsoProvider[] = await response.json();
        setProviders(data);
      } catch (e: any) {
        console.error('SSO Provider fetch error:', e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSsoProviders();
  }, [enableDynamicSso]);

  const handleSsoLogin = (providerId: string) => {
    window.location.href = `/api/sso/${providerId}/login`;
  };

  if (!enableDynamicSso) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'rounded-lg border-l-4 border-red-500 p-4 text-sm font-semibold',
          isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'
        )}
      >
        {t('errors.ssoLoadFailed')}: {error}
      </div>
    );
  }

  if (providers.length === 0) {
    // Optionally, render nothing or a message if no providers are enabled
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {providers.map(provider => (
        <Button
          key={provider.id}
          variant="outline"
          type="button"
          onClick={() => handleSsoLogin(provider.id)}
          className="flex items-center justify-center gap-2"
        >
          <Shield className="h-4 w-4" />
          <span>{provider.button_text || provider.name}</span>
        </Button>
      ))}
    </div>
  );
}
