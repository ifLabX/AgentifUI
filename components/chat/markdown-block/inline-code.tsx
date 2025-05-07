"use client";

import React from "react";
import { cn } from "@lib/utils";
import { useTheme } from "@lib/hooks";

interface InlineCodeProps {
  children: React.ReactNode;
  className?: string;
}

export const InlineCode: React.FC<InlineCodeProps> = ({
  children,
  className,
}) => {
  const { isDark } = useTheme();

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
          ? "bg-gray-700 text-pink-400 border border-gray-600/50" // Adjusted colors for modern look
          : "bg-gray-200 text-pink-600 border border-gray-300/70",
        className
      )}
    >
      {children}
    </code>
  );
};
