'use client';

import { Button } from '@components/ui/button';
import { useTheme } from '@lib/hooks/use-theme';
import { createClient } from '@lib/supabase/client';
import type { PublicSsoProvider, SsoProvider } from '@lib/types/database';
import { cn } from '@lib/utils';
import { clearCacheOnLogin } from '@lib/utils/cache-cleanup';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

// SSO登录按钮组件
// 提供统一的SSO登录入口界面
interface SSOButtonProps {
  returnUrl?: string;
  className?: string;
  variant?: 'gradient' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
  providerId?: string; // 特定提供商ID
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

      // SSO登录前先清理前一个用户的缓存，防止数据污染
      clearCacheOnLogin();

      // 构建SSO登录URL
      const params = new URLSearchParams();
      if (returnUrl) {
        params.set('returnUrl', returnUrl);
      }

      // 动态构建SSO登录URL
      const ssoLoginUrl = providerId
        ? `/api/sso/${providerId}/login${params.toString() ? '?' + params.toString() : ''}`
        : `/api/sso/cas/login${params.toString() ? '?' + params.toString() : ''}`;

      // 重定向到SSO登录接口
      window.location.href = ssoLoginUrl;
    } catch (error) {
      console.error('[SSO登录] 启动SSO登录失败:', error);
      setIsLoading(false);

      // 显示错误提示
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

// 带有详细说明的SSO登录卡片 - 动态获取所有启用的SSO提供商
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

        // 使用安全的公开视图获取所有启用的SSO提供商
        // 按display_order排序，支持多个提供商
        const { data: providers, error } = await supabase
          .from('public_sso_providers')
          .select('*');

        console.log('=== SSO安全查询 ===');
        console.log('启用的SSO提供商:', providers);
        console.log('查询错误:', error);

        if (error) {
          throw new Error(error.message);
        }

        // 确保数据按display_order排序（数据库已排序，但防止意外）
        const sortedProviders = (providers || []).sort((a, b) => {
          // display_order为null的排在最后
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
        {/* Title and description */}
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

        {/* SSO登录按钮列表 - 按display_order排序显示 */}
        <div className="space-y-3">
          {providers.map(provider => {
            // 使用新的settings字段，包含过滤后的完整配置
            const settings = provider.settings as any;
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
