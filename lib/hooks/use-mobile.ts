import { useEffect, useState } from 'react';

// Define mobile device breakpoint (matches Tailwind md breakpoint)
const MOBILE_BREAKPOINT = 768;

export function useMobile() {
  // Initial state is undefined to avoid SSR hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Use MediaQueryList to listen for screen size changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Add change event listener
    mql.addEventListener('change', onChange);

    // Immediately check current state
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // Cleanup event listener on unmount
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // Always return a boolean (even if initial state is undefined)
  return !!isMobile;
}
