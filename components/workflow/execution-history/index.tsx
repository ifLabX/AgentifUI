"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { ExecutionItem } from './execution-item'
import { X, History, Search, Filter } from 'lucide-react'

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
 * - 支持搜索和筛选
 * - 可查看历史执行结果
 * - 响应式设计
 */
export function ExecutionHistory({ instanceId, onClose, isMobile }: ExecutionHistoryProps) {
  const { isDark } = useTheme()
  const [executions, setExecutions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // 模拟历史记录数据
  useEffect(() => {
    const mockExecutions = [
      {
        id: 'exec_1',
        title: '情感分析工作流 - 2024/01/15',
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        total_steps: 3,
        total_tokens: 150,
        elapsed_time: 2.5,
        inputs: { input_text: '这是一个测试文本', Multisentiment: 'False' },
        outputs: { result: '正面情感，置信度：0.85' }
      },
      {
        id: 'exec_2',
        title: '情感分析工作流 - 2024/01/14',
        status: 'failed',
        created_at: '2024-01-14T15:20:00Z',
        total_steps: 2,
        total_tokens: 80,
        elapsed_time: 1.2,
        inputs: { input_text: '另一个测试', Multisentiment: 'True' },
        error_message: '模型调用失败'
      },
      {
        id: 'exec_3',
        title: '情感分析工作流 - 2024/01/13',
        status: 'completed',
        created_at: '2024-01-13T09:15:00Z',
        total_steps: 3,
        total_tokens: 200,
        elapsed_time: 3.1,
        inputs: { input_text: '第三个测试文本', Multisentiment: 'False' },
        outputs: { result: '中性情感，置信度：0.72' }
      }
    ]
    
    setTimeout(() => {
      setExecutions(mockExecutions)
      setIsLoading(false)
    }, 500)
  }, [instanceId])
  
  // 筛选执行记录
  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = execution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         JSON.stringify(execution.inputs).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter
    return matchesSearch && matchesStatus
  })
  
  return (
    <div className={cn(
      "h-full flex flex-col",
      isDark ? "bg-stone-900" : "bg-white"
    )}>
      {/* 头部 */}
      <div className={cn(
        "p-4 border-b flex-shrink-0",
        isDark ? "border-stone-700" : "border-stone-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className={cn(
              "h-5 w-5",
              isDark ? "text-stone-400" : "text-stone-600"
            )} />
            <h2 className={cn(
              "text-lg font-semibold font-serif",
              isDark ? "text-stone-200" : "text-stone-800"
            )}>
              执行历史
            </h2>
          </div>
          
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
        
        {/* 搜索和筛选 */}
        <div className="space-y-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4",
              isDark ? "text-stone-400" : "text-stone-500"
            )} />
            <input
              type="text"
              placeholder="搜索执行记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full pl-10 pr-3 py-2 rounded-lg border font-serif text-sm",
                "focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent",
                isDark
                  ? "border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400"
                  : "border-stone-300 bg-white text-stone-900 placeholder-stone-500"
              )}
            />
          </div>
          
          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <Filter className={cn(
              "h-4 w-4",
              isDark ? "text-stone-400" : "text-stone-500"
            )} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg border font-serif text-sm",
                "focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent",
                isDark
                  ? "border-stone-600 bg-stone-700 text-stone-100"
                  : "border-stone-300 bg-white text-stone-900"
              )}
            >
              <option value="all">全部状态</option>
              <option value="completed">已完成</option>
              <option value="failed">已失败</option>
              <option value="running">执行中</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 执行记录列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              正在加载历史记录...
            </div>
          </div>
        ) : filteredExecutions.length === 0 ? (
          <div className="p-6 text-center">
            <div className={cn(
              "text-sm font-serif",
              isDark ? "text-stone-400" : "text-stone-600"
            )}>
              {searchTerm || statusFilter !== 'all' ? '没有找到匹配的记录' : '暂无执行记录'}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
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