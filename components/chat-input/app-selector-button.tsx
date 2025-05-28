"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentApp } from '@lib/hooks/use-current-app';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useChatStore } from '@lib/stores/chat-store';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface AppSelectorButtonProps {
  className?: string;
}

export function AppSelectorButton({ className }: AppSelectorButtonProps) {
  const router = useRouter();
  const { currentAppId, validateConfig, isValidating } = useCurrentApp();
  const { apps, fetchApps, isLoading } = useAppListStore();
  const { clearMessages } = useChatStore();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isOptimisticSwitching, setIsOptimisticSwitching] = useState(false);

  // --- BEGIN COMMENT ---
  // 🎯 获取可用的app列表，现在会自动触发批量参数获取
  // --- END COMMENT ---
  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // --- BEGIN COMMENT ---
  // 🎯 过滤出模型类型的应用
  // 优先级：有元数据配置的模型 > 根据名称推断的模型
  // --- END COMMENT ---
  const modelApps = apps.filter(app => {
    const metadata = app.config?.app_metadata;
    
    // 如果有元数据配置，检查是否为模型类型
    if (metadata) {
      return metadata.app_type === 'model';
    }
    
    // 如果没有元数据配置，根据名称进行启发式判断
    const appName = (app.display_name || app.name || app.instance_id).toLowerCase();
    const modelKeywords = ['gpt', 'claude', 'gemini', 'llama', 'qwen', '通义', '模型', 'model', 'chat', '对话'];
    const marketplaceKeywords = ['翻译', 'translate', '代码', 'code', '助手', 'assistant', '工具', 'tool', '生成', 'generate'];
    
    const isLikelyModel = modelKeywords.some(keyword => appName.includes(keyword));
    const isLikelyMarketplace = marketplaceKeywords.some(keyword => appName.includes(keyword));
    
    // 只有明确是模型且不是应用市场应用才包含
    return isLikelyModel && !isLikelyMarketplace;
  });

  // --- BEGIN COMMENT ---
  // 🎯 乐观UI：应用切换处理
  // 立即关闭下拉菜单，显示切换后的应用名称，右侧显示小spinner
  // --- END COMMENT ---
  const handleAppChange = async (newAppId: string) => {
    if (newAppId === currentAppId) {
      setIsOpen(false);
      return;
    }

    try {
      // 立即关闭下拉菜单
      setIsOpen(false);
      
      // 开始乐观切换状态
      setIsOptimisticSwitching(true);
      
      // --- BEGIN COMMENT ---
      // 🎯 使用 validateConfig 进行应用切换，现在参数已预缓存
      // 指定为切换上下文，不触发消息输入框的spinner
      // --- END COMMENT ---
      await validateConfig(newAppId, 'switch');
      
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
    } catch (error) {
      console.error('切换app失败:', error);
      // TODO: 显示用户友好的错误提示
    } finally {
      // 结束乐观切换状态
      setIsOptimisticSwitching(false);
    }
  };

  // 获取当前选中的app名称
  const currentApp = modelApps.find(app => app.id === currentAppId);
  const currentAppName = currentApp?.display_name || currentApp?.name || '选择模型';

  // --- BEGIN COMMENT ---
  // 🎯 骨架屏：固定长度的响应式骨架屏
  // 移动端较短，桌面端较长
  // 🎯 修复：暗黑模式下使用更亮的颜色，确保与输入框背景有对比度
  // --- END COMMENT ---
  if (isLoading && modelApps.length === 0) {
    return (
      <div className={cn("flex items-center", className)}>
        <div 
          className={cn(
            "h-4 rounded animate-pulse",
            "w-16 sm:w-20 md:w-24", // 响应式宽度
            isDark ? "bg-stone-500/60" : "bg-stone-300/60" // 🎯 修复：暗黑模式使用更亮的stone-500
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* --- BEGIN COMMENT ---
      主按钮：无边框无背景，serif字体，stone配色
      可以向左延伸，右侧距离固定
      --- END COMMENT --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isValidating}
        className={cn(
          "flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-serif",
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isDark 
            ? "hover:bg-stone-800/50 text-stone-300" 
            : "hover:bg-stone-100 text-stone-600"
        )}
      >
        {/* --- BEGIN COMMENT ---
        应用名称：可以向左延伸，使用truncate防止过长
        --- END COMMENT --- */}
        <span className="truncate max-w-[4rem] sm:max-w-[5rem] md:max-w-[6rem] font-serif">
          {currentAppName}
        </span>
        
        {/* --- BEGIN COMMENT ---
        右侧图标区域：固定宽度，显示v/反v或spinner
        --- END COMMENT --- */}
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {isOptimisticSwitching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </div>
      </button>

      {/* --- BEGIN COMMENT ---
      下拉菜单：只显示模型类型的应用
      --- END COMMENT --- */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉选项 */}
          <div className={cn(
            "absolute bottom-full left-0 mb-1 min-w-[8rem] max-w-[12rem]",
            "rounded-md shadow-lg z-20 max-h-48 overflow-y-auto",
            "border",
            isDark 
              ? "bg-stone-700/95 border-stone-600/80 backdrop-blur-sm" 
              : "bg-stone-50/95 border-stone-300/80 backdrop-blur-sm"
          )}>
            {modelApps.length === 0 ? (
              <div className={cn(
                "px-3 py-2 text-sm font-serif",
                isDark ? "text-stone-400" : "text-stone-500"
              )}>
                暂无可用模型
              </div>
            ) : (
              modelApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => handleAppChange(app.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-serif",
                    "transition-colors duration-150 truncate",
                    isDark 
                      ? "hover:bg-stone-600/60" 
                      : "hover:bg-stone-200/60",
                    app.id === currentAppId && (
                      isDark 
                        ? "bg-stone-600/80 text-stone-100 font-medium" 
                        : "bg-stone-200/80 text-stone-800 font-medium"
                    ),
                    app.id !== currentAppId && (
                      isDark ? "text-stone-300" : "text-stone-600"
                    )
                  )}
                >
                  {app.display_name || app.name}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
} 