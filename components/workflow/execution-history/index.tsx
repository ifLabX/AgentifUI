"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useThemeColors } from '@lib/hooks/use-theme-colors'
import { cn } from '@lib/utils'
import { ExecutionItem } from './execution-item'
import { X, History, Search } from 'lucide-react'

interface ExecutionHistoryProps {
  instanceId: string
  onClose: () => void
  isMobile: boolean
}

/**
 * 执行历史记录组件
 * 
 * 功能特点：
 * - 显示工作流执行历史
 * - 支持搜索
 * - 可查看历史执行结果
 * - 响应式设计
 */
export function ExecutionHistory({ instanceId, onClose, isMobile }: ExecutionHistoryProps) {
  const { isDark } = useTheme()
  const { colors } = useThemeColors()
  const [executions, setExecutions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // 模拟历史记录数据
  useEffect(() => {
    const mockExecutions = [
      {
        id: 'exec_1',
        title: '情感分析工作流',
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        elapsed_time: 2.5,
        inputs: { input_text: '这是一个测试文本', Multisentiment: 'False' },
        outputs: { result: '正面情感，置信度：0.85' }
      },
      {
        id: 'exec_2',
        title: '情感分析工作流',
        status: 'failed',
        created_at: '2024-01-14T15:20:00Z',
        elapsed_time: 1.2,
        inputs: { input_text: '另一个测试', Multisentiment: 'True' },
        error_message: '模型调用失败'
      },
      {
        id: 'exec_3',
        title: '情感分析工作流',
        status: 'completed',
        created_at: '2024-01-13T09:15:00Z',
        elapsed_time: 3.1,
        inputs: { input_text: '第三个测试文本', Multisentiment: 'False' },
        outputs: { result: '中性情感，置信度：0.72' }
      },
      {
        id: 'exec_4',
        title: '情感分析工作流',
        status: 'completed',
        created_at: '2024-01-12T14:45:00Z',
        elapsed_time: 2.8,
        inputs: { input_text: '第四个测试', Multisentiment: 'False' },
        outputs: { result: '负面情感，置信度：0.91' }
      },
      {
        id: 'exec_5',
        title: '情感分析工作流',
        status: 'completed',
        created_at: '2024-01-11T11:20:00Z',
        elapsed_time: 1.9,
        inputs: { input_text: '第五个测试', Multisentiment: 'True' },
        outputs: { result: '正面情感，置信度：0.76' }
      }
    ]
    
    setTimeout(() => {
      setExecutions(mockExecutions)
      setIsLoading(false)
    }, 500)
  }, [instanceId])
  
  // 筛选执行记录（只保留搜索功能）
  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = execution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         JSON.stringify(execution.inputs).toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  return (
    <div className={cn(
      "h-full flex flex-col",
      colors.mainBackground.tailwind
    )}>
      {/* 头部 */}
      <div className={cn(
        "p-3 border-b flex-shrink-0",
        isDark ? "border-stone-700/50" : "border-stone-300/50"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className={cn(
              "h-4 w-4",
              isDark ? "text-stone-400" : "text-stone-600"
            )} />
            <h2 className={cn(
              "text-base font-semibold font-serif",
              colors.mainText.tailwind
            )}>
              执行历史
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark
                ? "hover:bg-stone-700/50 text-stone-400 hover:text-stone-300"
                : "hover:bg-stone-200/50 text-stone-600 hover:text-stone-700"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative">
          <Search className={cn(
            "absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5",
            isDark ? "text-stone-500" : "text-stone-400"
          )} />
          <input
            type="text"
            placeholder="搜索执行记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-8 pr-3 py-2 rounded-md border font-serif text-sm",
              "focus:outline-none focus:ring-1 focus:ring-stone-400/50 focus:border-transparent",
              isDark
                ? "border-stone-600/50 bg-stone-700/50 text-stone-100 placeholder-stone-500"
                : "border-stone-300/50 bg-stone-50/50 text-stone-900 placeholder-stone-400"
            )}
          />
        </div>
      </div>
      
      {/* 执行记录列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              正在加载历史记录...
            </div>
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="p-4 text-center">
            <div className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-500" : "text-stone-500"
            )}>
              {searchTerm ? '没有找到匹配的记录' : '暂无执行记录'}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredExecutions.map((execution) => (
              <ExecutionItem
                key={execution.id}
                execution={execution}
                onClick={() => {
                  // TODO: 查看执行详情
                  console.log('查看执行详情:', execution)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 