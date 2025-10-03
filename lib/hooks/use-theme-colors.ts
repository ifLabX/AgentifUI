import { getThemeColors } from '../theme/main-colors';
import { useTheme } from './use-theme';

/**
 * Theme color hook.
 * Provides a unified way to access theme colors, ensuring visual consistency across the application.
 *
 * @returns The color object for the current theme.
 *
 * @example
 * // Usage in a component
 * const { colors } = useThemeColors();
 *
 * // Using Tailwind classes
 * <div className={colors.mainBackground.tailwind}>...</div>
 *
 * // Using inline styles
 * <div style={{ background: colors.mainBackground.rgb }}>...</div>
 */
export function useThemeColors() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return {
    colors,
    isDark,
  };
}
