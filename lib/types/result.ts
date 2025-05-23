/**
 * 统一的Result类型定义
 * 
 * 用于标准化所有数据库操作和API调用的返回值
 * 提供一致的错误处理和成功状态检查
 */

export type Result<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: Error; data?: never };

/**
 * 创建成功结果
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * 创建失败结果
 */
export function failure<T>(error: Error | string): Result<T> {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  return { success: false, error: errorObj };
}

/**
 * 包装异步操作，自动捕获异常并返回Result类型
 */
export async function wrapAsync<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<Result<T>> {
  try {
    const data = await operation();
    return success(data);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    if (errorMessage) {
      errorObj.message = `${errorMessage}: ${errorObj.message}`;
    }
    return failure(errorObj);
  }
}

/**
 * 数据库操作错误类型
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * 网络操作错误类型
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * 验证错误类型
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
} 