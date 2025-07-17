import { appParametersService } from '@lib/services/dify/app-parameters-service';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';

import { useEffect, useState } from 'react';

interface UseAppParametersState {
  parameters: DifyAppParametersResponse | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated?: Date;
  source?: 'database';
}

/**
 * App parameters hook - database only strategy
 *
 * Core strategy:
 * 1. Only use local config from database (instant loading)
 * 2. Return null if no data, let component handle fallback logic
 * 3. Data is managed by the admin panel's sync scheduler
 *
 * @param instanceId Application instance ID
 * @returns App parameters state
 */
export function useAppParameters(
  instanceId: string | null
): UseAppParametersState {
  const [state, setState] = useState<UseAppParametersState>({
    parameters: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!instanceId) {
      setState({
        parameters: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;

    const fetchParameters = async () => {
      if (cancelled) return;

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        const result = await appParametersService.getAppParameters(instanceId);

        if (cancelled) return;

        if (result.success) {
          setState({
            parameters: result.data, // may be null
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
            source: 'database',
          });
        } else {
          setState({
            parameters: null,
            isLoading: false,
            error: result.error.message,
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        if (cancelled) return;

        setState({
          parameters: null,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get app parameters',
          lastUpdated: new Date(),
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
