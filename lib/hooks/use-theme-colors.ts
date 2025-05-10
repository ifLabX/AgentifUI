import { useTheme } from './use-theme';
import { getThemeColors } from '../theme/main-colors';

/**
 * 主题颜色Hook
 * 提供统一的主题颜色访问方式，确保整个应用的视觉一致性
 * 
 * @returns 当前主题的颜色对象
 * 
 * @example
 * // 在组件中使用
 * const { colors } = useThemeColors();
 * 
 * // 使用Tailwind类
 * <div className={colors.mainBackground.tailwind}>...</div>
 * 
 * // 使用内联样式
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
