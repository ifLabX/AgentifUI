/**
 * Account status to error code mapping constants
 *
 * Used for consistent error handling across SSO authentication
 * and middleware account status validation
 */
export const ACCOUNT_STATUS_ERROR_MAP = {
  suspended: 'account_suspended',
  pending: 'account_pending',
} as const;

export const ACCOUNT_STATUS_DEFAULT_ERROR = 'invalid_account' as const;

/**
 * System-level error codes for authentication failures
 */
export const AUTH_SYSTEM_ERRORS = {
  PROFILE_CHECK_FAILED: 'profile_check_failed',
  PROFILE_NOT_FOUND: 'profile_not_found',
  PERMISSION_CHECK_FAILED: 'permission_check_failed',
} as const;

/**
 * Get appropriate error code for given account status
 *
 * @param status - User account status from database
 * @returns Error code for display to user
 */
export function getAccountStatusError(
  status: string | undefined | null
): string {
  if (!status) return ACCOUNT_STATUS_DEFAULT_ERROR;

  return (
    ACCOUNT_STATUS_ERROR_MAP[status as keyof typeof ACCOUNT_STATUS_ERROR_MAP] ??
    ACCOUNT_STATUS_DEFAULT_ERROR
  );
}

// Type exports for TypeScript safety
export type AccountStatusErrorCode =
  | (typeof ACCOUNT_STATUS_ERROR_MAP)[keyof typeof ACCOUNT_STATUS_ERROR_MAP]
  | typeof ACCOUNT_STATUS_DEFAULT_ERROR;

export type AuthSystemErrorCode =
  (typeof AUTH_SYSTEM_ERRORS)[keyof typeof AUTH_SYSTEM_ERRORS];
