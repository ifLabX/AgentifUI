'use client';

import { useProfile } from '@lib/hooks/use-profile';
import { useTheme } from '@lib/hooks/use-theme';
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

/**
 * User bottom sheet content component
 * Display different content based on user login status
 * Login state: display user information and operation buttons (settings, theme switch, logout, etc.)
 * Unlogged state: display login and register buttons
 */
export function UserBottomSheet({
  isOpen,
  onClose,
  isLoggedIn,
  onLogoutClick,
}: UserBottomSheetProps) {
  const { isDark } = useTheme();
  const router = useRouter();
  const t = useTranslations('mobile.user');
  const tBottomSheet = useTranslations('mobile.bottomSheet');
  const tMenu = useTranslations('mobile.menu');
  const tRoles = useTranslations('pages.settings.profileSettings.roles');

  // Use useProfile hook to get user information
  const { profile } = useProfile();

  // Extract user information from profile
  const userName = profile?.full_name || profile?.username || t('defaultUser');
  const userRole =
    profile?.role === 'admin'
      ? tRoles('admin')
      : profile?.role === 'manager'
        ? tRoles('manager')
        : tRoles('user'); // Display user role instead of fixed "group system"

  // Handle login
  const handleLogin = () => {
    router.push('/login');
    onClose();
  };

  // Handle registration
  const handleRegister = () => {
    router.push('/register');
    onClose();
  };

  // Handle logout - trigger confirmation dialog
  const handleLogout = () => {
    if (onLogoutClick) {
      onLogoutClick();
      onClose();
    }
  };

  // Render menu items
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
        // Light/dark mode style
        isDark
          ? danger
            ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300'
            : 'text-stone-300 hover:bg-stone-700 hover:text-stone-200'
          : danger
            ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
            : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
        // Shared style
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
          {/* User information area - simple design */}
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

          {/* Menu options */}
          <div
            className={cn(
              'space-y-1 overflow-hidden rounded-lg',
              isDark ? 'bg-stone-800/50' : 'bg-stone-50',
              'border',
              isDark ? 'border-stone-700' : 'border-stone-200',
              'mb-2'
            )}
          >
            {profile?.role === 'admin' &&
              renderMenuItem(
                <Wrench className="h-5 w-5" />, // Admin backend
                tMenu('adminPanel'),
                () => {
                  router.push('/admin');
                  onClose();
                }
              )}

            {renderMenuItem(
              <Sliders className="h-5 w-5" />, // Settings
              tMenu('settings'),
              () => {
                router.push('/settings');
                onClose();
              }
            )}

            {renderMenuItem(
              <Info className="h-5 w-5" />, // About
              tMenu('about'),
              () => {
                router.push('/about');
                onClose();
              }
            )}
          </div>

          {/* Logout button (separate group) */}
          <div
            className={cn(
              'overflow-hidden rounded-lg',
              isDark ? 'bg-stone-800/50' : 'bg-stone-50',
              'border',
              isDark ? 'border-stone-700' : 'border-stone-200'
            )}
          >
            {renderMenuItem(
              <LogOut className="h-5 w-5" />, // Logout
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
