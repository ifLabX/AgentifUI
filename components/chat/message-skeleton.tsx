/**
 * Message skeleton component
 *
 * Used as a placeholder effect when messages are loading
 */
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';

export function MessageSkeleton() {
  const { isDark } = useThemeColors();

  return (
    <div
      className="relative flex w-full animate-pulse flex-col gap-8 px-4 py-6"
      style={{
        background: isDark
          ? 'linear-gradient(to bottom, rgba(41, 37, 36, 1), rgba(41, 37, 36, 0.3))'
          : 'linear-gradient(to bottom, rgba(245, 245, 245, 1), rgba(245, 245, 245, 0.3))',
      }}
    >
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div
          className={cn(
            'w-3/4 max-w-[600px] rounded-xl px-4 py-3',
            isDark ? 'bg-stone-700' : 'bg-stone-300/60'
          )}
        >
          <div className="mb-2 h-4 w-full rounded bg-stone-400/50"></div>
          <div className="mb-2 h-4 w-[80%] rounded bg-stone-400/50"></div>
          <div className="h-4 w-[40%] rounded bg-stone-400/50"></div>
        </div>
      </div>

      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div
          className={cn(
            'w-4/5 max-w-[600px] rounded-xl px-4 py-3',
            isDark
              ? 'border border-stone-700 bg-stone-900'
              : 'bg-white shadow-sm'
          )}
        >
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
