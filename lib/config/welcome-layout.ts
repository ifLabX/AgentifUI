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
    // --- BEGIN COMMENT ---
    // 扩展区域：新组件间距配置
    // 添加新组件时在此处添加间距配置
    // --- END COMMENT ---
    [key: string]: number; // 支持动态添加新组件间距
  };
  
  // 组件高度估算（用于计算布局）
  estimatedHeights: {
    welcomeText: number; // 欢迎文字区域高度
    promptContainer: number; // 提示容器高度
    inputContainer: number; // 输入框容器高度
    // --- BEGIN COMMENT ---
    // 扩展区域：新组件高度估算
    // 添加新组件时在此处添加高度估算
    // --- END COMMENT ---
    [key: string]: number; // 支持动态添加新组件高度
  };
  
  // 紧凑布局的触发阈值
  compactLayoutThreshold: number; // 视口高度使用比例（0-1）
  
  // --- BEGIN COMMENT ---
  // 扩展配置：支持新组件的自定义配置
  // --- END COMMENT ---
  extensions?: {
    [componentName: string]: {
      enabled: boolean; // 是否启用该组件
      priority: number; // 布局优先级（数字越小优先级越高）
      positioning: 'above-input' | 'below-input' | 'above-welcome' | 'below-prompt' | 'custom';
      customOffset?: number; // 自定义偏移量（仅当positioning为custom时使用）
    };
  };
}

// --- BEGIN COMMENT ---
// 默认布局配置
// --- END COMMENT ---
export const DEFAULT_WELCOME_LAYOUT: WelcomeLayoutConfig = {
  inputOffsetFromCenter: 20, // 向上移动，输入框更靠近中心上方
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
    inputOffsetFromCenter: 0, // 紧凑模式输入框居中，确保副标题可见
    minSpacing: {
      welcomeTextToInput: 40, // 适当间距，确保副标题不被遮挡
      promptToInput: 25, // 减少间距
      welcomeTextToPrompt: 20, // 减少间距
    },
    estimatedHeights: {
      welcomeText: 90, // 紧凑文字区域，考虑副标题
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
    inputOffsetFromCenter: 10, // 大屏幕也适当上移
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
// 新组件管理函数
// --- END COMMENT ---

/**
 * 添加新组件到布局配置
 * @param componentName 组件名称
 * @param config 组件配置
 * @param baseConfig 基础配置（可选，默认使用DEFAULT_WELCOME_LAYOUT）
 */
export function addComponent(
  componentName: string,
  config: {
    height: number;
    spacing: { [key: string]: number };
    positioning: 'above-input' | 'below-input' | 'above-welcome' | 'below-prompt' | 'custom';
    priority?: number;
    customOffset?: number;
  },
  baseConfig: WelcomeLayoutConfig = DEFAULT_WELCOME_LAYOUT
): WelcomeLayoutConfig {
  return {
    ...baseConfig,
    minSpacing: {
      ...baseConfig.minSpacing,
      ...config.spacing,
    },
    estimatedHeights: {
      ...baseConfig.estimatedHeights,
      [componentName]: config.height,
    },
    extensions: {
      ...baseConfig.extensions,
      [componentName]: {
        enabled: true,
        priority: config.priority || 5,
        positioning: config.positioning,
        customOffset: config.customOffset,
      },
    },
  };
}

/**
 * 快速添加通知组件（在欢迎文字上方）
 */
export function addNotificationComponent(height: number = 40): WelcomeLayoutConfig {
  return addComponent('notification', {
    height,
    spacing: { notificationToWelcome: 20 },
    positioning: 'above-welcome',
    priority: 1,
  });
}

/**
 * 快速添加操作按钮组（在提示按钮下方）
 */
export function addActionButtons(height: number = 50): WelcomeLayoutConfig {
  return addComponent('actionButtons', {
    height,
    spacing: { promptToActions: 30, actionsToBottom: 20 },
    positioning: 'below-prompt',
    priority: 6,
  });
}

/**
 * 快速添加状态指示器（在输入框上方）
 */
export function addStatusIndicator(height: number = 30): WelcomeLayoutConfig {
  return addComponent('statusIndicator', {
    height,
    spacing: { statusToInput: 15 },
    positioning: 'above-input',
    priority: 3,
  });
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