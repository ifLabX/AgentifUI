import { useTheme } from './use-theme';
import { getSettingsColors } from '@lib/theme/settings-colors';

// --- BEGIN COMMENT ---
// 设置页面颜色 Hook
// 提供设置页面所需的所有颜色，根据当前主题自动切换
// --- END COMMENT ---
export function useSettingsColors() {
  const { isDark } = useTheme();
  const colors = getSettingsColors(isDark);
  
  return {
    colors,
    isDark
  };
}
