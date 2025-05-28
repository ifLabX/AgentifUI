import { useState, useEffect } from 'react';
import { appParametersService } from '@lib/services/app-parameters-service';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';

interface UseAppParametersState {
  parameters: DifyAppParametersResponse | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
  source?: 'database' | 'api';
}

/**
 * 应用参数Hook - 数据库优先策略
 * 
 * 🎯 核心策略：
 * 1. 优先使用数据库中的本地配置（instant loading）
 * 2. Fallback到Dify API调用（compatibility）
 * 3. 智能缓存减少重复请求
 * 
 * @param instanceId 应用实例ID
 * @returns 应用参数状态
 */
export function useAppParameters(instanceId: string | null): UseAppParametersState {
  const [state, setState] = useState<UseAppParametersState>({
    parameters: null,
    isLoading: false,
    error: null
  });

  useEffect(() => {
    if (!instanceId) {
      setState({
        parameters: null,
        isLoading: false,
        error: null
      });
      return;
    }

    let cancelled = false;

    const fetchParameters = async () => {
      if (cancelled) return;

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      try {
        const result = await appParametersService.getAppParameters(instanceId);
        
        if (cancelled) return;

        if (result.success) {
          setState({
            parameters: result.data,
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
            source: 'database' // 服务会自动处理数据库/API选择
          });
        } else {
          setState({
            parameters: null,
            isLoading: false,
            error: result.error.message,
            lastUpdated: new Date()
          });
        }
      } catch (error) {
        if (cancelled) return;
        
        setState({
          parameters: null,
          isLoading: false,
          error: error instanceof Error ? error.message : '获取应用参数失败',
          lastUpdated: new Date()
        });
      }
    };

    fetchParameters();

    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  return state;
}

/**
 * 应用参数同步Hook
 * 提供手动同步功能和同步状态查询
 */
export function useAppParametersSync(instanceId: string | null) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const syncFromDify = async () => {
    if (!instanceId || isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await appParametersService.syncFromDify(instanceId);
      
      if (result.success) {
        setLastSyncTime(new Date());
        console.log(`[useAppParametersSync] 同步成功: ${instanceId}`);
      } else {
        setSyncError(result.error.message);
        console.error(`[useAppParametersSync] 同步失败: ${instanceId}`, result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      setSyncError(errorMessage);
      console.error(`[useAppParametersSync] 同步异常: ${instanceId}`, error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncStatus = async () => {
    if (!instanceId) return null;

    try {
      const result = await appParametersService.getSyncStatus(instanceId);
      return result.success ? result.data : null;
    } catch (error) {
      console.error(`[useAppParametersSync] 获取状态失败: ${instanceId}`, error);
      return null;
    }
  };

  return {
    isSyncing,
    syncError,
    lastSyncTime,
    syncFromDify,
    getSyncStatus
  };
} 