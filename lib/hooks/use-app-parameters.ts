import { useState, useEffect, useCallback } from 'react';
import { getDifyAppParameters } from '@lib/services/dify/app-service';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';

interface UseAppParametersState {
  parameters: DifyAppParametersResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// --- BEGIN COMMENT ---
// 🎯 简化的应用参数Hook - 作为fallback机制
// 用于向后兼容和在数据库方案不可用时的备用方案
// --- END COMMENT ---
interface CachedParameters {
  data: DifyAppParametersResponse;
  timestamp: number;
  appId: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
const parametersCache = new Map<string, CachedParameters>();

/**
 * 获取应用参数的Hook（简化版 - 作为fallback）
 * 
 * 🎯 用途：
 * 1. 作为数据库优先方案的fallback机制
 * 2. 保持API兼容性，减少重构工作
 * 3. 在数据库方案不可用时提供基本功能
 * 
 * @param appId - 应用ID，如果为null则不发起请求
 * @returns 应用参数状态和重新获取函数
 */
export function useAppParameters(appId: string | null): UseAppParametersState {
  const [parameters, setParameters] = useState<DifyAppParametersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- BEGIN COMMENT ---
  // 检查缓存是否有效
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
  // 设置缓存
  // --- END COMMENT ---
  const setCachedParameters = useCallback((id: string, data: DifyAppParametersResponse) => {
    parametersCache.set(id, {
      data,
      timestamp: Date.now(),
      appId: id
    });
  }, []);

  // --- BEGIN COMMENT ---
  // 🎯 简化的获取应用参数逻辑
  // --- END COMMENT ---
  const fetchParameters = useCallback(async (id: string, forceRefresh: boolean = false) => {
    try {
      setError(null);

      // 检查缓存（除非强制刷新）
      if (!forceRefresh) {
        const cached = getCachedParameters(id);
        if (cached) {
          console.log('[useAppParameters] 使用缓存的应用参数:', id);
          setParameters(cached);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);

      // 从API获取参数
      console.log('[useAppParameters] 从API获取应用参数:', id);
      const result = await getDifyAppParameters(id);
      
      // 缓存结果
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
  }, [getCachedParameters, setCachedParameters]);

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

  return {
    parameters,
    isLoading,
    error,
    refetch
  };
} 