/**
 * 应用主题颜色管理
 * 集中定义所有主题相关的颜色，确保整个应用的视觉一致性
 */

// 亮色模式颜色
export const lightColors = {
  // 主背景色 - 用于主页、导航栏、输入背景等需要与主页融合的组件
  mainBackground: {
    tailwind: 'bg-stone-100', // Tailwind类名
    rgb: 'rgb(245, 243, 230)', // 对应的RGB值，用于内联样式
    hex: '#f5f3e6', // 对应的HEX值
  },
  
  // 文本颜色
  mainText: {
    tailwind: 'text-stone-900',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },
  
  // 侧边栏背景色 - 稍深于主背景
  sidebarBackground: {
    tailwind: 'bg-stone-200/95',
    rgb: 'rgba(231, 229, 228, 0.95)',
    hex: '#e7e5e4f2',
  },
  
  // 用户消息背景色 - 稍深于主背景
  userMessageBackground: {
    tailwind: 'bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },
  
  // 按钮悬停效果 - 更深的背景色
  buttonHover: {
    tailwind: 'hover:bg-stone-300',
    rgb: 'rgb(214, 211, 209)',
    hex: '#d6d3d1',
  },
};

// 暗色模式颜色
export const darkColors = {
  // 主背景色
  mainBackground: {
    tailwind: 'bg-gray-900',
    rgb: 'rgb(17, 24, 39)',
    hex: '#111827',
  },
  
  // 文本颜色
  mainText: {
    tailwind: 'text-gray-100',
    rgb: 'rgb(243, 244, 246)',
    hex: '#f3f4f6',
  },
  
  // 侧边栏背景色
  sidebarBackground: {
    tailwind: 'bg-gray-800/90',
    rgb: 'rgba(31, 41, 55, 0.9)',
    hex: '#1f2937e6',
  },
  
  // 用户消息背景色
  userMessageBackground: {
    tailwind: 'bg-gray-800',
    rgb: 'rgb(31, 41, 55)',
    hex: '#1f2937',
  },
  
  // 按钮悬停效果
  buttonHover: {
    tailwind: 'hover:bg-gray-700',
    rgb: 'rgb(55, 65, 81)',
    hex: '#374151',
  },
};

/**
 * 获取当前主题的颜色
 * @param isDark 是否为暗色模式
 * @returns 当前主题的颜色对象
 */
export function getThemeColors(isDark: boolean) {
  return isDark ? darkColors : lightColors;
}
