"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { X, Download } from 'lucide-react'
import { FiCopy, FiCheck } from "react-icons/fi"
import { TooltipWrapper } from "@components/ui/tooltip-wrapper"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import "katex/dist/katex.min.css"
import { 
  InlineCode,
  CodeBlock,
  MarkdownTableContainer,
  MarkdownBlockquote,
} from "@components/chat/markdown-block"

interface ResultViewerProps {
  result: any
  execution: any
  onClose: () => void
}

/**
 * 结果查看器组件
 * 
 * 以弹窗形式展示工作流执行结果
 */
export function ResultViewer({ result, execution, onClose }: ResultViewerProps) {
  const { isDark } = useTheme()
  const [isVisible, setIsVisible] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  
  // --- 组件挂载时触发进入动画 ---
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])
  
  // --- 格式化结果数据 ---
  const formatResult = (data: any): { content: string; isMarkdown: boolean } => {
    if (!data) return { content: '无结果数据', isMarkdown: false }
    
    try {
      // 如果数据已经是字符串，检查是否是JSON字符串
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data)
          return { content: JSON.stringify(parsed, null, 2), isMarkdown: false }
        } catch {
          // 如果不是JSON字符串，可能是markdown内容
          return { content: data, isMarkdown: true }
        }
      }
      
      // 检查是否有result1、result2等字段（工作流结果模式）
      const resultKeys = Object.keys(data).filter(key => key.startsWith('result'))
      if (resultKeys.length > 0) {
        // 优先使用第一个result字段
        const firstResultKey = resultKeys[0]
        const resultContent = data[firstResultKey]
        
        if (typeof resultContent === 'string') {
          // 移除think块内容，只保留主要内容
          let cleanContent = resultContent
          
          // 移除<think>...</think>块
          cleanContent = cleanContent.replace(/<think>[\s\S]*?<\/think>/g, '')
          
          // 检查是否包含markdown
          if (cleanContent.includes('```') || cleanContent.includes('#') || cleanContent.includes('**')) {
            return { content: cleanContent.trim(), isMarkdown: true }
          } else {
            return { content: cleanContent.trim(), isMarkdown: false }
          }
        }
      }
      
      // 如果有text字段，优先显示text内容
      if (data.text && typeof data.text === 'string') {
        // 检查是否包含markdown代码块
        if (data.text.includes('```')) {
          // 包含代码块，作为markdown渲染
          return { content: data.text, isMarkdown: true }
        } else {
          // 纯文本或简单内容
          return { content: data.text, isMarkdown: false }
        }
      }
      
      // 如果有outputs字段，优先显示outputs
      if (data.outputs && typeof data.outputs === 'object') {
        return { content: JSON.stringify(data.outputs, null, 2), isMarkdown: false }
      }
      
      // 否则显示完整数据
      return { content: JSON.stringify(data, null, 2), isMarkdown: false }
    } catch (error) {
      console.error('[结果查看器] 数据格式化失败:', error)
      return { content: String(data), isMarkdown: false }
    }
  }
  
  const { content: formattedContent, isMarkdown } = formatResult(result)
  
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
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedContent)
      setIsCopied(true)
      console.log('[结果查看器] 结果已复制到剪贴板')
      
      // 2秒后重置状态
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (error) {
      console.error('[结果查看器] 复制失败:', error)
    }
  }
  
  const handleDownload = () => {
    const blob = new Blob([formattedContent], { type: isMarkdown ? 'text/markdown' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-result-${Date.now()}.${isMarkdown ? 'md' : 'json'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
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
                执行结果
              </h2>
              <p className={cn(
                "text-sm font-serif mt-1",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                {execution?.title || '工作流执行结果'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* 复制按钮 */}
              <TooltipWrapper
                content={isCopied ? "已复制" : "复制结果"}
                id="result-viewer-copy-btn"
                placement="bottom"
                desktopOnly={true}
              >
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-lg transition-colors",
                    "text-stone-500 dark:text-stone-400",
                    "hover:text-stone-700 dark:hover:text-stone-300",
                    "hover:bg-stone-300/40 dark:hover:bg-stone-600/40",
                    "focus:outline-none"
                  )}
                  style={{ transform: 'translateZ(0)' }}
                  aria-label={isCopied ? "已复制" : "复制结果"}
                >
                  {isCopied ? (
                    <FiCheck className="h-4 w-4" />
                  ) : (
                    <FiCopy className="h-4 w-4" />
                  )}
                </button>
              </TooltipWrapper>
              
              {/* 下载按钮 */}
              <button
                onClick={handleDownload}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isDark
                    ? "hover:bg-stone-700 text-stone-400 hover:text-stone-300"
                    : "hover:bg-stone-100 text-stone-600 hover:text-stone-700"
                )}
                title="下载结果"
              >
                <Download className="h-4 w-4" />
              </button>
              
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
            {isMarkdown ? (
              <div className={cn(
                "prose prose-stone max-w-none font-serif",
                isDark ? "prose-invert" : ""
              )}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex, rehypeRaw]}
                  components={markdownComponents}
                >
                  {formattedContent}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className={cn(
                "text-sm font-mono p-4 rounded-lg overflow-x-auto whitespace-pre-wrap",
                isDark ? "bg-stone-800 text-stone-200" : "bg-stone-50 text-stone-800"
              )}>
                {formattedContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 