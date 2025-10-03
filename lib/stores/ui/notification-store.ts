import { create } from 'zustand';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification state interface
 * @description Defines the structure for notification store state and actions
 */
interface NotificationState {
  /** Notification message content */
  message: string | null;
  /** Notification type */
  type: NotificationType;
  /** Display duration in milliseconds */
  duration: number;
  /** Whether notification is currently visible */
  isVisible: boolean;
  /** Show notification with message and optional type/duration */
  showNotification: (
    message: string,
    type?: NotificationType,
    duration?: number
  ) => void;
  /** Hide current notification */
  hideNotification: () => void;
}

let timeoutId: NodeJS.Timeout | null = null;

/**
 * Notification store
 * @description Zustand store for managing notification display state and auto-hide behavior
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  message: null,
  type: 'info',
  duration: 3000,
  isVisible: false,

  showNotification: (message, type = 'warning', duration = 3000) => {
    // Clear existing timer to avoid issues with rapid consecutive triggers
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Set new notification state and show
    set({ message, type, duration, isVisible: true });
    // Set auto-hide timer
    timeoutId = setTimeout(() => {
      get().hideNotification();
    }, duration);
  },

  hideNotification: () => {
    // Clear any existing timer
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Hide notification and reset message
    set({ isVisible: false, message: null });
  },
}));
