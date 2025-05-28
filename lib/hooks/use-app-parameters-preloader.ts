import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useSupabaseAuth } from '@lib/supabase/hooks';

/**
 * 应用参数预加载Hook
 * 
 * 🎯 优化后的用途：
 * 1. 只在登录状态下预加载
 * 2. 只在需要app的页面预加载
 * 3. 提供手动触发预加载的方法
 * 4. 监控预加载状态
 * 
 * 使用场景：
 * - 在根组件或布局组件中使用
 * - 自动检测页面类型和登录状态
 */
export function useAppParametersPreloader() {
  const pathname = usePathname();
  const { session } = useSupabaseAuth();
  
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
  // 🎯 检查是否为需要app的页面
  // --- END COMMENT ---
  const isAppRelatedPage = useCallback(() => {
    if (!pathname) return false;
    
    const appPages = ['/chat', '/app'];
    return appPages.some(page => pathname.startsWith(page));
  }, [pathname]);

  // --- BEGIN COMMENT ---
  // 🎯 检查是否应该激活预加载
  // 只有在登录状态且在相关页面时才激活
  // --- END COMMENT ---
  const shouldActivatePreloader = useCallback(() => {
    // 检查是否已登录
    if (!session?.user) {
      console.log('[Preloader] 用户未登录，跳过预加载');
      return false;
    }
    
    // 检查是否在需要app的页面
    if (!isAppRelatedPage()) {
      console.log('[Preloader] 当前页面不需要app，跳过预加载:', pathname);
      return false;
    }
    
    return true;
  }, [session?.user, isAppRelatedPage, pathname]);

  // --- BEGIN COMMENT ---
  // 🎯 检查是否需要预加载数据
  // 只有在激活状态下才检查数据
  // --- END COMMENT ---
  const shouldPreload = useCallback(() => {
    // 首先检查是否应该激活预加载
    if (!shouldActivatePreloader()) return false;
    
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
  }, [shouldActivatePreloader, apps.length, parametersCache, lastParametersFetchTime]);

  // --- BEGIN COMMENT ---
  // 🎯 非阻塞预加载
  // 使用setTimeout确保不阻塞主线程和页面跳转
  // --- END COMMENT ---
  const triggerPreload = useCallback(async () => {
    // 再次检查是否应该预加载（防止状态变化）
    if (!shouldActivatePreloader()) {
      console.log('[Preloader] 预加载条件不满足，取消预加载');
      return;
    }
    
    try {
      console.log('[Preloader] 开始非阻塞预加载');
      
      // 确保有应用列表
      if (apps.length === 0) {
        console.log('[Preloader] 先获取应用列表');
        await fetchApps();
      }
      
      // 获取所有应用参数
      await fetchAllAppParameters();
      
      console.log('[Preloader] 预加载完成');
    } catch (error) {
      console.error('[Preloader] 预加载失败:', error);
    }
  }, [shouldActivatePreloader, apps.length, fetchApps, fetchAllAppParameters]);

  // --- BEGIN COMMENT ---
  // 🎯 自动预加载：使用setTimeout实现非阻塞
  // --- END COMMENT ---
  useEffect(() => {
    if (shouldPreload() && !isLoadingParameters) {
      console.log('[Preloader] 触发非阻塞预加载');
      
      // 使用setTimeout确保不阻塞主线程
      const timeoutId = setTimeout(() => {
        triggerPreload();
      }, 0);
      
      return () => clearTimeout(timeoutId);
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
    
    // 🎯 新增：预加载激活状态
    isActive: shouldActivatePreloader(),
    
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