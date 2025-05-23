import { useState, useEffect, useRef } from 'react';
import { cn } from '@lib/utils';

interface TypeWriterProps {
  text: string;
  speed?: number; // 打字速度（毫秒）
  delay?: number; // 开始延迟（毫秒）
  className?: string;
  onComplete?: () => void;
  waitingEffect?: boolean; // 是否显示等待效果（shimmer）
}

export function TypeWriter({ 
  text, 
  speed = 50, 
  delay = 0, 
  className,
  onComplete,
  waitingEffect = false
}: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const targetTextRef = useRef('');
  const lastCompletedTextRef = useRef(''); // 记录上次完成的文本

  // --- BEGIN COMMENT ---
  // 清理定时器的函数
  // --- END COMMENT ---
  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // --- BEGIN COMMENT ---
  // 检查是否是续写（新文本是上次完成文本的扩展）
  // --- END COMMENT ---
  const isContinuation = (newText: string, lastCompletedText: string) => {
    if (!lastCompletedText) return false;
    
    // 移除等待标识符（如...）后比较
    const cleanLastText = lastCompletedText.replace(/\.\.\.$/, '');
    return newText.startsWith(cleanLastText) && newText.length > cleanLastText.length;
  };

  // --- BEGIN COMMENT ---
  // 智能打字逻辑：支持续写和重新开始
  // --- END COMMENT ---
  const startTyping = (targetText: string, startFrom = 0) => {
    clearTimeouts();
    targetTextRef.current = targetText;
    indexRef.current = startFrom;
    setIsWaiting(false);
    
    // 如果从中间开始，先设置当前显示的文本
    if (startFrom > 0) {
      setDisplayedText(targetText.substring(0, startFrom));
    } else {
      setDisplayedText('');
    }
    
    const typeNextChar = () => {
      const currentTarget = targetTextRef.current;
      const currentIndex = indexRef.current;
      
      if (currentIndex < currentTarget.length) {
        const newDisplayText = currentTarget.substring(0, currentIndex + 1);
        setDisplayedText(newDisplayText);
        indexRef.current++;
        
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        // 打字完成
        lastCompletedTextRef.current = currentTarget;
        
        // 检查是否需要等待效果
        if (waitingEffect && currentTarget.endsWith('...')) {
          setIsWaiting(true);
        }
        
        if (onComplete) {
          onComplete();
        }
      }
    };

    // 开始打字
    timeoutRef.current = setTimeout(typeNextChar, startFrom === 0 ? delay : 200);
  };

  // --- BEGIN COMMENT ---
  // 监听文本变化，智能判断是续写还是重新开始
  // --- END COMMENT ---
  useEffect(() => {
    if (!text) return;
    
    const lastCompleted = lastCompletedTextRef.current;
    
    if (lastCompleted && isContinuation(text, lastCompleted)) {
      // 续写模式：从完成的文本位置继续
      const cleanLastText = lastCompleted.replace(/\.\.\.$/, '');
      startTyping(text, cleanLastText.length);
    } else {
      // 重新开始模式
      lastCompletedTextRef.current = '';
      startTyping(text, 0);
    }
    
    return () => clearTimeouts();
  }, [text]); // 只依赖text变化

  // --- BEGIN COMMENT ---
  // 组件卸载时清理定时器
  // --- END COMMENT ---
  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  return (
    <span className={cn("inline-block", className)}>
      <span 
        className={cn(
          "transition-all duration-300",
          isWaiting && waitingEffect && "animate-pulse opacity-60"
        )}
      >
        {displayedText}
      </span>
    </span>
  );
} 