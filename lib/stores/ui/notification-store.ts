import { create } from 'zustand';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  message: string | null;
  type: NotificationType;
  duration: number; // --- BEGIN MODIFIED COMMENT --- 单位：毫秒 --- END MODIFIED COMMENT ---
  isVisible: boolean;
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
  hideNotification: () => void;
}

let timeoutId: NodeJS.Timeout | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  message: null,
  type: 'info',
  duration: 3000,
  isVisible: false,

  showNotification: (message, type = 'warning', duration = 3000) => {
    // 如果当前有定时器，先清除，避免快速连续触发导致问题
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // 设置新的通知状态并显示
    set({ message, type, duration, isVisible: true });
    // 设置自动隐藏的定时器
    timeoutId = setTimeout(() => {
      get().hideNotification();
    }, duration);
  },

  hideNotification: () => {
    // 清除可能存在的定时器
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // 隐藏通知并重置消息
    set({ isVisible: false, message: null });
  },
}));
