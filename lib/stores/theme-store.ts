import { create } from 'zustand';

// Note: With the introduction of next-themes, the role of this Zustand store has been greatly reduced and may even be redundant.
// Components should use the useTheme Hook from @lib/hooks/use-theme.ts (which wraps next-themes) instead.
// This store is kept mainly for compatibility with legacy components that may directly import its actions.
// The store itself no longer stores the actual theme state, nor is it responsible for persistence or DOM operations.
type Theme = 'light' | 'dark' | 'system'; // Theme type, consistent with next-themes

interface ThemeState {
  // _theme_placeholder: No longer stores the actual theme state, which is managed by next-themes.
  // You may keep or remove this placeholder depending on whether you want to maintain the store's basic structure.
  _theme_placeholder?: Theme;

  // toggleTheme: Action to toggle theme (deprecated).
  // The actual toggle logic should be done by calling the toggleTheme function returned from useTheme().
  toggleTheme: () => void;

  // setTheme: Action to set a specific theme (deprecated).
  // The actual set logic should be done by calling the setTheme function returned from useTheme().
  setTheme: (theme: Theme) => void;
}

// No need for persist middleware, getSystemTheme, or any initial state logic.
// next-themes will handle persistence and state initialization.
export const useThemeStore = create<ThemeState>()(() => ({
  _theme_placeholder: undefined, // Placeholder state, not actually used

  // The following actions are "stubs" because you cannot call the useTheme Hook inside the store creation function.
  // If all components migrate to using the useTheme Hook, these actions can theoretically be removed.
  // They are kept with warnings to remind developers of the correct usage.
  toggleTheme: () => {
    console.warn(
      '[DEPRECATED] Calling toggleTheme from the store is deprecated. Please use the toggleTheme function returned from useTheme() Hook.'
    );
    // Cannot call next-themes setTheme here
  },

  setTheme: (theme: Theme) => {
    console.warn(
      `[DEPRECATED] Calling setTheme('${theme}') from the store is deprecated. Please use the setTheme function returned from useTheme() Hook.`
    );
    // Cannot call next-themes setTheme here
  },
}));
