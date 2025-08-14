'use client';

import { cn } from '@lib/utils';

export function EditorSkeleton() {
  const SkeletonBlock = ({ className }: { className?: string }) => (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800',
        className
      )}
    />
  );

  return (
    <div className="space-y-5 pt-2">
      <SkeletonBlock className="h-10 w-3/4" />
      <SkeletonBlock className="h-24 w-full" />
      <div className="space-y-3 pt-4">
        <SkeletonBlock className="h-8 w-1/2" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
      <div className="space-y-3 pt-4">
        <SkeletonBlock className="h-8 w-1/2" />
        <SkeletonBlock className="h-20 w-full" />
      </div>
    </div>
  );
}
