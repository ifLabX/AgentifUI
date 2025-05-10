/**
 * 应用主题颜色管理
 * 集中定义所有主题相关的颜色，确保整个应用的视觉一致性
 */

// 亮色模式颜色
export const lightColors = {
  // 主背景色 - 用于主页、导航栏、输入背景等需要与主页融合的组件
  mainBackground: {
    tailwind: 'bg-stone-100', // Tailwind类名
    rgb: 'rgb(245, 245, 244)', // 对应的RGB值
    hex: '#f5f5f4', // 对应的HEX值
  },
  
  // 文本颜色
  mainText: {
    tailwind: 'text-stone-900',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },
  
  // 侧边栏背景色 - 稍深于主背景
  sidebarBackground: {
    tailwind: 'bg-stone-200', // 与UserMessage亮色背景一致
    rgb: 'rgb(231, 229, 228)', 
    hex: '#e7e5e4',
  },
  
  // 用户消息背景色 - 稍深于主背景
  userMessageBackground: {
    tailwind: 'bg-stone-200', // 与UserMessage亮色背景一致
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
    tailwind: 'bg-stone-800', // 更浅的暗色主背景
    rgb: 'rgb(41, 37, 36)', // stone-800
    hex: '#292524',
  },
  
  // 文本颜色
  mainText: {
    tailwind: 'text-gray-100', 
    rgb: 'rgb(243, 244, 246)',
    hex: '#f3f4f6',
  },
  
  // 侧边栏背景色
  sidebarBackground: {
    tailwind: 'bg-stone-700', // 与UserMessage暗色背景完全一致 (移除透明度)
    rgb: 'rgba(68, 64, 60, 1)', // stone-700 不透明
    hex: '#44403c',
  },
  
  // 用户消息背景色
  userMessageBackground: {
    tailwind: 'bg-stone-700', // UserMessage暗色背景基色
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },
  
  // 按钮悬停效果
  buttonHover: {
    tailwind: 'hover:bg-stone-600', 
    rgb: 'rgb(87, 83, 78)', 
    hex: '#57534e',
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
