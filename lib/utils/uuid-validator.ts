/**
 * UUID Validation Utilities
 *
 * Centralized UUID validation functions to avoid code duplication across API routes.
 * Provides consistent validation patterns for UUID format checking.
 */

/**
 * UUID v4 regex pattern for validation
 * Matches standard UUID format: 8-4-4-4-12 hexadecimal characters
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID v4 format
 *
 * @param uuid - The string to validate
 * @returns true if valid UUID v4, false otherwise
 *
 * @example
 * ```typescript
 * import { isValidUUID } from '@lib/utils/uuid-validator';
 *
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // true
 * isValidUUID('invalid-uuid'); // false
 * ```
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_V4_REGEX.test(uuid);
}

/**
 * Validate an array of UUIDs and return invalid ones
 *
 * @param uuids - Array of UUID strings to validate
 * @returns Array of invalid UUIDs (empty if all are valid)
 *
 * @example
 * ```typescript
 * import { getInvalidUUIDs } from '@lib/utils/uuid-validator';
 *
 * const uuids = ['550e8400-e29b-41d4-a716-446655440000', 'invalid-uuid'];
 * const invalid = getInvalidUUIDs(uuids); // ['invalid-uuid']
 * ```
 */
export function getInvalidUUIDs(uuids: string[]): string[] {
  return uuids.filter(uuid => !isValidUUID(uuid));
}

/**
 * Validate a single UUID and throw an error with context if invalid
 *
 * @param uuid - The UUID string to validate
 * @param context - Context for error message (e.g., 'notification ID', 'user ID')
 * @throws Error if UUID is invalid
 *
 * @example
 * ```typescript
 * import { validateUUIDOrThrow } from '@lib/utils/uuid-validator';
 *
 * try {
 *   validateUUIDOrThrow('invalid-uuid', 'notification ID');
 * } catch (error) {
 *   console.log(error.message); // "Invalid notification ID format"
 * }
 * ```
 */
export function validateUUIDOrThrow(uuid: string, context = 'UUID'): void {
  if (!isValidUUID(uuid)) {
    throw new Error(`Invalid ${context} format`);
  }
}

/**
 * Validate array of UUIDs and throw an error if any are invalid
 *
 * @param uuids - Array of UUID strings to validate
 * @param context - Context for error message (e.g., 'notification IDs', 'user IDs')
 * @throws Error if any UUID is invalid
 *
 * @example
 * ```typescript
 * import { validateUUIDArrayOrThrow } from '@lib/utils/uuid-validator';
 *
 * try {
 *   validateUUIDArrayOrThrow(['valid-uuid', 'invalid-uuid'], 'notification IDs');
 * } catch (error) {
 *   console.log(error.message); // "Invalid notification IDs format: invalid-uuid"
 * }
 * ```
 */
export function validateUUIDArrayOrThrow(
  uuids: string[],
  context = 'UUIDs'
): void {
  const invalidUUIDs = getInvalidUUIDs(uuids);
  if (invalidUUIDs.length > 0) {
    throw new Error(`Invalid ${context} format: ${invalidUUIDs.join(', ')}`);
  }
}

/**
 * Get the regex pattern for UUID validation (for advanced use cases)
 *
 * @returns The UUID v4 regex pattern
 */
export function getUUIDRegex(): RegExp {
  return UUID_V4_REGEX;
}
