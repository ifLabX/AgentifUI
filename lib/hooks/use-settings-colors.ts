import { getSettingsColors } from '@lib/theme/settings-colors';

import { useTheme } from './use-theme';

/**
 * Hook for settings page colors.
 * Provides all colors needed for the settings page, automatically switching based on the current theme.
 */
export function useSettingsColors() {
  const { isDark } = useTheme();
  const colors = getSettingsColors(isDark);

  return {
    colors,
    isDark,
  };
}
