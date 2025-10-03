'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ClientRenderProps {
  children: ReactNode | ((clientProps: { isMounted: boolean }) => ReactNode);
  fallback?: ReactNode;
}

/**
 * Client-only render wrapper.
 *
 * This component ensures its children are only rendered on the client,
 * preventing hydration errors caused by server/client rendering mismatches.
 *
 * @param children Content or render function to be rendered on the client
 * @param fallback Content to display during SSR or initial client render (optional)
 */
export function ClientRender({ children, fallback = null }: ClientRenderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return fallback;
  }

  return typeof children === 'function' ? children({ isMounted }) : children;
}

/**
 * Client render hook.
 *
 * Detects if the component has been mounted on the client.
 * Useful for conditionally rendering client-only content.
 */
export function useIsClient() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
