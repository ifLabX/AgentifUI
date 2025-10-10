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

/**
 * Maximum length for employee number field
 * Based on database TEXT type and practical business requirements
 */
const MAX_EMPLOYEE_NUMBER_LENGTH = 50;

/**
 * Validate and normalize employee number for SSO user identification
 *
 * This function ensures employee numbers meet business and security requirements:
 *
 * **Validation Rules**:
 * - Must not be null or undefined
 * - Must be a string type
 * - Must not be empty after trimming whitespace
 * - Must only contain safe characters: alphanumeric, hyphen (-), underscore (_)
 * - Must not exceed 50 characters
 *
 * **Security Considerations**:
 * - Prevents empty string attacks (e.g., '   ' becomes '')
 * - Prevents SQL injection via special characters
 * - Prevents XSS attacks via script tags
 * - Prevents DoS via excessively long strings
 *
 * **Database Alignment**:
 * - Matches database function validation in `find_user_by_employee_number`
 * - Respects UNIQUE constraint on profiles.employee_number
 * - Ensures indexable values (idx_profiles_employee_number)
 *
 * @param employeeNumber - Raw employee number from external source (CAS, form input, etc.)
 * @returns Trimmed and validated employee number
 * @throws Error with specific message if validation fails
 *
 * @example
 * // Valid inputs
 * validateEmployeeNumber('12345') // returns '12345'
 * validateEmployeeNumber('EMP-001') // returns 'EMP-001'
 * validateEmployeeNumber('user_123') // returns 'user_123'
 * validateEmployeeNumber('  12345  ') // returns '12345' (trimmed)
 *
 * @example
 * // Invalid inputs (throws Error)
 * validateEmployeeNumber('') // Error: cannot be empty
 * validateEmployeeNumber('   ') // Error: consist only of whitespace
 * validateEmployeeNumber('user@123') // Error: invalid characters
 * validateEmployeeNumber('a'.repeat(51)) // Error: exceeds maximum length
 * validateEmployeeNumber(null) // Error: is required
 * validateEmployeeNumber(123) // Error: must be a string
 */
export function validateEmployeeNumber(employeeNumber: unknown): string {
  // Type guard: Check for null/undefined
  if (employeeNumber === null || employeeNumber === undefined) {
    throw new Error('Employee number is required');
  }

  // Type guard: Check for string type
  if (typeof employeeNumber !== 'string') {
    throw new Error(
      `Employee number must be a string, received: ${typeof employeeNumber}`
    );
  }

  // Trim whitespace
  const trimmed = employeeNumber.trim();

  // Check empty after trim (prevent whitespace-only input attacks)
  if (trimmed.length === 0) {
    if (employeeNumber.length > 0) {
      // Original string had content but was only whitespace
      throw new Error('Employee number cannot consist only of whitespace');
    }
    // Original string was actually empty
    throw new Error('Employee number cannot be empty');
  }

  // Format validation (prevent SQL injection, XSS attacks, etc.)
  // Only allow: letters (a-z, A-Z), numbers (0-9), hyphen (-), underscore (_)
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error(
      'Employee number contains invalid characters. ' +
        'Only alphanumeric characters, hyphens, and underscores are allowed.'
    );
  }

  // Length validation (prevent DoS attacks and database performance issues)
  if (trimmed.length > MAX_EMPLOYEE_NUMBER_LENGTH) {
    throw new Error(
      `Employee number exceeds maximum length of ${MAX_EMPLOYEE_NUMBER_LENGTH} characters ` +
        `(received: ${trimmed.length} characters)`
    );
  }

  return trimmed;
}
