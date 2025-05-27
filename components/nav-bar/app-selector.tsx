"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentApp } from '@lib/hooks/use-current-app';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useChatStore } from '@lib/stores/chat-store';
import { cn } from '@lib/utils';
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react';

export function AppSelector() {
  const router = useRouter();
  const { currentAppId, validateConfig, isValidating } = useCurrentApp();
  const { apps, fetchApps, isLoading, error } = useAppListStore();
  const { clearMessages } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);

  // --- BEGIN COMMENT ---
  // 🎯 获取可用的app列表，现在会自动触发批量参数获取
  // --- END COMMENT ---
  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleAppChange = async (newAppId: string) => {
    if (newAppId === currentAppId) {
      setIsOpen(false);
      return;
    }

    try {
      // --- BEGIN COMMENT ---
      // 🎯 使用 validateConfig 进行应用切换，现在参数已预缓存
      // --- END COMMENT ---
      await validateConfig(newAppId);
      
      // --- BEGIN COMMENT ---
      // 切换成功后清理聊天状态
      // --- END COMMENT ---
      clearMessages();
      
      // --- BEGIN COMMENT ---
      // 🎯 使用Next.js路由进行页面跳转，避免硬刷新
      // 这样可以保持应用状态，包括预缓存的参数
      // --- END COMMENT ---
      router.push('/chat/new');
      
      console.log(`已切换到app: ${newAppId}`);
      setIsOpen(false);
    } catch (error) {
      console.error('切换app失败:', error);
      // TODO: 显示用户友好的错误提示
    }
  };

  // 获取当前选中的app名称
  const currentApp = apps.find(app => app.id === currentAppId);
  const currentAppName = currentApp?.name || '选择应用';

  // 如果正在加载且没有apps，显示加载状态
  if (isLoading && apps.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500">
        <Loader2 size={14} className="animate-spin" />
        <span>加载应用列表...</span>
      </div>
    );
  }

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm text-red-500">
        <AlertCircle size={14} />
        <span>加载失败</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isValidating || isLoading}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium",
          "bg-white border border-gray-200 hover:bg-gray-50",
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "min-w-[160px] justify-between"
        )}
      >
        <span className="truncate">{currentAppName}</span>
        <div className="flex items-center space-x-1">
          {(isValidating || isLoading) && (
            <Loader2 size={14} className="animate-spin" />
          )}
          <ChevronDown 
            size={14} 
            className={cn(
              "transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </div>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉选项 */}
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
            {apps.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                暂无可用应用
              </div>
            ) : (
              apps.map(app => (
                <button
                  key={app.id}
                  onClick={() => handleAppChange(app.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-gray-50",
                    "transition-colors duration-150",
                    app.id === currentAppId && "bg-blue-50 text-blue-600 font-medium"
                  )}
                >
                  {app.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
} 