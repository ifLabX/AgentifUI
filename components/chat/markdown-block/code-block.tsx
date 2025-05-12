"use client";

import React from "react";
import { cn } from "@lib/utils";
import { CodeBlockHeader } from "./code-block-header";
import Prism from "prismjs";
// 导入基础Prism样式 - 实际样式将使用我们的CSS变量
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
// 不再需要useTheme，因为我们使用CSS变量处理主题

interface CodeBlockProps {
  language: string | null;
  children: React.ReactNode;
  className?: string; // This className comes from react-markdown, e.g., "language-python"
  codeClassName?: string; // Additional class for the inner <code> element
  isStreaming?: boolean; // 新增：标记是否正在流式输出
}

// 使用 React.memo 包装组件，防止不必要的重新渲染
export const CodeBlock: React.FC<CodeBlockProps> = React.memo(({
  language,
  children,
  className, // from react-markdown
  codeClassName, // for inner code tag
  isStreaming = false, // 默认为非流式，即代码已完整
}) => {
  // 提取代码内容以便复制和高亮
  const codeContent = React.useMemo(() => {
    // 如果 children 是字符串，直接返回
    if (typeof children === 'string') {
      return children;
    }
    
    // 如果 children 是 React 元素，尝试提取文本内容
    if (React.isValidElement(children)) {
      const props = children.props as any;
      if (props?.children && typeof props.children === 'string') {
        return props.children;
      }
    }
    
    // 如果是数组，尝试将所有子元素连接成字符串
    if (Array.isArray(children)) {
      return children
        .map(child => {
          if (typeof child === 'string') return child;
          if (React.isValidElement(child)) {
            const props = child.props as any;
            if (props?.children && typeof props.children === 'string') {
              return props.children;
            }
          }
          return '';
        })
        .join('');
    }
    
    return '';
  }, [children]);
  
  // 解析语言名称，如 "language-python" 变为 "python"
  const parsedLanguage = React.useMemo(() => {
    if (!language) return 'text';
    if (language.startsWith('language-')) {
      return language.replace('language-', '');
    }
    return language;
  }, [language]);

  const codeRef = React.useRef<HTMLElement>(null);

  // --- BEGIN COMMENT ---
  // 使用 useEffect 在组件挂载后或内容/状态变化后应用 Prism 高亮
  // --- END COMMENT ---
  React.useEffect(() => {
    // --- BEGIN COMMENT ---
    // 调试日志：打印 useEffect 触发时的状态 (已注释)
    // --- END COMMENT ---
    /*
    console.log(
      '[CodeBlock Effect]', 
      { 
        isStreaming, 
        codeContentExists: !!codeContent, 
        refExists: !!codeRef.current,
        language: parsedLanguage, 
        firstChars: codeContent?.slice(0,30) 
      }
    );
    */

    // --- BEGIN COMMENT ---
    // 确保 Prism 已加载，代码内容存在，ref 已附加，并且当前不处于流式输出状态
    // --- END COMMENT ---
    if (!isStreaming && Prism && codeContent && codeRef.current) {
      // --- BEGIN COMMENT ---
      // 调试日志：准备执行高亮 (已注释)
      // --- END COMMENT ---
      /*
      console.log('[CodeBlock Highlighting]', parsedLanguage, codeContent?.slice(0, 50));
      */
      Prism.highlightElement(codeRef.current);
    }
    // --- BEGIN COMMENT ---
    // 依赖项：当代码内容、语言或流式状态变化时，重新评估高亮逻辑
    // 当 isStreaming 从 true 变为 false 时，此 effect 会执行，并进行高亮
    // --- END COMMENT ---
  }, [codeContent, parsedLanguage, isStreaming]);
  
  // --- BEGIN COMMENT ---
  // Prism.highlightElement 会直接修改DOM，
  // 所以我们不再需要 dangerouslySetInnerHTML 和 getHighlightedCode。
  // 我们将直接把 codeContent 放入 <code> 标签，Prism.highlightElement 会读取它并修改。
  // --- END COMMENT ---
  
  return (
    <div
      className="my-3 rounded-lg shadow-sm border transform-gpu"
      style={{
        backgroundColor: 'var(--md-code-bg)',
        borderColor: 'var(--md-code-border)'
      }}
    >
      <CodeBlockHeader language={parsedLanguage} codeContent={codeContent} />
      <div className="overflow-hidden rounded-b-lg">
        <pre 
          className={cn("font-mono text-sm p-4 overflow-x-auto", className)}
          style={{
            backgroundColor: 'var(--md-code-bg)'
          }}
        >
          <code
            ref={codeRef} // 附加 ref
            className={cn(`language-${parsedLanguage}`, codeClassName)}
            style={{ display: 'block' }} // 确保代码块是块级元素
          >
            {codeContent} {/* 直接渲染代码内容，Prism.highlightElement 会处理它 */}
          </code>
        </pre>
      </div>
    </div>
  );
});
