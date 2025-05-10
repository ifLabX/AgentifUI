"use client";

import React from "react";
import { cn } from "@lib/utils";
// 使用 CSS 变量而不是 React 状态或 Tailwind 类
import { CodeBlockHeader } from "./code-block-header"; // Assuming it's in the same directory

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
  // 不使用任何 React 状态，完全依赖 CSS 变量

  // --- BEGIN COMMENT ---
  // 现代化代码块样式：
  // - 包含 CodeBlockHeader 显示语言。
  // - <pre> 标签负责整体容器样式，包括背景、边框、圆角、内边距和水平滚动。
  // - 内部 <code> 标签负责代码文本本身的样式。
  // - 响应式设计，确保在不同屏幕尺寸和主题下均表现良好。
  // - 暗黑模式兼容。
  // --- END COMMENT ---
  return (
    <div
      className="my-3 rounded-lg shadow-sm border transform-gpu"
      style={{
        backgroundColor: 'var(--md-code-bg)',
        borderColor: 'var(--md-code-border)'
      }}
    >
      <CodeBlockHeader language={language} />
      <pre
        className="font-mono text-sm p-4 overflow-x-auto rounded-b-lg"
        style={{
          backgroundColor: 'var(--md-code-bg)',
          color: 'var(--md-code-text)'
        }}
      >
        <code className={cn(className, codeClassName)}>{children}</code>
      </pre>
    </div>
  );
});
