/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */
'use client';

import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationWithReadStatus,
} from '@lib/types/notification-center';
import { cn } from '@lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Check, Circle } from 'lucide-react';

import { useTranslations } from 'next-intl';

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

/**
 * NotificationItem Component
 *
 * Displays a single notification with read/unread status, priority badge,
 * and category label. Supports compact and full display modes.
 */

// ============================================================================
// Types
// ============================================================================

export interface NotificationItemProps {
  notification: NotificationWithReadStatus;
  onMarkAsRead?: (id: string) => void;
  onAction?: (notification: NotificationWithReadStatus) => void;
  compact?: boolean;
}

// ============================================================================
// Utils
// ============================================================================

/**
 * Get priority badge variant based on notification priority
 */
export function getPriorityVariant(
  priority: NotificationPriority
): 'default' | 'warning' | 'destructive' | 'info' {
  switch (priority) {
    case 'critical':
      return 'destructive';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
    default:
      return 'default';
  }
}

/**
 * Get category display color based on category type
 */
export function getCategoryColor(category?: NotificationCategory): string {
  if (!category) return 'text-muted-foreground';

  switch (category) {
    // Changelog categories
    case 'feature':
      return 'text-blue-600 dark:text-blue-400';
    case 'improvement':
      return 'text-green-600 dark:text-green-400';
    case 'bugfix':
      return 'text-orange-600 dark:text-orange-400';
    case 'security':
      return 'text-red-600 dark:text-red-400';
    case 'api_change':
      return 'text-purple-600 dark:text-purple-400';

    // Message categories
    case 'admin_announcement':
      return 'text-indigo-600 dark:text-indigo-400';
    case 'agent_result':
      return 'text-cyan-600 dark:text-cyan-400';
    case 'token_usage':
      return 'text-amber-600 dark:text-amber-400';
    case 'system_maintenance':
      return 'text-slate-600 dark:text-slate-400';
    case 'security_alert':
      return 'text-red-600 dark:text-red-400';
    case 'feature_tip':
      return 'text-emerald-600 dark:text-emerald-400';

    default:
      return 'text-muted-foreground';
  }
}

// ============================================================================
// Component
// ============================================================================

export function NotificationItem({
  notification,
  onMarkAsRead,
  onAction,
  compact = false,
}: NotificationItemProps) {
  const t = useTranslations('components.notificationItem');

  const handleClick = () => {
    if (onAction) {
      onAction(notification);
    }
    // Auto-mark as read on click if not already read
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded-lg border p-3 transition-colors',
        'hover:bg-muted/50 cursor-pointer',
        notification.is_read
          ? 'border-transparent bg-transparent'
          : 'border-primary/20 bg-primary/5',
        compact && 'gap-2 p-2'
      )}
      onClick={handleClick}
    >
      {/* Unread indicator dot */}
      <div className="flex items-start pt-1">
        {notification.is_read ? (
          <Circle className="text-muted-foreground/30 h-2 w-2" />
        ) : (
          <Circle className="fill-primary text-primary h-2 w-2" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Header: Title + Priority Badge */}
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'truncate leading-tight font-medium',
              compact ? 'text-sm' : 'text-base',
              notification.is_read && 'text-muted-foreground'
            )}
          >
            {notification.title}
          </h4>
          {notification.priority !== 'low' && (
            <Badge
              variant={getPriorityVariant(notification.priority)}
              className="shrink-0"
            >
              {t(`priority.${notification.priority}`)}
            </Badge>
          )}
        </div>

        {/* Category + Type */}
        {notification.category && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'font-medium',
                getCategoryColor(notification.category)
              )}
            >
              {t(`category.${notification.type}.${notification.category}`)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {t(`type.${notification.type}`)}
            </span>
          </div>
        )}

        {/* Content preview */}
        {!compact && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {notification.content}
          </p>
        )}

        {/* Footer: Timestamp */}
        <div className="flex items-center justify-between">
          <time className="text-muted-foreground text-xs">{timeAgo}</time>

          {/* Mark as read button (visible on hover for unread items) */}
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={handleMarkAsRead}
            >
              <Check className="h-3 w-3" />
              <span className="text-xs">{t('markAsRead')}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
