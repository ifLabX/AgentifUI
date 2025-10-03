/**
 * Unified Result type definition
 *
 * Used to standardize return values for all database operations and API calls.
 * Provides consistent error handling and success state checking.
 */

export type Result<T> =
  | { success: true; data: T; error?: never }
  | { success: false; error: Error; data?: never };

/**
 * Create a successful result
 */
export function success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function failure<T>(error: Error | string): Result<T> {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  return { success: false, error: errorObj };
}

/**
 * Wrap an async operation, automatically catch exceptions and return Result type
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
 * Database operation error type
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
 * Network operation error type
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
 * Validation error type
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
