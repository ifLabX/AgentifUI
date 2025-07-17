import { useChatLayoutStore } from '@lib/stores/chat-layout-store';

import { useEffect } from 'react';

/**
 * Hook to reset chat input height.
 *
 * Handles resetting the chat input height in different scenarios (welcome screen/chat screen).
 *
 * @param isWelcomeScreen Whether the current screen is the welcome screen.
 */
export function useInputHeightReset(isWelcomeScreen: boolean) {
  const { resetInputHeight } = useChatLayoutStore();

  // Reset input height when the screen state changes
  useEffect(() => {
    resetInputHeight();
  }, [isWelcomeScreen, resetInputHeight]);

  // Reset input height when the component unmounts
  useEffect(() => {
    return () => {
      resetInputHeight();
    };
  }, [resetInputHeight]);
}
