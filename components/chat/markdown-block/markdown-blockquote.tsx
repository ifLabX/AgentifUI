"use client";

import React from "react";
import { cn } from "@lib/utils";
import { useTheme } from "@lib/hooks";
import { useThemeColors } from "@lib/hooks/use-theme-colors";

interface MarkdownBlockquoteProps {
  children: React.ReactNode;
  className?: string;
}

export const MarkdownBlockquote: React.FC<MarkdownBlockquoteProps> = ({
  children,
  className,
}) => {
  const { isDark } = useTheme();
  const { colors } = useThemeColors();

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
        "pl-4 pr-3 py-2 my-3 border-l-4 rounded-r-md shadow-sm", // Added shadow and adjusted padding/margin
        isDark
          ? "border-amber-600 bg-stone-800/80 text-amber-200" // 暗色模式使用玄色背景和琥珀色边框
          : "border-amber-400 bg-stone-100/80 text-amber-700", // 亮色模式使用浅玄色背景和琥珀色边框
        "leading-relaxed", // Ensure good line height within blockquote
        className
      )}
    >
      {children}
    </blockquote>
  );
};
