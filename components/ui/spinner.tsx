'use client';

import { cn } from '@lib/utils';

import React from 'react';

import { useTranslations } from 'next-intl';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const t = useTranslations('loading');

  const sizeClasses = {
    sm: 'h-3 w-3 border-[1.5px]',
    md: 'h-4 w-4 border-2',
    lg: 'h-6 w-6 border-2',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-solid',
        sizeClasses[size],
        // Light mode: gray border with darker top
        'border-gray-200 border-t-gray-600',
        // Dark mode: darker border with lighter top
        'dark:border-gray-600 dark:border-t-gray-200',
        className
      )}
      aria-label={t('spinner')}
    />
  );
}
