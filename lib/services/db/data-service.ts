/**
 * Unified Data Service Layer
 *
 * Integrates cache, error handling, retry logic, and Result type.
 * Provides a unified interface for all database operations.
 */
import { createClient } from '@lib/supabase/client';
import {
  DatabaseError,
  Result,
  failure,
  success,
  wrapAsync,
} from '@lib/types/result';

import { cacheService } from './cache-service';
import { realtimeService } from './realtime-service';

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
   * Get the singleton instance of the data service
   */
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  /**
   * General query method with cache and error handling
   */
  async query<T>(
    operation: () => Promise<T>,
    cacheKey?: string,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    const {
      cache = false,
      cacheTTL = 5 * 60 * 1000, // 5 minutes
      retries = 3,
      retryDelay = 1000,
    } = options;

    // Use cache if enabled and cacheKey is provided
    if (cache && cacheKey) {
      try {
        return success(await cacheService.get(cacheKey, operation, cacheTTL));
      } catch (error) {
        return failure(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }

    // Retry logic if not using cache
    for (let attempt = 1; attempt <= retries; attempt++) {
      const result = await wrapAsync(operation);

      if (result.success) {
        return result;
      }

      // Return failure if last attempt or non-retryable error
      if (attempt === retries || this.isNonRetryableError(result.error)) {
        return result;
      }

      // Wait and retry
      await this.delay(retryDelay * attempt);
      console.log(
        `[DataService] Retry attempt ${attempt}, error:`,
        result.error.message
      );
    }

    return failure(
      new DatabaseError('Query failed, max retries reached', 'query')
    );
  }

  /**
   * Determine if the error is non-retryable
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
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a Supabase query and return Result
   */
  async executeQuery<T>(
    queryBuilder: any,
    operation: string,
    cacheKey?: string,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    return this.query(
      async () => {
        const { data, error } = await queryBuilder;

        if (error) {
          throw new DatabaseError(
            `${operation} failed: ${error.message}`,
            operation,
            error
          );
        }

        return data as T;
      },
      cacheKey,
      options
    );
  }

  /**
   * Get a single record
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
      this.supabase.from(table).select('*').match(filters).maybeSingle(),
      `Query ${table}`,
      cacheKey,
      options
    );

    // Setup realtime subscription
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
   * Get multiple records
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

    const orderStr = orderBy
      ? `${orderBy.column}:${orderBy.ascending ? 'asc' : 'desc'}`
      : '';
    const pageStr = pagination
      ? `${pagination.offset}:${pagination.limit}`
      : '';
    const cacheKey = options.cache
      ? `${table}:many:${filterStr}:${orderStr}:${pageStr}`
      : undefined;

    let query = this.supabase.from(table).select('*');

    // Apply filters
    if (Object.keys(filters).length > 0) {
      query = query.match(filters);
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    // Apply pagination
    if (pagination) {
      query = query.range(
        pagination.offset,
        pagination.offset + pagination.limit - 1
      );
    }

    const result = await this.executeQuery<T[]>(
      query,
      `Query ${table} list`,
      cacheKey,
      options
    );

    // Setup realtime subscription
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
   * Create a record
   */
  async create<T>(
    table: string,
    data: Partial<T>,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    const result = await this.executeQuery<T>(
      this.supabase.from(table).insert(data).select().single(),
      `Create ${table}`,
      undefined,
      options
    );

    // Clear related cache
    if (result.success) {
      cacheService.deletePattern(`${table}:*`);
    }

    return result;
  }

  /**
   * Update a record
   */
  async update<T>(
    table: string,
    id: string,
    data: Partial<T>,
    options: QueryOptions = {}
  ): Promise<Result<T>> {
    const result = await this.executeQuery<T>(
      this.supabase.from(table).update(data).eq('id', id).select().single(),
      `Update ${table}`,
      undefined,
      options
    );

    // Clear related cache
    if (result.success) {
      cacheService.deletePattern(`${table}:*`);
    }

    return result;
  }

  /**
   * Delete a record
   */
  async delete(
    table: string,
    id: string,
    options: QueryOptions = {}
  ): Promise<Result<void>> {
    const result = await this.executeQuery<void>(
      this.supabase.from(table).delete().eq('id', id),
      `Delete ${table}`,
      undefined,
      options
    );

    // Clear related cache
    if (result.success) {
      cacheService.deletePattern(`${table}:*`);
    }

    return result;
  }

  /**
   * Soft delete a record (set status to 'deleted')
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single(),
      `Soft delete ${table}`,
      undefined,
      options
    );

    // Clear related cache
    if (result.success) {
      cacheService.deletePattern(`${table}:*`);
    }

    return result;
  }

  /**
   * Get record count
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

    let query = this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    // Apply filters
    if (Object.keys(filters).length > 0) {
      query = query.match(filters);
    }

    return this.query(
      async () => {
        const { count, error } = await query;

        if (error) {
          throw new DatabaseError(
            `Failed to get ${table} count: ${error.message}`,
            'count',
            error
          );
        }

        return count || 0;
      },
      cacheKey,
      options
    );
  }

  /**
   * Clear all cache for a specific table
   */
  clearCache(table: string): number {
    return cacheService.deletePattern(`${table}:*`);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    cacheService.clear();
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    cacheService.destroy();
    realtimeService.destroy();
  }
}

// Export singleton instance
export const dataService = DataService.getInstance();
