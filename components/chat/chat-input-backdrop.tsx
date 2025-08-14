'use client';

import { useChatWidth } from '@lib/hooks';
import { cn } from '@lib/utils';

import React from 'react';

interface ChatInputBackdropProps {
  className?: string;
}

/**
 * ChatInputBackdrop component
 * Renders a background div for the chat input area.
 * Uses unified width class and applies theme-aware background colors via dark: prefix.
 */
export function ChatInputBackdrop({ className }: ChatInputBackdropProps) {
  const { widthClass } = useChatWidth();

  return (
    <div
      className={cn(
        'pointer-events-none absolute right-0 bottom-0 left-0 z-0 mx-auto h-24',
        widthClass, // Use unified width class
        'bg-stone-100 dark:bg-stone-800', // Theme-aware background using dark: prefix
        className
      )}
    />
  );
}
