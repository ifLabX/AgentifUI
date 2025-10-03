'use client';

import { cn } from '@lib/utils';

import React from 'react';

interface VersionTagProps {
  variant?: 'inline' | 'tag' | 'minimal';
  size?: 'sm' | 'xs';
  className?: string;
}

export function VersionTag({
  variant = 'tag',
  size = 'xs',
  className,
}: VersionTagProps) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  if (!version) {
    return null;
  }

  const baseClasses = cn('font-mono font-medium transition-all duration-200', {
    'text-xs': size === 'xs',
    'text-sm': size === 'sm',
  });

  const variantClasses = {
    inline: cn(baseClasses, 'opacity-60', 'text-stone-400 dark:text-stone-500'),
    tag: cn(
      baseClasses,
      'inline-flex items-center justify-center',
      'rounded-full px-2 py-0.5',
      'bg-stone-100/80 dark:bg-stone-800/60',
      'border border-stone-200/60 dark:border-stone-700/60',
      'text-stone-600 dark:text-stone-300',
      'hover:bg-stone-200/60 dark:hover:bg-stone-700/80',
      'shadow-sm'
    ),
    minimal: cn(baseClasses, 'text-current opacity-50'),
  };

  return (
    <span className={cn(variantClasses[variant], className)}>v{version}</span>
  );
}
