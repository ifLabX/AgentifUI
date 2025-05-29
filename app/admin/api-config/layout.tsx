"use client"

import React, { ReactNode, useEffect, useState } from 'react'
import { useApiConfigStore, ServiceInstance } from '@lib/stores/api-config-store'
import { useTheme } from '@lib/hooks/use-theme'
import { cn } from '@lib/utils'
import { 
  Plus,
  Database,
  Globe,
  Trash2,
  Loader2
} from 'lucide-react'

interface ApiConfigLayoutProps {
  children: ReactNode
}

export default function ApiConfigLayout({ children }: ApiConfigLayoutProps) {
  const { isDark } = useTheme()
  
  const {
    serviceInstances: instances,
    isLoading: instancesLoading,
    loadConfigData: loadInstances,
    deleteAppInstance: deleteInstance
  } = useApiConfigStore()
  
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // --- BEGIN COMMENT ---
  // 加载实例数据 - 只在首次加载时执行
  // --- END COMMENT ---
  useEffect(() => {
    if (!hasInitiallyLoaded && isInitialMount) {
      loadInstances().finally(() => {
        setHasInitiallyLoaded(true)
        setIsInitialMount(false)
      })
    } else if (isInitialMount) {
      setHasInitiallyLoaded(true)
      setIsInitialMount(false)
    }
  }, [hasInitiallyLoaded, isInitialMount, loadInstances])

  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm('确定要删除此应用实例吗？此操作不可撤销。')) {
      return
    }

    setIsProcessing(true)
    try {
      const instanceToDelete = instances.find(inst => inst.instance_id === instanceId)
      if (!instanceToDelete) {
        throw new Error('未找到要删除的实例')
      }
      
      await deleteInstance(instanceToDelete.id)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除应用实例失败')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* --- BEGIN COMMENT ---
      左侧应用实例导航 - 固定宽度，独立滚动
      --- END COMMENT --- */}
      <div className="w-80 flex-shrink-0 h-full flex flex-col">
        <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className={cn(
                "font-bold text-lg font-serif",
                isDark ? "text-stone-100" : "text-stone-900"
              )}>
                应用实例
              </h2>
              {/* 初始加载时的小spinner */}
              {instancesLoading && !hasInitiallyLoaded && (
                <Loader2 className="h-3 w-3 animate-spin text-stone-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // 通过自定义事件通知page组件显示添加表单
                  window.dispatchEvent(new CustomEvent('addInstance'))
                }}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  isDark 
                    ? "bg-stone-600 hover:bg-stone-500 text-stone-200 hover:text-stone-100" 
                    : "bg-stone-200 hover:bg-stone-300 text-stone-700 hover:text-stone-900"
                )}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className={cn(
            "text-sm font-serif",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            共 {instances.length} 个应用
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          {!hasInitiallyLoaded && instancesLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-stone-400" />
              <p className={cn(
                "text-sm font-serif",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                加载应用实例中...
              </p>
            </div>
          ) : instances.length === 0 ? (
            <div className="p-4 text-center">
              <Database className="h-12 w-12 mx-auto mb-3 text-stone-400" />
              <p className={cn(
                "text-sm font-serif",
                isDark ? "text-stone-400" : "text-stone-600"
              )}>
                暂无应用实例
              </p>
              <button
                onClick={() => {
                  // 通过自定义事件通知page组件显示添加表单
                  window.dispatchEvent(new CustomEvent('addInstance'))
                }}
                className={cn(
                  "mt-2 text-sm transition-colors font-serif cursor-pointer",
                  isDark ? "text-stone-300 hover:text-stone-100" : "text-stone-600 hover:text-stone-800"
                )}
              >
                添加第一个应用
              </button>
            </div>
          ) : (
            <div className="p-2">
              {instances.map((instance) => (
                <div
                  key={instance.instance_id}
                  className={cn(
                    "p-3 rounded-lg mb-2 cursor-pointer group",
                    "transition-colors duration-150 ease-in-out",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2",
                    isDark
                      ? "hover:bg-stone-800/50 focus:ring-stone-600"
                      : "hover:bg-white/50 focus:ring-stone-300"
                  )}
                  onClick={() => {
                    // 通过自定义事件通知page组件
                    window.dispatchEvent(new CustomEvent('selectInstance', {
                      detail: instance
                    }))
                  }}
                  tabIndex={0}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isDark ? "text-stone-400" : "text-stone-500"
                        )} />
                        <h3 className={cn(
                          "font-medium text-sm truncate font-serif",
                          isDark ? "text-stone-100" : "text-stone-900"
                        )}>
                          {instance.display_name}
                        </h3>
                      </div>
                      <p className={cn(
                        "text-xs truncate font-serif",
                        isDark ? "text-stone-400" : "text-stone-600"
                      )}>
                        {instance.description || instance.instance_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteInstance(instance.instance_id)
                        }}
                        disabled={isProcessing}
                        className={cn(
                          "p-1 rounded transition-colors cursor-pointer",
                          "hover:bg-red-100 dark:hover:bg-red-900/30",
                          "focus:outline-none focus:ring-2 focus:ring-red-500",
                          isProcessing && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* --- BEGIN COMMENT ---
      右侧内容区域 - 独立滚动，限制高度
      --- END COMMENT --- */}
      <div className="flex-1 h-full border-l border-stone-200 dark:border-stone-700 overflow-hidden">
        {children}
      </div>
    </div>
  )
} 