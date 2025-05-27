import { useEffect, useCallback } from 'react';
import { useAppListStore } from '@lib/stores/app-list-store';

/**
 * 应用参数预加载Hook
 * 
 * 🎯 用途：
 * 1. 在应用启动时预加载所有应用的参数
 * 2. 提供手动触发预加载的方法
 * 3. 监控预加载状态
 * 
 * 使用场景：
 * - 在根组件或布局组件中使用
 * - 在用户可能需要切换应用的页面中使用
 */
export function useAppParametersPreloader() {
  const { 
    apps,
    parametersCache,
    isLoadingParameters,
    parametersError,
    fetchApps,
    fetchAllAppParameters,
    lastParametersFetchTime
  } = useAppListStore();

  // --- BEGIN COMMENT ---
  // 检查是否需要预加载
  // --- END COMMENT ---
  const shouldPreload = useCallback(() => {
    // 如果没有应用列表，需要先获取应用列表
    if (apps.length === 0) return true;
    
    // 如果没有任何参数缓存，需要预加载
    if (Object.keys(parametersCache).length === 0) return true;
    
    // 如果缓存过期（超过5分钟），需要重新加载
    const CACHE_DURATION = 5 * 60 * 1000;
    const isExpired = Date.now() - lastParametersFetchTime > CACHE_DURATION;
    if (isExpired) return true;
    
    // 如果应用数量与缓存数量不匹配，可能有新应用
    if (apps.length !== Object.keys(parametersCache).length) return true;
    
    return false;
  }, [apps.length, parametersCache, lastParametersFetchTime]);

  // --- BEGIN COMMENT ---
  // 手动触发预加载
  // --- END COMMENT ---
  const triggerPreload = useCallback(async () => {
    try {
      console.log('[useAppParametersPreloader] 手动触发预加载');
      
      // 确保有应用列表
      if (apps.length === 0) {
        console.log('[useAppParametersPreloader] 先获取应用列表');
        await fetchApps();
      }
      
      // 获取所有应用参数
      await fetchAllAppParameters();
      
      console.log('[useAppParametersPreloader] 预加载完成');
    } catch (error) {
      console.error('[useAppParametersPreloader] 预加载失败:', error);
    }
  }, [apps.length, fetchApps, fetchAllAppParameters]);

  // --- BEGIN COMMENT ---
  // 自动预加载：在Hook初始化时检查是否需要预加载
  // --- END COMMENT ---
  useEffect(() => {
    if (shouldPreload() && !isLoadingParameters) {
      console.log('[useAppParametersPreloader] 自动触发预加载');
      triggerPreload();
    }
  }, [shouldPreload, isLoadingParameters, triggerPreload]);

  // --- BEGIN COMMENT ---
  // 计算预加载进度
  // --- END COMMENT ---
  const getPreloadProgress = useCallback(() => {
    if (apps.length === 0) return { loaded: 0, total: 0, percentage: 0 };
    
    const loaded = Object.keys(parametersCache).length;
    const total = apps.length;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    
    return { loaded, total, percentage };
  }, [apps.length, parametersCache]);

  // --- BEGIN COMMENT ---
  // 检查特定应用的参数是否已缓存
  // --- END COMMENT ---
  const isAppParametersCached = useCallback((appId: string) => {
    return !!parametersCache[appId];
  }, [parametersCache]);

  // --- BEGIN COMMENT ---
  // 获取特定应用的参数（如果已缓存）
  // --- END COMMENT ---
  const getCachedAppParameters = useCallback((appId: string) => {
    const cached = parametersCache[appId];
    if (!cached) return null;
    
    // 检查是否过期
    const CACHE_DURATION = 5 * 60 * 1000;
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) return null;
    
    return cached.data;
  }, [parametersCache]);

  return {
    // 状态
    isPreloading: isLoadingParameters,
    preloadError: parametersError,
    apps,
    
    // 进度信息
    progress: getPreloadProgress(),
    
    // 操作方法
    triggerPreload,
    shouldPreload: shouldPreload(),
    
    // 查询方法
    isAppParametersCached,
    getCachedAppParameters,
  };
} 