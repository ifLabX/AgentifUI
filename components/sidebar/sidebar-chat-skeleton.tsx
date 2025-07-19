'use client';

import { cn } from '@lib/utils';
import { MessageSquare } from 'lucide-react';

import * as React from 'react';

interface SidebarChatSkeletonProps {
  isDark: boolean;
}

/**
 * Sidebar chat item skeleton screen group
 *
 * Used to display a placeholder for a new conversation being created
 */
export function SidebarChatSkeleton({ isDark }: SidebarChatSkeletonProps) {
  // Skeleton screen component, display the loading state of the conversation creation
  // Style consistent with SidebarButton, ensure size and appearance consistency
  return (
    <div
      className={cn(
        'flex w-full items-center rounded-lg px-3 py-2',
        'animate-pulse',
        isDark ? 'bg-stone-800/50' : 'bg-stone-100/70',
        'h-10' // Height consistent with SidebarButton
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-6 w-6 flex-none items-center justify-center rounded-full',
          isDark ? 'bg-stone-700' : 'bg-stone-300'
        )}
      >
        <MessageSquare
          size={14}
          className={cn(isDark ? 'text-stone-500' : 'text-stone-400')}
        />
      </div>

      {/* Title skeleton screen - only display one line of title */}
      <div className="ml-3 flex min-w-0 flex-1 items-center">
        <div
          className={cn(
            'h-4 w-32 rounded',
            isDark ? 'bg-stone-700' : 'bg-stone-300'
          )}
        />
      </div>
    </div>
  );
}
