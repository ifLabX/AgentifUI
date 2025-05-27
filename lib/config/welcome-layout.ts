// --- BEGIN COMMENT ---
// 欢迎界面布局配置
// 通过修改这些参数可以轻松调整各组件的位置和间距
// --- END COMMENT ---

export interface WelcomeLayoutConfig {
  // 输入框在欢迎界面的位置（相对于视口中心的偏移）
  inputOffsetFromCenter: number; // 像素值，正值向下
  
  // 各组件之间的最小间距
  minSpacing: {
    welcomeTextToInput: number; // 欢迎文字到输入框的最小距离
    promptToInput: number; // 提示按钮到输入框的最小距离
    welcomeTextToPrompt: number; // 欢迎文字到提示按钮的最小距离
  };
  
  // 组件高度估算（用于计算布局）
  estimatedHeights: {
    welcomeText: number; // 欢迎文字区域高度
    promptContainer: number; // 提示容器高度
    inputContainer: number; // 输入框容器高度
  };
  
  // 紧凑布局的触发阈值
  compactLayoutThreshold: number; // 视口高度使用比例（0-1）
}

// --- BEGIN COMMENT ---
// 默认布局配置
// --- END COMMENT ---
export const DEFAULT_WELCOME_LAYOUT: WelcomeLayoutConfig = {
  inputOffsetFromCenter: 80, // 5rem = 80px，输入框向下偏移
  minSpacing: {
    welcomeTextToInput: 60, // 欢迎文字到输入框最小间距60px
    promptToInput: 40, // 提示按钮到输入框最小间距40px
    welcomeTextToPrompt: 30, // 欢迎文字到提示按钮最小间距30px
  },
  estimatedHeights: {
    welcomeText: 120, // 估算欢迎文字区域高度（包括标题和副标题）
    promptContainer: 60, // 估算提示容器高度
    inputContainer: 80, // 估算输入框容器基础高度
  },
  compactLayoutThreshold: 0.9, // 使用90%的视口高度作为紧凑布局触发阈值
};

// --- BEGIN COMMENT ---
// 便捷的配置调整函数
// --- END COMMENT ---

/**
 * 让欢迎文字更靠近输入框
 * @param distance 减少的距离（像素）
 */
export function moveWelcomeTextCloserToInput(distance: number = 20): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    minSpacing: {
      ...DEFAULT_WELCOME_LAYOUT.minSpacing,
      welcomeTextToInput: Math.max(20, DEFAULT_WELCOME_LAYOUT.minSpacing.welcomeTextToInput - distance),
    },
  };
}

/**
 * 让提示按钮更靠近输入框
 * @param distance 减少的距离（像素）
 */
export function movePromptCloserToInput(distance: number = 15): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    minSpacing: {
      ...DEFAULT_WELCOME_LAYOUT.minSpacing,
      promptToInput: Math.max(15, DEFAULT_WELCOME_LAYOUT.minSpacing.promptToInput - distance),
    },
  };
}

/**
 * 让输入框位置更高（向上移动）
 * @param distance 向上移动的距离（像素）
 */
export function moveInputHigher(distance: number = 20): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    inputOffsetFromCenter: DEFAULT_WELCOME_LAYOUT.inputOffsetFromCenter - distance,
  };
}

/**
 * 让输入框位置更低（向下移动）
 * @param distance 向下移动的距离（像素）
 */
export function moveInputLower(distance: number = 20): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    inputOffsetFromCenter: DEFAULT_WELCOME_LAYOUT.inputOffsetFromCenter + distance,
  };
}

/**
 * 创建紧凑布局配置（适用于小屏幕）
 */
export function createCompactLayout(): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    inputOffsetFromCenter: 40, // 输入框位置更靠近中心
    minSpacing: {
      welcomeTextToInput: 30, // 减少间距
      promptToInput: 20, // 减少间距
      welcomeTextToPrompt: 15, // 减少间距
    },
    estimatedHeights: {
      welcomeText: 80, // 紧凑文字区域
      promptContainer: 50, // 紧凑按钮容器
      inputContainer: 70, // 紧凑输入框
    },
    compactLayoutThreshold: 0.95, // 更容易触发紧凑布局
  };
}

/**
 * 创建宽松布局配置（适用于大屏幕）
 */
export function createSpacedLayout(): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    inputOffsetFromCenter: 120, // 输入框位置更低
    minSpacing: {
      welcomeTextToInput: 80, // 增加间距
      promptToInput: 60, // 增加间距
      welcomeTextToPrompt: 40, // 增加间距
    },
    estimatedHeights: {
      welcomeText: 150, // 更大的文字区域
      promptContainer: 80, // 更大的按钮容器
      inputContainer: 100, // 更大的输入框
    },
    compactLayoutThreshold: 0.8, // 不容易触发紧凑布局
  };
}

// --- BEGIN COMMENT ---
// 响应式配置：根据屏幕尺寸自动选择合适的布局
// --- END COMMENT ---
export function getResponsiveLayout(): WelcomeLayoutConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_WELCOME_LAYOUT;
  }
  
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // 小屏幕设备（手机）
  if (viewportHeight < 700 || viewportWidth < 640) {
    return createCompactLayout();
  }
  
  // 大屏幕设备（桌面）
  if (viewportHeight > 900 && viewportWidth > 1200) {
    return createSpacedLayout();
  }
  
  // 中等屏幕设备（平板、小笔记本）
  return DEFAULT_WELCOME_LAYOUT;
} 