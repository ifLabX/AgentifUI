/**
 * 统一的数据服务层
 * 
 * 整合缓存、错误处理、重试逻辑和Result类型
 * 为所有数据库操作提供统一的接口
 */

import { createClient } from '@lib/supabase/client';
import { cacheService, CacheKeys } from './cache-service';
import { realtimeService, SubscriptionKeys, SubscriptionConfigs } from './realtime-service';
import { Result, success, failure, wrapAsync, DatabaseError } from '@lib/types/result';
import type { PostgrestError } from '@supabase/supabase-js';

interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  retries?: number;
  retryDelay?: number;
}

interface RealtimeOptions {
  subscribe?: boolean;
  subscriptionKey?: string;
  onUpdate?: (payload: any) => void;
}

export class DataService {
  private static instance: DataService;
  private supabase = createClient();

  private constructor() {}

  /**
   * 获取数据服务单例
   */
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * 通用查询方法，集成缓存和错误处理
   */
  async query<T>(
    operation: () => Promise<T>,
    cacheKey?: string,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    const {
      cache = false,
      cacheTTL = 5 * 60 * 1000, // 5分钟
      retries = 3,
      retryDelay = 1000
    } = options;

    // 如果启用缓存且有缓存键
    if (cache && cacheKey) {
      try {
        return success(await cacheService.get(cacheKey, operation, cacheTTL));
      } catch (error) {
        return failure(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // 不使用缓存时的重试逻辑
    for (let attempt = 1; attempt <= retries; attempt++) {
      const result = await wrapAsync(operation);
      
      if (result.success) {
        return result;
      }

      // 如果是最后一次尝试或者是不可重试的错误，直接返回失败
      if (attempt === retries || this.isNonRetryableError(result.error)) {
        return result;
      }

      // 等待后重试
      await this.delay(retryDelay * attempt);
      console.log(`[数据服务] 重试第 ${attempt} 次，错误:`, result.error.message);
    }

    return failure(new DatabaseError('查询失败，已达到最大重试次数', 'query'));
  }

  /**
   * 判断是否为不可重试的错误
   */
  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('unique constraint') ||
      message.includes('foreign key') ||
      message.includes('check constraint') ||
      message.includes('not null') ||
      message.includes('permission denied') ||
      message.includes('row level security')
    );
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 执行Supabase查询并返回Result
   */
  async executeQuery<T>(
    queryBuilder: any,
    operation: string,
    cacheKey?: string,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    return this.query(async () => {
      const { data, error } = await queryBuilder;
      
      if (error) {
        throw new DatabaseError(
          `${operation}失败: ${error.message}`,
          operation,
          error
        );
      }

      return data as T;
    }, cacheKey, options);
  }

  /**
   * 获取单条记录
   */
  async findOne<T>(
    table: string,
    filters: Record<string, any>,
    options: QueryOptions & RealtimeOptions = {}
  ): Promise<Result<T | null>> {
    const filterStr = Object.entries(filters)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const cacheKey = options.cache ? `${table}:one:${filterStr}` : undefined;
    
    const result = await this.executeQuery<T>(
      this.supabase
        .from(table)
        .select('*')
        .match(filters)
        .maybeSingle(),
      `查询${table}`,
      cacheKey,
      options
    );

    // 设置实时订阅
    if (options.subscribe && options.subscriptionKey && options.onUpdate) {
      realtimeService.subscribe(
        options.subscriptionKey,
        { event: '*', schema: 'public', table },
        options.onUpdate
      );
    }

    return result;
  }

  /**
   * 获取多条记录
   */
  async findMany<T>(
    table: string,
    filters: Record<string, any> = {},
    orderBy?: { column: string; ascending?: boolean },
    pagination?: { offset: number; limit: number },
    options: QueryOptions & RealtimeOptions = {}
  ): Promise<Result<T[]>> {
    const filterStr = Object.entries(filters)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const orderStr = orderBy ? `${orderBy.column}:${orderBy.ascending ? 'asc' : 'desc'}` : '';
    const pageStr = pagination ? `${pagination.offset}:${pagination.limit}` : '';
    const cacheKey = options.cache ? `${table}:many:${filterStr}:${orderStr}:${pageStr}` : undefined;

    let query = this.supabase.from(table).select('*');

    // 应用过滤器
    if (Object.keys(filters).length > 0) {
      query = query.match(filters);
    }

    // 应用排序
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    // 应用分页
    if (pagination) {
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
    }

    const result = await this.executeQuery<T[]>(
      query,
      `查询${table}列表`,
      cacheKey,
      options
    );

    // 设置实时订阅
    if (options.subscribe && options.subscriptionKey && options.onUpdate) {
      realtimeService.subscribe(
        options.subscriptionKey,
        { event: '*', schema: 'public', table },
        options.onUpdate
      );
    }

    return result;
  }

  /**
   * 创建记录
   */
  async create<T>(
    table: string,
    data: Partial<T>,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    const result = await this.executeQuery<T>(
      this.supabase
        .from(table)
        .insert(data)
        .select()
        .single(),
      `创建${table}`,
      undefined,
      options
    );

    // 清除相关缓存
    if (result.success) {
      cacheService.deletePattern(`${table}:*`);
    }

    return result;
  }

  /**
   * 更新记录
   */
  async update<T>(
    table: string,
    id: string,
    data: Partial<T>,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    const result = await this.executeQuery<T>(
      this.supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single(),
      `更新${table}`,
      undefined,
      options
    );

    // 清除相关缓存
    if (result.success) {
      cacheService.deletePattern(`${table}:*`);
    }

    return result;
  }

  /**
   * 删除记录
   */
  async delete(
    table: string,
    id: string,
    options: QueryOptions = {}
  ): Promise<Result<void>> {
    const result = await this.executeQuery<void>(
      this.supabase
        .from(table)
        .delete()
        .eq('id', id),
      `删除${table}`,
      undefined,
      options
    );

    // 清除相关缓存
    if (result.success) {
      cacheService.deletePattern(`${table}:*`);
    }

    return result;
  }

  /**
   * 软删除记录（设置status为deleted）
   */
  async softDelete<T>(
    table: string,
    id: string,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    const result = await this.executeQuery<T>(
      this.supabase
        .from(table)
        .update({ 
          status: 'deleted', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single(),
      `软删除${table}`,
      undefined,
      options
    );

    // 清除相关缓存
    if (result.success) {
      cacheService.deletePattern(`${table}:*`);
    }

    return result;
  }

  /**
   * 获取记录数量
   */
  async count(
    table: string,
    filters: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<Result<number>> {
    const filterStr = Object.entries(filters)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const cacheKey = options.cache ? `${table}:count:${filterStr}` : undefined;

    let query = this.supabase.from(table).select('*', { count: 'exact', head: true });

    // 应用过滤器
    if (Object.keys(filters).length > 0) {
      query = query.match(filters);
    }

    return this.query(async () => {
      const { count, error } = await query;
      
      if (error) {
        throw new DatabaseError(
          `获取${table}数量失败: ${error.message}`,
          'count',
          error
        );
      }

      return count || 0;
    }, cacheKey, options);
  }

  /**
   * 清除指定表的所有缓存
   */
  clearCache(table: string): number {
    return cacheService.deletePattern(`${table}:*`);
  }

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    cacheService.clear();
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    cacheService.destroy();
    realtimeService.destroy();
  }
}

// 导出单例实例
export const dataService = DataService.getInstance(); 