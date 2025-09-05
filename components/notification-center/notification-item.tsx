'use client';

import { cn } from '@lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Bug,
  CheckCircle,
  Clock,
  Code,
  Lightbulb,
  Lock,
  Megaphone,
  MessageSquare,
  Shield,
  Sparkles,
  Wrench,
} from 'lucide-react';

import { useTranslations } from 'next-intl';

import type {
  ChangelogCategory,
  MessageCategory,
  NotificationWithReadStatus,
} from '../../lib/types/notification-center';
import { Badge } from '../ui/badge';

interface NotificationItemProps {
  notification: NotificationWithReadStatus;
  onMarkAsRead?: (id: string) => void;
  onAction?: (notification: NotificationWithReadStatus) => void;
  compact?: boolean;
  style?: React.CSSProperties;
}

// Category icons mapping
const categoryIcons = {
  // Message categories
  admin_announcement: Megaphone,
  agent_result: MessageSquare,
  token_usage: AlertTriangle,
  system_maintenance: Wrench,
  security_alert: Shield,
  feature_tip: Lightbulb,

  // Changelog categories
  feature: Sparkles,
  improvement: Wrench,
  bugfix: Bug,
  security: Lock,
  api_change: Code,
};

// Priority colors
const priorityColors = {
  low: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
  medium:
    'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  high: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
  critical: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
};

const priorityIndicators = {
  low: 'bg-blue-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export function NotificationItem({
  notification,
  onMarkAsRead,
  onAction,
  compact = false,
  style,
}: NotificationItemProps) {
  const t = useTranslations('components.notificationCenter');

  const {
    id,
    type,
    category,
    title,
    content,
    priority,
    is_read,
    created_at,
    published_at,
  } = notification;

  const CategoryIcon = category
    ? categoryIcons[category as MessageCategory | ChangelogCategory]
    : MessageSquare;
  const displayTime = published_at || created_at;

  const handleClick = () => {
    // Mark as read if not already read
    if (!is_read && onMarkAsRead) {
      onMarkAsRead(id);
    }

    // Trigger action callback
    if (onAction) {
      onAction(notification);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        'group bg-card relative cursor-pointer rounded-xl border transition-all duration-200',
        'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-1',
        'hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20',
        is_read
          ? 'border-border/50'
          : cn('border-2 shadow-sm', priorityColors[priority]),
        compact ? 'p-4' : 'p-6'
      )}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Click to view: ${title}`}
    >
      {/* Priority indicator */}
      {!is_read && (
        <div
          className={cn(
            'absolute top-0 left-0 h-full w-1 rounded-l-xl',
            priorityIndicators[priority]
          )}
          aria-hidden="true"
        />
      )}

      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 rounded-full p-3',
            type === 'changelog'
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-gray-100 dark:bg-gray-800/50'
          )}
        >
          <CategoryIcon
            className={cn(
              compact ? 'h-5 w-5' : 'h-6 w-6',
              type === 'changelog'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            )}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* Title */}
              <h3
                className={cn(
                  'text-foreground leading-snug font-semibold',
                  compact ? 'text-base' : 'text-lg'
                )}
              >
                {title}
              </h3>

              {/* Content */}
              {!compact && content && (
                <div className="mt-3">
                  <p className="text-muted-foreground leading-relaxed">
                    {content}
                  </p>
                </div>
              )}
            </div>

            {/* Read status */}
            {is_read && (
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <time dateTime={displayTime}>
                {formatDistanceToNow(new Date(displayTime), {
                  addSuffix: true,
                })}
              </time>
            </div>

            {/* Type and category badges */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {t(`types.${type}`)}
              </Badge>
              {category && (
                <Badge variant="outline" className="text-xs">
                  {t(`categories.${category}`)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { NotificationItemProps };
