"use client";

import React from "react";
import { cn } from "@lib/utils";
import { CodeIcon } from "lucide-react";
import { FiCopy, FiCheck } from "react-icons/fi";
import { TooltipWrapper } from "@components/ui/tooltip-wrapper";

interface CodeBlockHeaderProps {
  language: string | null;
  className?: string;
  codeContent?: string; // 添加代码内容属性用于复制功能
}

// 使用 React.memo 包装组件，防止不必要的重新渲染
// 使用随机ID生成器确保每个复制按钮的tooltip是唯一的
const generateUniqueId = () => `copy-code-${Math.random().toString(36).substring(2, 11)}`;

// 使用 React.memo 包装组件，防止不必要的重新渲染
export const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = React.memo(({
  language,
  className,
  codeContent,
}) => {
  // 复制功能状态 - 使用状态管理复制按钮的UI，这不会影响代码高亮
  const [isCopied, setIsCopied] = React.useState(false);
  
  // 为每个复制按钮生成唯一的tooltip ID
  const tooltipId = React.useRef(generateUniqueId()).current;
  
  // 处理复制操作
  const handleCopy = React.useCallback(async () => {
    if (!codeContent) return;
    
    try {
      await navigator.clipboard.writeText(codeContent);
      setIsCopied(true);
      
      // 2秒后重置状态
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [codeContent]);
  
  // 注意：这个组件只处理头部UI和复制功能，不影响代码高亮

  if (!language) {
    return null; // Don't render header if language is not specified
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-1 rounded-t-lg transform-gpu border-b", // 降低头部高度
        className
      )}
      style={{
        backgroundColor: 'var(--md-code-header-bg)',
        borderColor: 'var(--md-code-header-border)',
        color: 'var(--md-code-header-text)'
      }}
    >
      <div className="flex items-center gap-1.5">
        <CodeIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium select-none tracking-wide">
          {language.charAt(0).toUpperCase() + language.slice(1)}
        </span>
      </div>
      
      {/* 复制按钮 - 使用与消息操作按钮相同的样式 */}
      {codeContent && (
        <TooltipWrapper
          content={isCopied ? "已复制" : "复制代码"}
          id={tooltipId}
          placement="bottom"
          desktopOnly={true}
        >
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center justify-center p-1.5 rounded-md transition-all",
              "text-gray-500 dark:text-gray-400", 
              "hover:text-gray-700 dark:hover:text-gray-200",
              "hover:bg-gray-200/50 dark:hover:bg-gray-700/50",
              "focus:outline-none"
            )}
            aria-label={isCopied ? "已复制" : "复制代码"}
          >
            {isCopied ? (
              <FiCheck className="w-4 h-4" />
            ) : (
              <FiCopy className="w-4 h-4" />
            )}
          </button>
        </TooltipWrapper>
      )}
    </div>
  );
});
