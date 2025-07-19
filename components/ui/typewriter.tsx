import { cn } from '@lib/utils';

import { useEffect, useRef, useState } from 'react';

interface TypeWriterProps {
  text: string;
  speed?: number; // Typing speed (milliseconds)
  delay?: number; // Start delay (milliseconds)
  className?: string;
  onComplete?: () => void;
  waitingEffect?: boolean; // Whether to display the waiting effect (shimmer)
}

export function TypeWriter({
  text,
  speed = 50,
  delay = 0,
  className,
  onComplete,
  waitingEffect = false,
}: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false); // Add completion status
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
    return (
      newText.startsWith(cleanLastText) && newText.length > cleanLastText.length
    );
  };

  const startTyping = (targetText: string, startFrom = 0) => {
    clearTimeouts();
    targetTextRef.current = targetText;
    indexRef.current = startFrom;
    setIsWaiting(false);
    setIsComplete(false); // Reset completion status

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
        // 🎯 Typing complete: ensure fully displayed
        setRevealProgress(100);
        setIsComplete(true); // Mark as complete
        lastCompletedTextRef.current = currentTarget;

        if (waitingEffect && currentTarget.endsWith('...')) {
          setIsWaiting(true);
        }

        if (onComplete) {
          onComplete();
        }
      }
    };

    timeoutRef.current = setTimeout(
      typeNextChar,
      startFrom === 0 ? delay : 200
    );
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

  // 🎨 Intelligent gradient logic: when complete, fully display, and when in progress, there is a gradient
  const getMaskStyle = () => {
    if (isComplete) {
      // ✅ Complete state: all text fully displayed
      return {
        WebkitMask: 'none',
        mask: 'none',
      };
    }

    // 🎨 In progress: with gradient effect
    const solidEnd = Math.max(0, revealProgress - 8); // The part that is fully displayed
    const fadeEnd = revealProgress; // The gradient end point

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
      )`,
    };
  };

  return (
    <span className={cn('inline-block', className)}>
      <span
        className={cn(
          'transition-all duration-75 ease-out',
          className,
          isWaiting && waitingEffect && 'animate-pulse opacity-60'
        )}
        style={getMaskStyle()}
      >
        {displayedText}
      </span>
    </span>
  );
}
