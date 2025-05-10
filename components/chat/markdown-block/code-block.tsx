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
}

// 使用 React.memo 包装组件，防止不必要的重新渲染
export const CodeBlock: React.FC<CodeBlockProps> = React.memo(({
  language,
  children,
  className, // from react-markdown
  codeClassName, // for inner code tag
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

  // 使用 useEffect 在组件挂载后应用 Prism 高亮
  React.useEffect(() => {
    // 确保 Prism 已加载并且代码内容存在
    if (Prism && codeContent) {
      // 延迟执行以确保 DOM 已更新
      setTimeout(() => {
        Prism.highlightAll();
      }, 0);
    }
  }, [codeContent, parsedLanguage]);
  
  // 生成高亮的 HTML
  const getHighlightedCode = () => {
    try {
      // 尝试使用指定的语言进行高亮
      const grammar = Prism.languages[parsedLanguage] || Prism.languages.text;
      return Prism.highlight(codeContent, grammar, parsedLanguage);
    } catch (error) {
      console.error('Prism highlighting error:', error);
      // 如果高亮失败，返回未处理的代码
      return codeContent;
    }
  };
  
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
            className={cn(`language-${parsedLanguage}`, codeClassName)}
            dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}
            style={{ display: 'block' }} // 确保代码块是块级元素
          />
        </pre>
      </div>
    </div>
  );
});
