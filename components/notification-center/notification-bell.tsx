'use client';

import { cn } from '@lib/utils';
import { Bell } from 'lucide-react';

import { useTranslations } from 'next-intl';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationBell({
  unreadCount,
  onClick,
  onHover,
  onLeave,
  className,
  size = 'md',
}: NotificationBellProps) {
  const t = useTranslations('components.notificationCenter');

  const sizeVariants = {
    sm: {
      button: 'h-8 w-8',
      icon: 'h-4 w-4',
      badge: 'h-4 min-w-4 text-[10px] px-1',
      badgeOffset: '-top-1 -right-1',
    },
    md: {
      button: 'h-10 w-10',
      icon: 'h-5 w-5',
      badge: 'h-5 min-w-5 text-xs px-1.5',
      badgeOffset: '-top-1.5 -right-1.5',
    },
    lg: {
      button: 'h-12 w-12',
      icon: 'h-6 w-6',
      badge: 'h-6 min-w-6 text-sm px-2',
      badgeOffset: '-top-2 -right-2',
    },
  };

  const variant = sizeVariants[size];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        'hover:bg-accent/50 focus-visible:ring-ring relative rounded-full focus-visible:ring-2 focus-visible:ring-offset-2',
        variant.button,
        className
      )}
      aria-label={
        unreadCount > 0
          ? t('bell.ariaLabelWithCount', { count: unreadCount })
          : t('bell.ariaLabel')
      }
      aria-describedby={unreadCount > 0 ? 'notification-count' : undefined}
    >
      <Bell
        className={cn(
          'text-muted-foreground group-hover:text-foreground transition-colors',
          variant.icon
        )}
        strokeWidth={2}
      />

      {unreadCount > 0 && (
        <Badge
          id="notification-count"
          variant="destructive"
          className={cn(
            'border-background absolute flex items-center justify-center rounded-full border-2 leading-none font-semibold shadow-sm',
            variant.badge,
            variant.badgeOffset
          )}
          aria-live="polite"
          aria-label={t('bell.badgeLabel', { count: unreadCount })}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
}

// Export for easier testing
export type { NotificationBellProps };
