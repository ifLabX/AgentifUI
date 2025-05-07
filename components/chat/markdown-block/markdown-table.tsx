"use client";

import React from "react";
import { cn } from "@lib/utils";
import { useTheme } from "@lib/hooks";

interface MarkdownTableProps {
  children: React.ReactNode;
  className?: string;
}

export const MarkdownTableContainer: React.FC<MarkdownTableProps> = ({
  children,
  className,
}) => {
  const { isDark } = useTheme();

  // --- BEGIN COMMENT ---
  // 现代化表格容器样式：
  // - 外部 div 负责滚动条、圆角、边框和阴影。
  // - 内部 table 使用 border-collapse。
  // - 响应式设计，确保在不同屏幕尺寸和主题下均表现良好。
  // - 暗黑模式兼容。
  // --- END COMMENT ---
  return (
    <div
      className={cn(
        "my-4 overflow-x-auto rounded-lg shadow-sm", // Added shadow
        "border",
        isDark ? "border-gray-700/60" : "border-gray-300/80",
        className
      )}
    >
      <table
        className={cn(
          "min-w-full border-collapse w-full", // w-full to ensure it tries to fill container
          isDark ? "divide-gray-700" : "divide-gray-200" // For potential internal dividers if not using cell borders
        )}
      >
        {children}
      </table>
    </div>
  );
};

// --- BEGIN COMMENT ---
// 表头单元格 (th) 和数据单元格 (td) 的样式将直接在 AssistantMessage 中定义，
// 因为它们通常与 react-markdown 的 props 结构紧密耦合。
// 如果未来样式变得非常复杂，可以考虑将它们也拆分为单独组件。
// 此处 MarkdownTableContainer 主要负责表格的外部包裹和基础 <table> 样式。
// --- END COMMENT ---
