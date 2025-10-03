import { useEffect, useState } from 'react';

import { DifyAppConfig, getDifyAppConfig } from '../config/dify-config';

export interface ApiConfigResult {
  config: DifyAppConfig | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Hook to fetch Dify API configuration.
 *
 * @param appId Dify application ID (required)
 * @returns API config result, including config, loading state, and error info
 *
 * @example
 * ```tsx
 * const { config, isLoading, error } = useDifyConfig('my-app');
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error.message} />;
 * if (!config) return <ConfigMissing />;
 *
 * // Use config.apiKey and config.apiUrl
 * ```
 */
export function useDifyConfig(appId: string): ApiConfigResult {
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
      setError(
        err instanceof Error ? err : new Error('Unknown error loading config')
      );
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
    reload,
  };
}

/**
 * Generic API provider configuration interface.
 */
export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  type: string;
}

/**
 * Generic API provider config hook result.
 */
export interface ProviderConfigResult {
  provider: ProviderConfig | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

/**
 * Hook to fetch any API provider configuration.
 *
 * Note: This is a placeholder implementation and will be improved in future development.
 *
 * @param providerId Provider ID
 * @returns Provider config result
 */
export function useProviderConfig(providerId: string): ProviderConfigResult {
  const [provider] = useState<ProviderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Placeholder implementation, will be improved in the future
    setIsLoading(false);
    setError(new Error('Not implemented yet'));
  }, [providerId]);

  const reload = async () => {
    // Placeholder implementation
  };

  return {
    provider,
    isLoading,
    error,
    reload,
  };
}
