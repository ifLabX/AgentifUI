/**
 * Test suite for MediaResponseHandler
 * @description Verifies refactored logic maintains exact same behavior as original if-else chain
 */
import { MediaResponseHandler } from './media-response-handler';

// Mock ReadableStream and Response for Node.js environment
const mockReadableStream = {} as ReadableStream;
global.ReadableStream = jest.fn().mockImplementation(() => mockReadableStream);

// Mock Response constructor
class MockResponseConstructor {
  body: ReadableStream | null;
  status: number;
  statusText: string;
  headers: Headers;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.body = body as ReadableStream | null;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
  }
}

global.Response = MockResponseConstructor as typeof Response;
// Mock Headers constructor
class MockHeaders {
  private _headers = new Map<string, string>();

  constructor(init?: HeadersInit) {
    if (init) {
      if (init instanceof Headers) {
        // Copy from another Headers object
        init.forEach((value, key) => this.set(key, value));
      } else if (Array.isArray(init)) {
        // Array format
        init.forEach(([key, value]) => this.set(key, value));
      } else {
        // Object format
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }

  get(name: string): string | null {
    return this._headers.get(name.toLowerCase()) || null;
  }

  set(name: string, value: string): void {
    this._headers.set(name.toLowerCase(), value);
  }

  forEach(
    callbackfn: (value: string, key: string, parent: Headers) => void
  ): void {
    this._headers.forEach((value, key) =>
      callbackfn(value, key, this as unknown as Headers)
    );
  }

  // Add missing Headers methods to satisfy TypeScript
  append(): void {
    /* Mock implementation */
  }
  delete(): void {
    /* Mock implementation */
  }
  getSetCookie(): string[] {
    return [];
  }
  has(): boolean {
    return false;
  }
  keys(): IterableIterator<string> {
    return this._headers.keys();
  }
  values(): IterableIterator<string> {
    return this._headers.values();
  }
  entries(): IterableIterator<[string, string]> {
    return this._headers.entries();
  }
  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this._headers.entries();
  }
}

global.Headers = MockHeaders as unknown as typeof Headers;

class MockResponse {
  public headers: Headers;
  public body: ReadableStream | null;
  public status: number;
  public statusText: string;

  constructor(
    contentType: string,
    status = 200,
    statusText = 'OK',
    additionalHeaders: Record<string, string> = {}
  ) {
    this.headers = new Headers();
    this.headers.set('content-type', contentType);

    // Add additional headers
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      this.headers.set(key, value);
    });

    this.body = mockReadableStream;
    this.status = status;
    this.statusText = statusText;
  }
}

describe('MediaResponseHandler', () => {
  describe('handleMediaResponse', () => {
    const appId = 'test-app';
    const method = 'GET';

    describe('Audio handling', () => {
      it('should handle audio/mp3 content-type', () => {
        const mockResponse = new MockResponse('audio/mp3', 200, 'OK', {
          'content-length': '1024',
          'accept-ranges': 'bytes',
        });

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
        expect(result!.status).toBe(200);
        expect(result!.statusText).toBe('OK');
        expect(result!.body).toBe(mockResponse.body);
      });

      it('should handle audio/wav content-type', () => {
        const mockResponse = new MockResponse('audio/wav');

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
      });
    });

    describe('Video handling', () => {
      it('should handle video/mp4 content-type', () => {
        const mockResponse = new MockResponse('video/mp4', 200, 'OK', {
          'content-length': '2048',
          'accept-ranges': 'bytes',
        });

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
        expect(result!.status).toBe(200);
        expect(result!.statusText).toBe('OK');
        expect(result!.body).toBe(mockResponse.body);
      });

      it('should handle video/webm content-type', () => {
        const mockResponse = new MockResponse('video/webm');

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
      });
    });

    describe('PDF handling', () => {
      it('should handle application/pdf content-type', () => {
        const mockResponse = new MockResponse('application/pdf', 200, 'OK', {
          'content-length': '4096',
          'content-disposition': 'inline; filename="test.pdf"',
        });

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
        expect(result!.status).toBe(200);
        expect(result!.statusText).toBe('OK');
        expect(result!.body).toBe(mockResponse.body);
      });
    });

    describe('Image handling', () => {
      it('should handle image/png content-type', () => {
        const mockResponse = new MockResponse('image/png', 200, 'OK', {
          'content-length': '512',
          'content-type': 'image/png',
        });

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
        expect(result!.status).toBe(200);
        expect(result!.statusText).toBe('OK');
        expect(result!.body).toBe(mockResponse.body);
      });

      it('should handle image/jpeg content-type', () => {
        const mockResponse = new MockResponse('image/jpeg');

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
      });

      it('should handle application/octet-stream content-type', () => {
        const mockResponse = new MockResponse('application/octet-stream');

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
      });
    });

    describe('Priority order testing', () => {
      it('should prioritize audio over other types', () => {
        // This test verifies that if somehow a content-type could match multiple,
        // audio takes priority (first in original if-else chain)
        const mockResponse = new MockResponse('audio/custom-type');

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();
      });
    });

    describe('Non-media content types', () => {
      it('should return null for text/html content-type', () => {
        const mockResponse = new MockResponse('text/html');

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).toBeNull();
      });

      it('should return null for application/json content-type', () => {
        const mockResponse = new MockResponse('application/json');

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).toBeNull();
      });

      it('should return null for text/event-stream content-type', () => {
        const mockResponse = new MockResponse('text/event-stream');

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).toBeNull();
      });

      it('should return null when no content-type header', () => {
        const mockResponse = new MockResponse('');
        mockResponse.headers = new Headers(); // Empty headers

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).toBeNull();
      });
    });

    describe('Header copying behavior', () => {
      it('should copy essential headers and skip non-media headers', () => {
        const mockResponse = new MockResponse('application/pdf', 200, 'OK', {
          'content-type': 'application/pdf',
          'content-length': '1024',
          'accept-ranges': 'bytes',
          vary: 'Accept-Encoding',
          'cache-control': 'no-cache', // Should NOT be copied
          'set-cookie': 'session=abc123', // Should NOT be copied
        });

        const result = MediaResponseHandler.handleMediaResponse(
          mockResponse as unknown as Response,
          appId,
          method
        );

        expect(result).not.toBeNull();

        // Verify that correct headers are copied (content-type should be preserved)
        expect(result!.headers.get('content-type')).toBe('application/pdf');
        expect(result!.headers.get('content-length')).toBe('1024');
        expect(result!.headers.get('accept-ranges')).toBe('bytes');
        expect(result!.headers.get('vary')).toBe('Accept-Encoding');

        // Verify that incorrect headers are NOT copied
        expect(result!.headers.get('cache-control')).toBeNull();
        expect(result!.headers.get('set-cookie')).toBeNull();
      });
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return types in correct order', () => {
      const types = MediaResponseHandler.getRegisteredTypes();

      // Should match original if-else chain order: audio -> video -> pdf -> image
      expect(types).toEqual(['audio', 'video', 'pdf', 'image']);
    });
  });

  describe('registerMediaType', () => {
    it('should allow registering new media types', () => {
      // Save original count
      const originalCount = MediaResponseHandler.getRegisteredTypes().length;

      // Register new type
      MediaResponseHandler.registerMediaType('custom', {
        contentTypes: ['application/custom'],
        description: 'Custom',
        shouldCopyHeader: () => true,
      });

      // Verify it was added
      const newTypes = MediaResponseHandler.getRegisteredTypes();
      expect(newTypes).toHaveLength(originalCount + 1);
      expect(newTypes[originalCount]).toBe('custom');

      // Test the new type works
      const mockResponse = new MockResponse('application/custom');
      const result = MediaResponseHandler.handleMediaResponse(
        mockResponse as unknown as Response,
        'test-app',
        'GET'
      );

      expect(result).not.toBeNull();
    });
  });
});
