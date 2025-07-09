import { getAppParametersFromDb, updateAppParametersInDb } from '@lib/db';
import { getDifyAppParameters } from '@lib/services/dify/app-service';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';
import type { Result } from '@lib/types/result';
import { failure, success } from '@lib/types/result';

/**
 * 统一应用参数服务
 *
 * 🎯 核心策略：
 * 1. 优先使用数据库中的本地配置（instant loading）
 * 2. Fallback到Dify API调用（compatibility）
 */

interface AppParametersCache {
  [appId: string]: {
    data: DifyAppParametersResponse | null;
    timestamp: number;
    source: 'database';
  };
}

const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存 - 延长应用参数缓存时间
const parametersCache: AppParametersCache = {};

/**
 * 从数据库配置转换为Dify参数格式
 */
function convertDatabaseConfigToDifyParameters(
  config: any
): DifyAppParametersResponse | null {
  if (!config) return null;

  try {
    // 确保返回符合DifyAppParametersResponse格式的数据
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
    console.error('[AppParametersService] 转换数据库配置失败:', error);
    return null;
  }
}

/**
 * 获取缓存的参数
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
 * 设置缓存
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
   * 纯数据库模式获取应用参数
   * @param instanceId 应用实例ID
   * @returns 应用参数的Result，无数据时返回null
   */
  async getAppParameters(
    instanceId: string
  ): Promise<Result<DifyAppParametersResponse | null>> {
    try {
      // 1. 检查内存缓存
      const cached = getCachedParameters(instanceId);
      if (cached) {
        console.log('[AppParametersService] 使用缓存的应用参数:', instanceId);
        return success(cached);
      }

      // 2. 仅从数据库获取
      console.log('[AppParametersService] 从数据库获取应用参数:', instanceId);
      const dbResult = await getAppParametersFromDb(instanceId);

      if (dbResult.success && dbResult.data) {
        const difyParameters = convertDatabaseConfigToDifyParameters(
          dbResult.data
        );
        if (difyParameters) {
          console.log('[AppParametersService] 数据库参数获取成功:', instanceId);
          setCachedParameters(instanceId, difyParameters, 'database');
          return success(difyParameters);
        }
      }

      // 3. 数据库无数据，返回null（不再fallback到API）
      console.log(
        '[AppParametersService] 数据库无应用参数，返回null:',
        instanceId
      );
      return success(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '获取应用参数失败';
      console.error('[AppParametersService] 获取应用参数失败:', error);
      return failure(new Error(errorMessage));
    }
  }
}

// 导出单例实例
export const appParametersService = new AppParametersService();
