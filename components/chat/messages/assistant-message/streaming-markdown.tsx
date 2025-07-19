import { cn } from '@lib/utils';

import React, { useEffect, useRef, useState } from 'react';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  isComplete?: boolean;
  className?: string;
  typewriterSpeed?: number; // characters per second
  children: (displayedContent: string) => React.ReactNode; // render function
}

/**
 * StreamingText component: handles streaming text rendering logic.
 * Responsibilities:
 * 1. Manages character-by-character display of streaming text.
 * 2. Uses render prop pattern to let parent decide how to render content.
 * 3. Does not care about specific rendering format (Markdown, HTML, etc).
 */
export const StreamingText: React.FC<StreamingTextProps> = ({
  content,
  isStreaming,
  isComplete = false,
  className,
  typewriterSpeed = 100, // default 100 characters/second
  children,
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const animationRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const currentIndexRef = useRef<number>(0);

  /**
   * Core streaming logic:
   * 1. If not streaming or already complete, show full content immediately.
   * 2. If streaming, use requestAnimationFrame to smoothly reveal text character by character.
   * 3. When content updates, continue from current position seamlessly.
   */
  useEffect(() => {
    // If not streaming or already complete, show full content immediately
    if (!isStreaming || isComplete) {
      setDisplayedContent(content);
      currentIndexRef.current = content.length;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // If content hasn't changed and animation is running, do nothing
    if (content === displayedContent && animationRef.current) {
      return;
    }

    // Ensure current index does not exceed new content length
    currentIndexRef.current = Math.min(currentIndexRef.current, content.length);

    // Start streaming animation
    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateTimeRef.current;

      // Calculate how many characters to add
      const charactersToAdd = Math.max(
        1,
        Math.floor((deltaTime * typewriterSpeed) / 1000)
      );

      if (charactersToAdd > 0 && currentIndexRef.current < content.length) {
        currentIndexRef.current = Math.min(
          currentIndexRef.current + charactersToAdd,
          content.length
        );
        setDisplayedContent(content.substring(0, currentIndexRef.current));
        lastUpdateTimeRef.current = now;
      }

      // Continue animation until all content is shown
      if (currentIndexRef.current < content.length) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    // Start animation
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
    <div className={cn('streaming-text-container', className)}>
      {children(displayedContent)}
    </div>
  );
};

/**
 * Backward-compatible StreamingMarkdown component.
 * Keeps the original API, but uses StreamingText internally.
 */
interface StreamingMarkdownProps {
  content: string;
  isStreaming: boolean;
  isComplete?: boolean;
  className?: string;
  typewriterSpeed?: number;
}

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = props => {
  return (
    <StreamingText {...props}>
      {displayedContent => (
        <div className="streaming-markdown-content">{displayedContent}</div>
      )}
    </StreamingText>
  );
};
