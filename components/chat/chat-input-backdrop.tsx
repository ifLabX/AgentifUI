'use client';

import { useChatWidth } from '@lib/hooks';
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';

import React from 'react';

interface ChatInputBackdropProps {
  className?: string;
}

/**
 * ChatInputBackdrop component
 * Renders a background div for the chat input area.
 * Uses unified width class and always applies the main background color from theme.
 */
export function ChatInputBackdrop({ className }: ChatInputBackdropProps) {
  const { colors } = useThemeColors();
  const { widthClass } = useChatWidth();

  return (
    <div
      className={cn(
        'pointer-events-none absolute right-0 bottom-0 left-0 z-0 mx-auto h-24',
        widthClass, // Use unified width class
        colors.mainBackground.tailwind, // Always use mainBackground color
        className
      )}
      // style removed: background is handled by tailwind class
    />
  );
}
