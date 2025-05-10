"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import "katex/dist/katex.min.css"
import type { Components } from "react-markdown"
// --- BEGIN MODIFIED COMMENT ---
// 导入原子化的 Markdown 组件和思考块相关组件
// --- END MODIFIED COMMENT ---
import { 
  ThinkBlockHeader, 
  ThinkBlockStatus 
} from "@components/chat/markdown-block/think-block-header" // Keep existing think block components
import { ThinkBlockContent } from "@components/chat/markdown-block/think-block-content"
import {
  InlineCode,
  CodeBlock,
  MarkdownTableContainer,
  MarkdownBlockquote,
} from "@components/chat/markdown-block";
import { AssistantMessageActions } from "./assistant-message-actions";


const extractThinkContent = (rawContent: string): {
  hasThinkBlock: boolean;
  thinkContent: string;
  mainContent: string;
  thinkClosed: boolean;
} => {
  const thinkStartTag = '<think>';
  const thinkEndTag = '</think>';

  if (rawContent.startsWith(thinkStartTag)) {
    const endTagIndex = rawContent.indexOf(thinkEndTag);
    if (endTagIndex !== -1) {
      const thinkContent = rawContent.substring(thinkStartTag.length, endTagIndex);
      const mainContent = rawContent.substring(endTagIndex + thinkEndTag.length);
      return { hasThinkBlock: true, thinkContent, mainContent, thinkClosed: true };
    }
    const thinkContent = rawContent.substring(thinkStartTag.length);
    return { hasThinkBlock: true, thinkContent, mainContent: '', thinkClosed: false };
  }
  return { hasThinkBlock: false, thinkContent: '', mainContent: rawContent, thinkClosed: false };
};

interface AssistantMessageProps {
  id: string;
  content: string
  isStreaming: boolean
  wasManuallyStopped: boolean
  className?: string
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ 
  id,
  content, 
  isStreaming,
  wasManuallyStopped, 
  className 
}) => {
  const { isDark } = useTheme();

  const { hasThinkBlock, thinkContent, mainContent, thinkClosed } = useMemo(() => 
    extractThinkContent(content),
    [content]
  );

  const [isOpen, setIsOpen] = useState(true);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const calculateStatus = (): ThinkBlockStatus => {
    if (hasThinkBlock && thinkClosed) {
      return 'completed';
    }
    
    if (wasManuallyStopped) {
      return hasThinkBlock ? 'stopped' : 'completed';
    }

    if (isStreaming && hasThinkBlock && !thinkClosed) {
      return 'thinking';
    }

    return 'completed';
  };
  const currentStatus = calculateStatus();

  const prevStatusRef = useRef<ThinkBlockStatus>(currentStatus);

  useEffect(() => {
    const previousStatus = prevStatusRef.current;

    if (previousStatus === 'thinking' && currentStatus === 'completed') {
      setIsOpen(false);
    }
    else if (previousStatus !== 'thinking' && currentStatus === 'thinking') {
      setIsOpen(true);
    }

    prevStatusRef.current = currentStatus;

  }, [currentStatus]);

  const mainMarkdownComponents: Components = {
    // --- BEGIN MODIFIED COMMENT ---
    // 使用原子化组件渲染代码块和内联代码
    // --- END MODIFIED COMMENT ---
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : null;

      if (node.position?.start.line !== node.position?.end.line || language) {
        // 多行代码或指定了语言 -> 代码块
        return (
          <CodeBlock language={language} className={className} {...props}>
            {String(children).replace(/\n$/, "")}
          </CodeBlock>
        );
      }
      // 单行代码 -> 内联代码
      return <InlineCode {...props}>{children}</InlineCode>;
    },
    // --- BEGIN MODIFIED COMMENT ---
    // 使用原子化组件渲染表格容器，并直接在此处定义 th 和 td 的现代化样式
    // --- END MODIFIED COMMENT ---
    table({ children, ...props }: any) {
      return <MarkdownTableContainer {...props}>{children}</MarkdownTableContainer>;
    },
    th({ children, ...props }: any) {
      return (
        <th
          className={cn(
            "px-4 py-2.5 text-left text-sm font-semibold border-b-2", // Adjusted padding and added bottom border
            isDark
              ? "border-gray-700 bg-gray-800 text-gray-200" // Header background for dark
              : "border-gray-300 bg-gray-100 text-gray-700", // Header background for light
            "first:pl-3 last:pr-3 sm:first:pl-4 sm:last:pr-4" // Responsive padding for first/last cells
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
            "px-4 py-2.5 text-sm border-b", // Adjusted padding
            isDark ? "border-gray-700/50 text-gray-300" : "border-gray-200/70 text-gray-600",
            "first:pl-3 last:pr-3 sm:first:pl-4 sm:last:pr-4" // Responsive padding
          )}
          {...props}
        >
          {children}
        </td>
      );
    },
    // --- BEGIN MODIFIED COMMENT ---
    // 使用原子化组件渲染引用块
    // --- END MODIFIED COMMENT ---
    blockquote({ children, ...props }: any) {
      return <MarkdownBlockquote {...props}>{children}</MarkdownBlockquote>;
    },
    // --- BEGIN MODIFIED COMMENT ---
    // 为其他 HTML 元素（如 p, ul, ol, li, h1-h6, a, hr）添加现代化样式
    // --- END MODIFIED COMMENT ---
    p({ children, ...props }) {
      return <p className="my-2.5" {...props}>{children}</p>;
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

  return (
    <div 
      className={cn("w-full mb-4 assistant-message-container group", className)}
      data-message-id={id}
    >
      {hasThinkBlock && (
        <>
          <ThinkBlockHeader 
            status={currentStatus} 
            isOpen={isOpen} 
            onToggle={toggleOpen} 
          />
          <ThinkBlockContent 
            markdownContent={thinkContent}
            isOpen={isOpen}
          />
        </>
      )}

      {mainContent && (
        // --- BEGIN MODIFIED COMMENT ---
        // 优化主内容区域的整体字体样式
        // - 设置基础字体大小 (text-base) 和行高 (leading-relaxed)
        // --- END MODIFIED COMMENT ---
        <div className={cn(
          "w-full markdown-body main-content-area text-base leading-relaxed",
          isDark ? "text-gray-200" : "text-gray-800", // 更柔和的文本颜色
          !hasThinkBlock ? "py-2" : "pt-1 pb-2" // 调整无思考块时的padding
        )}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={mainMarkdownComponents} 
            children={mainContent}
          />
          
          {/* 助手消息操作按钮 - 添加-ml-2来抵消可能的内边距，确保与消息内容左侧对齐 */}
          <AssistantMessageActions
            messageId={id}
            onCopy={() => console.log('Copy assistant message', id)}
            onRegenerate={() => console.log('Regenerate message', id)}
            onFeedback={(isPositive) => console.log('Feedback', isPositive ? 'positive' : 'negative', id)}
            isRegenerating={isStreaming}
            className="-ml-2"
          />
        </div>
      )}
    </div>
  );
};
