'use client';

import { useNotificationStore } from '@lib/stores/ui/notification-store';
import { cn } from '@lib/utils';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XCircleIcon,
  XIcon,
} from 'lucide-react';

import React from 'react';

import { useTranslations } from 'next-intl';

const iconMap = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

const colorMap = {
  success: 'bg-green-500 border-green-600',
  error: 'bg-red-500 border-red-600',
  warning: 'bg-yellow-500 border-yellow-600',
  info: 'bg-stone-500 border-stone-600',
};

export const NotificationBar: React.FC = () => {
  const t = useTranslations('components.ui.notificationBar');
  const { message, type, isVisible, hideNotification } = useNotificationStore();

  // If not visible or no message, do not render anything
  if (!isVisible || !message) {
    return null;
  }

  const IconComponent = iconMap[type] || InfoIcon; // Default use InfoIcon
  const colors = colorMap[type] || colorMap.info; // Default use info color

  return (
    <div
      className={cn(
        'fixed top-5 left-1/2 z-50 -translate-x-1/2 transform', // Position at top center
        'w-auto max-w-[90%] md:max-w-md lg:max-w-lg', // Responsive width
        'flex items-center space-x-3 rounded-md border p-3 text-white shadow-lg', // Base style
        colors, // Apply color based on type
        'transition-all duration-300 ease-in-out', // Transition animation
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0' // Show/hide animation
      )}
      role="alert"
    >
      <IconComponent className="h-5 w-5 flex-shrink-0" />
      <span className="flex-grow text-sm font-medium">{message}</span>
      <button
        onClick={hideNotification}
        className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-white/20"
        aria-label={t('closeNotification')}
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
