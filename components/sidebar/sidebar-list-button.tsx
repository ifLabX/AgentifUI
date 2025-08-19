'use client';

import { cn } from '@lib/utils';

import type * as React from 'react';

// SidebarListButton component
// Designed specifically for sidebar list items, with a more compact and elegant style
// Unlike SidebarButton, this component does not occupy the entire sidebar width
// Supports responsive layout, with different behaviors on mobile and desktop
// 🎯 New: support hover separation effect for more button and item area
interface SidebarListButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  active?: boolean;
  isLoading?: boolean;
  moreActionsTrigger?: React.ReactNode;
  isDisabled?: boolean;
  children?: React.ReactNode;
  hasOpenDropdown?: boolean; // Whether there is an open dropdown menu
  disableHover?: boolean; // Whether to disable hover effect (when other menus are open)
}

export function SidebarListButton({
  icon,
  active = false,
  isLoading = false,
  className,
  onClick,
  moreActionsTrigger,
  isDisabled = false,
  hasOpenDropdown = false,
  disableHover = false,
  children,
  ...props
}: SidebarListButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const mockEvent = {
        ...e,
        type: 'click',
      } as unknown as React.MouseEvent<HTMLDivElement>;
      onClick?.(mockEvent);
    }
  };

  // 🎯 Handle the click of the main content area (excluding the more button area)
  const handleMainContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger selection when clicking on the main content area
    handleClick(e);
  };

  return (
    <div
      role="button"
      data-nav-button="true"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      className={cn(
        // Basic style - 🎯 Further reduce the padding to make the button more compact
        // Changed from px-2.5 py-1.5 to px-2 py-1, reducing the overall size
        'group relative flex items-center rounded-lg px-2 py-1 text-sm font-medium',
        'transition-all duration-300 ease-out',

        // Focus state style
        'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-primary focus-visible:ring-offset-background dark:focus-visible:ring-stone-500 dark:focus-visible:ring-offset-gray-900',

        // Disabled state styling
        isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',

        // Base text color - handles both themes
        !isDisabled
          ? 'text-stone-600 dark:text-gray-200'
          : 'text-stone-400 dark:text-gray-500',

        // Selected state styling
        active && !isDisabled && 'bg-stone-300/90 dark:bg-stone-600/80',

        // Hover effect: only show when not selected, not disabled, no dropdown is open
        !active &&
          !isDisabled &&
          !hasOpenDropdown &&
          !disableHover &&
          'hover:bg-stone-300/80 dark:hover:bg-stone-600/60',

        // Responsive width styling
        'w-full', // Default width 100%

        className
      )}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* Main content area: contains icon and text, handles click events */}
      {/* Removed independent hover effects, uses overall hover effect */}
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center',
          // Restore cursor-pointer to ensure the button area has clear interactive prompts
          !isDisabled && 'cursor-pointer'
        )}
        onClick={handleMainContentClick}
      >
        {isLoading ? (
          <span className={cn('flex h-4 w-4 items-center justify-center')}>
            <div
              className={cn(
                'h-3 w-3 animate-pulse rounded-full',
                'bg-stone-400 dark:bg-stone-600',
                'opacity-80'
              )}
            />
          </span>
        ) : (
          icon && (
            <span
              className={cn(
                '-ml-0.5 flex h-4 w-4 items-center justify-center',
                'text-gray-500 dark:text-gray-400'
              )}
            >
              {icon}
            </span>
          )
        )}
        {children && (
          <div
            className={cn('min-w-0 flex-1 truncate', icon ? 'ml-1.5' : 'ml-0')}
          >
            {children}
          </div>
        )}
      </div>

      {/* More Actions area: independent hover and click handling */}
      {/* Uses higher CSS priority to override overall hover effects */}
      {moreActionsTrigger && (
        <div
          className={cn(
            'relative z-10 ml-0.5 flex-shrink-0'
            // 🎯 Independent hover effect for the more button area, covering the overall hover effect
            // Use hover:bg-transparent to "cancel" the parent's hover effect
          )}
          onClick={e => {
            e.stopPropagation(); // Prevent selecting chat items when clicking on the MoreButton area
          }}
        >
          {moreActionsTrigger}
        </div>
      )}
    </div>
  );
}
