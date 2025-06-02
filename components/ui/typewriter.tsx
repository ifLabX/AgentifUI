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
  const [revealProgress, setRevealProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false); // 添加完成状态
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const targetTextRef = useRef('');
  const lastCompletedTextRef = useRef('');

  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const isContinuation = (newText: string, lastCompletedText: string) => {
    if (!lastCompletedText) return false;
    
    const cleanLastText = lastCompletedText.replace(/\.\.\.$/, '');
    return newText.startsWith(cleanLastText) && newText.length > cleanLastText.length;
  };

  const startTyping = (targetText: string, startFrom = 0) => {
    clearTimeouts();
    targetTextRef.current = targetText;
    indexRef.current = startFrom;
    setIsWaiting(false);
    setIsComplete(false); // 重置完成状态
    
    setDisplayedText(targetText);
    
    if (startFrom > 0) {
      setRevealProgress((startFrom / targetText.length) * 100);
    } else {
      setRevealProgress(0);
    }
    
    const typeNextChar = () => {
      const currentTarget = targetTextRef.current;
      const currentIndex = indexRef.current;
      
      if (currentIndex < currentTarget.length) {
        const progress = ((currentIndex + 1) / currentTarget.length) * 100;
        setRevealProgress(progress);
        indexRef.current++;
        
        timeoutRef.current = setTimeout(typeNextChar, speed);
      } else {
        // 🎯 打字完成：确保完全显示
        setRevealProgress(100);
        setIsComplete(true); // 标记为完成
        lastCompletedTextRef.current = currentTarget;
        
        if (waitingEffect && currentTarget.endsWith('...')) {
          setIsWaiting(true);
        }
        
        if (onComplete) {
          onComplete();
        }
      }
    };

    timeoutRef.current = setTimeout(typeNextChar, startFrom === 0 ? delay : 200);
  };

  useEffect(() => {
    if (!text) return;
    
    const lastCompleted = lastCompletedTextRef.current;
    
    if (lastCompleted && isContinuation(text, lastCompleted)) {
      const cleanLastText = lastCompleted.replace(/\.\.\.$/, '');
      startTyping(text, cleanLastText.length);
    } else {
      lastCompletedTextRef.current = '';
      startTyping(text, 0);
    }
    
    return () => clearTimeouts();
  }, [text]);

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  // 🎨 智能渐变逻辑：完成时完全显示，进行中时有渐变
  const getMaskStyle = () => {
    if (isComplete) {
      // ✅ 完成状态：全部文字完整显示
      return {
        WebkitMask: 'none',
        mask: 'none'
      };
    }
    
    // 🎨 进行中：带渐变效果
    const solidEnd = Math.max(0, revealProgress - 8);  // 完全显示的部分
    const fadeEnd = revealProgress;                    // 渐变结束点
    
    return {
      WebkitMask: `linear-gradient(90deg, 
        black 0%, 
        black ${solidEnd}%, 
        rgba(0,0,0,0.6) ${(solidEnd + fadeEnd) / 2}%, 
        rgba(0,0,0,0.2) ${fadeEnd}%, 
        transparent ${fadeEnd}%, 
        transparent 100%
      )`,
      mask: `linear-gradient(90deg, 
        black 0%, 
        black ${solidEnd}%, 
        rgba(0,0,0,0.6) ${(solidEnd + fadeEnd) / 2}%, 
        rgba(0,0,0,0.2) ${fadeEnd}%, 
        transparent ${fadeEnd}%, 
        transparent 100%
      )`
    };
  };

  return (
    <span className={cn("inline-block", className)}>
      <span 
        className={cn(
          "transition-all duration-75 ease-out",
          className,
          isWaiting && waitingEffect && "animate-pulse opacity-60"
        )}
        style={getMaskStyle()}
      >
        {displayedText}
      </span>
    </span>
  );
}
