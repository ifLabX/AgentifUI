"use client"

import { useState, useEffect } from 'react'
import { useTheme } from '@lib/hooks/use-theme'
import { useChatWidth } from '@lib/hooks/use-chat-width'
import type { SyncConfig, SchedulerStats } from '@lib/services/app-parameters-sync-scheduler'
import { cn } from '@lib/utils'
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  WifiOff
} from 'lucide-react'

interface SyncStatus {
  config: SyncConfig
  stats: SchedulerStats
  isActive: boolean
}

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error' | 'info'
}

export default function SyncSchedulerPage() {
  const { isDark } = useTheme()
  const { widthClass, paddingClass } = useChatWidth()
  
  // 状态管理
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState<Partial<SyncConfig>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' })

  // Toast显示函数
  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  // API调用函数
  const apiCall = async (action?: string, config?: Partial<SyncConfig>) => {
    try {
      const url = '/api/admin/sync-scheduler'
      const options: RequestInit = {
        method: action ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
      
      if (action) {
        options.body = JSON.stringify({ action, config })
      }

      const response = await fetch(url, options)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '操作失败')
      }
      
      setConnectionError(false)
      return result.data
    } catch (error) {
      console.error('API调用失败:', error)
      setConnectionError(true)
      throw error
    }
  }

  // 加载状态
  const loadStatus = async () => {
    try {
      const currentStatus = await apiCall()
      setStatus(currentStatus)
      setConnectionError(false)
    } catch (error) {
      console.error('加载同步状态失败:', error)
      showToast('无法连接到同步服务', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadStatus()
    // 定期更新状态
    const interval = setInterval(loadStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // 启动/停止调度器
  const handleToggleScheduler = async () => {
    if (!status) return
    
    try {
      const action = status.isActive ? 'stop' : 'start'
      await apiCall(action)
      await loadStatus()
      showToast(status.isActive ? '同步调度器已停止' : '同步调度器已启动', 'success')
    } catch (error) {
      showToast('操作失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
    }
  }

  // 手动触发同步
  const handleTriggerSync = async () => {
    setIsTriggering(true)
    try {
      await apiCall('trigger')
      await loadStatus()
      showToast('手动同步已触发', 'success')
    } catch (error) {
      showToast('触发同步失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
    } finally {
      setIsTriggering(false)
    }
  }

  // 保存配置
  const handleSaveConfig = async () => {
    if (!tempConfig) return
    
    setIsSaving(true)
    try {
      await apiCall('configure', tempConfig)
      setIsConfigOpen(false)
      setTempConfig({})
      await loadStatus()
      showToast('配置已保存', 'success')
    } catch (error) {
      showToast('保存配置失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // 重置统计
  const handleResetStats = async () => {
    try {
      await apiCall('reset-stats')
      await loadStatus()
      showToast('统计信息已重置', 'success')
    } catch (error) {
      showToast('重置失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
    }
  }

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen",
        isDark ? "bg-stone-900" : "bg-stone-50"
      )}>
        <div className={cn("w-full mx-auto", widthClass, paddingClass, "py-8")}>
          <div className={cn(
            "animate-pulse space-y-6",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            <div className={cn(
              "h-8 rounded",
              isDark ? "bg-stone-800" : "bg-stone-200"
            )} />
            <div className={cn(
              "h-32 rounded-lg",
              isDark ? "bg-stone-800" : "bg-stone-200"
            )} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen font-serif",
      isDark ? "bg-stone-900 text-stone-100" : "bg-stone-50 text-stone-900"
    )}>
      <div className={cn("w-full mx-auto", widthClass, paddingClass, "py-8 space-y-8")}>
        
        {/* --- BEGIN COMMENT ---
        Toast通知
        --- END COMMENT --- */}
        {toast.show && (
          <div className="fixed top-4 right-4 z-50 max-w-sm">
            <div className={cn(
              "rounded-lg p-4 shadow-lg border animate-in slide-in-from-top-2",
              toast.type === 'success' && "bg-green-500 text-white border-green-600",
              toast.type === 'error' && "bg-red-500 text-white border-red-600",
              toast.type === 'info' && (isDark ? "bg-stone-800 text-stone-100 border-stone-700" : "bg-white text-stone-900 border-stone-200")
            )}>
              <div className="flex items-center gap-2">
                {toast.type === 'success' && <CheckCircle className="h-5 w-5" />}
                {toast.type === 'error' && <XCircle className="h-5 w-5" />}
                {toast.type === 'info' && <AlertCircle className="h-5 w-5" />}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* --- BEGIN COMMENT ---
        页面标题
        --- END COMMENT --- */}
        <div className="space-y-2">
          <h1 className={cn(
            "text-3xl md:text-4xl font-bold flex items-center gap-3",
            isDark ? "text-stone-100" : "text-stone-800"
          )}>
            <Database className="h-8 w-8 md:h-10 md:w-10" />
            同步调度管理
            {connectionError && (
              <div title="连接异常" className="inline-block">
                <WifiOff className="h-6 w-6 text-red-500" />
              </div>
            )}
          </h1>
          <p className={cn(
            "text-base md:text-lg",
            isDark ? "text-stone-400" : "text-stone-600"
          )}>
            管理应用参数的自动同步调度器
            {connectionError && (
              <span className="text-red-500 ml-2">• 无法连接到服务</span>
            )}
          </p>
        </div>

        {/* --- BEGIN COMMENT ---
        连接错误提示
        --- END COMMENT --- */}
        {connectionError && (
          <div className={cn(
            "p-4 rounded-lg border-l-4 border-red-500",
            isDark ? "bg-red-900/20 text-red-200" : "bg-red-50 text-red-800"
          )}>
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5" />
              <span className="font-medium">服务连接异常</span>
            </div>
            <p className="mt-1 text-sm">
              无法连接到同步调度服务，请检查服务状态或刷新页面重试。
            </p>
          </div>
        )}

        {/* --- BEGIN COMMENT ---
        状态概览卡片
        --- END COMMENT --- */}
        <div className={cn(
          "rounded-xl p-6 border",
          isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200",
          connectionError && "opacity-50"
        )}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            {/* 状态信息 */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium",
                  status?.isActive 
                    ? "bg-green-500/20 text-green-600 border border-green-500/30"
                    : "bg-stone-500/20 text-stone-600 border border-stone-500/30"
                )}>
                  <Activity className="h-4 w-4" />
                  {status?.isActive ? "运行中" : "已停止"}
                </div>
                
                {status?.config.enabled && (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium",
                    "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                  )}>
                    <Settings className="h-4 w-4" />
                    已启用
                  </div>
                )}

                {status?.stats.currentlyRunning && (
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium",
                    "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30"
                  )}>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    正在同步
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-stone-500" />
                  <span>同步间隔: {status?.config.interval || 0} 分钟</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-stone-500" />
                  <span>批次大小: {status?.config.batchSize || 0}</span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleToggleScheduler}
                disabled={!status?.config.enabled || connectionError}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  status?.isActive
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white",
                  (!status?.config.enabled || connectionError) && "opacity-50 cursor-not-allowed"
                )}
              >
                {status?.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {status?.isActive ? "停止" : "启动"}
              </button>
              
              <button
                onClick={handleTriggerSync}
                disabled={isTriggering || status?.stats.currentlyRunning || connectionError}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isDark 
                    ? "bg-stone-700 hover:bg-stone-600 text-stone-200" 
                    : "bg-stone-200 hover:bg-stone-300 text-stone-800",
                  (isTriggering || status?.stats.currentlyRunning || connectionError) && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw className={cn("h-4 w-4", (isTriggering || status?.stats.currentlyRunning) && "animate-spin")} />
                {isTriggering ? "同步中..." : "手动同步"}
              </button>
              
              <button
                onClick={() => {
                  setTempConfig(status?.config || {})
                  setIsConfigOpen(true)
                }}
                disabled={connectionError}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isDark 
                    ? "bg-stone-700 hover:bg-stone-600 text-stone-200" 
                    : "bg-stone-200 hover:bg-stone-300 text-stone-800",
                  connectionError && "opacity-50 cursor-not-allowed"
                )}
              >
                <Settings className="h-4 w-4" />
                配置
              </button>
            </div>
          </div>
        </div>

        {/* --- BEGIN COMMENT ---
        统计信息
        --- END COMMENT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={cn(
            "p-6 rounded-xl border",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className={cn("text-2xl font-bold", isDark ? "text-stone-100" : "text-stone-800")}>
                  {status?.stats.totalSyncs || 0}
                </div>
                <div className={cn("text-sm", isDark ? "text-stone-400" : "text-stone-600")}>
                  总同步次数
                </div>
              </div>
            </div>
          </div>

          <div className={cn(
            "p-6 rounded-xl border",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className={cn("text-2xl font-bold", isDark ? "text-stone-100" : "text-stone-800")}>
                  {status?.stats.successfulSyncs || 0}
                </div>
                <div className={cn("text-sm", isDark ? "text-stone-400" : "text-stone-600")}>
                  成功次数
                </div>
              </div>
            </div>
          </div>

          <div className={cn(
            "p-6 rounded-xl border",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className={cn("text-2xl font-bold", isDark ? "text-stone-100" : "text-stone-800")}>
                  {status?.stats.failedSyncs || 0}
                </div>
                <div className={cn("text-sm", isDark ? "text-stone-400" : "text-stone-600")}>
                  失败次数
                </div>
              </div>
            </div>
          </div>

          <div className={cn(
            "p-6 rounded-xl border",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className={cn("text-sm font-medium", isDark ? "text-stone-100" : "text-stone-800")}>
                  {status?.stats.lastSyncTime 
                    ? new Date(status.stats.lastSyncTime).toLocaleString('zh-CN')
                    : "从未同步"
                  }
                </div>
                <div className={cn("text-sm", isDark ? "text-stone-400" : "text-stone-600")}>
                  上次同步
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- BEGIN COMMENT ---
        成功率显示
        --- END COMMENT --- */}
        {status && status.stats.totalSyncs > 0 && (
          <div className={cn(
            "p-4 rounded-lg border",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  (status.stats.successfulSyncs / status.stats.totalSyncs) > 0.8 
                    ? "bg-green-500" 
                    : (status.stats.successfulSyncs / status.stats.totalSyncs) > 0.5 
                      ? "bg-yellow-500" 
                      : "bg-red-500"
                )} />
                <span className="text-sm font-medium">
                  成功率: {Math.round((status.stats.successfulSyncs / status.stats.totalSyncs) * 100)}%
                </span>
              </div>
              <div className="text-sm text-stone-500">
                {status.stats.successfulSyncs} / {status.stats.totalSyncs} 次成功
              </div>
            </div>
          </div>
        )}

        {/* --- BEGIN COMMENT ---
        下次同步时间和重置按钮
        --- END COMMENT --- */}
        {status?.stats.nextSyncTime && (
          <div className={cn(
            "p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
            isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
          )}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-stone-500" />
              <span className="text-sm">
                下次同步时间: {new Date(status.stats.nextSyncTime).toLocaleString('zh-CN')}
              </span>
            </div>
            <button
              onClick={handleResetStats}
              disabled={connectionError}
              className={cn(
                "text-sm px-3 py-1 rounded transition-colors",
                isDark 
                  ? "text-stone-400 hover:text-stone-200 hover:bg-stone-700" 
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-100",
                connectionError && "opacity-50 cursor-not-allowed"
              )}
            >
              重置统计
            </button>
          </div>
        )}

        {/* --- BEGIN COMMENT ---
        配置模态框
        --- END COMMENT --- */}
        {isConfigOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={cn(
              "w-full max-w-lg rounded-xl p-6 border",
              isDark ? "bg-stone-800 border-stone-700" : "bg-white border-stone-200"
            )}>
              <h3 className={cn("text-xl font-bold mb-6", isDark ? "text-stone-100" : "text-stone-800")}>
                同步配置
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={cn("block text-sm font-medium mb-2", isDark ? "text-stone-300" : "text-stone-700")}>
                    是否启用
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tempConfig.enabled ?? false}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      className={cn(
                        "rounded",
                        isDark ? "bg-stone-700 border-stone-600" : "bg-white border-stone-300"
                      )}
                    />
                    <span className="text-sm">启用自动同步</span>
                  </label>
                </div>
                
                <div>
                  <label className={cn("block text-sm font-medium mb-2", isDark ? "text-stone-300" : "text-stone-700")}>
                    同步间隔（分钟）
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={tempConfig.interval ?? 60}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      isDark 
                        ? "bg-stone-700 border-stone-600 text-stone-200" 
                        : "bg-white border-stone-300 text-stone-800"
                    )}
                  />
                  <p className="text-xs text-stone-500 mt-1">建议值：30-120分钟</p>
                </div>
                
                <div>
                  <label className={cn("block text-sm font-medium mb-2", isDark ? "text-stone-300" : "text-stone-700")}>
                    批次大小
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={tempConfig.batchSize ?? 10}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      isDark 
                        ? "bg-stone-700 border-stone-600 text-stone-200" 
                        : "bg-white border-stone-300 text-stone-800"
                    )}
                  />
                  <p className="text-xs text-stone-500 mt-1">每批次处理的应用数量</p>
                </div>
                
                <div>
                  <label className={cn("block text-sm font-medium mb-2", isDark ? "text-stone-300" : "text-stone-700")}>
                    最大重试次数
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={tempConfig.maxRetries ?? 3}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      isDark 
                        ? "bg-stone-700 border-stone-600 text-stone-200" 
                        : "bg-white border-stone-300 text-stone-800"
                    )}
                  />
                  <p className="text-xs text-stone-500 mt-1">同步失败时的重试次数</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {isSaving ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={() => {
                    setIsConfigOpen(false)
                    setTempConfig({})
                  }}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                    isDark 
                      ? "bg-stone-700 hover:bg-stone-600 text-stone-200" 
                      : "bg-stone-200 hover:bg-stone-300 text-stone-800"
                  )}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 