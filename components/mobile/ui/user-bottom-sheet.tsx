'use client';

import { VersionTag } from '@components/ui';
import { useProfile } from '@lib/hooks/use-profile';
import { cn } from '@lib/utils';
import { Info, LogOut, Sliders, UserCircle, Wrench } from 'lucide-react';

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

export function UserBottomSheet({
  isOpen,
  onClose,
  isLoggedIn,
  onLogoutClick,
}: UserBottomSheetProps) {
  const router = useRouter();
  const t = useTranslations('mobile.user');
  const tBottomSheet = useTranslations('mobile.bottomSheet');
  const tMenu = useTranslations('mobile.menu');
  const tRoles = useTranslations('pages.settings.profileSettings.roles');

  const { profile } = useProfile();
  const userName = profile?.full_name || profile?.username || t('defaultUser');
  const userRole =
    profile?.role === 'admin'
      ? tRoles('admin')
      : profile?.role === 'manager'
        ? tRoles('manager')
        : tRoles('user');
  const handleLogin = () => {
    router.push('/login');
    onClose();
  };

  const handleRegister = () => {
    router.push('/register');
    onClose();
  };

  const handleLogout = () => {
    if (onLogoutClick) {
      onLogoutClick();
      onClose();
    }
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    danger: boolean = false,
    showVersion: boolean = false
  ) => (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-lg px-4 py-3',
        danger
          ? 'text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300'
          : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-stone-200',
        'transition-colors duration-200'
      )}
    >
      <span className="mr-3 flex-shrink-0">{icon}</span>
      <span className="font-serif font-medium">{label}</span>
      {showVersion && (
        <span className="ml-auto">
          <VersionTag variant="tag" size="xs" />
        </span>
      )}
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
          <div
            className={cn(
              'mb-3 rounded-lg px-3 py-2',
              'bg-stone-100/80 dark:bg-stone-700/30'
            )}
          >
            <div
              className={cn(
                'font-serif font-medium',
                'text-stone-800 dark:text-white'
              )}
            >
              {userName}
            </div>
            <div
              className={cn(
                'font-serif text-sm',
                'text-stone-500 dark:text-stone-400'
              )}
            >
              {userRole}
            </div>
          </div>

          <div
            className={cn(
              'space-y-1 overflow-hidden rounded-lg',
              'bg-stone-50 dark:bg-stone-800/50',
              'border',
              'border-stone-200 dark:border-stone-700',
              'mb-2'
            )}
          >
            {profile?.role === 'admin' &&
              renderMenuItem(
                <Wrench className="h-5 w-5" />,
                tMenu('adminPanel'),
                () => {
                  router.push('/admin');
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
              <Info className="h-5 w-5" />,
              tMenu('about'),
              () => {
                router.push('/about');
                onClose();
              },
              false,
              true
            )}
          </div>

          <div
            className={cn(
              'overflow-hidden rounded-lg',
              'bg-stone-50 dark:bg-stone-800/50',
              'border',
              'border-stone-200 dark:border-stone-700'
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
              'bg-stone-100 text-stone-600 dark:bg-stone-700/50 dark:text-stone-300'
            )}
          >
            <UserCircle
              className={cn(
                'mx-auto mb-3 h-16 w-16',
                'text-stone-500 dark:text-stone-400'
              )}
            />
            <p className="font-serif">{t('loginPrompt')}</p>
          </div>

          <button
            onClick={handleLogin}
            className={cn(
              'w-full rounded-lg px-4 py-3 text-center font-serif font-medium',
              'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
              'shadow-sm transition-colors duration-200'
            )}
          >
            {tMenu('login')}
          </button>

          <button
            onClick={handleRegister}
            className={cn(
              'w-full rounded-lg px-4 py-3 text-center font-serif font-medium',
              'bg-stone-200 text-stone-700 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-200 dark:hover:bg-stone-600',
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
