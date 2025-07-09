'use client';

import { useCurrentApp } from '@lib/hooks/use-current-app';
import { useTheme } from '@lib/hooks/use-theme';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useChatStore } from '@lib/stores/chat-store';
import { cn } from '@lib/utils';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

// 🎯 多提供商支持：模型选择器现在支持来自不同提供商的模型
// 过滤逻辑基于 app_type === 'model'，不再限制特定提供商
// 保持向后兼容，现有的 Dify 模型仍然正常工作
// 从chat-input.tsx导入全局焦点管理器
import { useFocusManager } from './chat-input';

interface ModelSelectorButtonProps {
  className?: string;
}

export function ModelSelectorButton({ className }: ModelSelectorButtonProps) {
  const { currentAppId, switchToSpecificApp, isValidating } = useCurrentApp();
  const { apps, fetchApps, isLoading } = useAppListStore();
  const { clearMessages } = useChatStore();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isOptimisticSwitching, setIsOptimisticSwitching] = useState(false);

  // 获取全局焦点管理器
  const { focusInput } = useFocusManager();
  const t = useTranslations('pages.chat.modelSelector');

  // 获取可用的app列表
  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // 🎯 过滤出模型类型的应用
  // 支持多提供商：只要 app_type === 'model' 就显示，不限制提供商
  // 这样可以显示来自不同提供商（Dify、OpenAI、Claude等）的模型
  const modelApps = apps.filter(app => {
    const metadata = app.config?.app_metadata;
    return metadata?.app_type === 'model';
  });

  // 🎯 最后使用模型记忆机制
  // 当从非模型应用回到聊天界面时，自动恢复到最后使用的模型
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

  // 🎯 简化模型选择逻辑：
  // 1. 如果当前应用是模型类型，直接使用
  // 2. 如果当前应用不是模型类型，尝试恢复最后使用的模型
  // 3. 如果没有最后使用的模型或该模型不可用，选择第一个可用模型
  // 🎯 修复：使用instance_id进行匹配，因为currentAppId存储的是instance_id而不是UUID
  const currentApp = modelApps.find(app => app.instance_id === currentAppId);
  const isCurrentAppModel = !!currentApp;

  // 获取应该显示的模型应用
  const getTargetModelApp = () => {
    // 如果当前应用就是模型类型，直接使用
    if (isCurrentAppModel) {
      return currentApp;
    }

    // 如果当前应用不是模型类型，尝试恢复最后使用的模型
    const lastUsedModelId = getLastUsedModel();
    if (lastUsedModelId) {
      // 🎯 修复：使用instance_id进行匹配，因为lastUsedModelId存储的是instance_id
      const lastUsedModel = modelApps.find(
        app => app.instance_id === lastUsedModelId
      );
      if (lastUsedModel) {
        return lastUsedModel;
      }
    }

    // 如果没有最后使用的模型或该模型不可用，选择第一个可用模型
    return modelApps.length > 0 ? modelApps[0] : null;
  };

  const targetModelApp = getTargetModelApp();

  // 🎯 简化应用切换：移除自动跳转，让用户控制导航
  const handleAppChange = useCallback(
    async (newAppId: string) => {
      if (newAppId === currentAppId) {
        setIsOpen(false);
        setTimeout(() => focusInput(), 0);
        return;
      }

      try {
        // 立即关闭下拉菜单
        setIsOpen(false);

        // 开始乐观切换状态（显示spinner）
        setIsOptimisticSwitching(true);

        // 🎯 记录最后使用的模型（仅当切换到模型类型应用时）
        // 🎯 修复：使用instance_id进行匹配，因为newAppId是instance_id
        const targetApp = modelApps.find(app => app.instance_id === newAppId);
        if (targetApp) {
          setLastUsedModel(newAppId);

          // 🎯 静默切换应用，不强制跳转页面
          // switchToSpecificApp需要instance_id，不是数据库UUID
          await switchToSpecificApp(targetApp.instance_id);
        } else {
          throw new Error(`未找到应用: ${newAppId}`);
        }

        // 切换成功后清理聊天状态
        clearMessages();

        console.log(`已切换到app: ${newAppId}`);
      } catch (error) {
        console.error('切换app失败:', error);
        // @future 显示用户友好的错误提示
      } finally {
        // 结束乐观切换状态
        setIsOptimisticSwitching(false);

        // 无论成功还是失败，都要确保恢复输入框焦点
        // 使用setTimeout确保在状态更新完成后执行
        setTimeout(() => focusInput(), 0);
      }
    },
    [
      currentAppId,
      focusInput,
      modelApps,
      setLastUsedModel,
      switchToSpecificApp,
      clearMessages,
    ]
  );

  // 🎯 简化自动恢复逻辑：只在组件初始化时执行一次
  // 移除复杂的路径检查和定时器，避免竞态条件
  useEffect(() => {
    // 只在有模型应用且当前应用不是模型类型时才尝试恢复
    if (
      modelApps.length > 0 &&
      !isCurrentAppModel &&
      currentAppId &&
      targetModelApp &&
      targetModelApp.instance_id !== currentAppId
    ) {
      console.log(
        `检测到非模型应用 ${currentAppId}，静默恢复到模型: ${targetModelApp.instance_id}`
      );

      // 🎯 修复：在静默切换前先记录到localStorage，确保首次登录时也能正确保存模型选择
      setLastUsedModel(targetModelApp.instance_id);

      // 静默切换，不显示loading状态，不强制跳转
      switchToSpecificApp(targetModelApp.instance_id).catch(error => {
        console.warn('静默恢复模型失败:', error);
      });
    }
  }, [
    modelApps.length,
    isCurrentAppModel,
    currentAppId,
    targetModelApp?.instance_id,
  ]); // 移除handleAppChange依赖，避免循环

  // 🎯 显示状态判断：
  // 1. 如果正在验证或自动切换，显示loading状态
  // 2. 如果当前应用是模型类型，显示当前模型名称
  // 3. 如果有目标模型，显示目标模型名称
  // 4. 否则显示默认文本
  const getDisplayState = () => {
    // 如果当前应用是模型类型，显示当前模型
    if (isCurrentAppModel && currentApp) {
      return {
        isLoading: false,
        name: currentApp.display_name || currentApp.instance_id,
      };
    }

    // 如果有目标模型，显示目标模型
    if (targetModelApp) {
      return {
        isLoading: false,
        name: targetModelApp.display_name || targetModelApp.instance_id,
      };
    }

    // 没有可用模型
    if (modelApps.length === 0) {
      return { isLoading: false, name: t('noModelsAvailable') };
    }

    // 默认状态
    return { isLoading: false, name: t('selectModel') };
  };

  const displayState = getDisplayState();

  // 修改：处理下拉菜单的打开/关闭，确保操作后恢复焦点
  const handleToggleDropdown = useCallback(
    (e: React.MouseEvent) => {
      // 阻止事件冒泡，避免触发其他元素的点击事件
      e.preventDefault();
      e.stopPropagation();

      setIsOpen(prev => {
        const newIsOpen = !prev;

        // 如果是关闭下拉菜单，恢复输入框焦点
        // 如果是打开，焦点会自然地在下拉菜单上，这是期望的行为
        if (!newIsOpen) {
          setTimeout(() => focusInput(), 0);
        }

        return newIsOpen;
      });
    },
    [focusInput]
  );

  // 修改：处理背景点击关闭下拉菜单，确保恢复焦点
  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
    // 背景点击关闭下拉菜单后，恢复输入框焦点
    setTimeout(() => focusInput(), 0);
  }, [focusInput]);

  // 获取当前选中的app名称
  const currentAppName = displayState.name;

  // 🎯 骨架屏：只在真正需要时显示，避免频繁闪烁
  // 仅在首次加载且没有模型数据时显示骨架屏
  if (isLoading && modelApps.length === 0) {
    return (
      <div className={cn('flex items-center', className)}>
        <div
          className={cn(
            'h-4 animate-pulse rounded',
            'w-16 sm:w-20 md:w-24', // 响应式宽度
            isDark ? 'bg-stone-500/60' : 'bg-stone-300/60' // 🎯 修复：暗黑模式使用更亮的stone-500
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Main button: borderless, no background, serif font, stone color scheme */}
      {/* Remove width restrictions, allow leftward expansion to show full name */}
      {/* Modified: use custom click handler to ensure focus management */}
      <button
        onClick={handleToggleDropdown}
        // 添加onMouseDown防止按钮点击时输入框失去焦点
        onMouseDown={e => e.preventDefault()}
        className={cn(
          'flex items-center space-x-1 rounded-md px-2 py-1 font-serif text-sm',
          'transition-colors duration-200',
          // Add fixed height and vertical center alignment, ensure serif font is vertically centered
          // Cursor control: only show pointer when dropdown is closed
          'h-8 min-h-[2rem]',
          !isOpen ? 'cursor-pointer' : '',
          isDark
            ? 'text-stone-300 hover:bg-stone-800/50'
            : 'text-stone-600 hover:bg-stone-100'
        )}
      >
        {/* App name: remove width restrictions and truncate, allow full name display */}
        {/* Add vertical center alignment to ensure serif font displays correctly */}
        <span
          className={cn(
            'font-serif whitespace-nowrap',
            'flex items-center leading-none'
          )}
        >
          {currentAppName}
        </span>

        {/* Right icon area: fixed width, shows chevron up/down or spinner */}
        {/* Supports spinner display for validation state */}
        <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
          {isOptimisticSwitching || isValidating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </div>
      </button>

      {/* Dropdown menu: only shows model-type applications */}
      {/* Modified: use custom click handler to ensure focus management */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div className="fixed inset-0 z-10" onClick={handleBackdropClick} />

          {/* Dropdown options: adjust positioning, ensure left alignment with button, allow wider dropdown */}
          <div
            className={cn(
              'absolute bottom-full left-0 mb-1 max-w-[16rem] min-w-[8rem]',
              'z-20 max-h-48 overflow-y-auto rounded-md shadow-lg',
              'border',
              isDark
                ? 'border-stone-600/80 bg-stone-700/95 backdrop-blur-sm'
                : 'border-stone-300/80 bg-stone-50/95 backdrop-blur-sm'
            )}
          >
            {modelApps.length === 0 ? (
              <div
                className={cn(
                  'px-3 py-2 font-serif text-sm',
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}
              >
                {t('noModelsAvailable')}
              </div>
            ) : (
              modelApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => handleAppChange(app.instance_id)}
                  // 添加onMouseDown防止按钮点击时输入框失去焦点
                  onMouseDown={e => e.preventDefault()}
                  className={cn(
                    'w-full px-3 py-2 text-left font-serif text-sm',
                    'transition-colors duration-150',
                    // Remove truncate, allow full app name display
                    // Use whitespace-nowrap to prevent line breaks, but allow horizontal scrolling
                    // Add cursor pointer
                    'cursor-pointer whitespace-nowrap',
                    isDark ? 'hover:bg-stone-600/60' : 'hover:bg-stone-200/60',
                    app.instance_id === currentAppId &&
                      (isDark
                        ? 'bg-stone-600/80 font-medium text-stone-100'
                        : 'bg-stone-200/80 font-medium text-stone-800'),
                    app.instance_id !== currentAppId &&
                      (isDark ? 'text-stone-300' : 'text-stone-600')
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
