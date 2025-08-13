'use client';

import { cn } from '@lib/utils';

import React from 'react';

import { useTranslations } from 'next-intl';

/**
 * Page loader component props
 * @description Configuration options for the page loading component
 */
interface PageLoaderProps {
  className?: string;
}

/**
 * Page loader component with spinning animation and localized text
 * @description Displays a centered loading spinner with internationalized loading messages
 */
export function PageLoader({ className }: PageLoaderProps) {
  const t = useTranslations('loading.pageLoader');

  return (
    <div
      className={cn(
        'flex min-h-screen w-full flex-col items-center justify-center',
        className
      )}
    >
      <div className="flex flex-col items-center">
        {/* Loading animation spinner */}
        <div className="mb-6 h-16 w-16">
          <svg
            className="text-primary h-full w-full animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Loading text content */}
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t('title')}
        </h3>
      </div>
    </div>
  );
}

/**
 * Skeleton loading component
 * @description Basic skeleton component for loading states with pulse animation
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

/**
 * Profile page skeleton loader
 * @description Skeleton placeholder for profile settings page layout
 */
export function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-4">
      <Skeleton className="mb-6 h-8 w-1/3" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>

        <Skeleton className="mt-6 h-10 w-full" />
      </div>
    </div>
  );
}

/**
 * Chat page skeleton loader
 * @description Skeleton placeholder for chat interface with message bubbles and input area
 */
export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          ))}
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
