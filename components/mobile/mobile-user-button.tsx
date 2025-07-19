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
 * Mobile sidebar user button component
 * Click to trigger bottom popup
 * Style consistent with other sidebar buttons
 */
export function MobileUserButton() {
  const { isDark } = useTheme();
  const isMobile = useMobile();
  const { isExpanded } = useSidebarStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const t = useTranslations('mobile.user');
  const tNav = useTranslations('mobile.navigation');

  // Use useProfile hook to get user information
  const { profile } = useProfile();

  // Extract user information from profile
  const isLoggedIn = !!profile;
  const userName =
    profile?.full_name ||
    profile?.username ||
    (isLoggedIn ? t('defaultUser') : t('loginRegister'));
  const avatarUrl = profile?.avatar_url;

  // Open bottom popup
  const handleOpenBottomSheet = () => {
    setIsOpen(true);
  };

  // Close bottom popup
  const handleCloseBottomSheet = () => {
    setIsOpen(false);
  };

  // Do not display content on non-mobile devices, but keep the component structure to ensure Hooks are executed correctly
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Logout confirmation dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      />

      <button
        data-nav-button="true"
        onClick={handleOpenBottomSheet}
        className={cn(
          'relative flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium',
          'transition-all duration-200 ease-in-out',
          'cursor-pointer outline-none',

          // Apply different styles based on theme and login status
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
        {/* Left avatar */}
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

        {/* Right text, only displayed when expanded */}
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
