'use client';

import { cn } from '@lib/utils';
import { X } from 'lucide-react';

import * as React from 'react';

export interface CloseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'subtle' | 'outline';
}

const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ className, size = 'md', variant = 'ghost', ...props }, ref) => {
    const sizeStyles = {
      sm: 'h-6 w-6 p-1',
      md: 'h-8 w-8 p-1.5',
      lg: 'h-10 w-10 p-2',
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const getVariantStyles = () => {
      switch (variant) {
        case 'subtle':
          return cn(
            'rounded-lg transition-all duration-200 hover:scale-105',
            'bg-stone-100/80 text-stone-500 hover:bg-stone-200 hover:text-stone-700',
            'dark:bg-stone-800/50 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-200'
          );
        case 'outline':
          return cn(
            'rounded-lg border-2 transition-all duration-200 hover:scale-105',
            'border-stone-300 text-stone-500 hover:border-stone-400 hover:bg-stone-100 hover:text-stone-700',
            'dark:border-stone-600 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-200'
          );
        default:
          return cn(
            'rounded-lg transition-all duration-200 hover:scale-105',
            'text-stone-500 hover:bg-stone-200/70 hover:text-stone-700',
            'dark:text-stone-400 dark:hover:bg-stone-700/50 dark:hover:text-stone-200'
          );
      }
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-serif select-none focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
          'focus:ring-stone-500 focus:ring-offset-white',
          'dark:focus:ring-stone-500 dark:focus:ring-offset-stone-900',
          sizeStyles[size],
          getVariantStyles(),
          className
        )}
        {...props}
      >
        <X className={iconSizes[size]} />
        <span className="sr-only">Close</span>
      </button>
    );
  }
);
CloseButton.displayName = 'CloseButton';

export { CloseButton };
