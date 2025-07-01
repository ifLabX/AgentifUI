'use client';

import { LogoutConfirmDialog, UserAvatar } from '@components/ui';
import { useMobile } from '@lib/hooks/use-mobile';
import { useProfile } from '@lib/hooks/use-profile';
import { useTheme } from '@lib/hooks/use-theme';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { cn } from '@lib/utils';
import { User } from 'lucide-react';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { UserBottomSheet } from './ui/user-bottom-sheet';

/**
 * 移动端侧边栏用户按钮组件
 * 点击触发底部弹出框
 * 样式与侧边栏其他按钮一致
 */
export function MobileUserButton() {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const { isExpanded } = useSidebarStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const t = useTranslations('mobile.user');
  const tNav = useTranslations('mobile.navigation');

  // 使用 useProfile hook 获取用户信息
  const { profile } = useProfile();

  // 从 profile 中提取用户信息
  const isLoggedIn = !!profile;
  const userName =
    profile?.full_name ||
    profile?.username ||
    (isLoggedIn ? t('defaultUser') : t('loginRegister'));
  const avatarUrl = profile?.avatar_url;

  // 打开底部弹出框
  const handleOpenBottomSheet = () => {
    setIsOpen(true);
  };

  // 关闭底部弹出框
  const handleCloseBottomSheet = () => {
    setIsOpen(false);
  };

  // 非移动端不显示内容，但保留组件结构确保Hooks正确执行
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* 退出登录确认对话框 */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      />

      <button
        onClick={handleOpenBottomSheet}
        className={cn(
          'relative flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium',
          'transition-all duration-200 ease-in-out',
          'cursor-pointer outline-none',

          // 根据主题和登录状态应用不同样式
          !isDark && [
            'text-stone-600',
            'hover:bg-stone-300 hover:shadow-md',
            isLoggedIn ? '' : 'text-blue-600',
          ],

          isDark && [
            'text-gray-200',
            'hover:bg-stone-600 hover:shadow-md',
            isLoggedIn ? '' : 'text-blue-400',
          ]
        )}
        aria-label={isLoggedIn ? tNav('openUserMenu') : t('loginRegister')}
      >
        {/* 左侧头像 */}
        <span className="flex h-8 w-8 items-center justify-center">
          {isLoggedIn ? (
            <UserAvatar
              avatarUrl={avatarUrl}
              userName={userName}
              size="sm"
              alt={t('avatarAlt', { userName })}
            />
          ) : (
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                'transition-all duration-200 ease-in-out',
                isDark
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'bg-blue-500/10 text-blue-600'
              )}
            >
              <User className="h-4 w-4" />
            </span>
          )}
        </span>

        {/* 右侧文字，只在展开时显示 */}
        {isExpanded && (
          <span className="ml-3 truncate font-serif">
            {isLoggedIn ? userName : t('loginRegister')}
          </span>
        )}
      </button>

      <UserBottomSheet
        isOpen={isOpen}
        onClose={handleCloseBottomSheet}
        isLoggedIn={!!isLoggedIn}
        onLogoutClick={() => setShowLogoutDialog(true)}
      />
    </>
  );
}
