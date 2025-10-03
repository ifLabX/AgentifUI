'use client';

import { useCallback } from 'react';

/**
 * Hook for edit functionality.
 *
 * @param onEdit Callback function to be called when edit is triggered.
 * @returns An object containing the handleEdit function.
 */
export function useEditAction(onEdit: () => void) {
  // Handler for edit action
  const handleEdit = useCallback(() => {
    if (typeof onEdit === 'function') {
      onEdit();
    }
  }, [onEdit]);

  return { handleEdit };
}
