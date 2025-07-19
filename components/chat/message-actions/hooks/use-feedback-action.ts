'use client';

import { useCallback, useState } from 'react';

/**
 * Hook for feedback functionality.
 *
 * @param onFeedback Callback function to be called when feedback is given. Receives a boolean indicating if the feedback is positive.
 * @returns Feedback state and handler function.
 */
export function useFeedbackAction(onFeedback: (isPositive: boolean) => void) {
  // State indicating whether feedback has been given
  const [hasFeedback, setHasFeedback] = useState(false);
  // State indicating whether the feedback is positive
  const [isPositive, setIsPositive] = useState<boolean | null>(null);

  // Handler for feedback action
  const handleFeedback = useCallback(
    (positive: boolean) => {
      if (typeof onFeedback === 'function') {
        onFeedback(positive);
        setHasFeedback(true);
        setIsPositive(positive);
      }
    },
    [onFeedback]
  );

  return {
    handleFeedback,
    hasFeedback,
    isPositive,
  };
}
