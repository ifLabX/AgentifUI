'use client';

import { LogoutConfirmDialog, UserAvatar, VersionTag } from '@components/ui';
import { useProfile } from '@lib/hooks/use-profile';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';
import { Clock, Info, LogOut, Sliders, UserCircle, Wrench } from 'lucide-react';

import React, { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export function DesktopUserAvatar() {
  const { isDark } = useThemeColors();
  const router = useRouter();
  const t = useTranslations('navbar.user');
  const tRoles = useTranslations('pages.settings.profileSettings.roles');
  const { profile } = useProfile();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(prev => {
      if (prev) {
        setHoveredItem(null);
      }
      return !prev;
    });
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsDropdownOpen(false);
    setHoveredItem(null);
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
    setIsDropdownOpen(false);
    setHoveredItem(null);
  };

  const menuItems = [
    {
      icon: Clock,
      label: t('history'),
      action: () => router.push('/chat/history'),
    },
    {
      icon: Sliders,
      label: t('settings'),
      action: () => router.push('/settings'),
    },
    {
      icon: Info,
      label: t('about'),
      action: () => router.push('/about'),
    },
  ];

  const adminMenuItems = [
    {
      icon: Wrench,
      label: t('admin'),
      action: () => router.push('/admin'),
    },
  ];

  const allMenuItems =
    profile?.role === 'admin' ? [...menuItems, ...adminMenuItems] : menuItems;

  const isLoggedIn = !!profile;
  const userName = profile?.full_name || profile?.username || t('userMenu');
  const userRole =
    profile?.role === 'admin'
      ? tRoles('admin')
      : profile?.role === 'manager'
        ? tRoles('manager')
        : tRoles('user');
  const avatarUrl = profile?.avatar_url;

  return (
    <>
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
      />

      <div className="relative mr-1">
        <button
          ref={triggerRef}
          onClick={toggleDropdown}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:ring-2 hover:ring-stone-400/50 focus:ring-2 focus:ring-stone-400/50 focus:outline-none"
          aria-label={isLoggedIn ? t('userMenu') : t('login')}
        >
          {isLoggedIn ? (
            <UserAvatar
              avatarUrl={avatarUrl}
              userName={userName}
              size="lg"
              className="h-9 w-9 transition-all duration-200"
            />
          ) : (
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200',
                isDark
                  ? 'border-stone-600 bg-stone-700 text-stone-200'
                  : 'border-stone-300 bg-stone-100 text-stone-600'
              )}
            >
              <UserCircle size={18} />
            </div>
          )}
        </button>
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              'animate-slide-in-down absolute top-12 -right-2 z-50 w-64 rounded-xl border p-2 shadow-xl',
              isDark
                ? 'border-stone-600 bg-stone-800'
                : 'border-stone-200 bg-stone-50'
            )}
          >
            {isLoggedIn ? (
              <>
                <div
                  className={cn(
                    'mb-2 rounded-lg p-3',
                    isDark ? 'bg-stone-700/50' : 'bg-stone-200/80'
                  )}
                >
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate font-serif text-sm font-semibold',
                          isDark ? 'text-stone-100' : 'text-stone-900'
                        )}
                      >
                        {userName}
                      </p>
                      <p
                        className={cn(
                          'truncate font-serif text-xs',
                          isDark ? 'text-stone-300' : 'text-stone-600'
                        )}
                      >
                        {userRole}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    'mb-2 h-px w-full',
                    isDark ? 'bg-stone-600' : 'bg-stone-200'
                  )}
                />

                <div className="space-y-1">
                  {allMenuItems.map((item, index) => {
                    const itemKey = `menu-${index}`;
                    const isHovered = hoveredItem === itemKey;

                    return (
                      <button
                        key={index}
                        onClick={() => handleMenuItemClick(item.action)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 focus:outline-none',
                          isDark
                            ? isHovered
                              ? 'bg-stone-700 text-stone-200'
                              : 'bg-transparent text-stone-200'
                            : isHovered
                              ? 'bg-stone-200 text-stone-800'
                              : 'bg-transparent text-stone-700'
                        )}
                        onMouseEnter={() => setHoveredItem(itemKey)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <item.icon
                          className={cn(
                            'h-4 w-4',
                            isDark ? 'text-stone-400' : 'text-stone-500'
                          )}
                        />
                        <span
                          className={cn(
                            'flex-1 font-serif text-sm',
                            isDark ? 'text-stone-200' : 'text-stone-700'
                          )}
                        >
                          {item.label}
                        </span>
                        {item.label === t('about') && (
                          <span className="ml-auto">
                            <VersionTag variant="tag" size="xs" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div
                  className={cn(
                    'my-2 h-px w-full',
                    isDark ? 'bg-stone-600' : 'bg-stone-200'
                  )}
                />

                <button
                  onClick={handleLogout}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left font-serif text-sm transition-colors duration-150 focus:outline-none',
                    'text-red-600',
                    hoveredItem === 'logout'
                      ? isDark
                        ? 'bg-red-900/20'
                        : 'bg-red-50'
                      : 'bg-transparent'
                  )}
                  onMouseEnter={() => setHoveredItem('logout')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-serif text-sm">{t('logout')}</span>
                </button>
              </>
            ) : (
              <div className="p-4">
                <div
                  className={cn(
                    'mb-6 rounded-xl px-4 py-6 text-center',
                    isDark
                      ? 'bg-stone-700/50 text-stone-200'
                      : 'bg-stone-200/80 text-stone-600'
                  )}
                >
                  <UserCircle
                    className={cn(
                      'mx-auto mb-3 h-16 w-16',
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    )}
                  />
                  <p className="font-serif font-medium">{t('loginPrompt')}</p>
                  <p className="mt-1 font-serif text-sm opacity-75">
                    {t('loginDescription')}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() =>
                      handleMenuItemClick(() => router.push('/login'))
                    }
                    className={cn(
                      'w-full transform rounded-xl px-4 py-3 text-center font-serif font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl',
                      hoveredItem === 'login' ? 'bg-stone-700' : 'bg-stone-600'
                    )}
                    onMouseEnter={() => setHoveredItem('login')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('login')}
                  </button>

                  <button
                    onClick={() =>
                      handleMenuItemClick(() => router.push('/register'))
                    }
                    className={cn(
                      'w-full transform rounded-xl border px-4 py-3 text-center font-serif font-medium shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                      hoveredItem === 'register'
                        ? isDark
                          ? 'border-stone-600 bg-stone-600 text-stone-100'
                          : 'border-stone-300 bg-stone-300 text-stone-800'
                        : isDark
                          ? 'border-stone-600 bg-stone-700 text-stone-200'
                          : 'border-stone-300 bg-stone-100 text-stone-700'
                    )}
                    onMouseEnter={() => setHoveredItem('register')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('register')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
