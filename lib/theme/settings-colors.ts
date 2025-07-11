/**
 * 设置页面主题颜色管理
 * 集中定义所有设置页面相关的颜色，确保设置页面的视觉一致性
 */

// 亮色模式颜色
export const lightSettingsColors = {
  // 设置页面主背景色
  pageBackground: {
    tailwind: 'bg-stone-100',
    rgb: 'rgb(245, 245, 244)',
    hex: '#f5f5f4',
  },

  // 设置卡片背景色
  cardBackground: {
    tailwind: 'bg-white',
    rgb: 'rgb(255, 255, 255)',
    hex: '#ffffff',
  },

  // 设置文本颜色
  textColor: {
    tailwind: 'text-stone-900',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },

  // 设置次要文本颜色
  secondaryTextColor: {
    tailwind: 'text-stone-600',
    rgb: 'rgb(87, 83, 78)',
    hex: '#57534e',
  },

  // 设置边框颜色
  borderColor: {
    tailwind: 'border-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // 设置侧边栏项目悬停效果
  sidebarItemHover: {
    tailwind: 'hover:bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // 设置侧边栏项目激活状态
  sidebarItemActive: {
    tailwind: 'bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // 设置卡片悬停效果
  cardHover: {
    tailwind: 'hover:bg-stone-50',
    rgb: 'rgb(250, 250, 249)',
    hex: '#fafaf9',
  },

  // 设置按钮背景色
  buttonBackground: {
    tailwind: 'bg-white',
    rgb: 'rgb(255, 255, 255)',
    hex: '#ffffff',
  },

  // 设置按钮边框色
  buttonBorder: {
    tailwind: 'border-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // 设置按钮文本色
  buttonText: {
    tailwind: 'text-stone-800',
    rgb: 'rgb(41, 37, 36)',
    hex: '#292524',
  },

  // 设置按钮悬停效果
  buttonHover: {
    tailwind: 'hover:bg-stone-100',
    rgb: 'rgb(245, 245, 244)',
    hex: '#f5f5f4',
  },

  // 设置按钮激活状态
  buttonActive: {
    tailwind: 'bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // 设置主按钮背景色
  primaryButtonBackground: {
    tailwind: 'bg-stone-800',
    rgb: 'rgb(41, 37, 36)',
    hex: '#292524',
  },

  // 设置主按钮文本色
  primaryButtonText: {
    tailwind: 'text-white',
    rgb: 'rgb(255, 255, 255)',
    hex: '#ffffff',
  },

  // 设置主按钮悬停效果
  primaryButtonHover: {
    tailwind: 'hover:bg-stone-900',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },

  // 设置骨架屏背景色
  skeletonBackground: {
    tailwind: 'bg-stone-200',
    rgb: 'rgb(231, 229, 228)',
    hex: '#e7e5e4',
  },

  // 设置骨架屏动画色
  skeletonHighlight: {
    tailwind: 'from-stone-200 via-stone-100 to-stone-200',
    rgb: 'rgb(231, 229, 228), rgb(245, 245, 244), rgb(231, 229, 228)',
    hex: '#e7e5e4, #f5f5f4, #e7e5e4',
  },

  // 返回按钮样式
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

// 暗色模式颜色
export const darkSettingsColors = {
  // 设置页面主背景色
  pageBackground: {
    tailwind: 'bg-stone-800',
    rgb: 'rgb(28, 25, 23)',
    hex: '#1c1917',
  },

  // 设置卡片背景色
  cardBackground: {
    tailwind: 'bg-stone-800',
    rgb: 'rgb(41, 37, 36)',
    hex: '#292524',
  },

  // 设置文本颜色
  textColor: {
    tailwind: 'text-stone-100',
    rgb: 'rgb(245, 245, 244)',
    hex: '#f5f5f4',
  },

  // 设置次要文本颜色
  secondaryTextColor: {
    tailwind: 'text-stone-400',
    rgb: 'rgb(168, 162, 158)',
    hex: '#a8a29e',
  },

  // 设置边框颜色
  borderColor: {
    tailwind: 'border-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // 设置侧边栏项目悬停效果
  sidebarItemHover: {
    tailwind: 'hover:bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // 设置侧边栏项目激活状态
  sidebarItemActive: {
    tailwind: 'bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // 设置卡片悬停效果
  cardHover: {
    tailwind: 'hover:bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // 设置按钮背景色
  buttonBackground: {
    tailwind: 'bg-stone-800',
    rgb: 'rgb(41, 37, 36)',
    hex: '#292524',
  },

  // 设置按钮边框色
  buttonBorder: {
    tailwind: 'border-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // 设置按钮文本色
  buttonText: {
    tailwind: 'text-stone-100',
    rgb: 'rgb(245, 245, 244)',
    hex: '#f5f5f4',
  },

  // 设置按钮悬停效果
  buttonHover: {
    tailwind: 'hover:bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // 设置按钮激活状态
  buttonActive: {
    tailwind: 'bg-stone-600',
    rgb: 'rgb(87, 83, 78)',
    hex: '#57534e',
  },

  // 设置主按钮背景色
  primaryButtonBackground: {
    tailwind: 'bg-stone-600',
    rgb: 'rgb(87, 83, 78)',
    hex: '#57534e',
  },

  // 设置主按钮文本色
  primaryButtonText: {
    tailwind: 'text-white',
    rgb: 'rgb(255, 255, 255)',
    hex: '#ffffff',
  },

  // 设置主按钮悬停效果
  primaryButtonHover: {
    tailwind: 'hover:bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // 设置骨架屏背景色
  skeletonBackground: {
    tailwind: 'bg-stone-700',
    rgb: 'rgb(68, 64, 60)',
    hex: '#44403c',
  },

  // 设置骨架屏动画色
  skeletonHighlight: {
    tailwind: 'from-stone-700 via-stone-600 to-stone-700',
    rgb: 'rgb(68, 64, 60), rgb(87, 83, 78), rgb(68, 64, 60)',
    hex: '#44403c, #57534e, #44403c',
  },

  // 返回按钮样式
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
 * 获取当前主题的设置页面颜色
 * @param isDark 是否为暗色模式
 * @returns 当前主题的设置页面颜色对象
 */
export function getSettingsColors(isDark: boolean) {
  return isDark ? darkSettingsColors : lightSettingsColors;
}
