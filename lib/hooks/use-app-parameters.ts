import { useState, useEffect, useCallback } from 'react';
import { getDifyAppParameters } from '@lib/services/dify/app-service';
import { useAppListStore } from '@lib/stores/app-list-store';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';

interface UseAppParametersState {
  parameters: DifyAppParametersResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// --- BEGIN COMMENT ---
// 🎯 保留原有的单独缓存机制作为fallback
// 主要使用app-list-store的批量缓存
// --- END COMMENT ---
interface CachedParameters {
  data: DifyAppParametersResponse;
  timestamp: number;
  appId: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
const parametersCache = new Map<string, CachedParameters>();

/**
 * 获取应用参数的Hook
 * 
 * 🎯 优化策略：
 * 1. 优先使用app-list-store的批量缓存（更高效）
 * 2. Fallback到原有的单独获取机制（兼容性）
 * 3. 支持手动刷新功能
 * 
 * @param appId - 应用ID，如果为null则不发起请求
 * @returns 应用参数状态和重新获取函数
 */
export function useAppParameters(appId: string | null): UseAppParametersState {
  const [parameters, setParameters] = useState<DifyAppParametersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- BEGIN COMMENT ---
  // 🎯 使用app-list-store的批量缓存和获取方法
  // --- END COMMENT ---
  const { 
    getAppParameters: getFromBatchCache,
    fetchAllAppParameters: triggerBatchFetch,
    isLoadingParameters: isBatchLoading,
    parametersError: batchError
  } = useAppListStore();

  // --- BEGIN COMMENT ---
  // 检查单独缓存是否有效（作为fallback）
  // --- END COMMENT ---
  const getCachedParameters = useCallback((id: string): DifyAppParametersResponse | null => {
    const cached = parametersCache.get(id);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      parametersCache.delete(id);
      return null;
    }
    
    return cached.data;
  }, []);

  // --- BEGIN COMMENT ---
  // 设置单独缓存（作为fallback）
  // --- END COMMENT ---
  const setCachedParameters = useCallback((id: string, data: DifyAppParametersResponse) => {
    parametersCache.set(id, {
      data,
      timestamp: Date.now(),
      appId: id
    });
  }, []);

  // --- BEGIN COMMENT ---
  // 🎯 智能获取应用参数：优先使用批量缓存，fallback到单独获取
  // --- END COMMENT ---
  const fetchParameters = useCallback(async (id: string, forceRefresh: boolean = false) => {
    try {
      setError(null);

      // --- BEGIN COMMENT ---
      // 🎯 策略1：优先检查批量缓存（app-list-store）
      // --- END COMMENT ---
      if (!forceRefresh) {
        const batchCached = getFromBatchCache(id);
        if (batchCached) {
          console.log('[useAppParameters] 使用批量缓存的应用参数:', id);
          setParameters(batchCached);
          setIsLoading(false);
          return;
        }
      }

      // --- BEGIN COMMENT ---
      // 🎯 策略2：检查单独缓存（fallback）
      // --- END COMMENT ---
      if (!forceRefresh) {
        const individualCached = getCachedParameters(id);
        if (individualCached) {
          console.log('[useAppParameters] 使用单独缓存的应用参数:', id);
          setParameters(individualCached);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);

      // --- BEGIN COMMENT ---
      // 🎯 策略3：尝试触发批量获取（可能会获取到目标参数）
      // --- END COMMENT ---
      if (!forceRefresh && !isBatchLoading) {
        console.log('[useAppParameters] 触发批量获取应用参数');
        await triggerBatchFetch();
        
        // 批量获取后再次检查缓存
        const batchCachedAfter = getFromBatchCache(id);
        if (batchCachedAfter) {
          console.log('[useAppParameters] 批量获取后找到应用参数:', id);
          setParameters(batchCachedAfter);
          setIsLoading(false);
          return;
        }
      }

      // --- BEGIN COMMENT ---
      // 🎯 策略4：单独获取（最后的fallback）
      // --- END COMMENT ---
      console.log('[useAppParameters] 单独获取应用参数:', id);
      const result = await getDifyAppParameters(id);
      
      // 同时缓存到单独缓存中
      setCachedParameters(id, result);
      setParameters(result);
      
      console.log('[useAppParameters] 成功获取应用参数:', {
        appId: id,
        hasOpeningStatement: !!result.opening_statement,
        suggestedQuestionsCount: result.suggested_questions?.length || 0
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取应用参数失败';
      console.error('[useAppParameters] 获取应用参数失败:', err);
      setError(errorMessage);
      setParameters(null);
    } finally {
      setIsLoading(false);
    }
  }, [getFromBatchCache, getCachedParameters, setCachedParameters, triggerBatchFetch, isBatchLoading]);

  // --- BEGIN COMMENT ---
  // 重新获取函数，供外部调用
  // --- END COMMENT ---
  const refetch = useCallback(async () => {
    if (!appId) return;
    await fetchParameters(appId, true); // 强制刷新
  }, [appId, fetchParameters]);

  // --- BEGIN COMMENT ---
  // 当appId变化时自动获取参数
  // --- END COMMENT ---
  useEffect(() => {
    if (!appId) {
      setParameters(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    fetchParameters(appId);
  }, [appId, fetchParameters]);

  // --- BEGIN COMMENT ---
  // 🎯 合并批量获取的loading状态和错误状态
  // --- END COMMENT ---
  const finalIsLoading = isLoading || (isBatchLoading && !parameters);
  const finalError = error || (batchError && !parameters ? batchError : null);

  return {
    parameters,
    isLoading: finalIsLoading,
    error: finalError,
    refetch
  };
} 