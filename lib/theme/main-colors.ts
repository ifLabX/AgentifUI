/**
 * Application theme color management
 * Centralized definition of all theme-related colors to ensure visual consistency across the app
 */

// Light mode colors
export const lightColors = {
  // Main background color - used for home page, navbar, input backgrounds, and components that blend with the main page
  mainBackground: {
    tailwind: 'bg-stone-100', // Tailwind class name
    rgb: 'rgb(245, 245, 244)', // Corresponding RGB value
    hex: '#f5f5f4', // Corresponding HEX value
  },

  // Main text color
  mainText: {
    tailwind: 'text-stone-900',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },

  // Sidebar background color - expanded state background, also used on hover
  sidebarBackground: {
    tailwind: 'bg-stone-200', // Same as UserMessage light background, used for expanded and hover state
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // User message background color - slightly deeper than main background
  userMessageBackground: {
    tailwind: 'bg-stone-200', // Same as UserMessage light background
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // Button hover effect - deeper background color
  buttonHover: {
    tailwind: 'hover:bg-stone-300',
    rgb: 'rgb(214, 211, 209)',
    hex: '#d6d3d1',
  },
};

// Dark mode colors
export const darkColors = {
  // Main background color
  mainBackground: {
    tailwind: 'bg-stone-800', // Lighter dark main background
    rgb: 'rgb(41, 37, 36)', // stone-800
    hex: '#292524',
  },

  // Main text color
  mainText: {
    tailwind: 'text-gray-100',
    rgb: 'rgb(243, 244, 246)',
    hex: '#f3f4f6',
  },

  // Sidebar background color - expanded state background, also used on hover
  sidebarBackground: {
    tailwind: 'bg-stone-700', // Same as UserMessage dark background, used for expanded and hover state
    rgb: 'rgba(68, 64, 60, 1)', // stone-700 opaque
    hex: '#44403c',
  },

  // User message background color
  userMessageBackground: {
    tailwind: 'bg-stone-700', // UserMessage dark background base color
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // Button hover effect
  buttonHover: {
    tailwind: 'hover:bg-stone-600',
    rgb: 'rgb(87, 83, 78)',
    hex: '#57534e',
  },
};

/**
 * Get the current theme colors
 * @param isDark Whether it is dark mode
 * @returns The color object for the current theme
 */
export function getThemeColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}
