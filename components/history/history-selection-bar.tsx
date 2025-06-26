"use client"

import * as React from "react"
import { Check, Trash2, X, Square, CheckSquare } from "lucide-react"
import { cn } from "@lib/utils"
import { useTheme } from "@lib/hooks/use-theme"

// --- BEGIN COMMENT ---
// 历史对话选择操作栏组件
// 提供全选、取消选择和批量删除功能
// --- END COMMENT ---
interface HistorySelectionBarProps {
  isSelectionMode: boolean
  selectedCount: number
  totalCount: number
  onToggleSelectionMode: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onBatchDelete: () => void
  onCancelSelection: () => void
  isDeleting?: boolean
}

export function HistorySelectionBar({
  isSelectionMode,
  selectedCount,
  totalCount,
  onToggleSelectionMode,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
  onCancelSelection,
  isDeleting = false
}: HistorySelectionBarProps) {
  const { isDark } = useTheme()
  
  // --- BEGIN COMMENT ---
  // 如果不在选择模式且没有选中项，则不显示操作栏
  // --- END COMMENT ---
  if (!isSelectionMode && selectedCount === 0) {
    return null
  }
  
  const allSelected = selectedCount === totalCount && totalCount > 0
  const hasSelection = selectedCount > 0
  
  return (
    <div className={cn(
      "sticky top-0 z-10 transition-all duration-300 ease-in-out",
      "rounded-xl mx-4 mb-4 backdrop-blur-sm",
      "bg-gradient-to-r",
      isDark 
        ? "from-stone-800/95 via-stone-800/90 to-stone-800/95 border border-stone-600/50 shadow-lg shadow-stone-900/20" 
        : "from-stone-50/95 via-white/90 to-stone-50/95 border border-stone-200/80 shadow-lg shadow-stone-900/10"
    )}>
      <div className="px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* --- 左侧：选择状态和全选按钮 --- */}
          <div className="flex items-center space-x-4">
            {/* 全选/取消全选按钮 */}
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-md",
                "transition-all duration-200 ease-in-out",
                "text-sm font-medium font-serif",
                "hover:shadow-md hover:scale-105",
                isDark
                  ? "hover:bg-stone-700 text-stone-300 border border-stone-600"
                  : "hover:bg-stone-200 text-stone-600 border border-stone-300"
              )}
              disabled={totalCount === 0}
            >
              {allSelected ? (
                <CheckSquare className="h-3.5 w-3.5" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              <span>
                {allSelected ? "取消全选" : "全选"}
              </span>
            </button>
            
            {/* 选择状态显示 */}
            {hasSelection && (
              <div className={cn(
                "text-xs font-serif",
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                已选择 <span className="font-medium">{selectedCount}</span> / {totalCount} 个对话
              </div>
            )}
          </div>
          
          {/* --- 右侧：操作按钮 --- */}
          <div className="flex items-center space-x-2">
            {/* 批量删除按钮 */}
            {hasSelection && (
              <button
                onClick={onBatchDelete}
                disabled={isDeleting}
                className={cn(
                  "flex items-center space-x-2 px-3 py-1.5 rounded-md",
                  "transition-all duration-200 ease-in-out",
                  "text-sm font-medium font-serif",
                  "hover:shadow-lg hover:scale-105",
                  isDeleting && "opacity-50 cursor-not-allowed",
                  isDark
                    ? "bg-red-900/40 hover:bg-red-900/60 text-red-300 border border-red-800 shadow-md shadow-red-900/20"
                    : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 shadow-md shadow-red-900/10"
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>
                  {isDeleting ? "删除中..." : `删除 (${selectedCount})`}
                </span>
              </button>
            )}
            
            {/* 取消选择按钮 */}
            <button
              onClick={onCancelSelection}
              className={cn(
                "flex items-center space-x-1 px-3 py-1.5 rounded-md",
                "transition-all duration-200 ease-in-out",
                "text-sm font-medium font-serif",
                "hover:shadow-md hover:scale-105",
                isDark
                  ? "hover:bg-stone-700 text-stone-400 border border-stone-600"
                  : "hover:bg-stone-200 text-stone-500 border border-stone-300"
              )}
            >
              <X className="h-3.5 w-3.5" />
              <span>取消</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 