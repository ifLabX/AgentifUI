'use client';

import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatStore } from '@lib/stores/chat-store';
import { useChatTransitionStore } from '@lib/stores/chat-transition-store';
import { useSidebarStore } from '@lib/stores/sidebar-store';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useChatInterface } from './use-chat-interface';
import { usePlatformKeys } from './use-platform-keys';

/**
 * Shortcut categories definition
 */
export const SHORTCUT_CATEGORIES = {
  /** Navigation shortcuts - should be available even in input fields */
  NAVIGATION: 'navigation',
  /** Editing shortcuts - should be disabled in input fields to avoid conflicts */
  EDITING: 'editing',
  /** System shortcuts - always available */
  SYSTEM: 'system',
} as const;

type ShortcutCategory =
  (typeof SHORTCUT_CATEGORIES)[keyof typeof SHORTCUT_CATEGORIES];

/**
 * SmartShortcut interface
 */
export interface SmartShortcut {
  /** Key combination */
  keys: {
    key: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  };
  /** Shortcut category */
  category: ShortcutCategory;
  /** Callback function */
  handler: (event: KeyboardEvent) => void;
  /** Description */
  description: string;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
}

/**
 * Smart shortcut hook
 *
 * Features:
 * 1. Navigation shortcuts (e.g. new chat, switch app) are available even in input fields
 * 2. Editing shortcuts (e.g. copy/paste) are disabled in input fields to avoid conflicts
 * 3. System shortcuts are always available
 *
 * @param options Configuration options
 */
export function useSmartShortcuts(
  options: {
    /** Whether to enable shortcuts */
    enabled?: boolean;
    /** Custom shortcut list */
    customShortcuts?: SmartShortcut[];
  } = {}
) {
  const { enabled = true, customShortcuts = [] } = options;

  const router = useRouter();
  const platformKeys = usePlatformKeys();
  const { clearConversationState } = useChatInterface();

  useEffect(() => {
    if (!enabled) return;

    // Default shortcut definitions, organized by category for selective enabling in different scenarios
    const defaultShortcuts: SmartShortcut[] = [
      // Navigation shortcuts - available even in input fields
      {
        keys: {
          key: 'k',
          metaKey: platformKeys.isMac,
          ctrlKey: !platformKeys.isMac,
        },
        category: SHORTCUT_CATEGORIES.NAVIGATION,
        handler: handleNewChat,
        description: 'New Chat',
        preventDefault: true,
      },
      {
        keys: {
          key: 'h',
          metaKey: platformKeys.isMac,
          ctrlKey: !platformKeys.isMac,
        },
        category: SHORTCUT_CATEGORIES.NAVIGATION,
        handler: () => router.push('/chat/history'),
        description: 'Chat History',
        preventDefault: true,
      },
      {
        keys: {
          key: 'a',
          metaKey: platformKeys.isMac,
          ctrlKey: !platformKeys.isMac,
          shiftKey: true,
        },
        category: SHORTCUT_CATEGORIES.NAVIGATION,
        handler: () => router.push('/apps'),
        description: 'App Market',
        preventDefault: true,
      },
      {
        keys: {
          key: ',',
          metaKey: platformKeys.isMac,
          ctrlKey: !platformKeys.isMac,
        },
        category: SHORTCUT_CATEGORIES.NAVIGATION,
        handler: () => router.push('/settings'),
        description: 'Settings',
        preventDefault: true,
      },
      // System shortcuts - always available
      {
        keys: {
          key: '\\',
          metaKey: platformKeys.isMac,
          ctrlKey: !platformKeys.isMac,
        },
        category: SHORTCUT_CATEGORIES.SYSTEM,
        handler: () => {
          const { toggleSidebar } = useSidebarStore.getState();
          toggleSidebar();
        },
        description: 'Toggle Sidebar',
        preventDefault: true,
      },
    ];

    // Merge default shortcuts and custom shortcuts
    const allShortcuts = [...defaultShortcuts, ...customShortcuts];

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      // Smart shortcut filtering logic
      // Decide whether to execute based on current focus state and shortcut category
      for (const shortcut of allShortcuts) {
        // Skip editing shortcuts in input fields
        if (isInInput && shortcut.category === SHORTCUT_CATEGORIES.EDITING) {
          continue;
        }

        // Check if key combination matches
        if (matchesShortcut(event, shortcut.keys)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          console.log(
            `[SmartShortcuts] Executing shortcut: ${shortcut.description}`
          );
          shortcut.handler(event);
          return; // Only execute the first matched shortcut
        }
      }
    };

    // Handler for new chat shortcut
    function handleNewChat() {
      const isAlreadyOnNewChat = window.location.pathname === '/chat/new';
      if (isAlreadyOnNewChat) {
        return;
      }

      console.log('[SmartShortcuts] Cmd+K: Start new chat');

      // Immediately route to new chat page
      router.push('/chat/new');

      // Delay state cleanup to ensure routing is complete
      setTimeout(() => {
        // Clear chatStore state
        const { clearMessages, setCurrentConversationId } =
          useChatStore.getState();
        const { setIsWelcomeScreen } = useChatInputStore.getState();
        const { setIsTransitioningToWelcome } =
          useChatTransitionStore.getState();
        const { selectItem } = useSidebarStore.getState();

        clearMessages();
        setCurrentConversationId(null);

        // Clear conversation state in use-chat-interface
        clearConversationState();

        // Clear other UI states
        setIsWelcomeScreen(true);
        setIsTransitioningToWelcome(true);
        useChatStore.getState().setIsWaitingForResponse(false);

        selectItem('chat', null, true);

        console.log('[SmartShortcuts] State cleanup complete');
      }, 100);
    }

    // Shortcut matching function
    function matchesShortcut(
      event: KeyboardEvent,
      shortcutKeys: SmartShortcut['keys']
    ): boolean {
      // Prevent errors from password managers or special events
      if (!event.key || typeof event.key !== 'string') return false;

      const keyMatch =
        event.key.toLowerCase() === shortcutKeys.key.toLowerCase();
      const metaMatch = shortcutKeys.metaKey ? event.metaKey : !event.metaKey;
      const ctrlMatch = shortcutKeys.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const shiftMatch = shortcutKeys.shiftKey
        ? event.shiftKey
        : !event.shiftKey;
      const altMatch = shortcutKeys.altKey ? event.altKey : !event.altKey;

      return keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch;
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    customShortcuts,
    router,
    platformKeys.isMac,
    clearConversationState,
  ]);

  // Return shortcut management utility functions
  // Allows components to get the current available shortcut info
  return {
    /** Get the list of shortcuts available in the current context */
    getAvailableShortcuts: (
      context: 'input' | 'normal' = 'normal'
    ): SmartShortcut[] => {
      const defaultShortcuts: SmartShortcut[] = [
        {
          keys: {
            key: 'k',
            metaKey: platformKeys.isMac,
            ctrlKey: !platformKeys.isMac,
          },
          category: SHORTCUT_CATEGORIES.NAVIGATION,
          handler: () => {},
          description: 'New Chat',
        },
        {
          keys: {
            key: 'h',
            metaKey: platformKeys.isMac,
            ctrlKey: !platformKeys.isMac,
          },
          category: SHORTCUT_CATEGORIES.NAVIGATION,
          handler: () => {},
          description: 'Chat History',
        },
        {
          keys: {
            key: 'a',
            metaKey: platformKeys.isMac,
            ctrlKey: !platformKeys.isMac,
            shiftKey: true,
          },
          category: SHORTCUT_CATEGORIES.NAVIGATION,
          handler: () => {},
          description: 'App Market',
        },
        {
          keys: {
            key: ',',
            metaKey: platformKeys.isMac,
            ctrlKey: !platformKeys.isMac,
          },
          category: SHORTCUT_CATEGORIES.NAVIGATION,
          handler: () => {},
          description: 'Settings',
        },
        {
          keys: {
            key: '\\',
            metaKey: platformKeys.isMac,
            ctrlKey: !platformKeys.isMac,
          },
          category: SHORTCUT_CATEGORIES.SYSTEM,
          handler: () => {},
          description: 'Toggle Sidebar',
        },
      ];

      const allShortcuts = [...defaultShortcuts, ...customShortcuts];

      if (context === 'input') {
        // In input fields, only return navigation and system shortcuts
        return allShortcuts.filter(
          s =>
            s.category === SHORTCUT_CATEGORIES.NAVIGATION ||
            s.category === SHORTCUT_CATEGORIES.SYSTEM
        );
      }

      return allShortcuts;
    },
  };
}

/**
 * Helper function to create a custom shortcut
 */
export function createShortcut(
  keys: SmartShortcut['keys'],
  category: ShortcutCategory,
  handler: (event: KeyboardEvent) => void,
  description: string,
  preventDefault: boolean = true
): SmartShortcut {
  return {
    keys,
    category,
    handler,
    description,
    preventDefault,
  };
}
