// Unified CORS configuration system
// There is only one CORS config for the entire project, controlled by environment variables for allowed domains
export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

// Default CORS configuration
const DEFAULT_CORS_CONFIG: Omit<CorsConfig, 'allowedOrigins'> = {
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Get the list of allowed origins
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Add main application domain
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

  // Remove duplicates and filter out empty values
  return [...new Set(origins)].filter(Boolean);
}

// Get default dev environment origins
// Fully based on environment variables, no hardcoding
function getDevOrigins(): string[] {
  const origins: string[] = [];

  // Dev environment allowed domains can be configured via env variable
  if (process.env.DEV_ALLOWED_ORIGINS) {
    const devOrigins = process.env.DEV_ALLOWED_ORIGINS.split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
    origins.push(...devOrigins);
  }

  // If NEXT_PUBLIC_APP_URL exists, add it to the allowed list
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  // Remove duplicates
  return [...new Set(origins)];
}

// Check if the origin is allowed
function isOriginAllowed(
  requestOrigin: string | null,
  allowedOrigins: string[]
): string | null {
  if (!requestOrigin) {
    return null;
  }

  // Exact match
  if (allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Wildcard match (*.example.com)
  for (const allowedOrigin of allowedOrigins) {
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      if (requestOrigin.endsWith(`.${domain}`) || requestOrigin === domain) {
        return requestOrigin;
      }
    }
  }

  return null;
}

// Get the CORS configuration
export function getCorsConfig(): CorsConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  let allowedOrigins = getAllowedOrigins();

  // In development: if no domains are configured, use default local domains
  if (isDevelopment && allowedOrigins.length === 0) {
    allowedOrigins = getDevOrigins();
  }

  // In production: if no domains are configured, log a warning
  if (!isDevelopment && allowedOrigins.length === 0) {
    console.warn(
      '[CORS] ⚠️ No allowed origins configured in production, all cross-origin requests will be denied'
    );
  }

  return {
    ...DEFAULT_CORS_CONFIG,
    allowedOrigins,
  };
}

// Create CORS response headers
export function createCorsHeaders(requestOrigin: string | null): Headers {
  const config = getCorsConfig();
  const headers = new Headers();

  // Check if the request origin is allowed
  const allowedOrigin = isOriginAllowed(requestOrigin, config.allowedOrigins);

  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);

    if (config.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(', '));
  headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));

  if (config.exposedHeaders.length > 0) {
    headers.set(
      'Access-Control-Expose-Headers',
      config.exposedHeaders.join(', ')
    );
  }

  headers.set('Access-Control-Max-Age', config.maxAge.toString());

  return headers;
}

// Handle CORS preflight request
export function handleCorsPreflightRequest(request: Request): Response {
  const origin = request.headers.get('origin');
  const corsHeaders = createCorsHeaders(origin);

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Unified function to add CORS headers to API responses
export function withCorsHeaders(
  response: Response,
  request: Request
): Response {
  const origin = request.headers.get('origin');
  const corsHeaders = createCorsHeaders(origin);

  // Copy existing response headers and add CORS headers
  const newHeaders = new Headers(response.headers);
  corsHeaders.forEach((value, key) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
