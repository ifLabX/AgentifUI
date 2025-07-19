'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

import React from 'react';

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

// NavBar exclusive reusable button component
// Designed as rounded, responsive, and supports light/dark theme
export function NavButton({
  icon,
  children,
  className,
  ...props
}: NavButtonProps) {
  const { isDark } = useTheme();

  return (
    <button
      className={cn(
        // Basic style
        'flex items-center justify-center gap-2 rounded-md px-3 py-1.5 transition-colors duration-150',
        // Font and size (can be adjusted as needed)
        'text-sm font-medium',
        // Responsive adjustment (if needed)
        // "sm:px-4 sm:py-2",
        // Theme-aware hover effect
        isDark
          ? 'text-gray-300 hover:bg-gray-700/50 hover:text-gray-100'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        // Disabled state
        'disabled:pointer-events-none disabled:opacity-50',
        // External class name passed in
        className
      )}
      {...props}
    >
      {icon && <span className="h-4 w-4 flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
