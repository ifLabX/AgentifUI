"use client"

import React from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { X, Copy, Download } from 'lucide-react'

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
  
  const handleCopy = () => {
    const resultText = JSON.stringify(result, null, 2)
    navigator.clipboard.writeText(resultText)
    // TODO: 显示复制成功提示
  }
  
  const handleDownload = () => {
    const resultText = JSON.stringify(result, null, 2)
    const blob = new Blob([resultText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workflow-result-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="fixed inset-4 z-50 flex items-center justify-center">
        <div className={cn(
          "w-full max-w-4xl max-h-full rounded-2xl shadow-2xl overflow-hidden",
          isDark ? "bg-stone-900 border border-stone-700" : "bg-white border border-stone-200"
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
              <button
                onClick={handleCopy}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isDark
                    ? "hover:bg-stone-700 text-stone-400 hover:text-stone-300"
                    : "hover:bg-stone-100 text-stone-600 hover:text-stone-700"
                )}
                title="复制结果"
              >
                <Copy className="h-4 w-4" />
              </button>
              
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
            <pre className={cn(
              "text-sm font-mono p-4 rounded-lg overflow-x-auto",
              isDark ? "bg-stone-800 text-stone-200" : "bg-stone-50 text-stone-800"
            )}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </>
  )
} 