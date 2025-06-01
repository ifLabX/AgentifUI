import { useState, useEffect, useCallback } from 'react';
import { useChatLayoutStore } from '@lib/stores/chat-layout-store';

// --- BEGIN COMMENT ---
// 欢迎界面布局配置接口
// 通过修改这些参数可以轻松调整各组件的位置和间距
// --- END COMMENT ---
export interface WelcomeLayoutConfig {
  // 输入框在欢迎界面的位置（相对于视口中心的偏移）
  inputOffsetFromCenter: number; // 像素值，正值向下，负值向上
  
  // 各组件之间的最小间距
  minSpacing: {
    welcomeTextToInput: number; // 欢迎文字到输入框的最小距离
    suggestedQuestionsToInput: number; // 推荐问题到输入框的最小距离
    welcomeTextToSuggestedQuestions: number; // 欢迎文字到推荐问题的最小距离
    // --- BEGIN COMMENT ---
    // 扩展区域：新组件间距配置
    // 添加新组件时在此处添加间距配置
    // --- END COMMENT ---
    [key: string]: number; // 支持动态添加新组件间距
  };
  
  // 组件高度估算（用于计算布局）
  estimatedHeights: {
    welcomeText: number; // 欢迎文字区域高度
    suggestedQuestions: number; // 推荐问题容器高度
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
      positioning: 'above-input' | 'below-input' | 'above-welcome' | 'below-suggested-questions' | 'custom';
      customOffset?: number; // 自定义偏移量（仅当positioning为custom时使用）
    };
  };
}

// --- BEGIN COMMENT ---
// 🎯 核心布局配置 - 在这里调整主要参数
// --- END COMMENT ---
const DEFAULT_WELCOME_LAYOUT: WelcomeLayoutConfig = {
  // --- BEGIN COMMENT ---
  // 输入框位置：调整这个值改变整体布局高度
  // 正值向下移动，负值向上移动，0为视口中心
  // --- END COMMENT ---
  inputOffsetFromCenter: -20, // 当前向下偏移20px，可调整为负值上移
  
  minSpacing: {
    // --- BEGIN COMMENT ---
    // 间距配置：调整这些值改变组件之间的距离
    // --- END COMMENT ---
    welcomeTextToInput: 10, // 欢迎文字到输入框的距离，减小此值让文字更靠近输入框
    suggestedQuestionsToInput: 40, // 推荐问题到输入框的距离
    welcomeTextToSuggestedQuestions: 30, // 欢迎文字到推荐问题的距离
  },
  
  estimatedHeights: {
    // --- BEGIN COMMENT ---
    // 高度估算：用于布局计算，如果组件实际高度变化需要调整这些值
    // --- END COMMENT ---
    welcomeText: 120, // 欢迎文字区域高度（包括标题和副标题）
    suggestedQuestions: 200, // 推荐问题容器高度（增加以支持多行显示）
    inputContainer: 80, // 输入框容器基础高度
  },
  
  // --- BEGIN COMMENT ---
  // 紧凑布局触发阈值：当可用空间小于视口高度的这个比例时启用紧凑模式
  // --- END COMMENT ---
  compactLayoutThreshold: 0.9, // 90%，可调整为更大值（如0.95）更容易触发紧凑模式
};

// --- BEGIN COMMENT ---
// 🎨 预设布局配置 - 不同屏幕尺寸的优化配置
// --- END COMMENT ---

/**
 * 创建紧凑布局配置（适用于小屏幕）
 */
function createCompactLayout(): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    // --- BEGIN COMMENT ---
    // 紧凑模式：输入框居中，确保副标题可见
    // --- END COMMENT ---
    inputOffsetFromCenter: -50, // 向上偏移
    minSpacing: {
      welcomeTextToInput: 60, // 适当间距，确保副标题不被遮挡
      suggestedQuestionsToInput: 40, // 减少间距
      welcomeTextToSuggestedQuestions: 20, // 减少间距
    },
    estimatedHeights: {
      welcomeText: 90, // 紧凑文字区域，考虑副标题
      suggestedQuestions: 100, // 紧凑推荐问题容器
      inputContainer: 70, // 紧凑输入框
    },
    compactLayoutThreshold: 0.95, // 更容易触发紧凑布局
  };
}

/**
 * 创建宽松布局配置（适用于大屏幕）
 */
function createSpacedLayout(): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    // --- BEGIN COMMENT ---
    // 宽松模式：大屏幕也适当上移，但保持舒适间距
    // --- END COMMENT ---
    inputOffsetFromCenter: -120, // 大屏幕也适当上移
    minSpacing: {
      welcomeTextToInput: 0, // 增加间距
      suggestedQuestionsToInput: 50, // 增加间距
      welcomeTextToSuggestedQuestions: 40, // 增加间距
    },
    estimatedHeights: {
      welcomeText: 150, // 更大的文字区域
      suggestedQuestions: 140, // 更大的推荐问题容器
      inputContainer: 100, // 更大的输入框
    },
    compactLayoutThreshold: 0.8, // 不容易触发紧凑布局
  };
}

// --- BEGIN COMMENT ---
// 📱 响应式配置：根据屏幕尺寸自动选择合适的布局
// --- END COMMENT ---
function getResponsiveLayout(): WelcomeLayoutConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_WELCOME_LAYOUT;
  }
  
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // --- BEGIN COMMENT ---
  // 屏幕尺寸判断：可以调整这些阈值来改变响应式行为
  // --- END COMMENT ---
  
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

// --- BEGIN COMMENT ---
// 🛠️ 便捷调整函数 - 快速微调布局参数
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
      welcomeTextToInput: Math.max(10, DEFAULT_WELCOME_LAYOUT.minSpacing.welcomeTextToInput - distance),
    },
  };
}

/**
 * 让推荐问题更靠近输入框
 * @param distance 减少的距离（像素）
 */
export function moveSuggestedQuestionsCloserToInput(distance: number = 15): WelcomeLayoutConfig {
  return {
    ...DEFAULT_WELCOME_LAYOUT,
    minSpacing: {
      ...DEFAULT_WELCOME_LAYOUT.minSpacing,
      suggestedQuestionsToInput: Math.max(20, DEFAULT_WELCOME_LAYOUT.minSpacing.suggestedQuestionsToInput - distance),
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

// --- BEGIN COMMENT ---
// 🎯 移动端欢迎文字宽度设置函数
// 这个函数主要用于调试和测试，实际宽度在Hook中动态计算
// --- END COMMENT ---
export function setMobileWelcomeTextWidth(widthRem: number): void {
  console.log(`设置移动端欢迎文字宽度: ${widthRem}rem`);
  console.log('注意：实际宽度由 useWelcomeLayout Hook 动态计算');
  console.log('移动端使用 width 强制宽度，桌面端使用 maxWidth 限制宽度');
}

// --- BEGIN COMMENT ---
// 🔧 动态组件添加系统
// 支持在运行时添加新的布局组件
// --- END COMMENT ---

/**
 * 添加新组件到布局系统
 * @param componentName 组件名称
 * @param config 组件配置
 * @param baseConfig 基础配置
 */
export function addComponent(
  componentName: string,
  config: {
    height: number;
    spacing: { [key: string]: number };
    positioning: 'above-input' | 'below-input' | 'above-welcome' | 'below-suggested-questions' | 'custom';
    priority?: number;
    customOffset?: number;
  },
  baseConfig: WelcomeLayoutConfig = DEFAULT_WELCOME_LAYOUT
): WelcomeLayoutConfig {
  const newConfig = { ...baseConfig };
  
  // 添加高度估算
  newConfig.estimatedHeights[componentName] = config.height;
  
  // 添加间距配置
  Object.entries(config.spacing).forEach(([key, value]) => {
    newConfig.minSpacing[key] = value;
  });
  
  // 添加扩展配置
  if (!newConfig.extensions) {
    newConfig.extensions = {};
  }
  
  newConfig.extensions[componentName] = {
    enabled: true,
    priority: config.priority || 5,
    positioning: config.positioning,
    customOffset: config.customOffset,
  };
  
  return newConfig;
}

/**
 * 添加通知组件
 */
export function addNotificationComponent(height: number = 40): WelcomeLayoutConfig {
  return addComponent('notification', {
    height,
    spacing: { notificationToInput: 20 },
    positioning: 'above-input',
    priority: 1,
  });
}

/**
 * 添加操作按钮组
 */
export function addActionButtons(height: number = 50): WelcomeLayoutConfig {
  return addComponent('actionButtons', {
    height,
    spacing: { actionButtonsToInput: 30 },
    positioning: 'below-suggested-questions',
    priority: 3,
  });
}

/**
 * 添加状态指示器
 */
export function addStatusIndicator(height: number = 30): WelcomeLayoutConfig {
  return addComponent('statusIndicator', {
    height,
    spacing: { statusToWelcome: 15 },
    positioning: 'above-welcome',
    priority: 2,
  });
}

// --- BEGIN COMMENT ---
// 🎯 布局位置接口定义
// --- END COMMENT ---
interface WelcomeLayoutPositions {
  // 输入框位置
  input: {
    top: string;
    transform: string;
  };
  
  // 欢迎文字容器位置
  welcomeText: {
    position: 'absolute';
    top: string;
    left: string;
    transform: string;
    padding: string;
  };
  
  // --- BEGIN COMMENT ---
  // 🔥 新增：专门为欢迎文字标题的样式（最高优先级）
  // --- END COMMENT ---
  welcomeTextTitle: {
    width?: string;
    maxWidth?: string;
  };
  
  // 推荐问题容器位置
  suggestedQuestions: {
    top: string;
    transform: string;
  };
  
  // 是否需要调整布局（当空间不足时）
  needsCompactLayout: boolean;
  
  // --- BEGIN COMMENT ---
  // 扩展组件位置：支持动态添加新组件
  // --- END COMMENT ---
  extensions: {
    [componentName: string]: {
      top: string;
      transform: string;
      zIndex?: number;
    };
  };
}

/**
 * 欢迎界面布局管理Hook
 * 提供智能的组件定位，防止遮挡并确保合适的间距
 * 
 * --- BEGIN COMMENT ---
 * 🎯 使用说明：
 * 1. 调整 DEFAULT_WELCOME_LAYOUT 中的参数来微调布局
 * 2. inputOffsetFromCenter: 控制整体高度（正值向下，负值向上）
 * 3. minSpacing: 控制组件间距
 * 4. estimatedHeights: 组件高度估算，影响布局计算
 * 5. compactLayoutThreshold: 紧凑模式触发阈值
 * --- END COMMENT ---
 */
export function useWelcomeLayout(): WelcomeLayoutPositions {
  const { inputHeight } = useChatLayoutStore();
  const [positions, setPositions] = useState<WelcomeLayoutPositions>({
    input: { top: '50%', transform: 'translate(-50%, calc(-50% + 5rem))' },
    welcomeText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, calc(-50% - 200px))',
      padding: '0 1rem',
    },
    welcomeTextTitle: {
      width: '32rem', // 默认适中的最大宽度，会在calculateLayout中动态调整
    },
    suggestedQuestions: { top: 'calc(50% + 120px)', transform: 'translateX(-50%)' },
    needsCompactLayout: false,
    extensions: {},
  });

  // --- BEGIN COMMENT ---
  // 🧮 智能布局计算函数
  // --- END COMMENT ---
  const calculateLayout = useCallback(() => {
    const config = getResponsiveLayout();
    const viewportHeight = window.innerHeight;
    const actualInputHeight = Math.max(inputHeight, config.estimatedHeights.inputContainer);
    
    // --- BEGIN COMMENT ---
    // 1. 确定输入框位置（基准点）
    // --- END COMMENT ---
    const inputCenterY = viewportHeight / 2 + config.inputOffsetFromCenter;
    const inputTopY = inputCenterY - actualInputHeight / 2;
    const inputBottomY = inputCenterY + actualInputHeight / 2;
    
    // --- BEGIN COMMENT ---
    // 2. 计算欢迎文字的理想位置
    // --- END COMMENT ---
    const idealWelcomeTextBottomY = inputTopY - config.minSpacing.welcomeTextToInput;
    const idealWelcomeTextTopY = idealWelcomeTextBottomY - config.estimatedHeights.welcomeText;
    
    // --- BEGIN COMMENT ---
    // 3. 计算推荐问题的理想位置
    // --- END COMMENT ---
    const idealSuggestedQuestionsTopY = inputBottomY + config.minSpacing.suggestedQuestionsToInput;
    const idealSuggestedQuestionsBottomY = idealSuggestedQuestionsTopY + config.estimatedHeights.suggestedQuestions;
    
    // --- BEGIN COMMENT ---
    // 4. 检查是否需要紧凑布局
    // --- END COMMENT ---
    const totalRequiredHeight = 
      config.estimatedHeights.welcomeText + 
      config.minSpacing.welcomeTextToInput + 
      actualInputHeight + 
      config.minSpacing.suggestedQuestionsToInput + 
      config.estimatedHeights.suggestedQuestions;
    
    const availableHeight = viewportHeight * config.compactLayoutThreshold;
    const needsCompactLayout = totalRequiredHeight > availableHeight;
    
    // --- BEGIN COMMENT ---
    // 5. 根据是否需要紧凑布局计算最终位置
    // --- END COMMENT ---
    let finalWelcomeTextY: number;
    let finalSuggestedQuestionsY: number;
    
    if (needsCompactLayout) {
      // 紧凑布局：减少间距，确保所有内容都能显示
      const compactSpacing = Math.min(config.minSpacing.welcomeTextToInput * 0.7, 40);
      finalWelcomeTextY = inputTopY - compactSpacing - config.estimatedHeights.welcomeText / 2;
      finalSuggestedQuestionsY = inputBottomY + compactSpacing;
    } else {
      // 正常布局：使用理想位置
      finalWelcomeTextY = idealWelcomeTextTopY + config.estimatedHeights.welcomeText / 2;
      finalSuggestedQuestionsY = idealSuggestedQuestionsTopY;
    }
    
    // --- BEGIN COMMENT ---
    // 6. 确保不超出视口边界
    // --- END COMMENT ---
    const minWelcomeTextY = config.estimatedHeights.welcomeText / 2 + 20; // 顶部留20px边距
    const maxSuggestedQuestionsY = viewportHeight - config.estimatedHeights.suggestedQuestions - 20; // 底部留20px边距
    
    finalWelcomeTextY = Math.max(finalWelcomeTextY, minWelcomeTextY);
    finalSuggestedQuestionsY = Math.min(finalSuggestedQuestionsY, maxSuggestedQuestionsY);
    
    // --- BEGIN COMMENT ---
    // 7. 转换为CSS样式和欢迎文字宽度计算
    // --- END COMMENT ---
    const viewportWidth = window.innerWidth;
    
    // --- BEGIN COMMENT ---
    // 🎯 欢迎文字宽度设置：根据设备类型设置不同宽度，确保移动端可调
    // 移动端：使用视口宽度的百分比，确保可以调整
    // 平板端：适中的固定宽度
    // 桌面端：较大的固定宽度
    // --- END COMMENT ---
    // --- BEGIN COMMENT ---
    // 🔥 优化的宽度设置：移动端使用视口宽度百分比，避免文字被挤压
    // --- END COMMENT ---
    let welcomeTextMaxWidth: string;
    if (viewportWidth < 640) {
      // --- BEGIN COMMENT ---
      // 移动端：直接使用视口宽度的90%，确保文字有足够空间
      // 不使用maxWidth，而是直接设置width，强制文字占用足够宽度
      // --- END COMMENT ---
      welcomeTextMaxWidth = '90vw'; 
    } else if (viewportWidth < 1024) {
      // 平板端
      welcomeTextMaxWidth = '35rem'; 
    } else {
      // 桌面端
      welcomeTextMaxWidth = '48rem'; 
    }
    
    const newPositions: WelcomeLayoutPositions = {
      input: {
        top: '50%',
        transform: `translate(-50%, calc(-50% + ${config.inputOffsetFromCenter}px))`,
      },
      welcomeText: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, calc(-50% + ${finalWelcomeTextY - viewportHeight / 2}px))`,
        padding: '0 1rem',
      },
      // --- BEGIN COMMENT ---
      // 🔥 标题专用样式：Hook中的最高优先级宽度设置
      // 移动端使用width强制宽度，桌面端使用maxWidth限制最大宽度
      // --- END COMMENT ---
      welcomeTextTitle: {
        ...(viewportWidth < 640 
          ? { width: welcomeTextMaxWidth } // 移动端：强制宽度
          : { maxWidth: welcomeTextMaxWidth } // 桌面端：最大宽度限制
        ),
      },
      suggestedQuestions: {
        top: `${finalSuggestedQuestionsY}px`,
        transform: 'translateX(-50%)',
      },
      needsCompactLayout,
      extensions: {},
    };
    
    setPositions(newPositions);
  }, [inputHeight]);

  // --- BEGIN COMMENT ---
  // 🔄 当输入框高度或视口大小变化时重新计算布局
  // --- END COMMENT ---
  useEffect(() => {
    calculateLayout();
    
    const handleResize = () => {
      calculateLayout();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateLayout]);

  return positions;
}

/**
 * 创建自定义移动端宽度的布局配置
 * @param mobileWidthVw 移动端视口宽度百分比（如90表示90vw）
 * @param minWidthPx 最小宽度（像素）
 * 
 * --- BEGIN COMMENT ---
 * 🎯 重要提示：移动端使用width而不是maxWidth
 * 这样可以强制文字占用指定宽度，避免文字收缩过窄
 * --- END COMMENT ---
 */
export function createMobileWidthLayout(mobileWidthVw: number = 90, minWidthPx: number = 280): WelcomeLayoutConfig {
  const config = { ...DEFAULT_WELCOME_LAYOUT };
  console.log(`移动端宽度配置: ${mobileWidthVw}vw, 最小宽度: ${minWidthPx}px`);
  console.log('✅ 解决方案：移动端使用width强制宽度，桌面端使用maxWidth限制宽度');
  return config;
}