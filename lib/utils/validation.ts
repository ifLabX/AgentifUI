/**
 * Validation utilities for common data formats
 */

/**
 * RFC 5322 compliant email validation regex
 * - Prevents consecutive dots in local and domain parts
 * - Prevents consecutive @ symbols
 * - Supports both FQDN (internet) and single-label domains (intranet)
 * - Supports common special characters in local part
 * - Each domain label must be 1-63 characters (RFC 1035)
 *
 * Pattern breakdown:
 * - Local part: [a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+
 * - Domain: [a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?
 * - Optional TLD parts: (?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*
 *
 * Supports:
 * - Internet: user@example.com, admin@mail.company.org
 * - Intranet: admin@localhost, user@internal, employee@domain
 * - Special: .local domains (RFC 6762), enterprise internal domains
 *
 * Extracted as constant for performance optimization (compiled once)
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * RFC 5321 length constraints
 * - Local part (before @): maximum 64 characters
 * - Domain part (after @): maximum 255 characters
 */
const MAX_LOCAL_PART_LENGTH = 64;
const MAX_DOMAIN_PART_LENGTH = 255;

/**
 * Validate email format using RFC-compliant regex with length validation
 *
 * This function uses an RFC 5322/5321 compliant regex pattern that validates:
 *
 * **Internet email formats**:
 * - Standard: user@example.com
 * - Subdomains: user@mail.example.com
 * - Special TLDs: user@example.co.uk
 *
 * **Intranet email formats** (RFC 5321 §2.3.5):
 * - Single-label domains: admin@localhost, user@internal
 * - .local domains: user@server.local (RFC 6762)
 * - Enterprise domains: employee@domain
 *
 * **Advanced features**:
 * - Special characters: !#$%&'*+/=?^_`{|}~-
 * - Plus addressing: user+tag@example.com
 * - Dots in local part: first.last@example.com
 *
 * **RFC 5321 length constraints**:
 * - Local part ≤ 64 characters
 * - Domain part ≤ 255 characters
 *
 * **Security validations**:
 * - Rejects consecutive dots: user..name@domain.com
 * - Rejects consecutive @: user@@domain.com
 * - Rejects dots at boundaries: .user@domain.com, user.@domain.com
 * - Rejects whitespace
 *
 * @param email - Email string to validate
 * @returns true if email format is valid, false otherwise
 *
 * @example
 * // Internet emails
 * isValidEmail('user@example.com') // returns true
 * isValidEmail('admin@mail.company.org') // returns true
 *
 * // Intranet emails
 * isValidEmail('admin@localhost') // returns true
 * isValidEmail('user@internal') // returns true
 * isValidEmail('employee@server.local') // returns true
 *
 * // Invalid formats
 * isValidEmail('invalid-email') // returns false
 * isValidEmail('user..name@domain.com') // returns false (consecutive dots)
 * isValidEmail('user@@domain.com') // returns false (consecutive @)
 *
 * // Whitespace handling
 * isValidEmail('  user@example.com  ') // returns true (trimmed)
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();

  // Check for basic structure and RFC 5322 compliance
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return false;
  }

  // RFC 5321 length validation
  const [localPart, domainPart] = trimmedEmail.split('@');

  if (localPart.length > MAX_LOCAL_PART_LENGTH) {
    return false;
  }

  if (domainPart.length > MAX_DOMAIN_PART_LENGTH) {
    return false;
  }

  // Additional validation: reject consecutive dots in local part
  if (localPart.includes('..')) {
    return false;
  }

  // Additional validation: reject consecutive dots in domain part
  if (domainPart.includes('..')) {
    return false;
  }

  // Additional validation: local part cannot start or end with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  return true;
}

/**
 * Normalize email address to lowercase for consistent storage and comparison
 *
 * According to RFC 5321 §2.3.11, the local part of an email address is
 * technically case-sensitive, but in practice, most email systems treat
 * addresses as case-insensitive. This function normalizes emails to lowercase
 * to prevent duplicate accounts due to case variations (e.g., User@example.com
 * vs user@example.com).
 *
 * **Why lowercase normalization matters:**
 * - Prevents duplicate accounts: User@example.com, user@example.com, USER@example.com
 * - Database consistency: PostgreSQL's default string comparison is case-sensitive
 * - Email system compatibility: Most modern email systems ignore case
 * - Industry best practice: Gmail, Outlook, etc. treat emails as case-insensitive
 *
 * @param email - Email address to normalize
 * @returns Normalized email in lowercase with whitespace trimmed, or empty string if invalid
 *
 * @example
 * normalizeEmail('User@Example.Com') // returns 'user@example.com'
 * normalizeEmail('  ADMIN@LOCALHOST  ') // returns 'admin@localhost'
 * normalizeEmail('Test.User+Tag@Domain.ORG') // returns 'test.user+tag@domain.org'
 * normalizeEmail('invalid') // returns '' (invalid format)
 * normalizeEmail('') // returns ''
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const trimmed = email.trim();

  // Validate before normalizing to ensure we only normalize valid emails
  if (!isValidEmail(trimmed)) {
    return '';
  }

  // Convert to lowercase for case-insensitive comparison
  return trimmed.toLowerCase();
}
