'use client';

import { cn } from '@lib/utils';
import { MessageSquare } from 'lucide-react';

import * as React from 'react';

/**
 * Sidebar chat item skeleton screen group
 *
 * Used to display a placeholder for a new conversation being created
 */
export function SidebarChatSkeleton() {
  // Skeleton screen component, display the loading state of the conversation creation
  // Style consistent with SidebarButton, ensure size and appearance consistency
  return (
    <div
      className={cn(
        'flex w-full items-center rounded-lg px-3 py-2',
        'animate-pulse',
        'bg-stone-100/70 dark:bg-stone-800/50',
        'h-10' // Height consistent with SidebarButton
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-6 w-6 flex-none items-center justify-center rounded-full',
          'bg-stone-300 dark:bg-stone-700'
        )}
      >
        <MessageSquare
          size={14}
          className="text-stone-400 dark:text-stone-500"
        />
      </div>

      {/* Title skeleton screen - only display one line of title */}
      <div className="ml-3 flex min-w-0 flex-1 items-center">
        <div
          className={cn('h-4 w-32 rounded', 'bg-stone-300 dark:bg-stone-700')}
        />
      </div>
    </div>
  );
}
