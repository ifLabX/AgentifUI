import { useState, useEffect } from 'react';
import { appParametersService } from '@lib/services/app-parameters-service';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';

interface UseAppParametersState {
  parameters: DifyAppParametersResponse | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
  source?: 'database';
}

/**
 * 应用参数Hook - 纯数据库策略
 * 
 * 🎯 核心策略：
 * 1. 仅使用数据库中的本地配置（instant loading）
 * 2. 无数据时返回null，由组件层面处理fallback逻辑
 * 3. 通过管理界面的同步调度器管理数据
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
            parameters: result.data, // 可能为null
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
            source: 'database'
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