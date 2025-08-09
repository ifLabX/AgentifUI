/**
 * Media Response Handler for Dify API Proxy
 * @description Centralized handler for different media types to eliminate code duplication
 */

interface MediaTypeConfig {
  /** Content types that this handler applies to */
  contentTypes: string[];
  /** Description for logging */
  description: string;
  /** Function to determine if a header should be copied */
  shouldCopyHeader: (headerName: string) => boolean;
}

/**
 * Create minimal response headers with Content-Type
 */
function createMinimalHeaders(contentType?: string): Headers {
  const headers = new Headers();
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  return headers;
}

/**
 * Check if a header should be copied for media responses
 */
function isMediaHeader(headerName: string): boolean {
  const lowerName = headerName.toLowerCase();
  return (
    lowerName.startsWith('content-') ||
    lowerName === 'accept-ranges' ||
    lowerName === 'vary'
  );
}

export class MediaResponseHandler {
  // Use array to maintain exact order matching original if-else chain
  private static readonly configs: Array<{
    key: string;
    config: MediaTypeConfig;
  }> = [
    // Order matches original: audio -> video -> PDF -> image
    {
      key: 'audio',
      config: {
        contentTypes: ['audio/'],
        description: 'Audio',
        shouldCopyHeader: isMediaHeader,
      },
    },
    {
      key: 'video',
      config: {
        contentTypes: ['video/'],
        description: 'Video',
        shouldCopyHeader: isMediaHeader,
      },
    },
    {
      key: 'pdf',
      config: {
        contentTypes: ['application/pdf'],
        description: 'PDF',
        shouldCopyHeader: isMediaHeader,
      },
    },
    {
      key: 'image',
      config: {
        contentTypes: ['image/', 'application/octet-stream'],
        description: 'Image/Binary',
        shouldCopyHeader: isMediaHeader,
      },
    },
  ];

  /**
   * Determine if a content type matches any registered media type
   * Maintains original if-else chain order for consistent behavior
   */
  private static getMediaConfig(
    contentType: string
  ): { key: string; config: MediaTypeConfig } | null {
    // Iterate through configs in original order (audio -> video -> PDF -> image)
    for (const { key, config } of this.configs) {
      const matches = config.contentTypes.some(type => {
        if (type.endsWith('/')) {
          return contentType.startsWith(type);
        }
        return contentType === type;
      });

      if (matches) {
        return { key, config };
      }
    }
    return null;
  }

  /**
   * Handle media response by piping binary data directly
   * @param response - The fetch response from Dify API
   * @param appId - Application ID for logging
   * @param method - HTTP method for logging
   * @returns Response object or null if not a media type
   */
  static handleMediaResponse(
    response: Response,
    appId: string,
    method: string
  ): Response | null {
    const contentType = response.headers.get('content-type');
    if (!contentType) {
      return null;
    }

    const mediaMatch = this.getMediaConfig(contentType.toLowerCase());
    if (!mediaMatch) {
      return null;
    }

    const { config } = mediaMatch;

    console.log(
      `[App: ${appId}] [${method}] ${config.description} response detected.`
    );

    // Create headers for the response
    const mediaHeaders = createMinimalHeaders();
    response.headers.forEach((value, key) => {
      if (config.shouldCopyHeader(key)) {
        mediaHeaders.set(key, value);
      }
    });

    // Direct pipe binary data to preserve integrity
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: mediaHeaders,
    });
  }

  /**
   * Register a new media type configuration
   * @param key - Unique key for the media type
   * @param config - Configuration for the media type
   */
  static registerMediaType(key: string, config: MediaTypeConfig): void {
    this.configs.push({ key, config });
  }

  /**
   * Get all registered media type keys (for testing/debugging)
   */
  static getRegisteredTypes(): string[] {
    return this.configs.map(({ key }) => key);
  }
}
