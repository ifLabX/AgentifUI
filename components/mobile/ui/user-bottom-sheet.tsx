'use client';

import { useLogout } from '@lib/hooks/use-logout';
import { useProfile } from '@lib/hooks/use-profile';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { Clock, LogOut, Moon, Sliders, Sun, UserCircle } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { BottomSheet } from './bottom-sheet';

interface UserBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLogoutClick?: () => void;
}

/**
 * 用户底部弹出框内容组件
 * 根据用户登录状态显示不同内容
 * 登录状态：显示用户信息和操作按钮（设置、主题切换、退出登录等）
 * 未登录状态：显示登录、注册按钮
 */
export function UserBottomSheet({
  isOpen,
  onClose,
  isLoggedIn,
  onLogoutClick,
}: UserBottomSheetProps) {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useLogout();
  const router = useRouter();
  const t = useTranslations('mobile.user');
  const tBottomSheet = useTranslations('mobile.bottomSheet');
  const tMenu = useTranslations('mobile.menu');
  const tRoles = useTranslations('pages.settings.profileSettings.roles');

  // 使用 useProfile hook 获取用户信息
  const { profile } = useProfile();

  // 从 profile 中提取用户信息
  const userName = profile?.full_name || profile?.username || t('defaultUser');
  const userRole =
    profile?.role === 'admin'
      ? tRoles('admin')
      : profile?.role === 'manager'
        ? tRoles('manager')
        : tRoles('user'); // 显示用户角色而不是固定的"群组系统"

  // 处理登录
  const handleLogin = () => {
    router.push('/login');
    onClose();
  };

  // 处理注册
  const handleRegister = () => {
    router.push('/register');
    onClose();
  };

  // 处理退出登录 - 触发确认对话框
  const handleLogout = () => {
    if (onLogoutClick) {
      onLogoutClick();
      onClose();
    }
  };

  // 渲染菜单项
  const renderMenuItem = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    danger: boolean = false
  ) => (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-lg px-4 py-3',
        // 亮色/暗色模式样式
        isDark
          ? danger
            ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300'
            : 'text-stone-300 hover:bg-stone-700 hover:text-stone-200'
          : danger
            ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
            : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
        // 共用样式
        'transition-colors duration-200'
      )}
    >
      <span className="mr-3 flex-shrink-0">{icon}</span>
      <span className="font-serif font-medium">{label}</span>
    </button>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isLoggedIn ? tBottomSheet('userMenu') : tBottomSheet('account')}
    >
      {isLoggedIn ? (
        <div className="flex flex-col">
          {/* 用户信息区域 - 简洁设计 */}
          <div
            className={cn(
              'mb-3 rounded-lg px-3 py-2',
              isDark ? 'bg-stone-700/30' : 'bg-stone-100/80'
            )}
          >
            <div
              className={cn(
                'font-serif font-medium',
                isDark ? 'text-white' : 'text-stone-800'
              )}
            >
              {userName}
            </div>
            <div
              className={cn(
                'font-serif text-sm',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            >
              {userRole}
            </div>
          </div>

          {/* 菜单选项 */}
          <div
            className={cn(
              'space-y-1 overflow-hidden rounded-lg',
              isDark ? 'bg-stone-800/50' : 'bg-stone-50',
              'border',
              isDark ? 'border-stone-700' : 'border-stone-200',
              'mb-2'
            )}
          >
            {renderMenuItem(
              <Clock className="h-5 w-5" />,
              tMenu('history'),
              () => {
                router.push('/chat/history');
                onClose();
              }
            )}

            {renderMenuItem(
              <Sliders className="h-5 w-5" />,
              tMenu('settings'),
              () => {
                router.push('/settings');
                onClose();
              }
            )}

            {renderMenuItem(
              isDark ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5" />
              ),
              isDark ? tMenu('lightMode') : tMenu('darkMode'),
              toggleTheme
            )}
          </div>

          {/* 退出登录按钮（单独分组） */}
          <div
            className={cn(
              'overflow-hidden rounded-lg',
              isDark ? 'bg-stone-800/50' : 'bg-stone-50',
              'border',
              isDark ? 'border-stone-700' : 'border-stone-200'
            )}
          >
            {renderMenuItem(
              <LogOut className="h-5 w-5" />,
              tMenu('logout'),
              handleLogout,
              true
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div
            className={cn(
              'mb-4 rounded-lg px-4 py-4 text-center',
              isDark
                ? 'bg-stone-700/50 text-stone-300'
                : 'bg-stone-100 text-stone-600'
            )}
          >
            <UserCircle
              className={cn(
                'mx-auto mb-3 h-16 w-16',
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}
            />
            <p className="font-serif">{t('loginPrompt')}</p>
          </div>

          <button
            onClick={handleLogin}
            className={cn(
              'w-full rounded-lg px-4 py-3 text-center font-serif font-medium',
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600',
              'shadow-sm transition-colors duration-200'
            )}
          >
            {tMenu('login')}
          </button>

          <button
            onClick={handleRegister}
            className={cn(
              'w-full rounded-lg px-4 py-3 text-center font-serif font-medium',
              isDark
                ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300',
              'shadow-sm transition-colors duration-200'
            )}
          >
            {tMenu('register')}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
