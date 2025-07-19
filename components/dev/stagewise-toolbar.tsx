'use client';

import { StagewiseToolbar } from '@stagewise/toolbar-next';

import { useEffect, useState } from 'react';

// This component encapsulates the Stagewise toolbar, ensuring it only runs in the development environment
// By using useEffect and useState to handle client-side rendering
// Next.js automatically exposes the process.env.NODE_ENV in the client
export function StagewiseToolbarWrapper() {
  // Use state to track whether it is in the client environment
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Basic toolbar configuration
  const stagewiseConfig = {
    plugins: [],
  };

  // Only render in the client, and rely on Next.js's built-in environment variable detection
  if (isMounted && process.env.NODE_ENV === 'development') {
    return <StagewiseToolbar config={stagewiseConfig} />;
  }

  return null;
}
