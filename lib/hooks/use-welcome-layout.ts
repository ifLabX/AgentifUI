import { useChatLayoutStore } from '@lib/stores/chat-layout-store';

import { useCallback, useEffect, useState } from 'react';

// Welcome screen layout configuration interface
// Modify these parameters to easily adjust the position and spacing of each component
export interface WelcomeLayoutConfig {
  // The position of the input box on the welcome screen (offset relative to the viewport center)
  inputOffsetFromCenter: number; // Pixel value, positive moves down, negative moves up

  // Minimum spacing between components
  minSpacing: {
    welcomeTextToInput: number; // Minimum distance from welcome text to input box
    suggestedQuestionsToInput: number; // Minimum distance from suggested questions to input box
    welcomeTextToSuggestedQuestions: number; // Minimum distance from welcome text to suggested questions
    // Extension area: spacing config for new components
    // Add spacing config here when adding new components
    [key: string]: number; // Support for dynamically adding new component spacing
  };

  // Estimated component heights (used for layout calculation)
  estimatedHeights: {
    welcomeText: number; // Height of the welcome text area
    suggestedQuestions: number; // Height of the suggested questions container
    inputContainer: number; // Height of the input container
    // Extension area: estimated height for new components
    // Add estimated height here when adding new components
    [key: string]: number; // Support for dynamically adding new component heights
  };

  // Threshold for triggering compact layout
  compactLayoutThreshold: number; // Proportion of viewport height (0-1)

  // Extension config: support for custom config of new components
  extensions?: {
    [componentName: string]: {
      enabled: boolean; // Whether the component is enabled
      priority: number; // Layout priority (lower number = higher priority)
      positioning:
        | 'above-input'
        | 'below-input'
        | 'above-welcome'
        | 'below-suggested-questions'
        | 'custom';
      customOffset?: number; // Custom offset (used only when positioning is 'custom')
    };
  };
}

// Core layout configuration - adjust main parameters here
const DEFAULT_WELCOME_LAYOUT: WelcomeLayoutConfig = {
  // Input box position: adjust this value to change overall layout height
  // Positive moves down, negative moves up, 0 is viewport center
  inputOffsetFromCenter: -20, // Currently offset down by 20px, can be set negative to move up

  minSpacing: {
    // Spacing config: adjust these values to change distance between components
    welcomeTextToInput: 10, // Distance from welcome text to input box, decrease to move text closer to input
    suggestedQuestionsToInput: 40, // Distance from suggested questions to input box
    welcomeTextToSuggestedQuestions: 30, // Distance from welcome text to suggested questions
  },

  estimatedHeights: {
    // Height estimation: used for layout calculation, adjust if component actual height changes
    welcomeText: 120, // Height of welcome text area (including title and subtitle)
    suggestedQuestions: 200, // Height of suggested questions container (increase to support multi-line display)
    inputContainer: 80, // Base height of input container
  },

  // Compact layout trigger threshold: compact mode is enabled when available space is less than this proportion of viewport height
  compactLayoutThreshold: 0.9, // 90%, can be set higher (e.g. 0.95) to trigger compact mode more easily
};

// Preset layout configurations - optimized for different screen sizes
/**
 * Create compact layout configuration (for small screens)
 */
function createCompactLayout(): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    // Compact mode: input box centered, ensure subtitle is visible
    inputOffsetFromCenter: -50, // Move up
    minSpacing: {
      welcomeTextToInput: 60, // Adequate spacing to ensure subtitle is not covered
      suggestedQuestionsToInput: 40, // Reduce spacing
      welcomeTextToSuggestedQuestions: 20, // Reduce spacing
    },
    estimatedHeights: {
      welcomeText: 90, // Compact text area, consider subtitle
      suggestedQuestions: 100, // Compact suggested questions container
      inputContainer: 70, // Compact input box
    },
    compactLayoutThreshold: 0.95, // Easier to trigger compact layout
  };
}

/**
 * Create spaced layout configuration (for large screens)
 */
function createSpacedLayout(): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    // Spaced mode: also move up on large screens, but keep comfortable spacing
    inputOffsetFromCenter: -120, // Also move up on large screens
    minSpacing: {
      welcomeTextToInput: 0, // Increase spacing
      suggestedQuestionsToInput: 50, // Increase spacing
      welcomeTextToSuggestedQuestions: 40, // Increase spacing
    },
    estimatedHeights: {
      welcomeText: 150, // Larger text area
      suggestedQuestions: 140, // Larger suggested questions container
      inputContainer: 100, // Larger input box
    },
    compactLayoutThreshold: 0.8, // Less likely to trigger compact layout
  };
}

// Responsive configuration: automatically select appropriate layout based on screen size
function getResponsiveLayout(): WelcomeLayoutConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_WELCOME_LAYOUT;
  }

  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Screen size detection: adjust these thresholds to change responsive behavior
  // Small screen devices (mobile)
  if (viewportHeight < 700 || viewportWidth < 640) {
    return createCompactLayout();
  }

  // Large screen devices (desktop)
  if (viewportHeight > 900 && viewportWidth > 1200) {
    return createSpacedLayout();
  }

  // Medium screen devices (tablet, small laptop)
  return DEFAULT_WELCOME_LAYOUT;
}

// Utility adjustment functions - quickly fine-tune layout parameters
/**
 * Move welcome text closer to input box
 * @param distance Amount to decrease distance (pixels)
 */
export function moveWelcomeTextCloserToInput(
  distance: number = 20
): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    minSpacing: {
      ...DEFAULT_WELCOME_LAYOUT.minSpacing,
      welcomeTextToInput: Math.max(
        10,
        DEFAULT_WELCOME_LAYOUT.minSpacing.welcomeTextToInput - distance
      ),
    },
  };
}

/**
 * Move suggested questions closer to input box
 * @param distance Amount to decrease distance (pixels)
 */
export function moveSuggestedQuestionsCloserToInput(
  distance: number = 15
): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    minSpacing: {
      ...DEFAULT_WELCOME_LAYOUT.minSpacing,
      suggestedQuestionsToInput: Math.max(
        20,
        DEFAULT_WELCOME_LAYOUT.minSpacing.suggestedQuestionsToInput - distance
      ),
    },
  };
}

/**
 * Move input box higher (upward)
 * @param distance Amount to move up (pixels)
 */
export function moveInputHigher(distance: number = 20): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    inputOffsetFromCenter:
      DEFAULT_WELCOME_LAYOUT.inputOffsetFromCenter - distance,
  };
}

/**
 * Move input box lower (downward)
 * @param distance Amount to move down (pixels)
 */
export function moveInputLower(distance: number = 20): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    inputOffsetFromCenter:
      DEFAULT_WELCOME_LAYOUT.inputOffsetFromCenter + distance,
  };
}

// Mobile welcome text width setting function
// This function is mainly for debugging and testing, actual width is dynamically calculated in the Hook
export function setMobileWelcomeTextWidth(widthRem: number): void {
  console.log(`Set mobile welcome text width: ${widthRem}rem`);
  console.log(
    'Note: Actual width is dynamically calculated by useWelcomeLayout Hook'
  );
  console.log(
    'Mobile uses width for forced width, desktop uses maxWidth for width limit'
  );
}

// Dynamic component addition system
// Supports adding new layout components at runtime
/**
 * Add a new component to the layout system
 * @param componentName Name of the component
 * @param config Component configuration
 * @param baseConfig Base configuration
 */
export function addComponent(
  componentName: string,
  config: {
    height: number;
    spacing: { [key: string]: number };
    positioning:
      | 'above-input'
      | 'below-input'
      | 'above-welcome'
      | 'below-suggested-questions'
      | 'custom';
    priority?: number;
    customOffset?: number;
  },
  baseConfig: WelcomeLayoutConfig = DEFAULT_WELCOME_LAYOUT
): WelcomeLayoutConfig {
  const newConfig = { ...baseConfig };

  // Add estimated height
  newConfig.estimatedHeights[componentName] = config.height;

  // Add spacing configuration
  Object.entries(config.spacing).forEach(([key, value]) => {
    newConfig.minSpacing[key] = value;
  });

  // Add extension configuration
  if (!newConfig.extensions) {
    newConfig.extensions = {};
  }

  newConfig.extensions[componentName] = {
    enabled: true,
    priority: config.priority || 5,
    positioning: config.positioning,
    customOffset: config.customOffset,
  };

  return newConfig;
}

/**
 * Add notification component
 */
export function addNotificationComponent(
  height: number = 40
): WelcomeLayoutConfig {
  return addComponent('notification', {
    height,
    spacing: { notificationToInput: 20 },
    positioning: 'above-input',
    priority: 1,
  });
}

/**
 * Add action buttons group
 */
export function addActionButtons(height: number = 50): WelcomeLayoutConfig {
  return addComponent('actionButtons', {
    height,
    spacing: { actionButtonsToInput: 30 },
    positioning: 'below-suggested-questions',
    priority: 3,
  });
}

/**
 * Add status indicator
 */
export function addStatusIndicator(height: number = 30): WelcomeLayoutConfig {
  return addComponent('statusIndicator', {
    height,
    spacing: { statusToWelcome: 15 },
    positioning: 'above-welcome',
    priority: 2,
  });
}

// Layout position interface definition
interface WelcomeLayoutPositions {
  // Input box position
  input: {
    top: string;
    transform: string;
  };

  // Welcome text container position
  welcomeText: {
    position: 'absolute';
    top: string;
    left: string;
    transform: string;
    padding: string;
  };

  // Dedicated style for welcome text title (highest priority)
  welcomeTextTitle: {
    width?: string;
    maxWidth?: string;
  };

  // Suggested questions container position
  suggestedQuestions: {
    top: string;
    transform: string;
  };

  // Whether layout adjustment is needed (when space is insufficient)
  needsCompactLayout: boolean;

  // Extension component positions: support for dynamically adding new components
  extensions: {
    [componentName: string]: {
      top: string;
      transform: string;
      zIndex?: number;
    };
  };
}

/**
 * Welcome screen layout management hook
 * @description Provides intelligent component positioning to prevent overlapping and ensure proper spacing
 *
 * @usage
 * 1. Adjust DEFAULT_WELCOME_LAYOUT parameters to fine-tune layout
 * 2. inputOffsetFromCenter: Controls overall height (positive moves down, negative moves up)
 * 3. minSpacing: Controls component spacing
 * 4. estimatedHeights: Component height estimation, affects layout calculation
 * 5. compactLayoutThreshold: Compact mode trigger threshold
 */
export function useWelcomeLayout(): WelcomeLayoutPositions {
  const { inputHeight } = useChatLayoutStore();
  const [positions, setPositions] = useState<WelcomeLayoutPositions>({
    input: { top: '50%', transform: 'translate(-50%, calc(-50% + 5rem))' },
    welcomeText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, calc(-50% - 200px))',
      padding: '0 1rem',
    },
    welcomeTextTitle: {
      width: '32rem', // Default moderate max width, will be dynamically adjusted in calculateLayout
    },
    suggestedQuestions: {
      top: 'calc(50% + 120px)',
      transform: 'translateX(-50%)',
    },
    needsCompactLayout: false,
    extensions: {},
  });

  // Intelligent layout calculation function
  const calculateLayout = useCallback(() => {
    const config = getResponsiveLayout();
    const viewportHeight = window.innerHeight;
    const actualInputHeight = Math.max(
      inputHeight,
      config.estimatedHeights.inputContainer
    );

    // 1. Determine input box position (reference point)
    const inputCenterY = viewportHeight / 2 + config.inputOffsetFromCenter;
    const inputTopY = inputCenterY - actualInputHeight / 2;
    const inputBottomY = inputCenterY + actualInputHeight / 2;

    // 2. Calculate ideal position for welcome text
    const idealWelcomeTextBottomY =
      inputTopY - config.minSpacing.welcomeTextToInput;
    const idealWelcomeTextTopY =
      idealWelcomeTextBottomY - config.estimatedHeights.welcomeText;

    // 3. Calculate ideal position for suggested questions
    const idealSuggestedQuestionsTopY =
      inputBottomY + config.minSpacing.suggestedQuestionsToInput;

    // 4. Check if compact layout is needed
    const totalRequiredHeight =
      config.estimatedHeights.welcomeText +
      config.minSpacing.welcomeTextToInput +
      actualInputHeight +
      config.minSpacing.suggestedQuestionsToInput +
      config.estimatedHeights.suggestedQuestions;

    const availableHeight = viewportHeight * config.compactLayoutThreshold;
    const needsCompactLayout = totalRequiredHeight > availableHeight;

    // 5. Calculate final positions based on whether compact layout is needed
    let finalWelcomeTextY: number;
    let finalSuggestedQuestionsY: number;

    if (needsCompactLayout) {
      // Compact layout: reduce spacing to ensure all content is visible
      const compactSpacing = Math.min(
        config.minSpacing.welcomeTextToInput * 0.7,
        40
      );
      finalWelcomeTextY =
        inputTopY - compactSpacing - config.estimatedHeights.welcomeText / 2;
      finalSuggestedQuestionsY = inputBottomY + compactSpacing;
    } else {
      // Normal layout: use ideal positions
      finalWelcomeTextY =
        idealWelcomeTextTopY + config.estimatedHeights.welcomeText / 2;
      finalSuggestedQuestionsY = idealSuggestedQuestionsTopY;
    }

    // 6. Ensure not to exceed viewport boundaries
    const minWelcomeTextY = config.estimatedHeights.welcomeText / 2 + 20; // Leave 20px margin at top
    const maxSuggestedQuestionsY =
      viewportHeight - config.estimatedHeights.suggestedQuestions - 20; // Leave 20px margin at bottom

    finalWelcomeTextY = Math.max(finalWelcomeTextY, minWelcomeTextY);
    finalSuggestedQuestionsY = Math.min(
      finalSuggestedQuestionsY,
      maxSuggestedQuestionsY
    );

    // 7. Convert to CSS styles and calculate welcome text width
    const viewportWidth = window.innerWidth;

    // Welcome text width setting: set different widths based on device type, ensure mobile is adjustable
    // Mobile: use percentage of viewport width, ensure enough space for text
    // Tablet: moderate fixed width
    // Desktop: larger fixed width
    // Optimized width setting: mobile uses viewport width percentage to avoid text being squeezed
    let welcomeTextMaxWidth: string;
    if (viewportWidth < 640) {
      // Mobile: use 90% of viewport width, ensure enough space for text
      // Do not use maxWidth, directly set width to force text to occupy enough width
      welcomeTextMaxWidth = '90vw';
    } else if (viewportWidth < 1024) {
      // Tablet
      welcomeTextMaxWidth = '35rem';
    } else {
      // Desktop
      welcomeTextMaxWidth = '48rem';
    }

    const newPositions: WelcomeLayoutPositions = {
      input: {
        top: '50%',
        transform: `translate(-50%, calc(-50% + ${config.inputOffsetFromCenter}px))`,
      },
      welcomeText: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, calc(-50% + ${finalWelcomeTextY - viewportHeight / 2}px))`,
        padding: '0 1rem',
      },
      // Title-specific style: highest priority width setting in the Hook
      // Mobile uses width for forced width, desktop uses maxWidth for max width limit
      welcomeTextTitle: {
        ...(viewportWidth < 640
          ? { width: welcomeTextMaxWidth } // Mobile: forced width
          : { maxWidth: welcomeTextMaxWidth }), // Desktop: max width limit
      },
      suggestedQuestions: {
        top: `${finalSuggestedQuestionsY}px`,
        transform: 'translateX(-50%)',
      },
      needsCompactLayout,
      extensions: {},
    };

    setPositions(newPositions);
  }, [inputHeight]);

  // Recalculate layout when input box height or viewport size changes
  useEffect(() => {
    calculateLayout();

    const handleResize = () => {
      calculateLayout();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateLayout]);

  return positions;
}

/**
 * Create custom mobile width layout configuration
 * @param mobileWidthVw Mobile viewport width percentage (e.g., 90 means 90vw)
 * @param minWidthPx Minimum width in pixels
 *
 * @important Mobile uses width instead of maxWidth
 * This forces text to occupy specified width, preventing text from shrinking too narrow
 */
export function createMobileWidthLayout(
  mobileWidthVw: number = 90,
  minWidthPx: number = 280
): WelcomeLayoutConfig {
  const config = { ...DEFAULT_WELCOME_LAYOUT };
  console.log(
    `Mobile width config: ${mobileWidthVw}vw, min width: ${minWidthPx}px`
  );
  console.log(
    'Solution: Mobile uses width for forced width, desktop uses maxWidth for width limit'
  );
  return config;
}
