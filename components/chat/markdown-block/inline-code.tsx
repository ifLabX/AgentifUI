"use client";

import React from "react";
import { cn } from "@lib/utils";
import { useTheme } from "@lib/hooks";
import { useThemeColors } from "@lib/hooks/use-theme-colors";

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

// 使用 React.memo 包装组件，防止不必要的重新渲染
export const InlineCode: React.FC<InlineCodeProps> = React.memo(({
  children,
  className,
}) => {
  const { isDark } = useTheme();
  const { colors } = useThemeColors();

  // --- BEGIN COMMENT ---
  // 现代化内联代码样式：
  // - 使用等宽字体 (font-mono)。
  // - 调整 padding、圆角、背景色和文字颜色，确保对比度和美观。
  // - 响应式设计，确保在不同屏幕尺寸和主题下均表现良好。
  // --- END COMMENT ---
  return (
    <code
      className={cn(
        "font-mono text-sm px-1.5 py-0.5 rounded-md mx-0.5 align-baseline", // align-baseline for better flow with text
        isDark
          ? "bg-stone-700 text-pink-300 border border-stone-600/50" // 使用stone色系与pink色系的组合
          : "bg-stone-200 text-pink-600 border border-stone-300/70",
        className
      )}
    >
      {children}
    </code>
  );
});
