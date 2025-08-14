'use client';

import { useMobile } from '@lib/hooks/use-mobile';
import { cn } from '@lib/utils';
import { MoreHorizontal } from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

interface MoreButtonV2Props
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconClassName?: string;
  isMenuOpen?: boolean; // Whether the dropdown menu is open
  forceVisible?: boolean; // Force display (mobile or other cases)
  disableHover?: boolean; // Whether to disable hover effect (when other menus are open)
}

export const MoreButtonV2 = React.forwardRef<
  HTMLButtonElement,
  MoreButtonV2Props
>(
  (
    {
      className,
      iconClassName,
      isMenuOpen = false,
      forceVisible = false,
      disableHover = false,
      ...props
    },
    ref
  ) => {
    const isMobile = useMobile();
    const t = useTranslations('common.ui.moreButton');

    // Responsive display logic: mobile devices always display, desktop devices display based on hover state
    const shouldForceVisible = isMobile || forceVisible;

    return (
      <button
        ref={ref}
        className={cn(
          'rounded-md p-1.5 transition-all duration-200 ease-in-out',
          'flex items-center justify-center',
          // Responsive display: mobile devices always display, desktop devices display based on hover state
          shouldForceVisible
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
          // Dynamic cursor: do not show pointer when dropdown menu is open
          !isMenuOpen ? 'cursor-pointer' : '',
          // Hover effect: rounded rectangle background
          disableHover ? '' : 'hover:bg-black/8 dark:hover:bg-white/12',
          // Selected state: background effect when dropdown menu is open
          isMenuOpen && 'bg-black/10 dark:bg-white/15',
          // Focus state
          'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        <MoreHorizontal className={cn('h-4 w-4', iconClassName)} />
        <span className="sr-only">{t('ariaLabel')}</span>
      </button>
    );
  }
);

MoreButtonV2.displayName = 'MoreButtonV2';
