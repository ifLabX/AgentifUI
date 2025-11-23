/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */
'use client';

import { Button } from '@components/ui/button';
import { cn } from '@lib/utils';
import { Bell } from 'lucide-react';

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

/**
 * NotificationBell Component
 *
 * Displays a notification bell icon with unread count badge.
 * Used in navigation bar to provide quick access to notification center.
 */

// ============================================================================
// Types
// ============================================================================

export interface NotificationBellProps {
  /** Number of unread notifications */
  unreadCount: number;
  /** Callback when bell is clicked */
  onClick: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the notification center is currently open */
  isOpen?: boolean;
}

// ============================================================================
// Utils
// ============================================================================

/**
 * Get size classes for the bell icon
 */
function getSizeClasses(size: 'sm' | 'md' | 'lg'): {
  button: string;
  icon: string;
  badge: string;
} {
  switch (size) {
    case 'sm':
      return {
        button: 'h-8 w-8',
        icon: 'h-4 w-4',
        badge: 'h-4 min-w-4 text-[10px]',
      };
    case 'lg':
      return {
        button: 'h-12 w-12',
        icon: 'h-6 w-6',
        badge: 'h-6 min-w-6 text-xs',
      };
    case 'md':
    default:
      return {
        button: 'h-10 w-10',
        icon: 'h-5 w-5',
        badge: 'h-5 min-w-5 text-[11px]',
      };
  }
}

/**
 * Format unread count for display (99+ for counts over 99)
 */
function formatUnreadCount(count: number): string {
  return count > 99 ? '99+' : count.toString();
}

// ============================================================================
// Component
// ============================================================================

export function NotificationBell({
  unreadCount,
  onClick,
  className,
  size = 'md',
  isOpen = false,
}: NotificationBellProps) {
  const sizeClasses = getSizeClasses(size);
  const hasUnread = unreadCount > 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'relative',
        sizeClasses.button,
        isOpen && 'bg-accent',
        className
      )}
      onClick={onClick}
      aria-label={
        hasUnread ? `Notifications (${unreadCount} unread)` : 'Notifications'
      }
      aria-pressed={isOpen}
    >
      <Bell
        className={cn(
          sizeClasses.icon,
          hasUnread && 'animate-pulse',
          'transition-transform hover:scale-110'
        )}
      />

      {/* Unread count badge */}
      {hasUnread && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center rounded-full',
            'bg-destructive text-destructive-foreground font-semibold',
            'ring-background ring-2',
            sizeClasses.badge,
            'px-1'
          )}
          aria-hidden="true"
        >
          {formatUnreadCount(unreadCount)}
        </span>
      )}
    </Button>
  );
}
