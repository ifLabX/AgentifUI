import { useState, useEffect } from 'react';
import { getDifyAppConfig, DifyAppConfig } from '../config/dify-config';

export interface ApiConfigResult {
  config: DifyAppConfig | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * 用于获取 Dify API 配置的 Hook
 * 
 * @param appId Dify 应用 ID，默认为 'default'
 * @returns API 配置结果，包含配置、加载状态和错误信息
 * 
 * @example
 * ```tsx
 * const { config, isLoading, error } = useDifyConfig('my-app');
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (!config) return <ConfigMissing />;
 * 
 * // 使用 config.apiKey 和 config.apiUrl
 * ```
 */
export function useDifyConfig(appId: string = 'default'): ApiConfigResult {
  const [config, setConfig] = useState<DifyAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const difyConfig = await getDifyAppConfig(appId);
      setConfig(difyConfig);
      
      if (!difyConfig) {
        throw new Error(`Failed to load configuration for Dify app "${appId}"`);
      }
    } catch (err) {
      console.error(`Error loading Dify config for ${appId}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error loading config'));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadConfig();
  }, [appId]);
  
  const reload = async () => {
    await loadConfig();
  };
  
  return {
    config,
    isLoading,
    error,
    reload
  };
}

/**
 * 通用 API 提供商配置
 */
export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  type: string;
}

/**
 * 通用 API 配置 Hook 结果
 */
export interface ProviderConfigResult {
  provider: ProviderConfig | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * 用于获取任意 API 提供商配置的 Hook
 * 
 * 注意：这是一个占位实现，将在后续开发中完善
 * 
 * @param providerId 提供商 ID
 * @returns 提供商配置结果
 */
export function useProviderConfig(providerId: string): ProviderConfigResult {
  const [provider, setProvider] = useState<ProviderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // 占位实现，将在后续开发中完善
    setIsLoading(false);
    setError(new Error('Not implemented yet'));
  }, [providerId]);
  
  const reload = async () => {
    // 占位实现
  };
  
  return {
    provider,
    isLoading,
    error,
    reload
  };
}
