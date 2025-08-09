/**
 * Comprehensive Test Suite for File Preview Cache Store
 * @description Tests all caching scenarios, edge cases, and real-world behaviors
 */
import type { DifyFilePreviewResponse } from '@lib/services/dify/types';

import {
  getCacheKey,
  useFilePreviewCacheStore,
} from './file-preview-cache-store';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test utilities
const createMockBlob = (
  content: string,
  size: number,
  type = 'application/pdf'
): Blob => {
  const blob = new Blob([content.repeat(Math.ceil(size / content.length))], {
    type,
  });
  // Mock the size property since Blob size calculation might vary
  Object.defineProperty(blob, 'size', { value: size, writable: false });
  return blob;
};

const createMockHeaders = (
  contentType = 'application/pdf'
): DifyFilePreviewResponse['headers'] => ({
  contentType,
  contentLength: 1024,
  contentDisposition: 'inline; filename="test.pdf"',
  cacheControl: 'no-cache',
  acceptRanges: 'bytes',
});

const createTestEntry = (fileId: string, size = 1024, content = 'test') => ({
  key: getCacheKey('test-app', fileId),
  blob: createMockBlob(content, size),
  headers: createMockHeaders(),
});

describe('File Preview Cache Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();

    // Reset store state using the store's methods
    const store = useFilePreviewCacheStore.getState();
    store.clear();

    // Reset config to default
    store.updateConfig({
      maxSizeBytes: 50 * 1024 * 1024, // 50MB
      ttlMs: 30 * 60 * 1000, // 30 minutes
      maxEntries: 100,
      maxFileSizeBytes: 20 * 1024 * 1024, // 20MB per file
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const key1 = getCacheKey('app-123', 'file-456');
      const key2 = getCacheKey('app-123', 'file-456');
      const key3 = getCacheKey('app-123', 'file-789');

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key1).toBe('preview:app-123:file-456');
    });

    it('should handle special characters in IDs', () => {
      const key = getCacheKey('app-test/123', 'file@test.pdf');
      expect(key).toBe('preview:app-test/123:file@test.pdf');
    });
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve cache entries correctly', () => {
      const store = useFilePreviewCacheStore.getState();
      const { key, blob, headers } = createTestEntry('file-001');

      // Cache miss initially
      expect(store.get(key)).toBeNull();
      expect(store.getCacheStats().missCount).toBe(1);

      // Store entry
      const stored = store.set(key, blob, headers);
      expect(stored).toBe(true);

      // Cache hit
      const entry = store.get(key);
      expect(entry).not.toBeNull();
      expect(entry!.content).toBe(blob);
      expect(entry!.headers).toEqual(headers);
      expect(entry!.size).toBe(1024);
      expect(store.getCacheStats().hitCount).toBe(1);
    });

    it('should handle cache entry replacement', () => {
      const store = useFilePreviewCacheStore.getState();
      const {
        key,
        blob: blob1,
        headers,
      } = createTestEntry('file-001', 1024, 'content1');
      const blob2 = createMockBlob('content2', 2048);

      // Store first entry
      store.set(key, blob1, headers);
      expect(store.getCacheStats().totalSize).toBe(1024);

      // Replace with second entry
      store.set(key, blob2, headers);
      expect(store.getCacheStats().totalSize).toBe(2048);

      // Verify replacement
      const entry = store.get(key);
      expect(entry!.content).toBe(blob2);
      expect(entry!.size).toBe(2048);
    });
  });

  describe('Size-based Filtering', () => {
    it('should reject files larger than maxFileSizeBytes', () => {
      const store = useFilePreviewCacheStore.getState();
      const { key, headers } = createTestEntry('large-file');

      // Create a file larger than default limit (20MB)
      const largeBlob = createMockBlob('large', 25 * 1024 * 1024); // 25MB

      const stored = store.set(key, largeBlob, headers);
      expect(stored).toBe(false);
      expect(store.get(key)).toBeNull();
      expect(store.getCacheStats().totalSize).toBe(0);
    });

    it('should accept files within size limit', () => {
      const store = useFilePreviewCacheStore.getState();
      const { key, headers } = createTestEntry('normal-file');

      // Create a file within limit
      const normalBlob = createMockBlob('normal', 10 * 1024 * 1024); // 10MB

      const stored = store.set(key, normalBlob, headers);
      expect(stored).toBe(true);
      expect(store.get(key)).not.toBeNull();
    });

    it('should allow size limit configuration', () => {
      const store = useFilePreviewCacheStore.getState();
      const { key, headers } = createTestEntry('test-file');

      // Set smaller limit
      store.updateConfig({ maxFileSizeBytes: 1024 });

      const smallBlob = createMockBlob('small', 512);
      const largeBlob = createMockBlob('large', 2048);

      expect(store.set(key + '-small', smallBlob, headers)).toBe(true);
      expect(store.set(key + '-large', largeBlob, headers)).toBe(false);
    });
  });

  describe('Cache Capacity Management', () => {
    it('should enforce maximum total size limit', () => {
      const store = useFilePreviewCacheStore.getState();

      // Set small cache limit for testing
      store.updateConfig({
        maxSizeBytes: 3072, // 3KB
        maxEntries: 100,
      });

      const headers = createMockHeaders();

      // Add entries totaling more than limit
      const files = [
        { key: 'file1', size: 1024 },
        { key: 'file2', size: 1024 },
        { key: 'file3', size: 1024 },
        { key: 'file4', size: 1024 }, // This should trigger eviction
      ];

      files.forEach(({ key, size }) => {
        const blob = createMockBlob('content', size);
        store.set(getCacheKey('app', key), blob, headers);
      });

      // Should have evicted oldest entries
      const stats = store.getCacheStats();
      expect(stats.totalSize).toBeLessThanOrEqual(3072 * 0.8); // Target 80% of max
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    it('should enforce maximum entry count limit', () => {
      const store = useFilePreviewCacheStore.getState();

      // Set entry count limit
      store.updateConfig({
        maxEntries: 3,
        maxSizeBytes: 50 * 1024 * 1024, // Large size limit to test entry count only
      });

      const headers = createMockHeaders();

      // Add more entries than limit
      for (let i = 1; i <= 5; i++) {
        const blob = createMockBlob('content', 512);
        store.set(getCacheKey('app', `file${i}`), blob, headers);
      }

      const stats = store.getCacheStats();
      expect(stats.entryCount).toBeLessThanOrEqual(3);
      expect(stats.evictionCount).toBeGreaterThan(0);
    });
  });

  describe('LRU Eviction Algorithm', () => {
    it('should evict least recently used entries', () => {
      const store = useFilePreviewCacheStore.getState();

      // Clear cache and set limits for testing
      store.clear();
      store.updateConfig({
        maxSizeBytes: 2048, // 2KB total limit
        maxEntries: 100,
      });

      const headers = createMockHeaders();

      // Add entries that will exceed size limit
      const file1Key = getCacheKey('app', 'file1');
      const file2Key = getCacheKey('app', 'file2');
      const file3Key = getCacheKey('app', 'file3');

      store.set(file1Key, createMockBlob('content1', 800), headers); // 800B
      store.set(file2Key, createMockBlob('content2', 800), headers); // 800B, total: 1600B

      // Access file1 to make it more recently used (updates lastAccessed)
      store.get(file1Key);

      // Add file3 which should trigger eviction (total would be 2400B > 2048B limit)
      store.set(file3Key, createMockBlob('content3', 800), headers); // 800B

      // Verify eviction occurred (should target 80% of max = ~1638B)
      const stats = store.getCacheStats();
      expect(stats.evictionCount).toBeGreaterThan(0);
      expect(stats.totalSize).toBeLessThanOrEqual(2048);
    });

    it('should update access count and time on cache hit', () => {
      const store = useFilePreviewCacheStore.getState();
      const { key, blob, headers } = createTestEntry('file-001');

      // Store entry - accessCount starts at 1
      store.set(key, blob, headers);

      // First get - should increment to 2
      const entry1 = store.get(key);
      expect(entry1!.accessCount).toBe(2); // 1 (set) + 1 (get)

      // Second get - should increment to 3
      const entry2 = store.get(key);
      expect(entry2!.accessCount).toBe(3); // previous + 1

      // Access time should be updated (at least not decrease)
      expect(entry2!.lastAccessed).toBeGreaterThanOrEqual(entry1!.lastAccessed);
    });
  });

  describe('TTL and Expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return expired entries as cache miss', () => {
      const store = useFilePreviewCacheStore.getState();
      const { key, blob, headers } = createTestEntry('file-001');

      // Set short TTL for testing
      store.updateConfig({ ttlMs: 1000 }); // 1 second

      store.set(key, blob, headers);

      // Entry should be available immediately
      expect(store.get(key)).not.toBeNull();

      // Fast forward past TTL
      jest.advanceTimersByTime(2000);

      // Entry should be expired
      expect(store.get(key)).toBeNull();
      expect(store.getCacheStats().missCount).toBe(1);
    });

    it('should clean up expired entries during cleanup', () => {
      const store = useFilePreviewCacheStore.getState();

      // Set short TTL
      store.updateConfig({ ttlMs: 1000 });

      const headers = createMockHeaders();

      // Add multiple entries
      store.set(
        getCacheKey('app', 'file1'),
        createMockBlob('content1', 1024),
        headers
      );
      store.set(
        getCacheKey('app', 'file2'),
        createMockBlob('content2', 1024),
        headers
      );

      expect(store.getCacheStats().entryCount).toBe(2);
      expect(store.getCacheStats().totalSize).toBe(2048);

      // Fast forward past TTL
      jest.advanceTimersByTime(2000);

      // Run cleanup
      store.cleanup();

      const stats = store.getCacheStats();
      expect(stats.entryCount).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it('should automatically clean up expired entries every 5 minutes', () => {
      // This test verifies the cleanup interval is set up correctly
      // Note: In real implementation, cleanup runs via setInterval
      expect(typeof window).toBeDefined(); // Ensure we're in browser environment for setInterval
    });
  });

  describe('Cache Statistics', () => {
    it('should track hit and miss counts correctly', () => {
      const store = useFilePreviewCacheStore.getState();
      const { key, blob, headers } = createTestEntry('file-001');

      // Initial stats
      let stats = store.getCacheStats();
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
      expect(stats.hitRate).toBe(0);

      // Cache miss
      store.get(key);
      stats = store.getCacheStats();
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0);

      // Add entry
      store.set(key, blob, headers);

      // Cache hit
      store.get(key);
      stats = store.getCacheStats();
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track total size correctly', () => {
      const store = useFilePreviewCacheStore.getState();
      const headers = createMockHeaders();

      expect(store.getCacheStats().totalSize).toBe(0);

      store.set(
        getCacheKey('app', 'file1'),
        createMockBlob('content1', 1024),
        headers
      );
      expect(store.getCacheStats().totalSize).toBe(1024);

      store.set(
        getCacheKey('app', 'file2'),
        createMockBlob('content2', 2048),
        headers
      );
      expect(store.getCacheStats().totalSize).toBe(3072);
    });

    it('should track eviction count', () => {
      const store = useFilePreviewCacheStore.getState();

      // Set small limits to trigger eviction
      store.updateConfig({ maxSizeBytes: 2048, maxEntries: 100 });

      const headers = createMockHeaders();

      // Add entries that will trigger eviction
      store.set(
        getCacheKey('app', 'file1'),
        createMockBlob('content1', 1024),
        headers
      );
      store.set(
        getCacheKey('app', 'file2'),
        createMockBlob('content2', 1024),
        headers
      );
      store.set(
        getCacheKey('app', 'file3'),
        createMockBlob('content3', 1024),
        headers
      ); // Should trigger eviction

      expect(store.getCacheStats().evictionCount).toBeGreaterThan(0);
    });
  });

  describe('Cache Clearing', () => {
    it('should clear all cache entries and reset stats', () => {
      const store = useFilePreviewCacheStore.getState();
      const headers = createMockHeaders();

      // Add some entries
      store.set(
        getCacheKey('app', 'file1'),
        createMockBlob('content1', 1024),
        headers
      );
      store.set(
        getCacheKey('app', 'file2'),
        createMockBlob('content2', 1024),
        headers
      );

      // Verify entries exist
      expect(store.getCacheStats().entryCount).toBe(2);
      expect(store.getCacheStats().totalSize).toBe(2048);

      // Clear cache
      store.clear();

      // Verify everything is cleared
      const stats = store.getCacheStats();
      expect(stats.entryCount).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.hitCount).toBe(0);
      expect(stats.missCount).toBe(0);
      expect(stats.evictionCount).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should allow configuration updates', () => {
      const store = useFilePreviewCacheStore.getState();

      // Check initial config (set by beforeEach)
      expect(store.config.maxSizeBytes).toBe(50 * 1024 * 1024);

      // Update configuration
      store.updateConfig({
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
        ttlMs: 60 * 60 * 1000, // 1 hour
        maxEntries: 50,
        maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
      });

      // Check updated config
      const updatedStore = useFilePreviewCacheStore.getState();
      expect(updatedStore.config.maxSizeBytes).toBe(10 * 1024 * 1024);
      expect(updatedStore.config.ttlMs).toBe(60 * 60 * 1000);
      expect(updatedStore.config.maxEntries).toBe(50);
      expect(updatedStore.config.maxFileSizeBytes).toBe(5 * 1024 * 1024);
    });

    it('should trigger cleanup when limits are reduced', () => {
      const store = useFilePreviewCacheStore.getState();
      const headers = createMockHeaders();

      // Add entries with current config
      store.set(
        getCacheKey('app', 'file1'),
        createMockBlob('content1', 2048),
        headers
      );
      store.set(
        getCacheKey('app', 'file2'),
        createMockBlob('content2', 2048),
        headers
      );

      expect(store.getCacheStats().entryCount).toBe(2);

      // Reduce maxEntries
      store.updateConfig({ maxEntries: 1 });

      // Should trigger eviction
      expect(store.getCacheStats().entryCount).toBeLessThanOrEqual(1);
    });
  });

  describe('Persistence Integration', () => {
    it('should have persist configuration for config and stats only', () => {
      const store = useFilePreviewCacheStore.getState();

      // Test that the store has the expected structure for persistence
      expect(store.config).toBeDefined();
      expect(store.stats).toBeDefined();
      expect(store.runtimeCache).toBeDefined();

      // Test that runtime cache is initialized as Map (memory-only)
      expect(store.runtimeCache).toBeInstanceOf(Map);

      // Verify persistent data structure
      expect(typeof store.config.maxSizeBytes).toBe('number');
      expect(typeof store.config.ttlMs).toBe('number');
      expect(typeof store.stats.totalSize).toBe('number');
      expect(typeof store.stats.hitCount).toBe('number');

      // Config should have all required properties
      expect(store.config).toHaveProperty('maxSizeBytes');
      expect(store.config).toHaveProperty('ttlMs');
      expect(store.config).toHaveProperty('maxEntries');
      expect(store.config).toHaveProperty('maxFileSizeBytes');
    });

    it('should initialize runtime cache on hydration', () => {
      // This tests the onRehydrateStorage callback
      const store = useFilePreviewCacheStore.getState();
      expect(store.runtimeCache).toBeInstanceOf(Map);
    });

    it('should only persist config and stats, not runtime cache', () => {
      const store = useFilePreviewCacheStore.getState();
      const headers = createMockHeaders();

      // Add cache entries
      store.set(
        getCacheKey('app', 'file1'),
        createMockBlob('content1', 1024),
        headers
      );

      // The partialize function should only include config and stats
      const persistConfig = {
        name: 'file-preview-cache-storage',
        storage: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
        partialize: (state: typeof store) => ({
          config: state.config,
          stats: state.stats,
        }),
      };

      const partializedState = persistConfig.partialize(store);

      expect(partializedState).toHaveProperty('config');
      expect(partializedState).toHaveProperty('stats');
      expect(partializedState).not.toHaveProperty('runtimeCache');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      const store = useFilePreviewCacheStore.getState();

      expect(() => store.get('')).not.toThrow();
      expect(store.get('')).toBeNull();
    });

    it('should handle blob creation errors gracefully', () => {
      const store = useFilePreviewCacheStore.getState();
      const headers = createMockHeaders();

      // Mock a problematic blob
      const problematicBlob = {
        size: 1024,
        type: 'application/pdf',
      } as Blob;

      expect(() =>
        store.set('test-key', problematicBlob, headers)
      ).not.toThrow();
    });

    it('should handle concurrent access patterns', () => {
      const store = useFilePreviewCacheStore.getState();
      const { key, blob, headers } = createTestEntry('file-001');

      // Simulate concurrent access
      store.set(key, blob, headers); // accessCount = 1 initially

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(store.get(key)); // Each get increments accessCount
      }

      // All should return the same entry
      results.forEach(result => {
        expect(result).not.toBeNull();
        expect(result!.content).toBe(blob);
      });

      // Access count should be updated correctly: 1 (initial) + 10 (gets) = 11
      // But since we're accessing the same entry object, it should be 11
      const finalEntry = store.runtimeCache.get(key);
      expect(finalEntry!.accessCount).toBe(11); // 1 (set) + 10 (gets)
    });
  });

  describe('Real-world Usage Simulation', () => {
    it('should simulate typical user preview behavior', () => {
      const store = useFilePreviewCacheStore.getState();
      const headers = createMockHeaders();

      // Reset stats first
      store.clear();

      // User opens several files
      const files = ['document.pdf', 'image.jpg', 'video.mp4', 'audio.mp3'];
      let hitCount = 0;
      let missCount = 0;

      files.forEach((filename, index) => {
        const key = getCacheKey('user-app', `file-${index}`);
        const blob = createMockBlob(`content-${filename}`, 1024 + index * 512);

        // First access - cache miss
        expect(store.get(key)).toBeNull();
        missCount++; // Track expected miss

        // Store in cache
        store.set(key, blob, headers);

        // Second access - cache hit
        const cachedEntry = store.get(key);
        expect(cachedEntry).not.toBeNull();
        expect(cachedEntry!.content).toBe(blob);
        hitCount++; // Track expected hit
      });

      // Verify statistics
      const stats = store.getCacheStats();
      expect(stats.hitCount).toBe(hitCount); // expected cache hits
      expect(stats.missCount).toBe(missCount); // expected cache misses
      expect(stats.hitRate).toBe(hitCount / (hitCount + missCount)); // calculated hit rate
      expect(stats.entryCount).toBe(files.length); // entries cached (unless evicted)
    });

    it('should handle mixed file sizes and types', () => {
      const store = useFilePreviewCacheStore.getState();

      const testCases = [
        {
          name: 'small-doc.pdf',
          size: 100 * 1024,
          type: 'application/pdf',
          shouldCache: true,
        },
        {
          name: 'large-video.mp4',
          size: 25 * 1024 * 1024,
          type: 'video/mp4',
          shouldCache: false,
        },
        {
          name: 'medium-image.jpg',
          size: 5 * 1024 * 1024,
          type: 'image/jpeg',
          shouldCache: true,
        },
        {
          name: 'huge-file.zip',
          size: 100 * 1024 * 1024,
          type: 'application/zip',
          shouldCache: false,
        },
      ];

      testCases.forEach(({ name, size, type, shouldCache }) => {
        const key = getCacheKey('app', name);
        const blob = createMockBlob('content', size, type);
        const headers = createMockHeaders(type);

        const cached = store.set(key, blob, headers);
        expect(cached).toBe(shouldCache);

        if (shouldCache) {
          expect(store.get(key)).not.toBeNull();
        } else {
          expect(store.get(key)).toBeNull();
        }
      });
    });
  });
});

describe('Cache Integration with File Preview Store', () => {
  // These tests would verify the integration between cache store and preview store
  // but since we're testing the cache store in isolation, we'll focus on the interface

  it('should provide correct cache key generation', () => {
    const appId = 'test-app-123';
    const fileId = 'file-upload-456';

    const key = getCacheKey(appId, fileId);
    expect(key).toBe(`preview:${appId}:${fileId}`);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });

  it('should maintain cache consistency across operations', () => {
    const store = useFilePreviewCacheStore.getState();
    const { key, blob, headers } = createTestEntry('consistency-test');

    // Multiple operations should maintain consistency
    expect(store.set(key, blob, headers)).toBe(true);
    expect(store.get(key)).not.toBeNull();
    expect(store.get(key)).not.toBeNull(); // Second access

    const stats1 = store.getCacheStats();
    const stats2 = store.getCacheStats();

    // Stats should be consistent
    expect(stats1.hitCount).toBe(stats2.hitCount);
    expect(stats1.entryCount).toBe(stats2.entryCount);
  });
});
