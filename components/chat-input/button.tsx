'use client';

import { Button as UIButton } from '@components/ui/button';
import { useMounted } from '@lib/hooks';
import { cn } from '@lib/utils';

import type React from 'react';

interface ChatButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'function' | 'submit';
  ariaLabel: string;
  forceActiveStyle?: boolean;
}

export const ChatButton = ({
  icon,
  onClick,
  disabled = false,
  className,
  variant = 'function',
  ariaLabel,
  forceActiveStyle = false,
}: ChatButtonProps) => {
  const isMounted = useMounted();

  if (!isMounted) {
    return null;
  }

  if (variant === 'function') {
    return (
      <UIButton
        type="button"
        size="sm"
        variant="ghost"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg',
          'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-stone-600 dark:bg-stone-600/30 dark:text-stone-300 dark:hover:bg-stone-700/50',
          'bg-transparent',
          'cursor-pointer',
          className
        )}
        aria-label={ariaLabel}
      >
        {icon}
      </UIButton>
    );
  }

  return (
    <UIButton
      type="button"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full',
        forceActiveStyle || !disabled
          ? 'bg-black text-white hover:bg-gray-800 dark:bg-stone-900 dark:hover:bg-stone-800'
          : 'bg-gray-200 text-gray-400 dark:bg-stone-600 dark:text-stone-300',
        'cursor-pointer shadow-sm',
        className
      )}
      aria-label={ariaLabel}
    >
      {icon}
    </UIButton>
  );
};
