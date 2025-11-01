/**
 * Content moderation type definitions
 * @description Minimal types for content moderation system
 * @module lib/services/dify/moderation-types
 */

/**
 * Moderation result from content safety check
 * @description Contains safety status, identified categories, and timing information
 */
export interface ModerationResult {
  /** Whether the content is considered safe */
  isSafe: boolean;

  /** List of unsafe categories detected (e.g., ["violence", "hate_speech"]) */
  categories: string[];

  /** Raw response text from moderation API */
  rawResponse: string;

  /** Response time in milliseconds */
  responseTimeMs: number;
}

/**
 * Moderation error with categorization
 * @description Structured error from moderation system with retry guidance
 */
export class ModerationError extends Error {
  /**
   * Create a moderation error
   * @param message - Error message describing what went wrong
   * @param code - Error category for handling logic
   * @param retryable - Whether this error condition can be retried
   */
  constructor(
    message: string,
    public code: 'timeout' | 'api_error' | 'network_error' | 'parse_error',
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ModerationError';
  }
}

/**
 * Content moderation failure error
 * @description Thrown when user content is rejected by content moderation
 * This is a user-facing error that should be handled gracefully in the UI
 */
export class ContentModerationError extends Error {
  /**
   * Create a content moderation error
   * @param message - User-friendly error message
   * @param categories - List of violated content categories
   */
  constructor(
    message: string,
    public categories: string[]
  ) {
    super(message);
    this.name = 'ContentModerationError';
  }
}
