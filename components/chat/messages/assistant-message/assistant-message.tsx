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
// 导入引用资源组件
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
import { StreamingText } from './streaming-markdown';
import { ReferenceSources } from '@components/chat/reference-sources';

const extractThinkContent = (rawContent: string): {
  hasThinkBlock: boolean;
  thinkContent: string;
  mainContent: string;
  thinkClosed: boolean;
} => {
  // --- BEGIN COMMENT ---
  // 🔍 调试：检查details标签的位置和格式
  // --- END COMMENT ---
  if (rawContent.includes('<details')) {
    console.log('[AssistantMessage] 检测到details标签:', {
      content: rawContent.substring(0, 200) + '...',
      startsWithDetails: rawContent.indexOf('<details') === 0,
      detailsPosition: rawContent.indexOf('<details'),
      firstLine: rawContent.split('\n')[0]
    });
  }
  
  // --- BEGIN COMMENT ---
  // 支持两种标签：<think> 和 <details>
  // 优先检查 <think> 标签，如果没有则检查 <details> 标签
  // --- END COMMENT ---
  
  // 检查 <think> 标签
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
  
  // 检查 <details> 标签
  const detailsStartRegex = /<details(?:\s[^>]*)?>/i;
  const detailsMatch = rawContent.match(detailsStartRegex);
  
  if (detailsMatch && rawContent.indexOf(detailsMatch[0]) === 0) {
    const detailsStartTag = detailsMatch[0];
    const detailsEndTag = '</details>';
    const endTagIndex = rawContent.indexOf(detailsEndTag);
    
    if (endTagIndex !== -1) {
      // 提取details内容，移除summary部分
      let detailsContent = rawContent.substring(detailsStartTag.length, endTagIndex);
      
      // 移除 <summary>...</summary> 部分，只保留实际内容
      const summaryRegex = /<summary[^>]*>[\s\S]*?<\/summary>/i;
      detailsContent = detailsContent.replace(summaryRegex, '').trim();
      
      const mainContent = rawContent.substring(endTagIndex + detailsEndTag.length);
      return { hasThinkBlock: true, thinkContent: detailsContent, mainContent, thinkClosed: true };
    }
    
    // 未闭合的details标签
    let detailsContent = rawContent.substring(detailsStartTag.length);
    
    // 移除 <summary>...</summary> 部分（如果存在）
    const summaryRegex = /<summary[^>]*>[\s\S]*?<\/summary>/i;
    detailsContent = detailsContent.replace(summaryRegex, '').trim();
    
    return { hasThinkBlock: true, thinkContent: detailsContent, mainContent: '', thinkClosed: false };
  }
  
  return { hasThinkBlock: false, thinkContent: '', mainContent: rawContent, thinkClosed: false };
};

// --- 提取纯净的主要内容用于复制功能 ---
const extractMainContentForCopy = (rawContent: string): string => {
  // --- BEGIN COMMENT ---
  // 检查是否有未闭合的关键标签（think 和 details 都由 Think Block 处理）
  // --- END COMMENT ---
  const openThinkCount = (rawContent.match(/<think(?:\s[^>]*)?>/gi) || []).length;
  const closeThinkCount = (rawContent.match(/<\/think>/gi) || []).length;
  const openDetailsCount = (rawContent.match(/<details(?:\s[^>]*)?>/gi) || []).length;
  const closeDetailsCount = (rawContent.match(/<\/details>/gi) || []).length;
  
  // 如果有未闭合的标签，说明内容还在生成中，返回空字符串
  if (openThinkCount > closeThinkCount || openDetailsCount > closeDetailsCount) {
    return '';
  }
  
  let cleanContent = rawContent;
  
  // 移除所有 <think>...</think> 块
  const thinkRegex = /<think(?:\s[^>]*)?>[\s\S]*?<\/think>/gi;
  cleanContent = cleanContent.replace(thinkRegex, '');
  
  // 移除所有 <details>...</details> 块（现在由 Think Block 处理）
  const detailsRegex = /<details(?:\s[^>]*)?>[\s\S]*?<\/details>/gi;
  cleanContent = cleanContent.replace(detailsRegex, '');
  
  // 清理多余的空白字符
  return cleanContent.replace(/\n\s*\n/g, '\n').trim();
};

interface AssistantMessageProps {
  id: string;
  content: string
  isStreaming: boolean
  wasManuallyStopped: boolean
  metadata?: Record<string, any> // 🎯 新增：接收消息的metadata
  className?: string
}

// --- BEGIN MODIFIED COMMENT ---
// 使用 React.memo 包裹 AssistantMessage 以优化渲染性能
// 只有当 props 实际发生变化时，组件才会重新渲染
// --- END MODIFIED COMMENT ---
export const AssistantMessage: React.FC<AssistantMessageProps> = React.memo(({ 
  id,
  content, 
  isStreaming,
  wasManuallyStopped, 
  metadata,
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

  // --- BEGIN COMMENT ---
  // 预处理主内容，转义自定义HTML标签以避免浏览器解析错误
  // 与Think Block Content使用相同的处理逻辑
  // --- END COMMENT ---
  const preprocessMainContent = (content: string): string => {
    // 定义已知的安全HTML标签白名单
    const knownHtmlTags = new Set([
      'div', 'span', 'p', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 's',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'sub', 'sup',
      'mark', 'del', 'ins',
      'details', 'summary'
    ]);

    // 转义不在白名单中的HTML标签，让它们显示为文本
    return content.replace(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
      if (!knownHtmlTags.has(tagName.toLowerCase())) {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return match;
    }).replace(/<\/([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
      if (!knownHtmlTags.has(tagName.toLowerCase())) {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return match;
    });
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
    a({ children, href, node, ...props }: any) {
      // --- BEGIN COMMENT ---
      // 检查链接是否包含图片：如果包含图片，将其渲染为图片链接样式
      // 避免嵌套 <a> 标签导致的 HTML 错误
      // --- END COMMENT ---
      const hasImageChild = node?.children?.some((child: any) => child.tagName === 'img');
      
      if (hasImageChild) {
        // 如果链接包含图片，使用特殊的图片链接样式
        const imageChild = node.children.find((child: any) => child.tagName === 'img');
        const alt = imageChild?.properties?.alt || '图片链接';
        
        return (
          <a 
            href={href}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded border text-sm no-underline",
              isDark 
                ? "border-gray-600 bg-gray-800 text-sky-400 hover:text-sky-300 hover:border-gray-500" 
                : "border-gray-300 bg-gray-50 text-sky-600 hover:text-sky-700 hover:border-gray-400"
            )}
            target="_blank" 
            rel="noopener noreferrer"
            title={`点击查看: ${alt}`}
            {...props}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {alt}
          </a>
        );
      }
      
      // 普通链接的处理
      return <a href={href} className={cn("underline", isDark ? "text-sky-400 hover:text-sky-300" : "text-sky-600 hover:text-sky-700")} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
    },
    hr({ ...props }) {
      return <hr className={cn("my-4 border-t", isDark ? "border-gray-700" : "border-gray-300")} {...props} />;
    },
    // --- BEGIN COMMENT ---
    // 图片处理：将图片渲染为链接形式，避免加载抖动问题
    // 如果图片在链接内，由 a 组件统一处理，这里返回 null 避免重复渲染
    // --- END COMMENT ---
    img({ src, alt, node, ...props }: any) {
      // 确保src是字符串类型
      const imageUrl = typeof src === 'string' ? src : '';
      
      // 检查是否在链接内部（由父级 a 组件处理）
      const isInsideLink = node?.parent?.tagName === 'a';
      
      if (isInsideLink) {
        // 如果在链接内，返回 null，由父级 a 组件处理
        return null;
      }
      
      // 独立的图片，创建图片链接
      return (
        <a 
          href={imageUrl} 
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded border text-sm",
            isDark 
              ? "border-gray-600 bg-gray-800 text-sky-400 hover:text-sky-300 hover:border-gray-500" 
              : "border-gray-300 bg-gray-50 text-sky-600 hover:text-sky-700 hover:border-gray-400"
          )}
          target="_blank" 
          rel="noopener noreferrer"
          title={alt || "查看图片"}
          {...props}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {alt || "图片链接"}
        </a>
      );
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
          <StreamingText
            content={thinkContent}
            isStreaming={isStreaming && !thinkClosed}
            isComplete={thinkClosed || !isStreaming}
            typewriterSpeed={200}
          >
            {(displayedThinkContent) => (
              <ThinkBlockContent 
                markdownContent={displayedThinkContent}
                isOpen={isOpen}
              />
            )}
          </StreamingText>
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
          <StreamingText
            content={preprocessMainContent(mainContent)}
            isStreaming={isStreaming}
            isComplete={!isStreaming}
            typewriterSpeed={150}
          >
            {(displayedContent) => (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={mainMarkdownComponents}
              >
                {displayedContent}
              </ReactMarkdown>
            )}
          </StreamingText>
          
          {/* --- 引用和归属组件 --- */}
          <ReferenceSources 
            retrieverResources={metadata?.dify_retriever_resources || metadata?.dify_metadata?.retriever_resources}
            isDark={isDark}
            className="mt-4 mb-2"
            animationDelay={isStreaming ? 0 : 300} // 流式响应结束后延迟300ms显示
          />
          
          {/* 助手消息操作按钮 - 添加-ml-2来确保左对齐，调整间距 */}
          <AssistantMessageActions
            messageId={id}
            content={extractMainContentForCopy(content) || undefined}
            onRegenerate={() => console.log('Regenerate message', id)}
            onFeedback={(isPositive) => console.log('Feedback', isPositive ? 'positive' : 'negative', id)} //后续修改反馈功能
            isRegenerating={isStreaming}
            className={cn(
              "-ml-2",
              // 🎯 根据是否有引用调整按钮的上边距
              (metadata?.dify_retriever_resources || metadata?.dify_metadata?.retriever_resources)?.length > 0 
                ? "mt-0" // 有引用时使用正常间距
                : "-mt-4" // 无引用时保持原有的负间距
            )}
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
