"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { X, Download, Copy, Check } from 'lucide-react'
import { TooltipWrapper } from '@components/ui/tooltip-wrapper'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import {
  InlineCode,
  CodeBlock,
  MarkdownTableContainer,
  MarkdownBlockquote,
} from '@components/chat/markdown-block'

interface TextGenerationResultViewerProps {
  result: any
  execution: any
  onClose: () => void
}

/**
 * 文本生成结果查看器
 * 
 * 专门用于展示文本生成的历史记录结果
 * 模仿工作流的ResultViewer组件样式和功能
 */
export function TextGenerationResultViewer({ result, execution, onClose }: TextGenerationResultViewerProps) {
  const { isDark } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  
  // --- 动画控制 ---
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])
  
  // --- 格式化内容 ---
  const formatContent = (data: any): string => {
    // 如果result包含生成的文本内容
    if (typeof data === 'string') {
      return data
    }
    
    // 如果是对象，尝试提取文本内容
    if (data && typeof data === 'object') {
      // --- 优先查找文本生成专用字段 ---
      if (data.generated_text && typeof data.generated_text === 'string') {
        return data.generated_text
      }
      
      // --- 查找其他常见的文本字段 ---
      const textFields = ['text', 'content', 'output', 'result', 'answer', 'response']
      for (const field of textFields) {
        if (data[field] && typeof data[field] === 'string') {
          return data[field]
        }
      }
      
      // --- 如果没有找到文本字段，返回JSON格式 ---
      return JSON.stringify(data, null, 2)
    }
    
    return String(data || '暂无内容')
  }
  
  const formattedContent = formatContent(result)
  
  // --- 检测是否包含Markdown内容 ---
  const hasMarkdownContent = (text: string): boolean => {
    if (!text) return false
    
    // 检测常见的Markdown语法
    const markdownPatterns = [
      /```[\s\S]*?```/,  // 代码块
      /`[^`]+`/,         // 内联代码
      /#{1,6}\s/,        // 标题
      /\*\*[^*]+\*\*/,   // 粗体
      /\*[^*]+\*/,       // 斜体
      /\[[^\]]+\]\([^)]+\)/, // 链接
      /^\s*[-*+]\s/m,    // 无序列表
      /^\s*\d+\.\s/m,    // 有序列表
      /^\s*>\s/m,        // 引用
      /^\s*\|.*\|/m,     // 表格
    ]
    
    return markdownPatterns.some(pattern => pattern.test(text))
  }
  
  const shouldUseMarkdown = hasMarkdownContent(formattedContent)
  
  // --- Markdown组件配置 ---
  const markdownComponents: any = {
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : null
      
      if (language) {
        // 代码块
        return (
          <CodeBlock
            language={language}
            className={className}
            isStreaming={false}
          >
            {String(children).replace(/\n$/, '')}
          </CodeBlock>
        )
      } else {
        // 内联代码
        return <InlineCode className={className} {...props}>{children}</InlineCode>
      }
    },
    table({ children, ...props }: any) {
      return <MarkdownTableContainer>{children}</MarkdownTableContainer>
    },
    blockquote({ children, ...props }: any) {
      return <MarkdownBlockquote>{children}</MarkdownBlockquote>
    },
    p({ children, ...props }: any) {
      return <p className="my-2 font-serif" {...props}>{children}</p>
    },
    ul({ children, ...props }: any) {
      return <ul className="my-2.5 ml-6 list-disc space-y-1 font-serif" {...props}>{children}</ul>
    },
    ol({ children, ...props }: any) {
      return <ol className="my-2.5 ml-6 list-decimal space-y-1 font-serif" {...props}>{children}</ol>
    },
    li({ children, ...props }: any) {
      return <li className="pb-0.5" {...props}>{children}</li>
    },
    h1({ children, ...props }: any) {
      return <h1 className={cn("text-2xl font-semibold font-serif mt-4 mb-2 pb-1 border-b", isDark ? "border-gray-700" : "border-gray-300")} {...props}>{children}</h1>
    },
    h2({ children, ...props }: any) {
      return <h2 className={cn("text-xl font-semibold font-serif mt-3.5 mb-1.5 pb-1 border-b", isDark ? "border-gray-700" : "border-gray-300")} {...props}>{children}</h2>
    },
    h3({ children, ...props }: any) {
      return <h3 className="text-lg font-semibold font-serif mt-3 mb-1" {...props}>{children}</h3>
    },
    h4({ children, ...props }: any) {
      return <h4 className="text-base font-semibold font-serif mt-2.5 mb-0.5" {...props}>{children}</h4>
    },
    a({ children, href, ...props }: any) {
      return <a href={href} className={cn("underline font-serif", isDark ? "text-sky-400 hover:text-sky-300" : "text-sky-600 hover:text-sky-700")} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
    },
    hr({ ...props }: any) {
      return <hr className={cn("my-4 border-t", isDark ? "border-gray-700" : "border-gray-300")} {...props} />
    }
  }
  
  // --- 复制功能 ---
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedContent)
      setIsCopied(true)
      console.log('[文本生成结果查看器] 内容已复制到剪贴板')
      
      // 2秒后重置状态
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error('[文本生成结果查看器] 复制失败:', error)
    }
  }
  
  // --- 下载功能 ---
  const handleDownload = () => {
    const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `text-generation-result-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // --- 背景点击关闭 ---
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  // --- 键盘事件监听 ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  
  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
      />
      
      {/* 弹窗内容 */}
      <div className="fixed inset-4 z-50 flex items-center justify-center">
        <div className={cn(
          "w-full max-w-4xl max-h-full rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
          isDark ? "bg-stone-900 border border-stone-700" : "bg-white border border-stone-200",
          isVisible ? "animate-scale-in" : "opacity-0 scale-95"
        )}>
          {/* 头部 */}
          <div className={cn(
            "flex items-center justify-between p-6 border-b",
            isDark ? "border-stone-700" : "border-stone-200"
          )}>
            <div>
              <h2 className={cn(
                "text-xl font-bold font-serif",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                生成结果
              </h2>
              <p className={cn(
                "text-sm font-serif mt-1",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                {execution?.title || '文本生成结果'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 复制按钮 */}
              <TooltipWrapper
                content={isCopied ? "已复制" : "复制结果"}
                id="text-result-viewer-copy-btn"
                placement="bottom"
                desktopOnly={true}
              >
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-lg transition-colors",
                    isDark ? "text-stone-400" : "text-stone-500",
                    isDark ? "hover:text-stone-300" : "hover:text-stone-700",
                    isDark ? "hover:bg-stone-600/40" : "hover:bg-stone-300/40",
                    "focus:outline-none"
                  )}
                  style={{ transform: 'translateZ(0)' }}
                  aria-label={isCopied ? "已复制" : "复制结果"}
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
                content="下载结果"
                id="text-result-viewer-download-btn"
                placement="bottom"
                desktopOnly={true}
              >
                <button
                  onClick={handleDownload}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isDark
                      ? "hover:bg-stone-700 text-stone-400 hover:text-stone-300"
                      : "hover:bg-stone-100 text-stone-600 hover:text-stone-700"
                  )}
                  aria-label="下载结果"
                >
                  <Download className="h-4 w-4" />
                </button>
              </TooltipWrapper>
              
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isDark
                    ? "hover:bg-stone-700 text-stone-400 hover:text-stone-300"
                    : "hover:bg-stone-100 text-stone-600 hover:text-stone-700"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
            <div className="space-y-4">
              {/* 执行信息 */}
              {execution && (
                <div className={cn(
                  "p-4 rounded-lg border",
                  isDark ? "bg-stone-800/50 border-stone-700" : "bg-stone-50 border-stone-200"
                )}>
                  <h3 className={cn(
                    "text-sm font-semibold font-serif mb-2",
                    isDark ? "text-stone-200" : "text-stone-800"
                  )}>
                    执行信息
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm font-serif">
                    <div>
                      <span className={cn(
                        "font-medium",
                        isDark ? "text-stone-300" : "text-stone-700"
                      )}>
                        状态：
                      </span>
                      <span className={cn(
                        "ml-2",
                        execution.status === 'completed' && (isDark ? "text-green-400" : "text-green-600"),
                        execution.status === 'failed' && (isDark ? "text-red-400" : "text-red-600"),
                        execution.status === 'stopped' && (isDark ? "text-yellow-400" : "text-yellow-600")
                      )}>
                        {execution.status === 'completed' ? '已完成' : 
                         execution.status === 'failed' ? '已失败' : 
                         execution.status === 'stopped' ? '已停止' : execution.status}
                      </span>
                    </div>
                    {execution.created_at && (
                      <div>
                        <span className={cn(
                          "font-medium",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          创建时间：
                        </span>
                        <span className={cn(
                          "ml-2",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          {new Date(execution.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    )}
                    {execution.elapsed_time && (
                      <div>
                        <span className={cn(
                          "font-medium",
                          isDark ? "text-stone-300" : "text-stone-700"
                        )}>
                          耗时：
                        </span>
                        <span className={cn(
                          "ml-2",
                          isDark ? "text-stone-400" : "text-stone-600"
                        )}>
                          {execution.elapsed_time}s
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              )}
              
              {/* 生成内容 */}
              <div>
                <h3 className={cn(
                  "text-sm font-semibold font-serif mb-3",
                  isDark ? "text-stone-200" : "text-stone-800"
                )}>
                  生成内容
                </h3>
                <div className={cn(
                  "p-4 rounded-lg border font-serif",
                  isDark ? "bg-stone-800 border-stone-700 text-stone-200" : "bg-white border-stone-200 text-stone-900"
                )}>
                  {shouldUseMarkdown ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeRaw]}
                      components={markdownComponents}
                    >
                      {formattedContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {formattedContent}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 