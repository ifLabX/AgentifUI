import { getAppParametersFromDb } from '@lib/db';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';
import type { Result } from '@lib/types/result';
import { failure, success } from '@lib/types/result';

/**
 * Unified App Parameters Service
 *
 * Core strategy:
 * 1. Prefer local config from database (instant loading)
 * 2. No fallback to Dify API (compatibility not implemented here)
 */

interface AppParametersCache {
  [appId: string]: {
    data: DifyAppParametersResponse | null;
    timestamp: number;
    source: 'database';
  };
}

// 30 minutes cache duration for app parameters
const CACHE_DURATION = 30 * 60 * 1000;
const parametersCache: AppParametersCache = {};

/**
 * Convert database config to Dify parameters format
 */
function convertDatabaseConfigToDifyParameters(
  config: any
): DifyAppParametersResponse | null {
  if (!config) return null;

  try {
    // Ensure the returned object matches DifyAppParametersResponse format
    return {
      opening_statement: config.opening_statement || '',
      suggested_questions: config.suggested_questions || [],
      suggested_questions_after_answer:
        config.suggested_questions_after_answer || { enabled: false },
      speech_to_text: config.speech_to_text || { enabled: false },
      text_to_speech: config.text_to_speech || { enabled: false },
      retriever_resource: config.retriever_resource || { enabled: false },
      annotation_reply: config.annotation_reply || { enabled: false },
      user_input_form: config.user_input_form || [],
      file_upload: config.file_upload || {
        image: {
          enabled: false,
          number_limits: 3,
          transfer_methods: ['local_file', 'remote_url'],
        },
      },
      system_parameters: config.system_parameters || {},
    };
  } catch (error) {
    console.error(
      '[AppParametersService] Failed to convert database config:',
      error
    );
    return null;
  }
}

/**
 * Get cached parameters for an app
 */
function getCachedParameters(appId: string): DifyAppParametersResponse | null {
  const cached = parametersCache[appId];
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    delete parametersCache[appId];
    return null;
  }

  return cached.data;
}

/**
 * Set parameters cache for an app
 */
function setCachedParameters(
  appId: string,
  data: DifyAppParametersResponse | null,
  source: 'database'
) {
  parametersCache[appId] = {
    data,
    timestamp: Date.now(),
    source,
  };
}

class AppParametersService {
  /**
   * Get app parameters in database-only mode
   * @param instanceId - App instance ID
   * @returns Result of app parameters, returns null if no data
   */
  async getAppParameters(
    instanceId: string
  ): Promise<Result<DifyAppParametersResponse | null>> {
    try {
      // 1. Check in-memory cache
      const cached = getCachedParameters(instanceId);
      if (cached) {
        console.log(
          '[AppParametersService] Using cached app parameters:',
          instanceId
        );
        return success(cached);
      }

      // 2. Fetch from database only
      console.log(
        '[AppParametersService] Fetching app parameters from database:',
        instanceId
      );
      const dbResult = await getAppParametersFromDb(instanceId);

      if (dbResult.success && dbResult.data) {
        const difyParameters = convertDatabaseConfigToDifyParameters(
          dbResult.data
        );
        if (difyParameters) {
          console.log(
            '[AppParametersService] Successfully got parameters from database:',
            instanceId
          );
          setCachedParameters(instanceId, difyParameters, 'database');
          return success(difyParameters);
        }
      }

      // 3. No data in database, return null (no fallback to API)
      console.log(
        '[AppParametersService] No app parameters in database, returning null:',
        instanceId
      );
      return success(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get app parameters';
      console.error(
        '[AppParametersService] Failed to get app parameters:',
        error
      );
      return failure(new Error(errorMessage));
    }
  }
}

// Export singleton instance
export const appParametersService = new AppParametersService();
