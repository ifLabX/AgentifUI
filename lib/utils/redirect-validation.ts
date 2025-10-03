/**
 * Redirect URL validation utility
 * Ensures the security of redirect URLs based on the project's CORS configuration pattern.
 */

/**
 * Validate if a redirect URL is safe.
 * Uses the same domain validation logic as CORS configuration.
 * @param redirectUrl - The redirect URL to validate
 * @param baseUrl - The base URL (used for resolving relative paths)
 * @param defaultUrl - The default URL to return if validation fails
 * @returns The validated safe URL, or the default URL if invalid
 */
export function validateRedirectUrl(
  redirectUrl: string,
  baseUrl: string,
  defaultUrl: string = '/chat/new'
): string {
  // If no redirect URL is provided, return the default URL
  if (!redirectUrl || redirectUrl.trim() === '') {
    return defaultUrl;
  }

  try {
    // Get the list of allowed origins
    const allowedOrigins = getAllowedOrigins();

    // Try to parse the URL
    const parsedUrl = new URL(redirectUrl, baseUrl);

    // Check if it is a relative path (same origin)
    if (parsedUrl.origin === new URL(baseUrl).origin) {
      return redirectUrl;
    }

    // Check if the origin is in the allowed list
    if (isOriginAllowed(parsedUrl.origin, allowedOrigins)) {
      return redirectUrl;
    }

    // Not in the allowed list, return the default URL
    console.warn(
      `[Redirect Validation] Blocked redirect to unauthorized domain: ${parsedUrl.origin}`
    );
    return defaultUrl;
  } catch (error) {
    // URL parsing failed, return the default URL
    console.warn(
      `[Redirect Validation] Invalid redirect URL: ${redirectUrl}`,
      error
    );
    return defaultUrl;
  }
}

/**
 * Get the list of allowed origins.
 * Reuses the project's existing domain configuration logic.
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Add the main application domain
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  // Add additional allowed domains
  if (process.env.CORS_ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
    origins.push(...additionalOrigins);
  }

  // Add extra domains for development environment
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_ALLOWED_ORIGINS
  ) {
    const devOrigins = process.env.DEV_ALLOWED_ORIGINS.split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
    origins.push(...devOrigins);
  }

  // Remove duplicates and filter out empty values
  return [...new Set(origins)].filter(Boolean);
}

/**
 * Check if the origin is allowed.
 * Reuses the project's existing domain validation logic.
 */
function isOriginAllowed(
  requestOrigin: string | null,
  allowedOrigins: string[]
): boolean {
  if (!requestOrigin) {
    return false;
  }

  // Exact match
  if (allowedOrigins.includes(requestOrigin)) {
    return true;
  }

  // Wildcard match (*.example.com)
  for (const allowedOrigin of allowedOrigins) {
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      if (requestOrigin.endsWith(`.${domain}`) || requestOrigin === domain) {
        return true;
      }
    }
  }

  return false;
}
