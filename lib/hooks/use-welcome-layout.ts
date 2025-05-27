import { useState, useEffect, useCallback } from 'react';
import { useChatLayoutStore } from '@lib/stores/chat-layout-store';
import { getResponsiveLayout, type WelcomeLayoutConfig } from '@lib/config/welcome-layout';

interface WelcomeLayoutPositions {
  // 输入框位置
  input: {
    top: string;
    transform: string;
  };
  
  // 欢迎文字位置
  welcomeText: {
    position: 'absolute';
    top: string;
    left: string;
    transform: string;
    maxWidth: string;
    padding: string;
  };
  
  // 提示容器位置
  promptContainer: {
    top: string;
    transform: string;
  };
  
  // 是否需要调整布局（当空间不足时）
  needsCompactLayout: boolean;
}

/**
 * 欢迎界面布局管理Hook
 * 提供智能的组件定位，防止遮挡并确保合适的间距
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
      maxWidth: '28rem',
      padding: '0 1rem',
    },
    promptContainer: { top: 'calc(50% + 120px)', transform: 'translateX(-50%)' },
    needsCompactLayout: false,
  });

  // --- BEGIN COMMENT ---
  // 计算智能布局位置
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
    // 3. 计算提示容器的理想位置
    // --- END COMMENT ---
    const idealPromptTopY = inputBottomY + config.minSpacing.promptToInput;
    const idealPromptBottomY = idealPromptTopY + config.estimatedHeights.promptContainer;
    
    // --- BEGIN COMMENT ---
    // 4. 检查是否需要紧凑布局
    // --- END COMMENT ---
    const totalRequiredHeight = 
      config.estimatedHeights.welcomeText + 
      config.minSpacing.welcomeTextToInput + 
      actualInputHeight + 
      config.minSpacing.promptToInput + 
      config.estimatedHeights.promptContainer;
    
    const availableHeight = viewportHeight * config.compactLayoutThreshold;
    const needsCompactLayout = totalRequiredHeight > availableHeight;
    
    // --- BEGIN COMMENT ---
    // 5. 根据是否需要紧凑布局计算最终位置
    // --- END COMMENT ---
    let finalWelcomeTextY: number;
    let finalPromptY: number;
    
    if (needsCompactLayout) {
      // 紧凑布局：减少间距，确保所有内容都能显示
      const compactSpacing = Math.min(config.minSpacing.welcomeTextToInput * 0.7, 40);
      finalWelcomeTextY = inputTopY - compactSpacing - config.estimatedHeights.welcomeText / 2;
      finalPromptY = inputBottomY + compactSpacing;
    } else {
      // 正常布局：使用理想位置
      finalWelcomeTextY = idealWelcomeTextTopY + config.estimatedHeights.welcomeText / 2;
      finalPromptY = idealPromptTopY;
    }
    
    // --- BEGIN COMMENT ---
    // 6. 确保不超出视口边界
    // --- END COMMENT ---
    const minWelcomeTextY = config.estimatedHeights.welcomeText / 2 + 20; // 顶部留20px边距
    const maxPromptY = viewportHeight - config.estimatedHeights.promptContainer - 20; // 底部留20px边距
    
    finalWelcomeTextY = Math.max(finalWelcomeTextY, minWelcomeTextY);
    finalPromptY = Math.min(finalPromptY, maxPromptY);
    
    // --- BEGIN COMMENT ---
    // 7. 转换为CSS样式
    // --- END COMMENT ---
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
        maxWidth: '28rem',
        padding: '0 1rem',
      },
      promptContainer: {
        top: `${finalPromptY}px`,
        transform: 'translateX(-50%)',
      },
      needsCompactLayout,
    };
    
    setPositions(newPositions);
  }, [inputHeight]);

  // --- BEGIN COMMENT ---
  // 当输入框高度或视口大小变化时重新计算布局
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