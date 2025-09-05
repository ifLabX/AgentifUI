import { useCallback, useEffect, useRef } from 'react';

import { RealtimeChannel } from '@supabase/supabase-js';

import { useNotificationBridge } from '../stores/notification-bridge-store';
import { useNotificationCenter } from '../stores/notification-center-store';
import { createClient } from '../supabase/client';
import { useSupabaseAuth } from '../supabase/hooks';
import type { NotificationWithReadStatus } from '../types/notification-center';

interface RealtimeConfig {
  enableAutoShow?: boolean; // Auto-show critical notifications in bar
  enableSound?: boolean; // Play notification sound (future feature)
  enableDesktopNotifications?: boolean; // Browser notifications (future feature)
}

/**
 * Hook for real-time notification updates via Supabase
 * Integrates with notification center and bridge stores
 */
export function useNotificationRealtime(config: RealtimeConfig = {}) {
  const {
    enableAutoShow = true,
    enableSound = false,
    enableDesktopNotifications = false,
  } = config;

  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { user } = useSupabaseAuth();

  // Use refs to maintain stable references to store methods
  const notificationCenterRef = useRef(useNotificationCenter.getState());
  const notificationBridgeRef = useRef(useNotificationBridge.getState());
  const userIdRef = useRef(user?.id);

  // Update refs when values change
  useEffect(() => {
    notificationCenterRef.current = useNotificationCenter.getState();
    notificationBridgeRef.current = useNotificationBridge.getState();
    userIdRef.current = user?.id;
  });

  const handleInsert = useCallback(
    (payload: { new: NotificationWithReadStatus }) => {
      const notification = payload.new;

      console.log('New notification received:', notification);

      // Route through bridge for intelligent handling
      notificationBridgeRef.current.routeNotification(
        notification,
        enableAutoShow
      );

      // Optional: Browser notifications for high priority
      if (
        enableDesktopNotifications &&
        (notification.priority === 'critical' ||
          notification.priority === 'high') &&
        'Notification' in window &&
        window.Notification.permission === 'granted'
      ) {
        new window.Notification(notification.title, {
          body:
            notification.content.slice(0, 100) +
            (notification.content.length > 100 ? '...' : ''),
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }

      // Optional: Sound notification (future feature)
      if (enableSound && notification.priority === 'critical') {
        // Would play notification sound
        console.info('Would play critical notification sound');
      }
    },
    [enableAutoShow, enableDesktopNotifications, enableSound]
  );

  const handleUpdate = useCallback(
    (payload: { new: NotificationWithReadStatus }) => {
      const updatedNotification = payload.new;

      console.log('Notification updated:', updatedNotification);

      // Update in store
      notificationCenterRef.current._updateNotification(
        updatedNotification.id,
        updatedNotification
      );
    },
    []
  );

  const handleDelete = useCallback(
    (payload: { old: NotificationWithReadStatus }) => {
      const deletedNotification = payload.old;

      console.log('Notification deleted:', deletedNotification.id);

      // Remove from store
      notificationCenterRef.current._removeNotification(deletedNotification.id);
    },
    []
  );

  const handleReadStatusChange = useCallback(
    (payload: {
      new: { notification_id: string; user_id: string; read_at: string };
    }) => {
      const readRecord = payload.new;
      const { notification_id, user_id } = readRecord;

      // Only update if it's for current user
      if (userIdRef.current === user_id) {
        console.log('Notification marked as read:', notification_id);

        notificationCenterRef.current._updateNotification(notification_id, {
          read_at: readRecord.read_at,
        });

        // Refresh unread count
        notificationCenterRef.current.refreshUnreadCount();
      }
    },
    []
  );

  useEffect(() => {
    if (!user?.id) {
      // Clean up if user is not authenticated
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    console.log(
      'Setting up notification real-time subscription for user:',
      user.id
    );

    // Create channel for notifications
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const channel = supabase
      .channel(`user-notifications-${user.id}`) // Make channel name unique per user
      .on(
        'postgres_changes' as any, // Temporary type cast to avoid TypeScript type error
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `target_users=cs.{${user.id}}`,
        },
        handleInsert
      )
      .on(
        'postgres_changes' as any, // Temporary type cast to avoid TypeScript type error
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `target_users=cs.{${user.id}}`,
        },
        handleUpdate
      )
      .on(
        'postgres_changes' as any, // Temporary type cast to avoid TypeScript type error
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `target_users=cs.{${user.id}}`,
        },
        handleDelete
      )
      .on(
        'postgres_changes' as any, // Temporary type cast to avoid TypeScript type error
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_reads',
          filter: `user_id=eq.${user.id}`,
        },
        handleReadStatusChange
      )
      .subscribe((status: string) => {
        console.log('Notification subscription status:', status);
      });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('Cleaning up notification real-time subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // Only depend on user ID - callbacks are now stable

  // Initial data fetch when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('Fetching initial notification data');
      const currentCenter = notificationCenterRef.current;
      currentCenter.refreshUnreadCount();

      // Auto-fetch notifications if center is open
      if (currentCenter.isOpen) {
        const type =
          currentCenter.activeTab === 'all'
            ? undefined
            : (currentCenter.activeTab as 'changelog' | 'message');
        currentCenter.fetchNotifications(type, true);
      }
    }
  }, [user?.id]); // Only depend on user ID

  return {
    isConnected: channelRef.current !== null,
    channel: channelRef.current,
  };
}

/**
 * Hook for requesting desktop notification permission
 */
export function useNotificationPermission() {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return 'unsupported';
    }

    if (window.Notification.permission === 'granted') {
      return 'granted';
    }

    if (window.Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await window.Notification.requestPermission();
    return permission;
  }, []);

  return {
    permission:
      typeof window !== 'undefined' && 'Notification' in window
        ? window.Notification.permission
        : 'unsupported',
    requestPermission,
  };
}

/**
 * Hook for managing notification preferences
 */
export function useNotificationPreferences() {
  // This would integrate with user preferences store in the future
  // For now, return default preferences

  const preferences = {
    enableSound: false,
    enableDesktopNotifications: false,
    autoShowCritical: true,
    autoShowHigh: true,
    autoShowMedium: false,
    autoShowLow: false,
  };

  const updatePreferences = useCallback(
    (newPrefs: Partial<typeof preferences>) => {
      // Would save to user preferences
      console.log('Would update notification preferences:', newPrefs);
    },
    []
  );

  return {
    preferences,
    updatePreferences,
  };
}
