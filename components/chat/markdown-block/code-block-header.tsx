"use client";

import React from "react";
import { cn } from "@lib/utils";
import { useTheme } from "@lib/hooks";
import { CodeIcon } from "lucide-react"; // Or a more specific language icon library

interface CodeBlockHeaderProps {
  language: string | null;
  className?: string;
}

export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = ({
  language,
  className,
}) => {
  const { isDark } = useTheme();

  if (!language) {
    return null; // Don't render header if language is not specified
  }

  // --- BEGIN COMMENT ---
  // 现代化代码块头部样式：
  // - 左侧显示语言名称，使用圆角和柔和的背景色。
  // - 整体头部有上下边框，与代码块内容区分。
  // - 响应式设计，确保在小屏幕上也能良好显示。
  // - 暗黑模式兼容。
  // --- END COMMENT ---
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1.5 rounded-t-lg",
        "border-b",
        isDark
          ? "bg-gray-800 border-gray-700 text-gray-400"
          : "bg-gray-100 border-gray-300 text-gray-600",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <CodeIcon className="w-4 h-4" />
        <span className="text-xs font-medium select-none">
          {language.charAt(0).toUpperCase() + language.slice(1)}
        </span>
      </div>
      {/* Future: Add copy button or other controls here */}
    </div>
  );
};
