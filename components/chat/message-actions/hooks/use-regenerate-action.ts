'use client';

import { useCallback, useState } from 'react';

/**
 * Hook for regenerate functionality.
 *
 * @param onRegenerate Callback function to be called when regenerate is triggered.
 * @param initialRegenerating Initial state indicating whether regenerating is in progress.
 * @returns Regenerating state and handler functions.
 */
export function useRegenerateAction(
  onRegenerate: () => void,
  initialRegenerating = false
) {
  // State indicating whether regenerating is in progress
  const [isRegenerating, setIsRegenerating] = useState(initialRegenerating);

  // Handler for regenerate action
  const handleRegenerate = useCallback(() => {
    if (typeof onRegenerate === 'function' && !isRegenerating) {
      setIsRegenerating(true);

      // Call the regenerate callback
      onRegenerate();

      // Note: In real applications, the regenerating state should be reset by the external caller after completion.
      // This is just an example; you may want to provide a resetRegenerating method for actual usage.
    }
  }, [onRegenerate, isRegenerating]);

  // Handler to reset the regenerating state
  const resetRegenerating = useCallback(() => {
    setIsRegenerating(false);
  }, []);

  return {
    handleRegenerate,
    isRegenerating,
    resetRegenerating,
  };
}
