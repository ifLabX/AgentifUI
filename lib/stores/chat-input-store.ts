import { create } from 'zustand';

// Utility function to get the current route
// Supports SSR environment to avoid hydration errors
const getCurrentRoute = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return 'default'; // Default route for SSR environment
};

interface ChatInputState {
  // Store message content by route
  // Each route maintains its own input content for better UX
  messagesByRoute: Record<string, string>;
  currentRoute: string;

  // Compatibility: keep original API unchanged
  // Get message for current route via function
  message: string; // Normal property, updated via computed
  getMessage: () => string; // Manual getter function
  setMessage: (message: string) => void;
  clearMessage: () => void;

  // Route management functions
  setCurrentRoute: (route: string) => void;
  clearAllMessages: () => void;
  clearRouteMessage: (route: string) => void;

  // IME (input method) state
  isComposing: boolean;
  setIsComposing: (isComposing: boolean) => void;

  // Chat UI state
  isWelcomeScreen: boolean;
  setIsWelcomeScreen: (isWelcome: boolean) => void;

  // Dark mode state
  isDark: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useChatInputStore = create<ChatInputState>((set, get) => ({
  // Store message content by route
  messagesByRoute: {},
  currentRoute: getCurrentRoute(),

  // Compatibility: message property
  // Returns message for current route, or empty string if not set
  message: '',

  getMessage: () => {
    const state = get();
    return state.messagesByRoute[state.currentRoute] || '';
  },

  // Compatibility: setMessage
  // Set message for current route, avoid unnecessary updates
  setMessage: (message: string) => {
    const state = get();
    const currentMessage = state.messagesByRoute[state.currentRoute] || '';

    // Prevent update if value is the same to avoid unnecessary state changes
    if (currentMessage === message) return;

    set(state => ({
      messagesByRoute: {
        ...state.messagesByRoute,
        [state.currentRoute]: message,
      },
      // Also update message property for compatibility
      message: message,
    }));
  },

  // Compatibility: clearMessage
  // Clear message for current route
  clearMessage: () => {
    set(state => ({
      messagesByRoute: {
        ...state.messagesByRoute,
        [state.currentRoute]: '',
      },
      // Also update message property for compatibility
      message: '',
    }));
  },

  // Route management: set current route
  setCurrentRoute: (route: string) => {
    const state = get();
    if (state.currentRoute !== route) {
      // When switching route, update message property to new route's content
      const newMessage = state.messagesByRoute[route] || '';
      set({
        currentRoute: route,
        message: newMessage,
      });
    }
  },

  clearAllMessages: () => {
    set({
      messagesByRoute: {},
      message: '',
    });
  },

  clearRouteMessage: (route: string) => {
    set(state => {
      const newMessages = { ...state.messagesByRoute };
      delete newMessages[route];

      // If deleting current route, also update message property
      const newMessage = route === state.currentRoute ? '' : state.message;

      return {
        messagesByRoute: newMessages,
        message: newMessage,
      };
    });
  },

  // IME (input method) state
  isComposing: false,
  setIsComposing: (isComposingValue: boolean) => {
    if (get().isComposing !== isComposingValue) {
      set({ isComposing: isComposingValue });
    }
  },

  // Chat UI state
  isWelcomeScreen: true,
  setIsWelcomeScreen: isWelcome => set({ isWelcomeScreen: isWelcome }),

  // Dark mode state
  isDark: false,
  toggleDarkMode: () => set(state => ({ isDark: !state.isDark })),
  setDarkMode: isDark => set({ isDark }),
}));
