'use client';

import { cn } from '@lib/utils';

interface SidebarChatIconProps {
  // Allow custom class name and size
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SidebarChatIcon({
  className,
  size = 'md',
}: SidebarChatIconProps) {
  // Determine size based on size attribute
  const sizeClasses = {
    sm: {
      container: 'w-3',
      gap: 'space-y-[1.5px]',
      line1: 'h-[1px] w-3',
      line2: 'h-[1px] w-2',
      line3: 'h-[1px] w-1',
    },
    md: {
      container: 'w-3.5',
      gap: 'space-y-[2px]',
      line1: 'h-[1.5px] w-3.5',
      line2: 'h-[1.5px] w-2.5',
      line3: 'h-[1.5px] w-1.5',
    },
    lg: {
      container: 'w-4',
      gap: 'space-y-1',
      line1: 'h-[2px] w-4',
      line2: 'h-[2px] w-3',
      line3: 'h-[2px] w-2',
    },
  };

  const { container, gap, line1, line2, line3 } = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-start justify-center transition-transform duration-150',
        gap,
        container,
        'group-hover:scale-105',
        className
      )}
    >
      <div
        className={cn(
          line1,
          'rounded-full bg-current transition-all duration-150 group-hover:w-full',
          'opacity-70 dark:opacity-80'
        )}
      />
      <div
        className={cn(
          line2,
          'rounded-full bg-current transition-all duration-150 group-hover:w-4/5',
          'opacity-70 dark:opacity-80'
        )}
      />
      <div
        className={cn(
          line3,
          'rounded-full bg-current transition-all duration-150 group-hover:w-3/5',
          'opacity-70 dark:opacity-80'
        )}
      />
    </div>
  );
}
