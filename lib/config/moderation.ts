/**
 * Global content moderation configuration
 * @description Loads moderation settings from environment variables for zero-database dependency
 * @module lib/config/moderation
 */

/**
 * Moderation configuration interface
 * @description Defines structure for content moderation system configuration
 */
export interface ModerationConfig {
  /** Whether global moderation is enabled */
  enabled: boolean;

  /** Dify API base URL (e.g., https://api.dify.ai/v1) */
  apiUrl: string;

  /** Dify application API key for authentication */
  apiKey: string;

  /** Timeout for moderation API calls in milliseconds */
  timeoutMs: number;

  /** Failure mode: fail_open (allow on error) or fail_closed (block on error) */
  failureMode: 'fail_open' | 'fail_closed';
}

/**
 * Get global moderation configuration from environment variables
 * @description Reads configuration from process.env for runtime config
 * @returns Moderation configuration object with defaults
 */
export function getModerationConfig(): ModerationConfig {
  return {
    enabled: process.env.MODERATION_ENABLED === 'true',
    apiUrl: process.env.MODERATION_API_URL || '',
    apiKey: process.env.MODERATION_API_KEY || '',
    timeoutMs: parseInt(process.env.MODERATION_TIMEOUT_MS || '5000', 10),
    failureMode: (process.env.MODERATION_FAILURE_MODE || 'fail_open') as
      | 'fail_open'
      | 'fail_closed',
  };
}

/**
 * Validate moderation configuration completeness
 * @description Ensures all required configuration values are present when enabled
 * @param config - Moderation configuration to validate
 * @returns true if config is valid and complete, false otherwise
 */
export function validateModerationConfig(config: ModerationConfig): boolean {
  if (!config.enabled) {
    return true; // If disabled, no validation needed
  }

  if (!config.apiUrl) {
    console.error(
      '[Moderation Config] MODERATION_API_URL is required when MODERATION_ENABLED=true'
    );
    return false;
  }

  if (!config.apiKey) {
    console.error(
      '[Moderation Config] MODERATION_API_KEY is required when MODERATION_ENABLED=true'
    );
    return false;
  }

  if (config.timeoutMs <= 0 || config.timeoutMs > 30000) {
    console.error(
      '[Moderation Config] MODERATION_TIMEOUT_MS must be between 1 and 30000'
    );
    return false;
  }

  return true;
}
