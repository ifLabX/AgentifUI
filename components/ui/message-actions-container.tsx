'use client';

import { useMobile } from '@lib/hooks';
import { cn } from '@lib/utils';

import React from 'react';

interface MessageActionsContainerProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  isAssistantMessage?: boolean;
}

export const MessageActionsContainer: React.FC<
  MessageActionsContainerProps
> = ({ children, className, align = 'left', isAssistantMessage = false }) => {
  const isMobile = useMobile();

  return (
    <div
      className={cn(
        'mt-1 flex flex-wrap gap-1 transition-opacity',
        'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
        isMobile ? 'opacity-100' : '', // Always visible on mobile devices
        {
          'justify-start': align === 'left',
          'justify-end': align === 'right',
          'justify-center': align === 'center',
        },
        // Different styles for assistant messages and user messages (only add bottom padding, no left padding, ensure alignment with message left)
        isAssistantMessage ? 'py-1 pr-2 pl-0' : '',
        className
      )}
    >
      {children}
    </div>
  );
};
