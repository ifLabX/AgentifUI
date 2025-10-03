import { useChatInputStore } from '@lib/stores/chat-input-store';

import { useEffect } from 'react';

import { useTheme } from './use-theme';
import { useWelcomeScreen } from './use-welcome-screen';

/**
 * Chat state synchronization hook
 * @description Synchronizes global theme and welcome screen state to chat input component using Zustand
 *
 * @returns Object containing current state and setter functions for page usage
 */
export function useChatStateSync() {
  const { isDark } = useTheme();
  const { isWelcomeScreen } = useWelcomeScreen();

  // Get required actions directly from store
  const setDarkMode = useChatInputStore(state => state.setDarkMode);
  const setIsWelcomeScreen = useChatInputStore(
    state => state.setIsWelcomeScreen
  );

  // Sync theme state
  useEffect(() => {
    setDarkMode(isDark);
  }, [isDark, setDarkMode]);

  // Sync welcome screen state
  useEffect(() => {
    setIsWelcomeScreen(isWelcomeScreen);
  }, [isWelcomeScreen, setIsWelcomeScreen]);

  // Return current state and setter functions for page usage
  return { isDark, isWelcomeScreen, setIsWelcomeScreen };
}
