import { useEffect, useState } from 'react';

import { useTheme as useNextTheme } from 'next-themes';

/**
 * Get the initial theme (dark or light) from localStorage or system preference.
 * This function runs immediately on the client and does not depend on React state.
 * Returns true if dark mode should be enabled, false otherwise.
 */
const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    // Check theme setting in localStorage first
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') return true;
    if (storedTheme === 'light') return false;

    // If theme is 'system' or not set, check system preference
    if (storedTheme === 'system' || !storedTheme) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Custom useTheme hook.
 * Wraps next-themes' useTheme and provides a compatible interface for the project.
 * Handles hydration issues to ensure isDark is correct on initial render.
 */
export function useTheme() {
  const {
    theme, // Current theme setting ('light', 'dark', or 'system')
    setTheme, // Function to set theme ('light', 'dark', 'system')
    resolvedTheme, // The actual applied theme ('light' or 'dark'), resolves 'system'
    // systemTheme, // User's system preference ('light' or 'dark')
  } = useNextTheme();

  // Use initial theme state to avoid flicker.
  // Get the correct theme state on the client immediately, not waiting for mount.
  const [mounted, setMounted] = useState(false);
  const [initialDark] = useState(() => getInitialTheme());

  useEffect(() => setMounted(true), []);

  // Compute isDark state.
  // Use initial theme before mount, use resolvedTheme after mount.
  // This avoids theme flicker on initial render.
  const isDark = mounted ? resolvedTheme === 'dark' : initialDark;

  /**
   * Toggle between light and dark mode.
   * Uses resolvedTheme to determine the current applied theme.
   */
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // Return theme state and actions.
  return {
    theme, // Current setting ('light', 'dark', 'system')
    setTheme, // Function to set theme
    resolvedTheme, // Actual applied theme ('light', 'dark')
    isDark, // Whether dark mode is enabled (only valid after mount)
    toggleTheme, // Function to toggle light/dark mode
  };
}
