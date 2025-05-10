"use client";

import React from "react";
import { cn } from "@lib/utils";
import { useTheme } from "@lib/hooks";
import { useThemeColors } from "@lib/hooks/use-theme-colors";
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
  const { isDark } = useTheme();
  const { colors } = useThemeColors();

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
      className={cn(
        "my-3 rounded-lg shadow-sm", // Added shadow for depth
        isDark ? "bg-stone-900" : "bg-stone-50", // Container background
        "border",
        isDark ? "border-stone-700/50" : "border-stone-300/70"
      )}
      style={{ backgroundColor: isDark ? "rgb(28, 25, 23)" : "rgb(250, 250, 249)" }} // 固定背景色，防止闪烁
    >
      <CodeBlockHeader language={language} />
      <pre
        className={cn(
          "font-mono text-sm p-4 overflow-x-auto",
          "rounded-b-lg", // Rounded bottom corners as header has top
          isDark
            ? colors.mainText.tailwind // 使用主题定义的文本颜色
            : "text-stone-800",
          // className from react-markdown might contain language-xxx, which is fine for <pre> too
          // but we primarily use it for the inner <code> for syntax highlighting.
          // Here, we ensure the <pre> itself doesn't get conflicting background from language-xxx if themes apply it.
          isDark ? "bg-stone-800/50" : "bg-stone-100/50" 
        )}
      >
        <code className={cn(className, codeClassName)}>{children}</code>
      </pre>
    </div>
  );
});
