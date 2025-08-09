'use client';

import { useCurrentApp } from '@lib/hooks/use-current-app';
import { useTheme } from '@lib/hooks/use-theme';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useChatStore } from '@lib/stores/chat-store';
import { cn } from '@lib/utils';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

// 🎯 Multi-provider support: model selector now supports models from different providers
// Filter logic based on app_type === 'model', no longer limited to specific providers
// Maintain backward compatibility, existing Dify models still work
// Import global focus manager from chat-input.tsx
import { useFocusManager } from './index';

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

  // Get global focus manager
  const { focusInput } = useFocusManager();
  const t = useTranslations('pages.chat.modelSelector');

  // Get available app list
  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // 🎯 Filter out model-type applications
  // Support multi-provider: display as long as app_type === 'model', no provider limit
  // This allows displaying models from different providers (Dify, OpenAI, Claude, etc.)
  const modelApps = apps.filter(app => {
    const metadata = app.config?.app_metadata;
    return metadata?.app_type === 'model';
  });

  // 🎯 Last used model memory mechanism
  // When returning from non-model application to chat interface, automatically restore the last used model
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
      // Ignore localStorage error
    }
  };

  // 🎯 Simplify model selection logic:
  // 1. If the current application is a model type, use it directly
  // 2. If the current application is not a model type, try to restore the last used model
  // 3. If there is no last used model or the model is not available, select the first available model
  // 🎯 Fix: use instance_id for matching, because currentAppId stores instance_id instead of UUID
  const currentApp = modelApps.find(app => app.instance_id === currentAppId);
  const isCurrentAppModel = !!currentApp;

  // Get the model application to be displayed
  const getTargetModelApp = () => {
    // If the current application is a model type, use it directly
    if (isCurrentAppModel) {
      return currentApp;
    }

    // If the current application is not a model type, try to restore the last used model
    const lastUsedModelId = getLastUsedModel();
    if (lastUsedModelId) {
      // 🎯 Fix: use instance_id for matching, because lastUsedModelId stores instance_id
      const lastUsedModel = modelApps.find(
        app => app.instance_id === lastUsedModelId
      );
      if (lastUsedModel) {
        return lastUsedModel;
      }
    }

    // If there is no last used model or the model is not available, select the first available model
    return modelApps.length > 0 ? modelApps[0] : null;
  };

  const targetModelApp = getTargetModelApp();

  // 🎯 Simplify application switching: remove automatic jump, let users control navigation
  const handleAppChange = useCallback(
    async (newAppId: string) => {
      if (newAppId === currentAppId) {
        setIsOpen(false);
        setTimeout(() => focusInput(), 0);
        return;
      }

      try {
        // Immediately close the dropdown menu
        setIsOpen(false);

        // Start optimistic switching state (display spinner)
        setIsOptimisticSwitching(true);

        // 🎯 Record the last used model (only when switching to model-type application)
        // 🎯 Fix: use instance_id for matching, because newAppId is instance_id
        const targetApp = modelApps.find(app => app.instance_id === newAppId);
        if (targetApp) {
          setLastUsedModel(newAppId);

          // 🎯 Silent application switching, no forced page jump
          // switchToSpecificApp needs instance_id, not database UUID
          await switchToSpecificApp(targetApp.instance_id);
        } else {
          throw new Error(t('appNotFound', { appId: newAppId }));
        }

        // After successful switching, clear the chat state
        clearMessages();

        console.log(`Switched to app: ${newAppId}`);
      } catch (error) {
        console.error('Switch app failed:', error);
        // @future Display user-friendly error message
      } finally {
        // End optimistic switching state
        setIsOptimisticSwitching(false);

        // Ensure input box focus is restored, whether successful or not
        // Use setTimeout to ensure execution after state update
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

  // 🎯 Simplify automatic recovery logic: only executed once during component initialization
  // Remove complex path checks and timers to avoid race conditions
  useEffect(() => {
    // Only attempt recovery when there are model applications and the current application is not a model type
    if (
      modelApps.length > 0 &&
      !isCurrentAppModel &&
      currentAppId &&
      targetModelApp &&
      targetModelApp.instance_id !== currentAppId
    ) {
      // 🎯 Fix: record to localStorage before silent switching, ensure correct model selection is saved on first login
      setLastUsedModel(targetModelApp.instance_id);

      // Silent switching, no loading state, no forced jump
      switchToSpecificApp(targetModelApp.instance_id).catch(error => {
        console.warn('Silent model recovery failed:', error);
      });
    }
  }, [
    modelApps.length,
    isCurrentAppModel,
    currentAppId,
    targetModelApp?.instance_id,
  ]); // Remove handleAppChange dependency to avoid loop

  // 🎯 Display state judgment:
  // 1. If validation or automatic switching is in progress, display loading state
  // 2. If the current application is a model type, display the current model name
  // 3. If there is a target model, display the target model name
  // 4. Otherwise, display the default text
  const getDisplayState = () => {
    // If the current application is a model type, display the current model name
    if (isCurrentAppModel && currentApp) {
      return {
        isLoading: false,
        name: currentApp.display_name || currentApp.instance_id,
      };
    }

    // If there is a target model, display the target model name
    if (targetModelApp) {
      return {
        isLoading: false,
        name: targetModelApp.display_name || targetModelApp.instance_id,
      };
    }

    // No available model
    if (modelApps.length === 0) {
      return { isLoading: false, name: t('noModelsAvailable') };
    }

    // Default state
    return { isLoading: false, name: t('selectModel') };
  };

  const displayState = getDisplayState();

  // Modify: handle dropdown menu open/close, ensure focus is restored after operation
  const handleToggleDropdown = useCallback(
    (e: React.MouseEvent) => {
      // Prevent event bubbling, avoid triggering clicks on other elements
      e.preventDefault();
      e.stopPropagation();

      setIsOpen(prev => {
        const newIsOpen = !prev;

        // If the dropdown menu is closed, restore the input box focus
        // If the dropdown menu is opened, the focus will naturally be on the dropdown menu, this is the expected behavior
        if (!newIsOpen) {
          setTimeout(() => focusInput(), 0);
        }

        return newIsOpen;
      });
    },
    [focusInput]
  );

  // Modify: handle background click to close the dropdown menu, ensure focus is restored
  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
    // After the background click closes the dropdown menu, restore the input box focus
    setTimeout(() => focusInput(), 0);
  }, [focusInput]);

  // Get the name of the currently selected app
  const currentAppName = displayState.name;

  // 🎯 Skeleton screen: only show when really needed, avoid frequent flickering
  // Only show when first loading and no model data
  if (isLoading && modelApps.length === 0) {
    return (
      <div className={cn('flex items-center', className)}>
        <div
          className={cn(
            'h-4 animate-pulse rounded',
            'w-16 sm:w-20 md:w-24', // Responsive width
            isDark ? 'bg-stone-500/60' : 'bg-stone-300/60' // 🎯 Fix: dark mode uses brighter stone-500
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
        // Add onMouseDown to prevent input box focus loss when button is clicked
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
          {/* Background mask */}
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
                  // Add onMouseDown to prevent input box focus loss when button is clicked
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
