/**
 * Chat list skeleton screen component
 *
 * Skeleton screen effect displayed when loading the chat list
 */
import { cn } from '@lib/utils';

import * as React from 'react';

interface ChatSkeletonProps {
  isDark: boolean;
  count?: number;
}

export function ChatSkeleton({ isDark, count = 5 }: ChatSkeletonProps) {
  return (
    <div className="mb-2 space-y-1">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <ChatSkeletonItem key={`skeleton-${index}`} isDark={isDark} />
        ))}
    </div>
  );
}

interface ChatSkeletonItemProps {
  isDark: boolean;
}

export function ChatSkeletonItem({ isDark }: ChatSkeletonItemProps) {
  // Skeleton screen project, simulating the appearance of the chat project
  // Do not use outer frame background color, only display the animation effect of internal elements
  return (
    <div className="group relative px-3">
      <div className="flex h-9 items-center rounded-md">
        <div
          className={cn(
            'mr-3 h-5 w-5 flex-shrink-0 animate-pulse rounded-full',
            isDark ? 'bg-stone-600' : 'bg-stone-400'
          )}
        />
        <div
          className={cn(
            'h-4 w-[70%] animate-pulse rounded-md',
            isDark ? 'bg-stone-600' : 'bg-stone-400'
          )}
        />
      </div>
    </div>
  );
}
