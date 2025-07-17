'use client';

import { useMemo } from 'react';

export interface PlatformKeys {
  /** Whether the platform is Mac */
  isMac: boolean;
  /** Whether the platform is Windows */
  isWindows: boolean;
  /** Whether the platform is Linux */
  isLinux: boolean;
  /** Modifier key symbol (Mac: ⌘, Others: Ctrl) */
  modifierSymbol: string;
  /** Modifier key text (Mac: Cmd, Others: Ctrl) */
  modifierKey: string;
  /** Option/Alt key symbol (Mac: ⌥, Others: Alt) */
  altSymbol: string;
  /** Option/Alt key text (Mac: Option, Others: Alt) */
  altKey: string;
  /** Shift key symbol */
  shiftSymbol: string;
  /** Format shortcut as text */
  formatShortcut: (keys: readonly string[]) => string;
  /** Format shortcut as symbol array */
  formatShortcutSymbols: (keys: readonly string[]) => string[];
}

/**
 * Platform detection and shortcut key hook.
 *
 * Features:
 * - Minimal performance cost (detects only once at initialization)
 * - Supports all major platforms
 * - Provides both text and symbol shortcut formats
 * - SSR safe (returns default values on server side)
 *
 * @returns PlatformKeys platform info and formatting functions
 */
export function usePlatformKeys(): PlatformKeys {
  return useMemo(() => {
    // SSR safety check
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      // Return default values for server-side rendering (assume non-Mac)
      return {
        isMac: false,
        isWindows: false,
        isLinux: false,
        modifierSymbol: 'Ctrl',
        modifierKey: 'Ctrl',
        altSymbol: 'Alt',
        altKey: 'Alt',
        shiftSymbol: 'Shift',
        formatShortcut: (keys: readonly string[]) => keys.join(' + '),
        formatShortcutSymbols: (keys: readonly string[]) => [...keys],
      };
    }

    // Platform detection (prefer navigator.platform, fallback to userAgent)
    const platform = navigator.platform?.toUpperCase() || '';
    const userAgent = navigator.userAgent || '';

    const isMac =
      platform.includes('MAC') || /Mac|iPhone|iPad|iPod/.test(userAgent);
    const isWindows = platform.includes('WIN') || userAgent.includes('Windows');
    const isLinux = platform.includes('LINUX') || userAgent.includes('Linux');

    // Return platform-specific key symbols and text
    const platformKeys: PlatformKeys = {
      isMac,
      isWindows,
      isLinux,
      modifierSymbol: isMac ? '⌘' : 'Ctrl',
      modifierKey: isMac ? 'Cmd' : 'Ctrl',
      altSymbol: isMac ? '⌥' : 'Alt',
      altKey: isMac ? 'Option' : 'Alt',
      shiftSymbol: '⇧',

      // Format shortcut as text (e.g., ["Cmd", "N"] -> "Cmd + N")
      formatShortcut: (keys: readonly string[]) => {
        return keys
          .map(key => {
            // Auto convert modifier keys
            if (key.toLowerCase() === 'cmd' || key.toLowerCase() === 'ctrl') {
              return isMac ? 'Cmd' : 'Ctrl';
            }
            if (key.toLowerCase() === 'option' || key.toLowerCase() === 'alt') {
              return isMac ? 'Option' : 'Alt';
            }
            return key;
          })
          .join(' + ');
      },

      // Format shortcut as symbol array (e.g., ["⌘", "Enter"] -> ["⌘", "⏎"])
      formatShortcutSymbols: (keys: readonly string[]) => {
        return keys.map(key => {
          // Auto convert modifier key symbols
          if (key.toLowerCase() === 'cmd' || key.toLowerCase() === 'ctrl') {
            return isMac ? '⌘' : 'Ctrl';
          }
          if (key.toLowerCase() === 'option' || key.toLowerCase() === 'alt') {
            return isMac ? '⌥' : 'Alt';
          }
          if (key.toLowerCase() === 'shift') {
            return '⇧';
          }
          // Special key: Enter to symbol
          if (key.toLowerCase() === 'enter') {
            return '⏎';
          }
          return key;
        });
      },
    };

    return platformKeys;
  }, []); // Empty dependency array, only runs once on mount
}

/**
 * Predefined common shortcut key combinations
 */
export const COMMON_SHORTCUTS = {
  // Basic operations
  NEW: ['Cmd', 'N'],
  SAVE: ['Cmd', 'S'],
  SAVE_SUBMIT: ['Cmd', 'Enter'], // Save/submit form
  OPEN: ['Cmd', 'O'],
  CLOSE: ['Cmd', 'W'],
  QUIT: ['Cmd', 'Q'],

  // Edit operations
  COPY: ['Cmd', 'C'],
  PASTE: ['Cmd', 'V'],
  CUT: ['Cmd', 'X'],
  UNDO: ['Cmd', 'Z'],
  REDO: ['Cmd', 'Shift', 'Z'],
  SELECT_ALL: ['Cmd', 'A'],

  // Find operations
  FIND: ['Cmd', 'F'],
  FIND_NEXT: ['Cmd', 'G'],
  FIND_PREV: ['Cmd', 'Shift', 'G'],

  // Navigation operations
  REFRESH: ['Cmd', 'R'],
  BACK: ['Cmd', 'Left'],
  FORWARD: ['Cmd', 'Right'],
  HOME: ['Cmd', 'Home'],
  END: ['Cmd', 'End'],

  // UI operations
  TOGGLE_SIDEBAR: ['Cmd', '\\'],
  SETTINGS: ['Cmd', ','],
  TOGGLE_FULLSCREEN: ['Cmd', 'Shift', 'F'],

  // App specific
  NEW_TAB: ['Cmd', 'T'],
  CLOSE_TAB: ['Cmd', 'W'],
  NEXT_TAB: ['Cmd', 'Shift', ']'],
  PREV_TAB: ['Cmd', 'Shift', '['],

  // Cancel/confirm
  CANCEL: ['Escape'],
  SUBMIT: ['Enter'],

  // App features (AgentifUI specific)
  NEW_CHAT: ['Cmd', 'K'],
  RECENT_CHATS: ['Cmd', 'H'], // H for History
  APPS_MARKET: ['Cmd', 'Shift', 'A'],
} as const;

/**
 * Shortcut formatting utility hook
 *
 * @param shortcutKey Key name from COMMON_SHORTCUTS
 * @returns Formatted shortcut object
 */
export function useFormattedShortcut(
  shortcutKey: keyof typeof COMMON_SHORTCUTS
) {
  const platformKeys = usePlatformKeys();

  return useMemo(() => {
    const keys = COMMON_SHORTCUTS[shortcutKey];
    return {
      keys,
      text: platformKeys.formatShortcut(keys),
      symbols: platformKeys.formatShortcutSymbols(keys),
      platformKeys,
    };
  }, [shortcutKey, platformKeys]);
}
