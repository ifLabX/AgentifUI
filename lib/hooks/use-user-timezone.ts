'use client';

import { useCallback, useEffect, useState } from 'react';

// User timezone preference hook
// Uses localStorage to store user's timezone setting, supports fallback to system timezone
const TIMEZONE_STORAGE_KEY = 'user-timezone';

// Validate if a timezone string is valid
// Uses Intl.DateTimeFormat to check validity
const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

// Get the system default timezone
// Used as a fallback when user has not set a timezone
const getSystemTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

export function useUserTimezone() {
  const [timezone, setTimezone] = useState<string>(() => {
    // Initialize timezone: prefer user setting, fallback to system timezone
    // Ensure a reasonable default value during server-side rendering
    if (typeof window === 'undefined') {
      return 'UTC'; // Default value for SSR
    }

    const savedTimezone = localStorage.getItem(TIMEZONE_STORAGE_KEY);

    if (savedTimezone && isValidTimezone(savedTimezone)) {
      return savedTimezone;
    }

    return getSystemTimezone();
  });

  // Update timezone on client hydration
  // Ensures consistency between server and client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTimezone = localStorage.getItem(TIMEZONE_STORAGE_KEY);

      if (savedTimezone && isValidTimezone(savedTimezone)) {
        setTimezone(savedTimezone);
      } else {
        const systemTimezone = getSystemTimezone();
        setTimezone(systemTimezone);
        // Save system timezone to localStorage as default
        localStorage.setItem(TIMEZONE_STORAGE_KEY, systemTimezone);
      }
    }
  }, []);

  // Update user timezone setting
  // Updates both state and localStorage
  const updateTimezone = useCallback((newTimezone: string) => {
    if (!isValidTimezone(newTimezone)) {
      console.warn(`[useUserTimezone] Invalid timezone: ${newTimezone}`);
      return false;
    }

    setTimezone(newTimezone);

    if (typeof window !== 'undefined') {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, newTimezone);
    }

    return true;
  }, []);

  // Reset to system timezone
  // Clears user custom setting and reverts to system default
  const resetToSystemTimezone = useCallback(() => {
    const systemTimezone = getSystemTimezone();
    setTimezone(systemTimezone);

    if (typeof window !== 'undefined') {
      localStorage.setItem(TIMEZONE_STORAGE_KEY, systemTimezone);
    }

    return systemTimezone;
  }, []);

  // Check if current timezone is the system timezone
  const isSystemTimezone = timezone === getSystemTimezone();

  return {
    timezone,
    updateTimezone,
    resetToSystemTimezone,
    isSystemTimezone,
    systemTimezone: getSystemTimezone(),
  };
}
