"use client";

import React from "react";
import { cn } from "@lib/utils";
// --- BEGIN MODIFIED COMMENT ---
// 移除了 useThemeColors 的导入，改用 CSS 变量
// --- END MODIFIED COMMENT ---
// import { useThemeColors } from "@lib/hooks/use-theme-colors";

interface MarkdownTableProps {
  children: React.ReactNode;
  className?: string;
}

export const MarkdownTableContainer: React.FC<MarkdownTableProps> = ({
  children,
  className,
}) => {
  // --- BEGIN MODIFIED COMMENT ---
  // 移除了 useThemeColors hook 的使用
  // --- END MODIFIED COMMENT ---
  // const { colors } = useThemeColors();

  return (
    <div
      className={cn(
        "my-4 overflow-x-auto",
        "w-fit max-w-full", // 使容器宽度适应内容，但不超过可用空间
        className
      )}
    >
      <table
        className={cn(
          "border-collapse",
          "rounded-lg overflow-hidden" // 圆角和溢出隐藏
          // --- BEGIN MODIFIED COMMENT ---
          // 移除了 colors.userMessageBackground.tailwind (背景将透明化，由父级决定)
          // 移除了 divide-y 和相关的颜色类 (内部边框由子元素处理)
          // 移除了 border 和相关的颜色类 (外部边框通过 style 应用 CSS 变量)
          // --- END MODIFIED COMMENT ---
        )}
        style={{
          // --- BEGIN MODIFIED COMMENT ---
          // 使用 CSS 变量设置表格边框
          // --- END MODIFIED COMMENT ---
          border: '1px solid var(--md-table-border)'
        }}
      >
        {children}
      </table>
    </div>
  );
};
