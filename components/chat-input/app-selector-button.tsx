"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentApp } from '@lib/hooks/use-current-app';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useChatStore } from '@lib/stores/chat-store';
import { useTheme } from '@lib/hooks/use-theme';
import { cn } from '@lib/utils';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// --- BEGIN COMMENT ---
// 从chat-input.tsx导入全局焦点管理器
// --- END COMMENT ---
import { useFocusManager } from './chat-input';

// --- BEGIN COMMENT ---
// 🎯 新增：导入新的应用参数服务
// --- END COMMENT ---
import { appParametersService } from '@lib/services/app-parameters-service';

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
  // 获取全局焦点管理器
  // --- END COMMENT ---
  const { focusInput } = useFocusManager();

  // --- BEGIN COMMENT ---
  // 🎯 获取可用的app列表，现在会自动触发批量参数获取
  // --- END COMMENT ---
  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // --- BEGIN COMMENT ---
  // 🎯 新增：当应用列表加载完成后，批量预缓存模型应用的参数
  // --- END COMMENT ---
  useEffect(() => {
    const performBatchSync = async () => {
      if (!isLoading && apps.length > 0) {
        // 过滤出模型类型的应用ID
        const modelAppIds = apps
          .filter(app => {
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
            
            return isLikelyModel && !isLikelyMarketplace;
          })
          .map(app => app.id);

        if (modelAppIds.length > 0) {
          console.log(`[app-selector-button] 开始批量同步 ${modelAppIds.length} 个模型应用的参数`);
          try {
            // --- BEGIN COMMENT ---
            // 🎯 使用appParametersService的批量同步方法
            // --- END COMMENT ---
            const result = await appParametersService.batchSync(modelAppIds);
            if (result.success) {
              console.log('[app-selector-button] 批量同步完成');
            } else {
              console.warn('[app-selector-button] 批量同步部分失败:', result.error);
            }
          } catch (error) {
            console.warn('[app-selector-button] 批量同步失败，但不影响用户操作:', error);
          }
        }
      }
    };

    performBatchSync();
  }, [isLoading, apps]);

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
  // 修改：确保在操作完成后恢复输入框焦点
  // 🎯 新增：在切换前预缓存目标应用的参数
  // --- END COMMENT ---
  const handleAppChange = async (newAppId: string) => {
    if (newAppId === currentAppId) {
      setIsOpen(false);
      // --- BEGIN COMMENT ---
      // 即使没有实际切换，也要恢复焦点
      // --- END COMMENT ---
      setTimeout(() => focusInput(), 0);
      return;
    }

    try {
      // 立即关闭下拉菜单
      setIsOpen(false);
      
      // 开始乐观切换状态
      setIsOptimisticSwitching(true);
      
      // --- BEGIN COMMENT ---
      // 🎯 新增：在切换前预缓存目标应用的参数
      // 在后台静默缓存，不阻塞切换过程
      // --- END COMMENT ---
      appParametersService.getAppParameters(newAppId)
        .then(() => {
          console.log(`[app-selector-button] 成功预缓存应用 ${newAppId} 的参数`);
        })
        .catch((error) => {
          console.warn(`[app-selector-button] 预缓存应用 ${newAppId} 参数失败，但不影响切换:`, error);
        });
      
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
      
      // --- BEGIN COMMENT ---
      // 无论成功还是失败，都要确保恢复输入框焦点
      // 使用setTimeout确保在状态更新完成后执行
      // --- END COMMENT ---
      setTimeout(() => focusInput(), 0);
    }
  };

  // --- BEGIN COMMENT ---
  // 修改：处理下拉菜单的打开/关闭，确保操作后恢复焦点
  // --- END COMMENT ---
  const handleToggleDropdown = useCallback((e: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发其他元素的点击事件
    e.preventDefault();
    e.stopPropagation();
    
    setIsOpen(prev => {
      const newIsOpen = !prev;
      
      // --- BEGIN COMMENT ---
      // 如果是关闭下拉菜单，恢复输入框焦点
      // 如果是打开，焦点会自然地在下拉菜单上，这是期望的行为
      // --- END COMMENT ---
      if (!newIsOpen) {
        setTimeout(() => focusInput(), 0);
      }
      
      return newIsOpen;
    });
  }, [focusInput]);

  // --- BEGIN COMMENT ---
  // 修改：处理背景点击关闭下拉菜单，确保恢复焦点
  // --- END COMMENT ---
  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
    // --- BEGIN COMMENT ---
    // 背景点击关闭下拉菜单后，恢复输入框焦点
    // --- END COMMENT ---
    setTimeout(() => focusInput(), 0);
  }, [focusInput]);

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
      {/* --- BEGIN MODIFIED COMMENT ---
      主按钮：无边框无背景，serif字体，stone配色
      移除宽度限制，允许向左扩展显示完整名称
      修改：使用自定义点击处理器确保焦点管理
      --- END MODIFIED COMMENT --- */}
      <button
        onClick={handleToggleDropdown}
        disabled={isValidating}
        // --- BEGIN COMMENT ---
        // 添加onMouseDown防止按钮点击时输入框失去焦点
        // --- END COMMENT ---
        onMouseDown={(e) => e.preventDefault()}
        className={cn(
          "flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-serif",
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // --- BEGIN MODIFIED COMMENT ---
          // 添加固定高度和垂直居中对齐，确保serif字体垂直居中
          // cursor控制：只有在下拉框关闭且未验证时显示pointer
          // --- END MODIFIED COMMENT ---
          "h-8 min-h-[2rem]",
          !isOpen && !isValidating ? "cursor-pointer" : "",
          isDark 
            ? "hover:bg-stone-800/50 text-stone-300" 
            : "hover:bg-stone-100 text-stone-600"
        )}
      >
        {/* --- BEGIN MODIFIED COMMENT ---
        应用名称：移除宽度限制和truncate，允许显示完整名称
        添加垂直居中对齐确保serif字体正确显示
        --- END MODIFIED COMMENT --- */}
        <span className={cn(
          "font-serif whitespace-nowrap",
          "flex items-center leading-none"
        )}>
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
      修改：使用自定义点击处理器确保焦点管理
      --- END COMMENT --- */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={handleBackdropClick}
          />
          
          {/* --- BEGIN MODIFIED COMMENT ---
          下拉选项：调整定位，确保与按钮左对齐，允许更宽的下拉菜单
          --- END MODIFIED COMMENT --- */}
          <div className={cn(
            "absolute bottom-full left-0 mb-1 min-w-[8rem] max-w-[16rem]",
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
                  // --- BEGIN COMMENT ---
                  // 添加onMouseDown防止按钮点击时输入框失去焦点
                  // --- END COMMENT ---
                  onMouseDown={(e) => e.preventDefault()}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-serif",
                    "transition-colors duration-150",
                    // --- BEGIN MODIFIED COMMENT ---
                    // 移除truncate，允许显示完整的应用名称
                    // 使用whitespace-nowrap防止换行，但允许水平滚动
                    // 添加cursor pointer
                    // --- END MODIFIED COMMENT ---
                    "whitespace-nowrap cursor-pointer",
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