'use client';

import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { createClient } from '@lib/supabase/client';
import { cn } from '@lib/utils';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * SSO处理页面
 *
 * 用于显示SSO登录处理状态，替代跳转到login页面
 * 包含加载指示器和状态信息
 */

export default function SSOProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { colors, isDark } = useThemeColors();
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
      // --- 防止重复处理 ---
      if (hasProcessedRef.current || isProcessingRef.current) {
        return;
      }

      hasProcessedRef.current = true;
      isProcessingRef.current = true;

      try {
        // --- 获取URL参数 ---
        const ssoLogin = searchParams.get('sso_login');
        const welcome = searchParams.get('welcome');
        const redirectTo = searchParams.get('redirect_to') || '/chat';
        const userId = searchParams.get('user_id');
        const userEmail = searchParams.get('user_email');

        if (ssoLogin !== 'success' || !userId || !userEmail) {
          throw new Error(t('errors.missingParams'));
        }

        setMessage(t('welcome', { name: welcome || 'User' }));

        // --- 读取SSO用户数据cookie ---
        const ssoUserCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('sso_user_data='));

        if (!ssoUserCookie) {
          throw new Error(t('errors.userDataNotFound'));
        }

        // 提取cookie值（去掉cookie名称部分）
        let cookieValue = ssoUserCookie.split('=')[1];

        // 调试：输出cookie原始值
        console.log('Raw cookie value:', cookieValue);
        console.log('Cookie value starts with %:', cookieValue.startsWith('%'));

        // 尝试URL解码（如果需要的话）
        if (cookieValue.startsWith('%')) {
          cookieValue = decodeURIComponent(cookieValue);
          console.log('After decodeURIComponent:', cookieValue);
        }

        const ssoUserData = JSON.parse(cookieValue);

        // --- 检查数据是否过期 ---
        if (Date.now() > ssoUserData.expiresAt) {
          throw new Error(t('errors.sessionExpired'));
        }

        setMessage(t('verifying'));

        // --- 调用SSO登录API ---
        const response = await fetch('/api/auth/sso-signin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
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

          // --- 验证会话是否真正建立 ---
          const supabase = createClient();
          const {
            data: { user },
            error: getUserError,
          } = await supabase.auth.getUser();

          if (getUserError || !user) {
            throw new Error(t('errors.sessionValidationFailed'));
          }

          console.log('会话验证成功，用户ID:', user.id);

          // --- 清理会话cookie ---
          document.cookie =
            'sso_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

          setStatus('success');
          setMessage(t('success'));

          // --- 跳转到目标页面 ---
          setTimeout(() => {
            console.log(`准备跳转到: ${redirectTo}`);
            router.replace(redirectTo);
          }, 1000);
        } else {
          throw new Error(t('errors.noValidSessionData'));
        }
      } catch (err: any) {
        console.error('SSO处理失败:', err);
        setStatus('error');
        setError(err.message || t('errors.processingFailed'));
        setMessage(t('failed'));

        // --- 清理可能存在的会话cookie ---
        document.cookie =
          'sso_user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // --- 3秒后跳转到登录页面 ---
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
    <div
      className={cn(
        'flex min-h-screen items-center justify-center',
        colors.mainBackground.tailwind
      )}
    >
      <div
        className={cn(
          'mx-4 w-full max-w-md space-y-6 rounded-xl border p-8 text-center shadow-lg',
          isDark
            ? 'border-stone-800 bg-stone-900'
            : 'border-stone-200 bg-stone-50'
        )}
      >
        {/* --- 标题 --- */}
        <div className="space-y-2">
          <h1 className="bg-gradient-to-r from-stone-700 to-stone-500 bg-clip-text py-1 text-2xl leading-normal font-bold text-transparent">
            {t('title')}
          </h1>
        </div>

        {/* --- 状态指示器 --- */}
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

        {/* --- 状态消息 --- */}
        <div className="space-y-2">
          <p
            className={cn(
              'text-lg font-medium',
              status === 'success'
                ? 'text-stone-600'
                : status === 'error'
                  ? 'text-stone-600'
                  : isDark
                    ? 'text-stone-300'
                    : 'text-stone-700'
            )}
          >
            {message}
          </p>

          {error && (
            <p
              className={cn(
                'text-sm',
                isDark ? 'text-red-400' : 'text-red-600'
              )}
            >
              {error}
            </p>
          )}

          {status === 'error' && (
            <p
              className={cn(
                'mt-4 text-xs',
                isDark ? 'text-stone-400' : 'text-stone-600'
              )}
            >
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
  const { isDark } = useThemeColors();

  return (
    <svg
      className={cn(
        'animate-spin',
        isDark ? 'text-stone-300' : 'text-stone-600'
      )}
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
