import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@lib/utils';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  isComplete?: boolean;
  className?: string;
  typewriterSpeed?: number; // 字符/秒
  children: (displayedContent: string) => React.ReactNode; // 渲染函数
}

// --- BEGIN COMMENT ---
// 🎯 StreamingText组件：专注于流式文本渲染逻辑
// 职责：
// 1. 管理流式文本的逐字符显示
// 2. 通过render prop模式让父组件决定如何渲染内容
// 3. 不关心具体的渲染格式（Markdown、HTML等）
// --- END COMMENT ---
export const StreamingText: React.FC<StreamingTextProps> = ({
  content,
  isStreaming,
  isComplete = false,
  className,
  typewriterSpeed = 100, // 默认100字符/秒
  children
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const currentIndexRef = useRef<number>(0);

  // --- BEGIN COMMENT ---
  // 🎯 核心流式逻辑：
  // 1. 非流式状态：直接显示完整内容
  // 2. 流式状态：使用requestAnimationFrame实现丝滑逐字符显示
  // 3. 内容更新时：从当前位置继续，无缝衔接
  // 4. 🎯 新增：智能批量更新，提高Markdown渲染流畅性
  // --- END COMMENT ---
  useEffect(() => {
    // 非流式状态或已完成，直接显示完整内容
    if (!isStreaming || isComplete) {
      setDisplayedContent(content);
      currentIndexRef.current = content.length;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // 如果内容没有变化，不需要重新启动动画
    if (content === displayedContent && animationRef.current) {
      return;
    }

    // 确保当前索引不超过新内容长度
    currentIndexRef.current = Math.min(currentIndexRef.current, content.length);

    // 启动流式动画
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;
      
      // 🎯 优化：智能字符批量计算
      // 1. 基础速度：根据typewriterSpeed计算
      // 2. 最小批量：确保每次至少显示1个字符
      // 3. 最大批量：限制每次最多显示5个字符，避免跳跃感
      // 4. 加速策略：内容越长，批量越大，提高长文本渲染速度
      const baseCharactersToAdd = Math.floor((deltaTime * typewriterSpeed) / 1000);
      const minBatch = 1;
      const maxBatch = Math.min(5, Math.max(2, Math.floor(content.length / 200))); // 长文本加速
      const charactersToAdd = Math.max(minBatch, Math.min(maxBatch, baseCharactersToAdd));
      
      if (charactersToAdd > 0 && currentIndexRef.current < content.length) {
        // --- BEGIN COMMENT ---
        // 🎯 应用智能Markdown感知渲染
        // 先计算目标索引，然后使用智能函数调整到合适的结束位置
        // --- END COMMENT ---
        const targetIndex = Math.min(currentIndexRef.current + charactersToAdd, content.length);
        const smartEndIndex = getSmartEndIndex(content, targetIndex);
        
        currentIndexRef.current = smartEndIndex;
        setDisplayedContent(content.substring(0, currentIndexRef.current));
        lastUpdateTimeRef.current = now;
      }

      // 继续动画直到显示完成
      if (currentIndexRef.current < content.length) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    // 启动动画
    lastUpdateTimeRef.current = Date.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [content, isStreaming, isComplete, typewriterSpeed]);

  return (
    <div className={cn("streaming-text-container", className)}>
      {children(displayedContent)}
    </div>
  );
};

// --- BEGIN COMMENT ---
// 🎯 向后兼容的StreamingMarkdown组件
// 保持原有的API，但内部使用StreamingText
// --- END COMMENT ---
interface StreamingMarkdownProps {
  content: string;
  isStreaming: boolean;
  isComplete?: boolean;
  className?: string;
  typewriterSpeed?: number;
}

// --- BEGIN COMMENT ---
// 🎯 Markdown语法感知函数
// 检测当前位置是否在Markdown语法的中间，如果是则跳过到语法结束
// 这样可以减少 "**你好" → "**你好啊**" 的闪烁问题
// --- END COMMENT ---
const getSmartEndIndex = (content: string, targetIndex: number): number => {
  // 如果已经到达末尾，直接返回
  if (targetIndex >= content.length) return content.length;
  
  // 检查常见的Markdown语法模式
  const markdownPatterns = [
    /\*\*[^*]*$/,     // 粗体开始但未结束: **text
    /\*[^*]*$/,       // 斜体开始但未结束: *text  
    /`[^`]*$/,        // 行内代码开始但未结束: `code
    /\[[^\]]*$/,      // 链接文本开始但未结束: [text
    /!\[[^\]]*$/,     // 图片开始但未结束: ![alt
  ];
  
  const currentText = content.substring(0, targetIndex);
  
  // 检查是否在不完整的Markdown语法中
  for (const pattern of markdownPatterns) {
    if (pattern.test(currentText)) {
      // 尝试找到对应的结束标记
      const remainingText = content.substring(targetIndex);
      
      if (currentText.endsWith('**') && remainingText.includes('**')) {
        // 粗体：找到下一个 **
        const endIndex = content.indexOf('**', targetIndex);
        if (endIndex !== -1) return Math.min(endIndex + 2, content.length);
      } else if (currentText.endsWith('*') && !currentText.endsWith('**') && remainingText.includes('*')) {
        // 斜体：找到下一个 *
        const endIndex = content.indexOf('*', targetIndex);
        if (endIndex !== -1) return Math.min(endIndex + 1, content.length);
      } else if (currentText.endsWith('`') && remainingText.includes('`')) {
        // 行内代码：找到下一个 `
        const endIndex = content.indexOf('`', targetIndex);
        if (endIndex !== -1) return Math.min(endIndex + 1, content.length);
      } else if (currentText.match(/\[[^\]]*$/) && remainingText.includes('](')) {
        // 链接：找到 ](
        const endIndex = content.indexOf('](', targetIndex);
        if (endIndex !== -1) {
          // 继续找到链接的结束 )
          const linkEndIndex = content.indexOf(')', endIndex + 2);
          if (linkEndIndex !== -1) return Math.min(linkEndIndex + 1, content.length);
        }
      }
    }
  }
  
  return targetIndex;
};

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = (props) => {
  return (
    <StreamingText {...props}>
      {(displayedContent) => (
        <div className="streaming-markdown-content">
          {displayedContent}
        </div>
      )}
    </StreamingText>
  );
}; 