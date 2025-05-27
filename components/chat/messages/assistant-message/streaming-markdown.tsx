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
      
      // 计算应该显示的字符数
      const charactersToAdd = Math.max(1, Math.floor((deltaTime * typewriterSpeed) / 1000));
      
      if (charactersToAdd > 0 && currentIndexRef.current < content.length) {
        currentIndexRef.current = Math.min(currentIndexRef.current + charactersToAdd, content.length);
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