"use client";

import React from "react";
import { cn } from "@lib/utils";
// 使用 CSS 变量而不是 React 状态或 Tailwind 类

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

// 使用 React.memo 包装组件，防止不必要的重新渲染
export const InlineCode: React.FC<InlineCodeProps> = React.memo(({
  children,
  className,
}) => {
  // 不使用任何 React 状态，完全依赖 CSS 变量

  // --- BEGIN COMMENT ---
  // 现代化内联代码样式：
  // - 使用等宽字体 (font-mono)。
  // - 调整 padding、圆角、背景色和文字颜色，确保对比度和美观。
  // - 响应式设计，确保在不同屏幕尺寸和主题下均表现良好。
  // --- END COMMENT ---
  return (
    <code
      className={cn(
        "font-mono text-sm px-1.5 py-0.5 rounded-md mx-0.5 align-baseline transform-gpu border",
        className
      )}
      style={{
        backgroundColor: 'var(--md-inline-code-bg)',
        borderColor: 'var(--md-inline-code-border)',
        color: 'var(--md-inline-code-text)'
      }}
    >
      {children}
    </code>
  );
});
