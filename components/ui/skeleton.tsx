'use client';

import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

// Basic skeleton component
export function Skeleton({ className, width, height }: SkeletonProps) {
  const { isDark } = useTheme();

  const style = {
    width: width
      ? typeof width === 'number'
        ? `${width}px`
        : width
      : undefined,
    height: height
      ? typeof height === 'number'
        ? `${height}px`
        : height
      : undefined,
  };

  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        isDark ? 'bg-stone-700/50' : 'bg-gray-200',
        className
      )}
      style={style}
    />
  );
}

// Text input skeleton
export function InputSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// Button skeleton
export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-full', className)} />;
}

// Avatar skeleton
export function AvatarSkeleton({ size = 40 }: { size?: number }) {
  return <Skeleton className="rounded-full" width={size} height={size} />;
}

// Title skeleton
export function TitleSkeleton({ width = '1/3' }: { width?: string }) {
  return <Skeleton className={`h-8 w-${width} mb-6`} />;
}

// Profile form skeleton
export function ProfileFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-4">
      <TitleSkeleton />
      <div className="space-y-4">
        <InputSkeleton />
        <InputSkeleton />
        <ButtonSkeleton className="mt-6" />
      </div>
    </div>
  );
}

// Chat message skeleton
export function ChatMessageSkeleton() {
  return (
    <div className="mb-4 flex items-start space-x-3">
      <AvatarSkeleton />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}

// Chat list skeleton
export function ChatListSkeleton({
  messageCount = 3,
}: {
  messageCount?: number;
}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: messageCount }).map((_, index) => (
        <ChatMessageSkeleton key={index} />
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg p-4', className)}>
      <Skeleton className="mb-4 h-8 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Table skeleton
export function TableSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex space-x-4 pb-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-8 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex space-x-4 py-2">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      ))}
    </div>
  );
}

// API configuration page skeleton
export function ApiConfigSkeleton() {
  const { isDark } = useTheme();

  return (
    <div className="space-y-8">
      {/* Title area */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
      </div>

      {/* API key management prompt area */}
      <div
        className={cn(
          'rounded-lg border p-4',
          isDark
            ? 'border-blue-800/30 bg-blue-900/20'
            : 'border-blue-100 bg-blue-50/80'
        )}
      >
        <Skeleton
          className={cn(
            'mb-2 h-6 w-1/4',
            isDark ? 'bg-blue-700/30' : 'bg-blue-200/50'
          )}
        />
        <Skeleton
          className={cn(
            'mb-1 h-4 w-full',
            isDark ? 'bg-blue-700/30' : 'bg-blue-200/50'
          )}
        />
        <Skeleton
          className={cn(
            'mb-1 h-4 w-full',
            isDark ? 'bg-blue-700/30' : 'bg-blue-200/50'
          )}
        />
        <Skeleton
          className={cn(
            'h-4 w-3/4',
            isDark ? 'bg-blue-700/30' : 'bg-blue-200/50'
          )}
        />
      </div>

      {/* Tab area */}
      <div>
        <div
          className={cn(
            'mb-6 flex border-b pb-2',
            isDark ? 'border-stone-700/50' : 'border-stone-200/50'
          )}
        >
          <Skeleton className="mr-4 h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Application instance list area */}
        <div className="space-y-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Table - use card wrapper */}
          <div
            className={cn(
              'overflow-hidden rounded-lg border',
              isDark
                ? 'border-stone-700/30 bg-stone-800'
                : 'border-stone-300/50 bg-white'
            )}
          >
            {/* Table header */}
            <div
              className={cn(
                'flex p-4',
                isDark ? 'bg-stone-800/60' : 'bg-stone-100/80'
              )}
            >
              <Skeleton className="mr-4 h-6 w-1/5" />
              <Skeleton className="mr-4 h-6 w-1/5" />
              <Skeleton className="mr-4 h-6 w-1/5" />
              <Skeleton className="mr-4 h-6 w-1/5" />
              <Skeleton className="h-6 w-1/5" />
            </div>

            {/* Table row */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'flex border-t p-4',
                  isDark ? 'border-stone-700/20' : 'border-stone-200/50'
                )}
              >
                <Skeleton className="mr-4 h-6 w-1/5" />
                <Skeleton className="mr-4 h-6 w-1/5" />
                <Skeleton className="mr-4 h-6 w-1/5" />
                <Skeleton className="mr-4 h-6 w-1/5" />
                <Skeleton className="h-6 w-1/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
