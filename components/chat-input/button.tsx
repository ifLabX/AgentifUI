'use client';

import { Button as UIButton } from '@components/ui/button';
import { useMounted } from '@lib/hooks';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';

import type React from 'react';

interface ChatButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'function' | 'submit';
  isDark?: boolean;
  ariaLabel: string;
  forceActiveStyle?: boolean;
}

export const ChatButton = ({
  icon,
  onClick,
  disabled = false,
  className,
  variant = 'function',
  isDark = false,
  ariaLabel,
  forceActiveStyle = false,
}: ChatButtonProps) => {
  const isMounted = useMounted();
  // Get theme colors
  const { colors } = useThemeColors();

  if (!isMounted) {
    return null;
  }

  // Function button - with subtle gray border
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
          isDark
            ? `border border-stone-600 bg-stone-600/30 ${colors.mainText.tailwind} ${colors.buttonHover.tailwind}`
            : 'border border-gray-200 text-gray-600 hover:bg-gray-50',
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

  // Submit/upload button - empty state is dark gray
  return (
    <UIButton
      type="button"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full',
        forceActiveStyle || !disabled
          ? isDark
            ? 'bg-stone-900 text-white hover:bg-stone-800'
            : 'bg-black text-white hover:bg-gray-800'
          : isDark
            ? 'bg-stone-600 text-stone-300'
            : 'bg-gray-200 text-gray-400',
        'cursor-pointer shadow-sm',
        className
      )}
      aria-label={ariaLabel}
    >
      {icon}
    </UIButton>
  );
};
