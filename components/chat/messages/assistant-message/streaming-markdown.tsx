import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import type { Components } from 'react-markdown';
import { cn } from '@lib/utils';
import { useTheme } from '@lib/hooks';
import {
  InlineCode,
  CodeBlock,
  MarkdownTableContainer,
  MarkdownBlockquote,
} from '@components/chat/markdown-block';

interface StreamingMarkdownProps {
  content: string;
  isStreaming: boolean;
  isComplete?: boolean;
  className?: string;
  typewriterSpeed?: number; // 字符/秒
}

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({
  content,
  isStreaming,
  isComplete = false,
  className,
  typewriterSpeed = 100 // 默认100字符/秒
}) => {
  const { isDark } = useTheme();
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

  // --- BEGIN COMMENT ---
  // 🎨 Markdown组件配置：与原AssistantMessage保持一致
  // --- END COMMENT ---
  const markdownComponents: Components = {
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : null;

      if (node.position?.start.line !== node.position?.end.line || language) {
        return (
          <CodeBlock 
            language={language} 
            className={className} 
            isStreaming={isStreaming}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </CodeBlock>
        );
      }
      return <InlineCode {...props}>{children}</InlineCode>;
    },
    table({ children, ...props }: any) {
      return <MarkdownTableContainer {...props}>{children}</MarkdownTableContainer>;
    },
    th({ children, ...props }: any) {
      return (
        <th
          className={cn(
            "px-4 py-2.5 text-left text-sm font-semibold border-b-2",
            isDark
              ? "border-gray-700 bg-gray-800 text-gray-200"
              : "border-gray-300 bg-gray-100 text-gray-700",
            "first:pl-3 last:pr-3 sm:first:pl-4 sm:last:pr-4"
          )}
          {...props}
        >
          {children}
        </th>
      );
    },
    td({ children, ...props }: any) {
      return (
        <td
          className={cn(
            "px-4 py-2.5 text-sm border-b",
            isDark ? "border-gray-700/50 text-gray-300" : "border-gray-200/70 text-gray-600",
            "first:pl-3 last:pr-3 sm:first:pl-4 sm:last:pr-4"
          )}
          {...props}
        >
          {children}
        </td>
      );
    },
    blockquote({ children, ...props }: any) {
      return <MarkdownBlockquote {...props}>{children}</MarkdownBlockquote>;
    },
    p({ children, ...props }) {
      return <p className="my-0" {...props}>{children}</p>;
    },
    ul({ children, ...props }) {
      return <ul className="my-2.5 ml-6 list-disc space-y-1" {...props}>{children}</ul>;
    },
    ol({ children, ...props }) {
      return <ol className="my-2.5 ml-6 list-decimal space-y-1" {...props}>{children}</ol>;
    },
    li({ children, ...props }) {
      return <li className="pb-0.5" {...props}>{children}</li>;
    },
    h1({ children, ...props }) {
      return <h1 className={cn("text-2xl font-semibold mt-4 mb-2 pb-1 border-b", isDark ? "border-gray-700" : "border-gray-300")} {...props}>{children}</h1>;
    },
    h2({ children, ...props }) {
      return <h2 className={cn("text-xl font-semibold mt-3.5 mb-1.5 pb-1 border-b", isDark ? "border-gray-700" : "border-gray-300")} {...props}>{children}</h2>;
    },
    h3({ children, ...props }) {
      return <h3 className="text-lg font-semibold mt-3 mb-1" {...props}>{children}</h3>;
    },
    h4({ children, ...props }) {
      return <h4 className="text-base font-semibold mt-2.5 mb-0.5" {...props}>{children}</h4>;
    },
    a({ children, href, ...props }) {
      return <a href={href} className={cn("underline", isDark ? "text-sky-400 hover:text-sky-300" : "text-sky-600 hover:text-sky-700")} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    },
    hr({ ...props }) {
      return <hr className={cn("my-4 border-t", isDark ? "border-gray-700" : "border-gray-300")} {...props} />;
    }
  };

  // 是否显示光标
  const shouldShowCursor = isStreaming && !isComplete && displayedContent.length < content.length;

  return (
    <div className={cn("streaming-markdown-container", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={markdownComponents}
      >
        {displayedContent}
      </ReactMarkdown>
      
      {/* 流式光标效果 */}
      {shouldShowCursor && (
        <span className="inline-block w-0.5 h-5 bg-blue-500 animate-pulse ml-0.5 align-text-top" />
      )}
    </div>
  );
}; 