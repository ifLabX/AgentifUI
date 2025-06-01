/**
 * 应用执行记录相关的数据库查询函数
 * 
 * 本文件包含与应用执行记录表(app_executions)相关的所有数据库操作
 * 用于管理工作流和文本生成应用的执行历史
 * 更新为使用统一的数据服务和Result类型
 */

import { dataService } from '@lib/services/db/data-service';
import { cacheService, CacheKeys } from '@lib/services/db/cache-service';
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from '@lib/services/db/realtime-service';
import { Result, success, failure } from '@lib/types/result';
import { AppExecution, ExecutionType, ExecutionStatus } from '../types/database';
import { createClient } from '../supabase/client';

// 保持与现有代码的兼容性，同时使用新的数据服务
const supabase = createClient();

/**
 * 获取用户的执行记录列表（优化版本）
 * @param userId 用户ID
 * @param limit 每页数量，默认20
 * @param offset 偏移量，默认0
 * @param executionType 可选的执行类型筛选
 * @param status 可选的状态筛选
 * @returns 执行记录列表和总数的Result
 */
export async function getUserExecutions(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  executionType?: ExecutionType,
  status?: ExecutionStatus
): Promise<Result<{ executions: AppExecution[], total: number }>> {
  const filters: Record<string, any> = { 
    user_id: userId,
    ...(executionType && { execution_type: executionType }),
    ...(status && { status: status })
  };

  try {
    // 获取执行记录列表
    const executionsResult = await dataService.findMany<AppExecution>(
      'app_executions',
      filters,
      { column: 'created_at', ascending: false },
      { offset, limit },
      {
        cache: true,
        cacheTTL: 2 * 60 * 1000, // 2分钟缓存
      }
    );

    if (!executionsResult.success) {
      return failure(executionsResult.error);
    }

    // 获取总数
    const countResult = await dataService.count('app_executions', filters);
    
    if (!countResult.success) {
      return failure(countResult.error);
    }

    return success({
      executions: executionsResult.data,
      total: countResult.data
    });
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 根据ID获取执行记录详情（优化版本）
 * @param executionId 执行记录ID
 * @returns 执行记录对象的Result，如果未找到则返回null
 */
export async function getExecutionById(executionId: string): Promise<Result<AppExecution | null>> {
  return dataService.findOne<AppExecution>(
    'app_executions',
    { id: executionId },
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟缓存
    }
  );
}

/**
 * 根据外部执行ID获取执行记录（优化版本）
 * @param externalExecutionId Dify返回的执行ID
 * @returns 执行记录对象的Result，如果未找到则返回null
 */
export async function getExecutionByExternalId(externalExecutionId: string): Promise<Result<AppExecution | null>> {
  return dataService.findOne<AppExecution>(
    'app_executions',
    { external_execution_id: externalExecutionId },
    {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟缓存
    }
  );
}

/**
 * 创建新的执行记录（优化版本）
 * @param execution 执行记录对象
 * @returns 创建的执行记录对象Result，如果创建失败则返回错误
 */
export async function createExecution(
  execution: Omit<AppExecution, 'id' | 'created_at' | 'updated_at'>
): Promise<Result<AppExecution>> {
  const executionWithDefaults = {
    ...execution,
    external_execution_id: execution.external_execution_id || null,
    task_id: execution.task_id || null,
    outputs: execution.outputs || null,
    error_message: execution.error_message || null,
    elapsed_time: execution.elapsed_time || null,
    completed_at: execution.completed_at || null,
    metadata: execution.metadata || {}
  };

  return dataService.create<AppExecution>('app_executions', executionWithDefaults);
}

/**
 * 更新执行记录（优化版本）
 * @param id 执行记录ID
 * @param updates 需要更新的字段
 * @returns 更新后的执行记录对象Result，如果更新失败则返回错误
 */
export async function updateExecution(
  id: string,
  updates: Partial<Omit<AppExecution, 'id' | 'created_at' | 'updated_at'>>
): Promise<Result<AppExecution>> {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  return dataService.update<AppExecution>('app_executions', id, updateData);
}

/**
 * 更新执行状态（优化版本）
 * @param id 执行记录ID
 * @param status 新状态
 * @param errorMessage 可选的错误信息
 * @param completedAt 可选的完成时间
 * @returns 是否更新成功的Result
 */
export async function updateExecutionStatus(
  id: string, 
  status: ExecutionStatus,
  errorMessage?: string,
  completedAt?: string
): Promise<Result<boolean>> {
  const updateData: Partial<AppExecution> = { 
    status,
    updated_at: new Date().toISOString()
  };

  if (errorMessage !== undefined) {
    updateData.error_message = errorMessage;
  }

  if (completedAt !== undefined) {
    updateData.completed_at = completedAt;
  } else if (status === 'completed' || status === 'failed' || status === 'stopped') {
    updateData.completed_at = new Date().toISOString();
  }

  const result = await dataService.update<AppExecution>('app_executions', id, updateData);
  
  if (result.success) {
    return success(true);
  } else {
    return success(false);
  }
}

/**
 * 删除执行记录（优化版本）
 * @param id 执行记录ID
 * @returns 是否删除成功的Result
 */
export async function deleteExecution(id: string): Promise<Result<boolean>> {
  console.log(`[删除执行记录] 开始删除执行记录，ID: ${id}`);
  
  const result = await dataService.delete('app_executions', id);
  
  if (result.success) {
    console.log(`[删除执行记录] 删除操作完成，ID: ${id}`);
    return success(true);
  } else {
    console.error(`[删除执行记录] 删除执行记录失败:`, result.error);
    return success(false);
  }
}

/**
 * 获取服务实例的执行记录（优化版本）
 * @param serviceInstanceId 服务实例ID
 * @param limit 限制数量
 * @returns 执行记录列表的Result
 */
export async function getExecutionsByServiceInstance(
  serviceInstanceId: string,
  limit: number = 10
): Promise<Result<AppExecution[]>> {
  return dataService.findMany<AppExecution>(
    'app_executions',
    { service_instance_id: serviceInstanceId },
    { column: 'created_at', ascending: false },
    { offset: 0, limit },
    {
      cache: true,
      cacheTTL: 2 * 60 * 1000, // 2分钟缓存
    }
  );
}

/**
 * 获取用户的执行统计信息
 * @param userId 用户ID
 * @param executionType 可选的执行类型筛选
 * @returns 统计信息的Result
 */
export async function getExecutionStats(
  userId: string,
  executionType?: ExecutionType
): Promise<Result<{
  total: number;
  completed: number;
  failed: number;
  running: number;
  totalTokens: number;
  avgElapsedTime: number;
}>> {
  try {
    const filters: Record<string, any> = { 
      user_id: userId,
      ...(executionType && { execution_type: executionType })
    };

    // 获取基础统计
    const { data, error } = await supabase
      .from('app_executions')
      .select('status, total_tokens, elapsed_time')
      .match(filters);

    if (error) {
      return failure(error);
    }

    const stats = {
      total: data.length,
      completed: data.filter(item => item.status === 'completed').length,
      failed: data.filter(item => item.status === 'failed').length,
      running: data.filter(item => item.status === 'running' || item.status === 'pending').length,
      totalTokens: data.reduce((sum, item) => sum + (item.total_tokens || 0), 0),
      avgElapsedTime: data.length > 0 
        ? data.reduce((sum, item) => sum + (item.elapsed_time || 0), 0) / data.length 
        : 0
    };

    return success(stats);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

// --- BEGIN COMMENT ---
// 兼容性函数，保持与现有代码的兼容性
// 这些函数将逐步迁移到使用Result类型
// --- END COMMENT ---

/**
 * 获取用户的执行记录列表（兼容版本）
 */
export async function getUserExecutionsLegacy(
  userId: string,
  limit: number = 20,
  offset: number = 0,
  executionType?: ExecutionType,
  status?: ExecutionStatus
): Promise<{ executions: AppExecution[], total: number }> {
  const result = await getUserExecutions(userId, limit, offset, executionType, status);
  if (result.success) {
    return result.data;
  } else {
    console.error('获取用户执行记录失败:', result.error);
    return { executions: [], total: 0 };
  }
}

/**
 * 根据ID获取执行记录详情（兼容版本）
 */
export async function getExecutionByIdLegacy(executionId: string): Promise<AppExecution | null> {
  const result = await getExecutionById(executionId);
  if (result.success) {
    return result.data;
  } else {
    console.error('获取执行记录详情失败:', result.error);
    return null;
  }
} 