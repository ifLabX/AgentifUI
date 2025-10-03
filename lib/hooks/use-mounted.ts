import { useEffect, useState } from 'react';

/**
 * Hook to determine if the component has been mounted.
 * Useful for preventing flickering during the mounting process.
 */
export function useMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return isMounted;
}
