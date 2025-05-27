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
// 
// 文本样式系统说明：
// 本组件使用了专门的CSS类系统来控制助手消息的文本显示效果：
// 
// 1. 行间距控制层级：
//    - 基础行间距: 1.35 (紧凑，用于列表等)
//    - 段落行间距: 1.9 (宽松，提高可读性)
//    - 标题行间距: 1.25 (最紧凑，突出层次)
// 
// 2. 段落间距控制：
//    - 当前设置: 0.1em (很小的分隔间距)
//    - 可在 styles/markdown.css 的 .assistant-message-content p 中调整
// 
// 3. 样式文件位置：
//    - 主要样式: styles/markdown.css (第277-340行)
//    - 样式类名: .assistant-message-content
// 
// 如需调整文本密度或间距，请修改对应的CSS文件而非此组件。
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
import { AssistantMessageActions } from '@components/chat/message-actions';
import { StreamingMarkdown } from './streaming-markdown';

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

// --- BEGIN MODIFIED ---
// 使用 React.memo 包裹 AssistantMessage 以优化渲染性能
// 只有当 props 实际发生变化时，组件才会重新渲染
// --- END MODIFIED ---
export const AssistantMessage: React.FC<AssistantMessageProps> = React.memo(({ 
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
        // --- BEGIN MODIFIED ---
        // 将 AssistantMessage 的 isStreaming prop 传递给 CodeBlock
        // --- END MODIFIED ---
        return (
          <CodeBlock 
            language={language} 
            className={className} 
            isStreaming={isStreaming} // <<< 添加此行
            {...props}
          >
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
      // 段落元素的渲染配置
      // my-0: 移除 Tailwind 默认的段落边距，防止与 assistant-message-content 样式冲突
      // 实际的段落间距和行间距由 styles/markdown.css 中的 .assistant-message-content p 样式控制
      // 这样做可以确保样式的一致性和可维护性
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
        // 助手消息主内容区域样式配置
        // 
        // 🎯 新增流式渲染支持：
        // - 使用StreamingMarkdown组件实现丝滑的打字机效果
        // - 保持原有的Markdown渲染能力和样式
        // - 根据isStreaming状态自动切换渲染模式
        // --- END MODIFIED COMMENT ---
        <div className={cn(
          "w-full markdown-body main-content-area assistant-message-content text-base",
          isDark ? "text-gray-200" : "text-gray-800", // 根据主题切换文本颜色
          !hasThinkBlock ? "py-2" : "pt-1 pb-2" // 根据是否有思考块调整垂直间距
        )}>
          {isStreaming ? (
            // 🎯 流式状态：使用StreamingMarkdown组件
            <StreamingMarkdown
              content={mainContent}
              isStreaming={isStreaming}
              isComplete={wasManuallyStopped}
              typewriterSpeed={60} // 可调整打字速度
            />
          ) : (
            // 🎯 非流式状态：使用原有的ReactMarkdown
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={mainMarkdownComponents} 
              children={mainContent}
            />
          )}
          
          {/* 助手消息操作按钮 - 添加-ml-2来确保左对齐，添加-mt-4来减少与消息内容的间距 */}
          <AssistantMessageActions
            messageId={id}
            content={content} // 使用原始文本而不是处理后的mainContent
            onRegenerate={() => console.log('Regenerate message', id)}
            onFeedback={(isPositive) => console.log('Feedback', isPositive ? 'positive' : 'negative', id)} //后续修改反馈功能
            isRegenerating={isStreaming}
            className="-ml-2 -mt-4"
          />
        </div>
      )}
    </div>
  );
});
// --- BEGIN MODIFIED ---
// 添加 displayName 属性，方便 React DevTools 调试
// --- END MODIFIED ---
AssistantMessage.displayName = "AssistantMessage";
