"use client";

import React from "react";
import { cn } from "@lib/utils";
// 使用 CSS 变量而不是 React 状态或 Tailwind 类

interface MarkdownBlockquoteProps {
  children: React.ReactNode;
  className?: string;
}

export const MarkdownBlockquote: React.FC<MarkdownBlockquoteProps> = ({
  children,
  className,
}) => {
  // 不使用任何 React 状态，完全依赖 CSS 变量

  // --- BEGIN COMMENT ---
  // 现代化引用块样式：
  // - 调整 padding、margin、左边框和圆角。
  // - 使用柔和的背景色和清晰的文字颜色，确保对比度和美观。
  // - 响应式设计，确保在不同屏幕尺寸和主题下均表现良好。
  // - 暗黑模式兼容。
  // --- END COMMENT ---
  return (
    <blockquote
      className={cn(
        "pl-4 pr-3 py-2 my-3 border-l-4 rounded-r-md shadow-sm leading-relaxed", // Added shadow and adjusted padding/margin
        className
      )}
      style={{
        borderLeftColor: 'var(--md-blockquote-border)',
        backgroundColor: 'var(--md-blockquote-bg)',
        color: 'var(--md-blockquote-text)'
      }}
    >
      {children}
    </blockquote>
  );
};
