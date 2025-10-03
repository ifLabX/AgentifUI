'use client';

import { useCallback, useState } from 'react';

/**
 * Hook for copy-to-clipboard functionality.
 *
 * @param content The content to be copied.
 * @returns Copy state and handler function.
 */
export function useCopyAction(content: string) {
  // State indicating whether the content has been copied
  const [isCopied, setIsCopied] = useState(false);

  // Handler for performing the copy action
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [content]);

  return { handleCopy, isCopied };
}
