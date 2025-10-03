/**
 * Settings page theme color management
 * Centralized definition of all colors related to the settings page to ensure visual consistency
 */

// Light mode colors
export const lightSettingsColors = {
  // Main background color for settings page
  pageBackground: {
    tailwind: 'bg-stone-100',
    rgb: 'rgb(245, 245, 244)',
    hex: '#f5f5f4',
  },

  // Card background color
  cardBackground: {
    tailwind: 'bg-white',
    rgb: 'rgb(255, 255, 255)',
    hex: '#ffffff',
  },

  // Main text color
  textColor: {
    tailwind: 'text-stone-900',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },

  // Secondary text color
  secondaryTextColor: {
    tailwind: 'text-stone-600',
    rgb: 'rgb(87, 83, 78)',
    hex: '#57534e',
  },

  // Border color
  borderColor: {
    tailwind: 'border-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // Sidebar item hover effect
  sidebarItemHover: {
    tailwind: 'hover:bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // Sidebar item active state
  sidebarItemActive: {
    tailwind: 'bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // Card hover effect
  cardHover: {
    tailwind: 'hover:bg-stone-50',
    rgb: 'rgb(250, 250, 249)',
    hex: '#fafaf9',
  },

  // Button background color
  buttonBackground: {
    tailwind: 'bg-white',
    rgb: 'rgb(255, 255, 255)',
    hex: '#ffffff',
  },

  // Button border color
  buttonBorder: {
    tailwind: 'border-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // Button text color
  buttonText: {
    tailwind: 'text-stone-800',
    rgb: 'rgb(41, 37, 36)',
    hex: '#292524',
  },

  // Button hover effect
  buttonHover: {
    tailwind: 'hover:bg-stone-100',
    rgb: 'rgb(245, 245, 244)',
    hex: '#f5f5f4',
  },

  // Button active state
  buttonActive: {
    tailwind: 'bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // Primary button background color
  primaryButtonBackground: {
    tailwind: 'bg-stone-800',
    rgb: 'rgb(41, 37, 36)',
    hex: '#292524',
  },

  // Primary button text color
  primaryButtonText: {
    tailwind: 'text-white',
    rgb: 'rgb(255, 255, 255)',
    hex: '#ffffff',
  },

  // Primary button hover effect
  primaryButtonHover: {
    tailwind: 'hover:bg-stone-900',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },

  // Skeleton background color
  skeletonBackground: {
    tailwind: 'bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // Skeleton animation color
  skeletonHighlight: {
    tailwind: 'from-stone-200 via-stone-100 to-stone-200',
    rgb: 'rgb(231, 229, 228), rgb(245, 245, 244), rgb(231, 229, 228)',
    hex: '#e7e5e4, #f5f5f4, #e7e5e4',
  },

  // Back button styles
  backButton: {
    background: {
      tailwind: 'bg-stone-100',
      rgb: 'rgb(245, 245, 244)',
      hex: '#f5f5f4',
    },
    backgroundHover: {
      tailwind: 'hover:bg-stone-200',
      rgb: 'rgb(231, 229, 228)',
      hex: '#e7e5e4',
    },
    text: {
      tailwind: 'text-stone-700',
      rgb: 'rgb(68, 64, 60)',
      hex: '#44403c',
    },
    textHover: {
      tailwind: 'hover:text-stone-900',
      rgb: 'rgb(28, 25, 23)',
      hex: '#1c1917',
    },
    border: {
      tailwind: 'border-stone-200',
      rgb: 'rgb(231, 229, 228)',
      hex: '#e7e5e4',
    },
    borderHover: {
      tailwind: 'hover:border-stone-300',
      rgb: 'rgb(214, 211, 209)',
      hex: '#d6d3d1',
    },
  },
};

// Dark mode colors
export const darkSettingsColors = {
  // Main background color for settings page
  pageBackground: {
    tailwind: 'bg-stone-800',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },

  // Card background color
  cardBackground: {
    tailwind: 'bg-stone-800',
    rgb: 'rgb(41, 37, 36)',
    hex: '#292524',
  },

  // Main text color
  textColor: {
    tailwind: 'text-stone-100',
    rgb: 'rgb(245, 245, 244)',
    hex: '#f5f5f4',
  },

  // Secondary text color
  secondaryTextColor: {
    tailwind: 'text-stone-400',
    rgb: 'rgb(168, 162, 158)',
    hex: '#a8a29e',
  },

  // Border color
  borderColor: {
    tailwind: 'border-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Sidebar item hover effect
  sidebarItemHover: {
    tailwind: 'hover:bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Sidebar item active state
  sidebarItemActive: {
    tailwind: 'bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Card hover effect
  cardHover: {
    tailwind: 'hover:bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Button background color
  buttonBackground: {
    tailwind: 'bg-stone-800',
    rgb: 'rgb(41, 37, 36)',
    hex: '#292524',
  },

  // Button border color
  buttonBorder: {
    tailwind: 'border-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Button text color
  buttonText: {
    tailwind: 'text-stone-100',
    rgb: 'rgb(245, 245, 244)',
    hex: '#f5f5f4',
  },

  // Button hover effect
  buttonHover: {
    tailwind: 'hover:bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Button active state
  buttonActive: {
    tailwind: 'bg-stone-600',
    rgb: 'rgb(87, 83, 78)',
    hex: '#57534e',
  },

  // Primary button background color
  primaryButtonBackground: {
    tailwind: 'bg-stone-600',
    rgb: 'rgb(87, 83, 78)',
    hex: '#57534e',
  },

  // Primary button text color
  primaryButtonText: {
    tailwind: 'text-white',
    rgb: 'rgb(255, 255, 255)',
    hex: '#ffffff',
  },

  // Primary button hover effect
  primaryButtonHover: {
    tailwind: 'hover:bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Skeleton background color
  skeletonBackground: {
    tailwind: 'bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Skeleton animation color
  skeletonHighlight: {
    tailwind: 'from-stone-700 via-stone-600 to-stone-700',
    rgb: 'rgb(68, 64, 60), rgb(87, 83, 78), rgb(68, 64, 60)',
    hex: '#44403c, #57534e, #44403c',
  },

  // Back button styles
  backButton: {
    background: {
      tailwind: 'bg-stone-800',
      rgb: 'rgb(41, 37, 36)',
      hex: '#292524',
    },
    backgroundHover: {
      tailwind: 'hover:bg-stone-700',
      rgb: 'rgb(68, 64, 60)',
      hex: '#44403c',
    },
    text: {
      tailwind: 'text-stone-300',
      rgb: 'rgb(214, 211, 209)',
      hex: '#d6d3d1',
    },
    textHover: {
      tailwind: 'hover:text-stone-200',
      rgb: 'rgb(231, 229, 228)',
      hex: '#e7e5e4',
    },
    border: {
      tailwind: 'border-stone-700',
      rgb: 'rgb(68, 64, 60)',
      hex: '#44403c',
    },
    borderHover: {
      tailwind: 'hover:border-stone-600',
      rgb: 'rgb(87, 83, 78)',
      hex: '#57534e',
    },
  },
};

/**
 * Get the settings page color object for the current theme
 * @param isDark Whether it is dark mode
 * @returns The settings page color object for the current theme
 */
export function getSettingsColors(isDark: boolean) {
  return isDark ? darkSettingsColors : lightSettingsColors;
}
