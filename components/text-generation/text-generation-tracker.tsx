"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { UnifiedStatusPanel } from '@components/workflow/workflow-tracker/unified-status-panel'
import { Play, Clock, CheckCircle, XCircle, Square, FileText, Loader2, Copy, Download } from 'lucide-react'

interface TextGenerationTrackerProps {
  isExecuting: boolean
  isStreaming: boolean
  generatedText: string
  currentExecution: any
  onStop?: () => void
  onRetry?: () => void
  onReset?: () => void
}

/**
 * 文本生成跟踪器组件
 * 
 * 功能特点：
 * - 实时显示文本生成状态
 * - 流式文本展示
 * - 统一的状态面板
 * - 文本操作功能（复制、下载）
 * - 与WorkflowTracker保持一致的布局结构
 */
export function TextGenerationTracker({ 
  isExecuting,
  isStreaming,
  generatedText,
  currentExecution,
  onStop,
  onRetry,
  onReset
}: TextGenerationTrackerProps) {
  const { isDark } = useTheme()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  
  // --- 自动滚动到底部 ---
  useEffect(() => {
    if (textAreaRef.current && isStreaming) {
      textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight
    }
  }, [generatedText, isStreaming])
  
  const getOverallStatus = () => {
    if (isExecuting || isStreaming) return 'running'
    if (currentExecution?.status === 'completed') return 'completed'
    if (currentExecution?.status === 'failed') return 'failed'
    if (currentExecution?.status === 'stopped') return 'stopped'
    return 'idle'
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-stone-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'stopped':
        return <Square className="h-5 w-5 text-stone-500" />
      default:
        return <FileText className="h-5 w-5 text-stone-400" />
    }
  }
  
  // --- 复制文本 ---
  const handleCopyText = async () => {
    if (generatedText) {
      try {
        await navigator.clipboard.writeText(generatedText)
        // 这里可以添加成功提示
      } catch (error) {
        console.error('复制失败:', error)
      }
    }
  }
  
  // --- 下载文本 ---
  const handleDownloadText = () => {
    if (generatedText) {
      const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `generated-text-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }
  
  const overallStatus = getOverallStatus()
  
  return (
    <div className="h-full flex flex-col">
      {/* --- 统一状态面板 --- */}
      {(onStop || onRetry || onReset) && (
        <UnifiedStatusPanel
          isExecuting={isExecuting}
          progress={0} // 文本生成不显示具体进度
          error={null} // 错误由外层处理
          canRetry={false} // 重试由外层处理
          currentExecution={currentExecution}
          onStop={onStop || (() => {})}
          onRetry={onRetry || (() => {})}
          onReset={onReset || (() => {})}
          onShowResult={() => {}} // 文本生成不需要单独的结果查看器
        />
      )}
      
      {/* --- 文本生成区域 --- */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        {!isExecuting && !currentExecution && !generatedText ? (
          // 空状态
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className={cn(
                "w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center mx-auto",
                isDark ? "border-stone-600" : "border-stone-300"
              )}>
                <FileText className={cn(
                  "h-6 w-6",
                  isDark ? "text-stone-400" : "text-stone-500"
                )} />
              </div>
              <div className="space-y-2">
                <h3 className={cn(
                  "text-lg font-semibold font-serif",
                  isDark ? "text-stone-200" : "text-stone-800"
                )}>
                  等待生成
                </h3>
                <p className={cn(
                  "text-sm font-serif",
                  isDark ? "text-stone-400" : "text-stone-600"
                )}>
                  填写左侧表单并点击执行按钮开始文本生成
                </p>
              </div>
            </div>
          </div>
        ) : (
          // 文本生成内容
          <div className="h-full flex flex-col space-y-4">
            {/* 状态标题 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(overallStatus)}
                <h3 className={cn(
                  "text-lg font-semibold font-serif",
                  isDark ? "text-stone-200" : "text-stone-800"
                )}>
                  {isExecuting || isStreaming ? '正在生成...' : '生成结果'}
                </h3>
              </div>
              
              {/* 操作按钮 */}
              {generatedText && !isExecuting && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      isDark
                        ? "hover:bg-stone-700 text-stone-400 hover:text-stone-300"
                        : "hover:bg-stone-100 text-stone-600 hover:text-stone-700"
                    )}
                    title="复制文本"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDownloadText}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      isDark
                        ? "hover:bg-stone-700 text-stone-400 hover:text-stone-300"
                        : "hover:bg-stone-100 text-stone-600 hover:text-stone-700"
                    )}
                    title="下载文本"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* 文本显示区域 */}
            <div className="flex-1 relative">
              {isExecuting && !generatedText ? (
                // 加载状态
                <div className={cn(
                  "h-full flex items-center justify-center rounded-lg border-2 border-dashed",
                  isDark ? "border-stone-600 bg-stone-800/50" : "border-stone-300 bg-stone-50"
                )}>
                  <div className="flex items-center gap-3">
                    <Loader2 className={cn(
                      "h-5 w-5 animate-spin",
                      isDark ? "text-stone-400" : "text-stone-600"
                    )} />
                    <div>
                      <div className={cn(
                        "font-medium font-serif",
                        isDark ? "text-stone-200" : "text-stone-800"
                      )}>
                        文本生成中
                      </div>
                      <div className={cn(
                        "text-sm font-serif",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )}>
                        请稍候，正在为您生成内容...
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // 文本内容
                <textarea
                  ref={textAreaRef}
                  value={generatedText}
                  readOnly
                  className={cn(
                    "w-full h-full p-4 rounded-lg border resize-none font-serif",
                    "focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent",
                    isDark
                      ? "bg-stone-800 border-stone-600 text-stone-200 placeholder-stone-400"
                      : "bg-white border-stone-300 text-stone-900 placeholder-stone-500"
                  )}
                  placeholder={isExecuting ? "正在生成文本..." : "生成的文本将显示在这里"}
                />
              )}
              
              {/* 流式生成指示器 */}
              {isStreaming && (
                <div className={cn(
                  "absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-xs",
                  isDark ? "bg-stone-700 text-stone-300" : "bg-stone-100 text-stone-600"
                )}>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-serif">实时生成中</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 