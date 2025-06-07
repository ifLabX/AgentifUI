"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { UnifiedStatusPanel } from '@components/workflow/workflow-tracker/unified-status-panel'
import { Play, Clock, CheckCircle, XCircle, Square, FileText, Loader2, Copy, Download, Check } from 'lucide-react'
import { TooltipWrapper } from '@components/ui/tooltip-wrapper'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { Components } from 'react-markdown'
import 'katex/dist/katex.min.css'
import { 
  InlineCode,
  CodeBlock,
  MarkdownTableContainer,
  MarkdownBlockquote,
} from '@components/chat/markdown-block'

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
  const markdownContainerRef = useRef<HTMLDivElement>(null)
  const [isCopied, setIsCopied] = useState(false)
  
  // --- 自动滚动到底部 ---
  useEffect(() => {
    if (markdownContainerRef.current && isStreaming) {
      markdownContainerRef.current.scrollTop = markdownContainerRef.current.scrollHeight
    }
  }, [generatedText, isStreaming])

  // --- 复用助手消息的Markdown组件配置 ---
  const markdownComponents: Components = {
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      
      if (language) {
        return (
          <CodeBlock
            language={language}
            className={className}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </CodeBlock>
        )
      }
      
      return <InlineCode {...props}>{children}</InlineCode>
    },
    table({ children, ...props }: any) {
      return <MarkdownTableContainer>{children}</MarkdownTableContainer>
    },
    blockquote({ children, ...props }: any) {
      return <MarkdownBlockquote>{children}</MarkdownBlockquote>
    },
    p({ children, ...props }: any) {
      return <p className="font-serif" {...props}>{children}</p>
    },
    h1({ children, ...props }: any) {
      return <h1 className="font-serif" {...props}>{children}</h1>
    },
    h2({ children, ...props }: any) {
      return <h2 className="font-serif" {...props}>{children}</h2>
    },
    h3({ children, ...props }: any) {
      return <h3 className="font-serif" {...props}>{children}</h3>
    },
    h4({ children, ...props }: any) {
      return <h4 className="font-serif" {...props}>{children}</h4>
    },
    ul({ children, ...props }: any) {
      return <ul className="font-serif" {...props}>{children}</ul>
    },
    ol({ children, ...props }: any) {
      return <ol className="font-serif" {...props}>{children}</ol>
    },
    li({ children, ...props }: any) {
      return <li className="font-serif" {...props}>{children}</li>
    },
  }
  
  const getOverallStatus = () => {
    if (isExecuting || isStreaming) return 'running'
    if (currentExecution?.status) return currentExecution.status
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
        setIsCopied(true)
        console.log('[文本生成跟踪器] 文本已复制到剪贴板')
        
        // 2秒后重置状态
        setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      } catch (error) {
        console.error('[文本生成跟踪器] 复制失败:', error)
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
          showResultButton={false} // 文本生成不显示查看结果按钮
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
                  {/* 复制按钮 */}
                  <TooltipWrapper
                    content={isCopied ? "已复制" : "复制文本"}
                    id="text-generation-copy-btn"
                    placement="bottom"
                    desktopOnly={true}
                  >
                    <button
                      onClick={handleCopyText}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-lg transition-colors",
                        isDark ? "text-stone-400" : "text-stone-500",
                        isDark ? "hover:text-stone-300" : "hover:text-stone-700",
                        isDark ? "hover:bg-stone-600/40" : "hover:bg-stone-300/40",
                        "focus:outline-none"
                      )}
                      style={{ transform: 'translateZ(0)' }}
                      aria-label={isCopied ? "已复制" : "复制文本"}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </TooltipWrapper>
                  
                  {/* 下载按钮 */}
                  <TooltipWrapper
                    content="下载文本"
                    id="text-generation-download-btn"
                    placement="bottom"
                    desktopOnly={true}
                  >
                    <button
                      onClick={handleDownloadText}
                      className={cn(
                        "flex items-center justify-center p-2 rounded-lg transition-colors",
                        isDark ? "text-stone-400" : "text-stone-500",
                        isDark ? "hover:text-stone-300" : "hover:text-stone-700",
                        isDark ? "hover:bg-stone-600/40" : "hover:bg-stone-300/40",
                        "focus:outline-none"
                      )}
                      style={{ transform: 'translateZ(0)' }}
                      aria-label="下载文本"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </TooltipWrapper>
                </div>
              )}
            </div>
            
            {/* 文本显示区域 */}
            <div className="flex-1 relative overflow-hidden">
              {isExecuting && !generatedText ? (
                // 加载状态
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed",
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
                // Markdown渲染内容
                <div
                  ref={markdownContainerRef}
                  className={cn(
                    "absolute inset-0 p-4 rounded-lg border font-serif overflow-y-auto overscroll-contain",
                    "focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent",
                    "assistant-message-content", // 复用助手消息的样式类
                    isDark
                      ? "bg-stone-800 border-stone-600 text-stone-200"
                      : "bg-white border-stone-300 text-stone-900"
                  )}
                  style={{
                    scrollBehavior: 'auto'
                  }}
                >
                  {generatedText ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {generatedText}
                    </ReactMarkdown>
                  ) : (
                    <div className={cn(
                      "flex items-center justify-center h-full font-serif",
                      isDark ? "text-stone-400" : "text-stone-500"
                    )}>
                      {isExecuting ? "正在生成文本..." : "生成的文本将显示在这里"}
                    </div>
                  )}
                </div>
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