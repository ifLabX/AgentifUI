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

interface AppSelectorButtonProps {
  className?: string;
}

export function AppSelectorButton({ className }: AppSelectorButtonProps) {
  const router = useRouter();
  const { currentAppId, switchToSpecificApp, isValidating } = useCurrentApp();
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
  // 获取可用的app列表
  // --- END COMMENT ---
  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // --- BEGIN COMMENT ---
  // 🎯 过滤出模型类型的应用
  // 只保留配置了app_type为model的应用
  // --- END COMMENT ---
  const modelApps = apps.filter(app => {
    const metadata = app.config?.app_metadata;
    return metadata?.app_type === 'model';
  });

  // --- BEGIN COMMENT ---
  // 🎯 最后使用模型记忆机制
  // 当从非模型应用回到聊天界面时，自动恢复到最后使用的模型
  // --- END COMMENT ---
  const getLastUsedModel = () => {
    try {
      return localStorage.getItem('last-used-model-app-id');
    } catch {
      return null;
    }
  };

  const setLastUsedModel = (appId: string) => {
    try {
      localStorage.setItem('last-used-model-app-id', appId);
    } catch {
      // 忽略localStorage错误
    }
  };

  // --- BEGIN COMMENT ---
  // 🎯 智能模型选择逻辑：
  // 1. 如果当前应用是模型类型，直接使用
  // 2. 如果当前应用不是模型类型，尝试恢复最后使用的模型
  // 3. 如果没有最后使用的模型或该模型不可用，选择第一个可用模型
  // --- END COMMENT ---
  const currentApp = modelApps.find(app => app.id === currentAppId);
  const isCurrentAppModel = !!currentApp;
  
  // --- BEGIN COMMENT ---
  // 🎯 智能验证和切换逻辑：
  // 当从非模型应用回到聊天界面时，自动验证并切换到合适的模型
  // 显示loading状态，就像重新进入页面一样
  // --- END COMMENT ---
  const [isAutoSwitching, setIsAutoSwitching] = useState(false);
  
  // 获取应该显示的模型应用
  const getTargetModelApp = () => {
    // 如果当前应用就是模型类型，直接使用
    if (isCurrentAppModel) {
      return currentApp;
    }
    
    // 如果当前应用不是模型类型，尝试恢复最后使用的模型
    const lastUsedModelId = getLastUsedModel();
    if (lastUsedModelId) {
      const lastUsedModel = modelApps.find(app => app.id === lastUsedModelId);
      if (lastUsedModel) {
        return lastUsedModel;
      }
    }
    
    // 如果没有最后使用的模型或该模型不可用，选择第一个可用模型
    return modelApps.length > 0 ? modelApps[0] : null;
  };

  const targetModelApp = getTargetModelApp();
  
  // --- BEGIN COMMENT ---
  // 🎯 纯乐观UI应用切换：立即更新UI，无任何API调用
  // 发送消息时的验证会在handleSubmit中自动触发
  // --- END COMMENT ---
  const handleAppChange = useCallback(async (newAppId: string) => {
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
      
      // 开始乐观切换状态（显示spinner）
      setIsOptimisticSwitching(true);
      
      // --- BEGIN COMMENT ---
      // 🎯 记录最后使用的模型（仅当切换到模型类型应用时）
      // --- END COMMENT ---
      const targetApp = modelApps.find(app => app.id === newAppId);
      if (targetApp) {
        setLastUsedModel(newAppId);
      }
      
      // --- BEGIN COMMENT ---
      // 🎯 纯乐观UI：使用switchToSpecificApp方法进行切换
      // 这个方法会处理从AppInfo到ServiceInstance的转换
      // --- END COMMENT ---
      await switchToSpecificApp(newAppId);
      
      // --- BEGIN COMMENT ---
      // 切换成功后清理聊天状态
      // --- END COMMENT ---
      clearMessages();
      
      // --- BEGIN COMMENT ---
      // 🎯 使用Next.js路由进行页面跳转，避免硬刷新
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
  }, [currentAppId, focusInput, modelApps, setLastUsedModel, switchToSpecificApp, clearMessages, router]);
  
  useEffect(() => {
    // --- BEGIN COMMENT ---
    // 🎯 修复：只在用户访问新对话页面时才自动切换
    // 不要在历史对话页面或应用详情页面进行自动切换，避免强制跳转到chat/new
    // --- END COMMENT ---
    const timer = setTimeout(() => {
      // 只有当前应用不是模型类型且有目标模型时才自动切换
      // 但要确保这不是用户刚刚主动切换的结果
      if (!isCurrentAppModel && targetModelApp && currentAppId && !isOptimisticSwitching && !isAutoSwitching) {
        // 检查当前路径是否是新对话页面，只在新对话页面才自动切换
        const pathname = window.location.pathname;
        const isOnNewChatPage = pathname === '/chat/new'
        const isOnAppDetailPage = pathname && pathname.startsWith('/apps/') && pathname.split('/').length === 4
        
        // --- BEGIN COMMENT ---
        // 🎯 修复：不在应用详情页面进行自动切换，避免干扰用户访问应用
        // --- END COMMENT ---
        if (isOnNewChatPage && !isOnAppDetailPage) {
          console.log(`在新对话页面检测到非模型应用 ${currentAppId}，自动切换到模型: ${targetModelApp.id}`);
          
          setIsAutoSwitching(true);
          
          handleAppChange(targetModelApp.id).finally(() => {
            setIsAutoSwitching(false);
          });
        }
      }
    }, 500); // 延迟500ms，给用户操作留出时间

    return () => clearTimeout(timer);
  }, [isCurrentAppModel, targetModelApp?.id, currentAppId, isOptimisticSwitching, isAutoSwitching, handleAppChange]);

  // --- BEGIN COMMENT ---
  // 🎯 显示状态判断：
  // 1. 如果正在验证或自动切换，显示loading状态
  // 2. 如果当前应用是模型类型，显示当前模型名称
  // 3. 如果有目标模型，显示目标模型名称
  // 4. 否则显示默认文本
  // --- END COMMENT ---
  const getDisplayState = () => {
    // 如果当前应用是模型类型，显示当前模型
    if (isCurrentAppModel && currentApp) {
      return { isLoading: false, name: currentApp.display_name || currentApp.instance_id };
    }
    
    // 如果有目标模型，显示目标模型
    if (targetModelApp) {
      return { isLoading: false, name: targetModelApp.display_name || targetModelApp.instance_id };
    }
    
    // 没有可用模型
    if (modelApps.length === 0) {
      return { isLoading: false, name: "暂无可用模型" };
    }
    
    // 默认状态
    return { isLoading: false, name: "选择模型" };
  };

  const displayState = getDisplayState();

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
  const currentAppName = displayState.name;

  // --- BEGIN COMMENT ---
  // 🎯 骨架屏：固定长度的响应式骨架屏
  // 移动端较短，桌面端较长
  // 🎯 修复：暗黑模式下使用更亮的颜色，确保与输入框背景有对比度
  // 🎯 修改：把原来显示"验证中..."的时机改成显示骨架屏
  // --- END COMMENT ---
  if ((isLoading && modelApps.length === 0) || isValidating || isAutoSwitching) {
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
        // --- BEGIN COMMENT ---
        // 添加onMouseDown防止按钮点击时输入框失去焦点
        // --- END COMMENT ---
        onMouseDown={(e) => e.preventDefault()}
        className={cn(
          "flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-serif",
          "transition-colors duration-200",
          // --- BEGIN MODIFIED COMMENT ---
          // 添加固定高度和垂直居中对齐，确保serif字体垂直居中
          // cursor控制：只有在下拉框关闭时显示pointer
          // --- END MODIFIED COMMENT ---
          "h-8 min-h-[2rem]",
          !isOpen ? "cursor-pointer" : "",
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
        支持验证状态的spinner显示
        --- END COMMENT --- */}
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {(isOptimisticSwitching || isValidating || isAutoSwitching) ? (
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
                  {app.display_name || app.instance_id}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
} 