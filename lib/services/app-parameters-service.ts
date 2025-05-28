import { getDifyAppParameters } from '@lib/services/dify/app-service';
import { 
  getAppParametersFromDb, 
  updateAppParametersInDb,
  batchUpdateAppParametersInDb,
  updateAppParametersSyncStatus,
  getAppInstancesForSync,
  getAppParametersSyncStatus
} from '@lib/db';
import type { DifyAppParametersResponse } from '@lib/services/dify/types';
import type { Result } from '@lib/types/result';
import { success, failure } from '@lib/types/result';

/**
 * 统一应用参数服务
 * 
 * 🎯 核心策略：
 * 1. 优先使用数据库中的本地配置（instant loading）
 * 2. Fallback到Dify API调用（compatibility）
 * 3. 支持配置同步和更新机制
 */

interface AppParametersCache {
  [appId: string]: {
    data: DifyAppParametersResponse;
    timestamp: number;
    source: 'database' | 'api';
  };
}

interface SyncResult {
  instanceId: string;
  success: boolean;
  error?: string;
  hasData: boolean;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存
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
      suggested_questions_after_answer: config.suggested_questions_after_answer || { enabled: false },
      speech_to_text: config.speech_to_text || { enabled: false },
      retriever_resource: config.retriever_resource || { enabled: false },
      annotation_reply: config.annotation_reply || { enabled: false },
      user_input_form: config.user_input_form || [],
      file_upload: config.file_upload || {
        image: {
          enabled: false,
          number_limits: 3,
          detail: 'high'
        }
      },
      system_parameters: config.system_parameters || {
        file_size_limit: 15,
        image_file_size_limit: 10,
        audio_file_size_limit: 50,
        video_file_size_limit: 100
      }
    };
  } catch (error) {
    console.error('[AppParametersService] 配置转换失败:', error);
    return null;
  }
}

/**
 * 检查缓存是否有效
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
  data: DifyAppParametersResponse, 
  source: 'database' | 'api'
) {
  parametersCache[appId] = {
    data,
    timestamp: Date.now(),
    source
  };
}

class AppParametersService {
  /**
   * 智能获取应用参数：数据库优先 + API fallback
   * @param instanceId 应用实例ID
   * @returns 应用参数的Result
   */
  async getAppParameters(instanceId: string): Promise<Result<DifyAppParametersResponse>> {
    try {
      // 1. 检查内存缓存
      const cached = getCachedParameters(instanceId);
      if (cached) {
        console.log('[AppParametersService] 使用缓存的应用参数:', instanceId);
        return success(cached);
      }

      // 2. 优先从数据库获取
      console.log('[AppParametersService] 从数据库获取应用参数:', instanceId);
      const dbResult = await getAppParametersFromDb(instanceId);
      
      if (dbResult.success && dbResult.data) {
        const difyParameters = convertDatabaseConfigToDifyParameters(dbResult.data);
        if (difyParameters) {
          console.log('[AppParametersService] 数据库参数获取成功:', instanceId);
          setCachedParameters(instanceId, difyParameters, 'database');
          return success(difyParameters);
        }
      }

      // 3. Fallback到API调用
      console.log('[AppParametersService] 从API获取应用参数:', instanceId);
      const apiResult = await getDifyAppParameters(instanceId);
      
      // 缓存API结果
      setCachedParameters(instanceId, apiResult, 'api');
      
      console.log('[AppParametersService] API参数获取成功:', {
        instanceId,
        hasOpeningStatement: !!apiResult.opening_statement,
        suggestedQuestionsCount: apiResult.suggested_questions?.length || 0
      });

      return success(apiResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取应用参数失败';
      console.error('[AppParametersService] 获取应用参数失败:', error);
      return failure(new Error(errorMessage));
    }
  }

  /**
   * 从Dify同步参数到数据库
   * @param instanceId 应用实例ID
   * @returns 同步操作的Result
   */
  async syncFromDify(instanceId: string): Promise<Result<void>> {
    try {
      console.log('[AppParametersService] 开始同步应用参数:', instanceId);
      
      // 设置同步状态为pending
      await updateAppParametersSyncStatus(instanceId, 'pending');

      // 从Dify API获取最新参数
      const apiResult = await getDifyAppParameters(instanceId);
      
      // 更新到数据库
      const updateResult = await updateAppParametersInDb(instanceId, apiResult);
      
      if (!updateResult.success) {
        // 同步失败，更新状态
        await updateAppParametersSyncStatus(instanceId, 'failed', updateResult.error.message);
        return failure(updateResult.error);
      }

      // 清除缓存，强制下次从数据库重新获取
      delete parametersCache[instanceId];
      
      console.log('[AppParametersService] 应用参数同步成功:', instanceId);
      return success(undefined);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败';
      console.error('[AppParametersService] 同步失败:', error);
      
      // 更新失败状态
      await updateAppParametersSyncStatus(instanceId, 'failed', errorMessage);
      
      return failure(new Error(errorMessage));
    }
  }

  /**
   * 批量同步应用参数
   * @param instanceIds 实例ID列表，如果不提供则同步所有需要同步的实例
   * @returns 同步结果的Result
   */
  async batchSync(instanceIds?: string[]): Promise<Result<SyncResult[]>> {
    try {
      console.log('[AppParametersService] 开始批量同步');
      
      let targetInstances: string[];
      
      if (instanceIds) {
        targetInstances = instanceIds;
      } else {
        // 获取需要同步的实例列表
        const instancesResult = await getAppInstancesForSync(60); // 1小时
        if (!instancesResult.success) {
          return failure(instancesResult.error);
        }
        targetInstances = instancesResult.data.map(instance => instance.instance_id);
      }

      console.log(`[AppParametersService] 需要同步 ${targetInstances.length} 个应用`);

      const syncResults: SyncResult[] = [];
      const syncData: Array<{ instanceId: string; parameters: any; error?: string }> = [];

      // 并发获取所有实例的参数
      const promises = targetInstances.map(async (instanceId) => {
        try {
          const apiResult = await getDifyAppParameters(instanceId);
          return { instanceId, parameters: apiResult };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取参数失败';
          return { instanceId, parameters: null, error: errorMessage };
        }
      });

      const results = await Promise.allSettled(promises);
      
      // 处理结果
      results.forEach((result, index) => {
        const instanceId = targetInstances[index];
        if (result.status === 'fulfilled') {
          syncData.push(result.value);
          syncResults.push({
            instanceId,
            success: !result.value.error,
            error: result.value.error,
            hasData: !!result.value.parameters
          });
        } else {
          const errorMessage = result.reason instanceof Error ? result.reason.message : '未知错误';
          syncData.push({ instanceId, parameters: null, error: errorMessage });
          syncResults.push({
            instanceId,
            success: false,
            error: errorMessage,
            hasData: false
          });
        }
      });

      // 批量更新到数据库
      const batchResult = await batchUpdateAppParametersInDb(syncData);
      if (!batchResult.success) {
        return failure(batchResult.error);
      }

      // 清除相关缓存
      targetInstances.forEach(instanceId => {
        delete parametersCache[instanceId];
      });

      const successCount = syncResults.filter(r => r.success).length;
      console.log(`[AppParametersService] 批量同步完成: ${successCount}/${syncResults.length} 成功`);

      return success(syncResults);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量同步失败';
      console.error('[AppParametersService] 批量同步失败:', error);
      return failure(new Error(errorMessage));
    }
  }

  /**
   * 获取同步状态
   * @param instanceId 应用实例ID
   * @returns 同步状态的Result
   */
  async getSyncStatus(instanceId: string): Promise<Result<{
    lastSyncAt?: string;
    syncStatus?: 'success' | 'failed' | 'pending';
    lastError?: string;
    hasParameters: boolean;
    cacheInfo?: {
      cached: boolean;
      source?: 'database' | 'api';
      age?: number;
    };
  }>> {
    try {
      const statusResult = await getAppParametersSyncStatus(instanceId);
      
      if (!statusResult.success) {
        return failure(statusResult.error);
      }

      const baseResult = statusResult.data || {
        hasParameters: false
      };

      // 构建完整的结果对象，包含cacheInfo
      const result = {
        lastSyncAt: baseResult.lastSyncAt,
        syncStatus: baseResult.syncStatus,
        lastError: baseResult.lastError,
        hasParameters: baseResult.hasParameters,
        cacheInfo: undefined as {
          cached: boolean;
          source?: 'database' | 'api';
          age?: number;
        } | undefined
      };

      // 添加缓存信息
      const cached = parametersCache[instanceId];
      if (cached) {
        result.cacheInfo = {
          cached: true,
          source: cached.source,
          age: Date.now() - cached.timestamp
        };
      } else {
        result.cacheInfo = {
          cached: false
        };
      }

      return success(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取同步状态失败';
      console.error('[AppParametersService] 获取同步状态失败:', error);
      return failure(new Error(errorMessage));
    }
  }

  /**
   * 清除缓存
   * @param instanceId 可选，指定实例ID，如果不提供则清除所有缓存
   */
  clearCache(instanceId?: string): void {
    if (instanceId) {
      delete parametersCache[instanceId];
      console.log('[AppParametersService] 清除缓存:', instanceId);
    } else {
      Object.keys(parametersCache).forEach(key => delete parametersCache[key]);
      console.log('[AppParametersService] 清除所有缓存');
    }
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const entries = Object.entries(parametersCache);
    const now = Date.now();
    
    return {
      total: entries.length,
      bySource: {
        database: entries.filter(([, cache]) => cache.source === 'database').length,
        api: entries.filter(([, cache]) => cache.source === 'api').length
      },
      byAge: {
        fresh: entries.filter(([, cache]) => now - cache.timestamp < 5 * 60 * 1000).length,
        aging: entries.filter(([, cache]) => {
          const age = now - cache.timestamp;
          return age >= 5 * 60 * 1000 && age < CACHE_DURATION;
        }).length,
        expired: entries.filter(([, cache]) => now - cache.timestamp >= CACHE_DURATION).length
      }
    };
  }
}

// 导出单例实例
export const appParametersService = new AppParametersService();

// 导出类型
export type { SyncResult }; 