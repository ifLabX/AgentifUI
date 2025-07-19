/**
 * Page loading spinner component
 *
 * Used to display a fullscreen loading state
 */
import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { cn } from '@lib/utils';

import React, { useEffect, useState } from 'react';

interface PageLoadingSpinnerProps {
  isLoading: boolean;
}

/**
 * PageLoadingSpinner
 * @description Shows a fullscreen loading spinner with a fade-in delay to prevent flicker.
 */
export function PageLoadingSpinner({ isLoading }: PageLoadingSpinnerProps) {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);

  // Add a delay before showing the spinner to avoid flicker
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isLoading]);

  if (!isLoading || !visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'transition-opacity duration-300',
        colors.mainBackground.tailwind,
        'bg-opacity-80',
        'backdrop-blur-sm'
      )}
    >
      <SpinnerIcon size={40} />
    </div>
  );
}

interface SpinnerIconProps {
  size?: number;
}

/**
 * SpinnerIcon
 * @description SVG spinner icon for loading indication
 */
function SpinnerIcon({ size = 24 }: SpinnerIconProps) {
  const { isDark } = useThemeColors();

  return (
    <svg
      className={cn(
        'animate-spin',
        isDark ? 'text-stone-300' : 'text-stone-600'
      )}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
