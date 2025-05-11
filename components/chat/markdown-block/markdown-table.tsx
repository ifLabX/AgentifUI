"use client";

import React from "react";
import { cn } from "@lib/utils";
import { useThemeColors } from "@lib/hooks/use-theme-colors";

interface MarkdownTableProps {
  children: React.ReactNode;
  className?: string;
}

export const MarkdownTableContainer: React.FC<MarkdownTableProps> = ({
  children,
  className,
}) => {
  const { colors } = useThemeColors();

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
          "rounded-lg overflow-hidden", // 圆角和溢出隐藏
          colors.userMessageBackground.tailwind, // 使用主题背景色
          "divide-y",
          "border",
          "dark:divide-stone-700/30 divide-stone-200/50", // 分隔线颜色
          "dark:border-stone-700/30 border-stone-200/50" // 边框颜色
        )}
      >
        {children}
      </table>
    </div>
  );
};
