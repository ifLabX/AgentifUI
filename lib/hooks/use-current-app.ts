/**
 * 当前应用相关的 Hook
 * 
 * 提供便捷的方式来访问和管理当前选中的应用实例
 */

import { useCurrentAppStore } from '@lib/stores/current-app-store';
import { useCallback } from 'react';
import type { ServiceInstance } from '@lib/types/database';

/**
 * 使用当前应用的 Hook
 * @returns 当前应用的状态和操作方法
 */
export function useCurrentApp() {
  const {
    currentAppId,
    currentAppInstance,
    isLoadingAppId,
    errorLoadingAppId,
    setCurrentAppId,
    clearCurrentApp,
    initializeDefaultAppId,
    refreshCurrentApp,
  } = useCurrentAppStore();

  // --- BEGIN COMMENT ---
  // 包装操作方法，提供更好的类型安全和错误处理
  // --- END COMMENT ---
  const switchApp = useCallback((appId: string, instance: ServiceInstance) => {
    if (!appId || !instance) {
      console.error('切换应用失败：appId 和 instance 不能为空');
      return;
    }
    setCurrentAppId(appId, instance);
  }, [setCurrentAppId]);

  const resetApp = useCallback(() => {
    clearCurrentApp();
  }, [clearCurrentApp]);

  const initializeApp = useCallback(async () => {
    try {
      await initializeDefaultAppId();
    } catch (error) {
      console.error('初始化应用失败:', error);
    }
  }, [initializeDefaultAppId]);

  const refreshApp = useCallback(async () => {
    try {
      await refreshCurrentApp();
    } catch (error) {
      console.error('刷新应用失败:', error);
    }
  }, [refreshCurrentApp]);

  return {
    // 状态
    currentAppId,
    currentAppInstance,
    isLoading: isLoadingAppId,
    error: errorLoadingAppId,
    
    // 计算属性
    hasCurrentApp: !!currentAppId && !!currentAppInstance,
    isReady: !isLoadingAppId && !!currentAppId,
    
    // 操作方法
    switchApp,
    resetApp,
    initializeApp,
    refreshApp,
  };
}

/**
 * 仅获取当前应用ID的 Hook（性能优化）
 * @returns 当前应用ID
 */
export function useCurrentAppId() {
  return useCurrentAppStore(state => state.currentAppId);
}

/**
 * 仅获取当前应用实例的 Hook（性能优化）
 * @returns 当前应用实例
 */
export function useCurrentAppInstance() {
  return useCurrentAppStore(state => state.currentAppInstance);
}

/**
 * 仅获取加载状态的 Hook（性能优化）
 * @returns 是否正在加载
 */
export function useCurrentAppLoading() {
  return useCurrentAppStore(state => state.isLoadingAppId);
}

/**
 * 仅获取错误状态的 Hook（性能优化）
 * @returns 错误信息
 */
export function useCurrentAppError() {
  return useCurrentAppStore(state => state.errorLoadingAppId);
} 