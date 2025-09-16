/**
 * Notification Admin Utilities
 *
 * Shared utilities for notification administration interface
 */
import type {
  NotificationCategory,
  NotificationPriority,
} from '@lib/types/notification-center';

interface CategoryOption {
  label: string;
  description: string;
  color: string;
}

interface PriorityOption {
  label: string;
  description: string;
  color: string;
}

/**
 * Get notification category options with translations and styling
 */
export const getCategoryOptions = (
  t: (key: string) => string
): Record<NotificationCategory, CategoryOption> => ({
  admin_announcement: {
    label: t('categories.admin_announcement.label'),
    description: t('categories.admin_announcement.description'),
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  agent_result: {
    label: t('categories.agent_result.label'),
    description: t('categories.agent_result.description'),
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  },
  token_usage: {
    label: t('categories.token_usage.label'),
    description: t('categories.token_usage.description'),
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  system_maintenance: {
    label: t('categories.system_maintenance.label'),
    description: t('categories.system_maintenance.description'),
    color:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  security_alert: {
    label: t('categories.security_alert.label'),
    description: t('categories.security_alert.description'),
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  feature_tip: {
    label: t('categories.feature_tip.label'),
    description: t('categories.feature_tip.description'),
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  feature: {
    label: t('categories.feature.label'),
    description: t('categories.feature.description'),
    color:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  },
  improvement: {
    label: t('categories.improvement.label'),
    description: t('categories.improvement.description'),
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  },
  bugfix: {
    label: t('categories.bugfix.label'),
    description: t('categories.bugfix.description'),
    color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
  },
  security: {
    label: t('categories.security.label'),
    description: t('categories.security.description'),
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
  api_change: {
    label: t('categories.api_change.label'),
    description: t('categories.api_change.description'),
    color:
      'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
  },
});

/**
 * Get notification priority options with translations and styling
 */
export const getPriorityOptions = (
  t: (key: string) => string
): Record<NotificationPriority, PriorityOption> => ({
  low: {
    label: t('priorities.low.label'),
    description: t('priorities.low.description'),
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  medium: {
    label: t('priorities.medium.label'),
    description: t('priorities.medium.description'),
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  high: {
    label: t('priorities.high.label'),
    description: t('priorities.high.description'),
    color:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  },
  critical: {
    label: t('priorities.critical.label'),
    description: t('priorities.critical.description'),
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
});

/**
 * Type definitions for category and priority options
 */
export type { CategoryOption, PriorityOption };
