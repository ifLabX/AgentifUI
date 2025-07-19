'use client';

import { useThemeColors } from '@lib/hooks/use-theme-colors';
import { useWelcomeLayout } from '@lib/hooks/use-welcome-layout';
import { cn } from '@lib/utils';

// Container component - uses intelligent layout system
interface ChatContainerProps {
  children: React.ReactNode;
  isWelcomeScreen?: boolean;
  isDark?: boolean;
  className?: string;
  widthClass: string;
  // Whether transitioning from conversation interface to welcome interface
  // When true, use flashing effect instead of sliding
  // When false, keep existing sliding effect
  isTransitioningToWelcome?: boolean;
}

// Define the distance from the conversation interface to the bottom
const INPUT_BOTTOM_MARGIN = '1rem';

export const ChatContainer = ({
  children,
  isWelcomeScreen = false,
  isDark = false,
  className,
  widthClass,
  isTransitioningToWelcome = false,
}: ChatContainerProps) => {
  // Get theme colors and intelligent layout position
  const { colors } = useThemeColors();
  const { input: inputPosition } = useWelcomeLayout();

  // Base styles including absolute positioning and width
  // Simplified transition effects using opacity instead of sliding
  const baseClasses = cn(
    'absolute left-1/2 w-full', // Position and width
    widthClass,
    // Use flashing transition effect, only transition opacity
    'transition-opacity duration-100 ease-in-out',
    className
  );

  // Dynamic calculation of styles, based on current state to determine position and deformation
  // Welcome screen uses intelligent layout system, conversation interface maintains original logic
  const dynamicStyles: React.CSSProperties = isWelcomeScreen
    ? {
        // Welcome screen: use intelligent layout system calculated position
        top: inputPosition.top,
        bottom: 'auto', // Ensure bottom is invalid
        transform: inputPosition.transform,
        // Use flashing effect uniformly
        transition: 'opacity 100ms ease-in-out',
      }
    : {
        // Conversation interface: based on bottom positioning, and horizontally centered through transform
        top: 'auto', // Ensure top is invalid
        bottom: INPUT_BOTTOM_MARGIN,
        transform: 'translateX(-50%)',
        // Use flashing effect uniformly
        transition: 'opacity 100ms ease-in-out',
      };

  return (
    <div className={baseClasses} style={dynamicStyles}>
      <div
        className={cn(
          'flex flex-col rounded-2xl',
          isDark ? colors.sidebarBackground.tailwind : 'bg-white',
          'shadow-[0_0_15px_rgba(0,0,0,0.1)]'
        )}
      >
        {children}
      </div>
    </div>
  );
};
