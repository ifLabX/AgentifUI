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
 * 万无一失的完整执行数据更新函数
 * 专门用于工作流执行完成时的完整数据保存
 * @param id 执行记录ID
 * @param completeData 完整的执行数据
 * @returns 更新后的执行记录对象Result
 */
export async function updateCompleteExecutionData(
  id: string,
  completeData: {
    status: ExecutionStatus;
    external_execution_id?: string | null;
    task_id?: string | null;
    outputs?: Record<string, any> | null;
    total_steps?: number;
    total_tokens?: number;
    elapsed_time?: number | null;
    error_message?: string | null;
    completed_at?: string | null;
    metadata?: Record<string, any>;
  }
): Promise<Result<AppExecution>> {
  console.log('[数据库] 开始完整执行数据更新，ID:', id)
  console.log('[数据库] 更新数据:', JSON.stringify(completeData, null, 2))
  
  try {
    // 构建安全的更新数据对象，确保所有字段都有明确的值
    const safeUpdateData: Partial<AppExecution> = {
      status: completeData.status,
      updated_at: new Date().toISOString(),
      
      // Dify标识符 - 明确处理null值
      ...(completeData.external_execution_id !== undefined && {
        external_execution_id: completeData.external_execution_id
      }),
      ...(completeData.task_id !== undefined && {
        task_id: completeData.task_id
      }),
      
      // 执行结果 - 明确处理null值
      ...(completeData.outputs !== undefined && {
        outputs: completeData.outputs
      }),
      ...(completeData.total_steps !== undefined && {
        total_steps: completeData.total_steps
      }),
      ...(completeData.total_tokens !== undefined && {
        total_tokens: completeData.total_tokens
      }),
      ...(completeData.elapsed_time !== undefined && {
        elapsed_time: completeData.elapsed_time
      }),
      
      // 错误和完成信息
      ...(completeData.error_message !== undefined && {
        error_message: completeData.error_message
      }),
      ...(completeData.completed_at !== undefined && {
        completed_at: completeData.completed_at
      }),
      
      // metadata - 确保是有效的JSON对象
      ...(completeData.metadata !== undefined && {
        metadata: completeData.metadata || {}
      })
    };
    
    console.log('[数据库] 安全更新数据对象:', JSON.stringify(safeUpdateData, null, 2))
    
    // 使用原生Supabase客户端进行更新，确保所有字段都能正确保存
    const { data, error } = await supabase
      .from('app_executions')
      .update(safeUpdateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[数据库] 完整数据更新失败:', error)
      return failure(error);
    }
    
    if (!data) {
      console.error('[数据库] 更新成功但未返回数据')
      return failure(new Error('更新成功但未返回数据'));
    }
    
    console.log('[数据库] ✅ 完整数据更新成功')
    console.log('[数据库] 更新后的数据:', JSON.stringify(data, null, 2))
    
    // 清除相关缓存
    try {
      await cacheService.delete(`execution:${id}`);
      await cacheService.delete(`executions:user:${data.user_id}`);
    } catch (cacheError) {
      console.warn('[数据库] 清除缓存时出错:', cacheError);
    }
    
    return success(data as AppExecution);
    
  } catch (error) {
    console.error('[数据库] 完整数据更新时发生异常:', error)
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
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
 * 删除执行记录（软删除版本）
 * @param id 执行记录ID
 * @returns 是否删除成功的Result
 */
export async function deleteExecution(id: string): Promise<Result<boolean>> {
  console.log(`[软删除执行记录] 开始软删除执行记录，ID: ${id}`);
  
  const result = await dataService.softDelete('app_executions', id);
  
  if (result.success) {
    console.log(`[软删除执行记录] 软删除操作完成，ID: ${id}`);
    return success(true);
  } else {
    console.error(`[软删除执行记录] 软删除执行记录失败:`, result.error);
    return success(false);
  }
}

/**
 * 获取服务实例的执行记录（优化版本，过滤软删除记录）
 * @param serviceInstanceId 服务实例ID
 * @param limit 限制数量
 * @returns 执行记录列表的Result
 */
export async function getExecutionsByServiceInstance(
  serviceInstanceId: string,
  limit: number = 10
): Promise<Result<AppExecution[]>> {
  try {
    console.log('[获取执行记录] 开始查询，服务实例ID:', serviceInstanceId)
    
    // 先尝试获取所有记录，然后在应用层过滤
    const result = await dataService.findMany<AppExecution>(
      'app_executions',
      { service_instance_id: serviceInstanceId },
      { column: 'created_at', ascending: false },
      { offset: 0, limit: limit * 2 }, // 获取更多记录以确保有足够的非删除记录
      {
        cache: true,
        cacheTTL: 2 * 60 * 1000, // 2分钟缓存
      }
    );
    
    if (!result.success) {
      console.error('[获取执行记录] 数据服务查询失败:', result.error);
      return failure(result.error);
    }
    
    // 在应用层过滤软删除的记录
    const filteredData = result.data
      .filter(execution => execution.status !== 'deleted')
      .slice(0, limit); // 限制最终返回的数量
    
    console.log('[获取执行记录] 查询成功，总数:', result.data.length, '过滤后:', filteredData.length)
    
    return success(filteredData);
  } catch (error) {
    console.error('[获取执行记录] 查询时发生异常:', error);
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
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