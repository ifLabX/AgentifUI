/**
 * Message skeleton component
 *
 * Used as a placeholder effect when messages are loading
 */
import { cn } from '@lib/utils';

export function MessageSkeleton() {
  return (
    <div className="relative flex w-full animate-pulse flex-col gap-8 px-4 py-6 bg-gradient-to-b from-stone-100 to-stone-100/30 dark:from-stone-800 dark:to-stone-800/30">
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="w-3/4 max-w-[600px] rounded-xl bg-stone-300/60 px-4 py-3 dark:bg-stone-700">
          <div className="mb-2 h-4 w-full rounded bg-stone-400/50"></div>
          <div className="mb-2 h-4 w-[80%] rounded bg-stone-400/50"></div>
          <div className="h-4 w-[40%] rounded bg-stone-400/50"></div>
        </div>
      </div>

      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div className="w-4/5 max-w-[600px] rounded-xl bg-white px-4 py-3 shadow-sm dark:border dark:border-stone-700 dark:bg-stone-900">
          <div className="mb-2 h-4 w-full rounded bg-stone-400/40"></div>
          <div className="mb-2 h-4 w-[90%] rounded bg-stone-400/40"></div>
          <div className="mb-2 h-4 w-[75%] rounded bg-stone-400/40"></div>
          <div className="h-4 w-[50%] rounded bg-stone-400/40"></div>
        </div>
      </div>
    </div>
  );
}

// MessageSkeletonGroup component, used to display multiple message skeletons
interface MessageSkeletonGroupProps {
  count?: number;
  className?: string;
}

export function MessageSkeletonGroup({
  count = 3,
  className,
}: MessageSkeletonGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton key={index} />
      ))}
    </div>
  );
}
