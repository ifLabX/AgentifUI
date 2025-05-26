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
    validateAndRefreshConfig, // 新增：验证并刷新配置
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

  // --- BEGIN COMMENT ---
  // 新增：强制等待App配置就绪的方法
  // 解决时序问题：确保在使用appId前，配置已完全加载
  // --- END COMMENT ---
  const ensureAppReady = useCallback(async (): Promise<{
    appId: string;
    instance: ServiceInstance;
  }> => {
    console.log('[ensureAppReady] 开始确保App配置就绪');
    
    // 🎯 新增：先验证配置有效性，确保与数据库同步
    if (currentAppId && currentAppInstance && !isLoadingAppId) {
      console.log('[ensureAppReady] 验证配置有效性...');
      try {
        await validateAndRefreshConfig();
        
        // 验证后重新获取状态
        const updatedState = useCurrentAppStore.getState();
        if (updatedState.currentAppId && updatedState.currentAppInstance) {
          console.log(`[ensureAppReady] 配置验证完成，返回: ${updatedState.currentAppId}`);
          return {
            appId: updatedState.currentAppId,
            instance: updatedState.currentAppInstance
          };
        }
      } catch (error) {
        console.warn('[ensureAppReady] 配置验证失败，继续使用当前配置:', error);
        // 验证失败时仍然使用当前配置，避免阻塞用户操作
        return {
          appId: currentAppId,
          instance: currentAppInstance
        };
      }
    }
    
    // 如果正在加载，等待加载完成
    if (isLoadingAppId) {
      console.log('[ensureAppReady] 正在加载中，等待完成...');
      
      // 轮询等待加载完成，最多等待10秒
      const maxWaitTime = 10000; // 10秒
      const pollInterval = 100; // 100ms
      let waitedTime = 0;
      
      while (waitedTime < maxWaitTime) {
        const currentState = useCurrentAppStore.getState();
        
        // 加载完成且有有效配置
        if (!currentState.isLoadingAppId && currentState.currentAppId && currentState.currentAppInstance) {
          console.log(`[ensureAppReady] 等待完成，获得配置: ${currentState.currentAppId}`);
          return {
            appId: currentState.currentAppId,
            instance: currentState.currentAppInstance
          };
        }
        
        // 加载完成但失败
        if (!currentState.isLoadingAppId && currentState.errorLoadingAppId) {
          console.error(`[ensureAppReady] 加载失败: ${currentState.errorLoadingAppId}`);
          throw new Error(`App配置加载失败: ${currentState.errorLoadingAppId}`);
        }
        
        // 继续等待
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        waitedTime += pollInterval;
      }
      
      throw new Error('App配置加载超时');
    }
    
    // 如果没有配置且没有在加载，主动初始化
    if (!currentAppId) {
      console.log('[ensureAppReady] 没有配置，开始初始化...');
      
      try {
        await initializeDefaultAppId();
        
        // 初始化后再次检查
        const finalState = useCurrentAppStore.getState();
        if (finalState.currentAppId && finalState.currentAppInstance) {
          console.log(`[ensureAppReady] 初始化成功: ${finalState.currentAppId}`);
          return {
            appId: finalState.currentAppId,
            instance: finalState.currentAppInstance
          };
        } else {
          throw new Error(`初始化后仍无有效配置: ${finalState.errorLoadingAppId || '未知错误'}`);
        }
      } catch (error) {
        console.error('[ensureAppReady] 初始化失败:', error);
        throw new Error(`App配置初始化失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 如果有错误，抛出异常
    if (errorLoadingAppId) {
      throw new Error(`App配置错误: ${errorLoadingAppId}`);
    }
    
    // 理论上不应该到达这里
    throw new Error('App配置状态异常：无法获取有效的应用配置，请检查数据库中是否存在默认的Dify应用实例');
  }, [currentAppId, currentAppInstance, isLoadingAppId, errorLoadingAppId, initializeDefaultAppId, validateAndRefreshConfig]);

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
    ensureAppReady, // 新增方法
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