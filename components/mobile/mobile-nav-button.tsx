'use client';

import { WidePanelLeft } from '@components/ui';
import { useTheme } from '@lib/hooks/use-theme';
import { useSidebarStore } from '@lib/stores/sidebar-store';
import { cn } from '@lib/utils';
import { ArrowRightToLine } from 'lucide-react';

import { useTranslations } from 'next-intl';

export function MobileNavButton() {
  const { isExpanded, showMobileNav } = useSidebarStore();
  const { isDark } = useTheme();
  const t = useTranslations('mobile.navigation');

  // If the sidebar is expanded, return null, do not render the button
  if (isExpanded) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label={t('openMenu')}
      onClick={showMobileNav}
      className={cn(
        'fixed top-0 left-0 z-50 md:hidden',
        '-translate-x-1 -translate-y-1',
        'group relative flex items-center justify-center',
        'h-10 w-10 rounded-lg',
        'transition-all duration-150 ease-in-out',
        'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'select-none',
        'border border-transparent',
        'cursor-e-resize',
        isDark
          ? 'text-gray-200 focus-visible:ring-stone-500 focus-visible:ring-offset-gray-900'
          : 'focus-visible:ring-primary focus-visible:ring-offset-background text-gray-200'
      )}
    >
      {/* Hover background */}
      <div
        className={cn(
          'absolute inset-0 rounded-lg transition-all duration-150 ease-in-out',
          isDark ? 'group-hover:bg-stone-600/60' : 'group-hover:bg-stone-300/80'
        )}
      />
      {/* Icon body */}
      <span
        className={cn(
          'relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center',
          isDark
            ? 'text-gray-400 group-hover:text-white'
            : 'text-gray-500 group-hover:text-stone-800'
        )}
      >
        {/* Default window icon - fade in and out when hovering */}
        <WidePanelLeft
          className={cn(
            'absolute h-5 w-5 transition-all duration-150 ease-out',
            'group-hover:scale-125 group-hover:opacity-0'
          )}
        />
        {/* Right arrow displayed when hovering */}
        <ArrowRightToLine
          className={cn(
            'absolute h-4 w-4 transition-all duration-150 ease-out',
            'scale-110 opacity-0 group-hover:opacity-100'
          )}
        />
      </span>
    </button>
  );
}
