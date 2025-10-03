/**
 * File Preview Cache Store
 * @description Centralized cache management for file preview content
 * Integrates with existing project cache cleanup system
 */
import type { DifyFilePreviewResponse } from '@lib/services/dify/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Cache entry interface
interface CacheEntry {
  content: Blob;
  headers: DifyFilePreviewResponse['headers'];
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

// Cache configuration
interface CacheConfig {
  // Maximum cache size in bytes (50MB default)
  maxSizeBytes: number;
  // Time to live in milliseconds (30 minutes default)
  ttlMs: number;
  // Maximum number of entries
  maxEntries: number;
  // Size threshold for caching (don't cache files larger than this)
  maxFileSizeBytes: number;
}

interface FilePreviewCacheState {
  // Runtime cache (in-memory, not persisted)
  runtimeCache: Map<string, CacheEntry>;

  // Cache configuration
  config: CacheConfig;

  // Cache statistics
  stats: {
    totalSize: number;
    hitCount: number;
    missCount: number;
    evictionCount: number;
  };

  // Actions
  get: (key: string) => CacheEntry | null;
  set: (
    key: string,
    content: Blob,
    headers: DifyFilePreviewResponse['headers']
  ) => boolean;
  clear: () => void;
  cleanup: () => void;
  getCacheStats: () => {
    totalSize: number;
    hitCount: number;
    missCount: number;
    evictionCount: number;
    entryCount: number;
    hitRate: number;
  };
  updateConfig: (newConfig: Partial<CacheConfig>) => void;
}

// Default configuration
const DEFAULT_CONFIG: CacheConfig = {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
  ttlMs: 30 * 60 * 1000, // 30 minutes
  maxEntries: 100,
  maxFileSizeBytes: 20 * 1024 * 1024, // 20MB per file
};

// Helper functions

const isExpired = (timestamp: number, ttl: number): boolean => {
  return Date.now() - timestamp > ttl;
};

const shouldCache = (size: number, config: CacheConfig): boolean => {
  return size <= config.maxFileSizeBytes;
};

// LRU eviction algorithm
const evictLRU = (
  cache: Map<string, CacheEntry>,
  targetSize: number,
  config: CacheConfig
): number => {
  let evictedCount = 0;
  let currentSize = Array.from(cache.values()).reduce(
    (sum, entry) => sum + entry.size,
    0
  );

  // Sort by last accessed time (oldest first)
  const sortedEntries = Array.from(cache.entries()).sort(
    ([, a], [, b]) => a.lastAccessed - b.lastAccessed
  );

  for (const [key, entry] of sortedEntries) {
    if (currentSize <= targetSize && cache.size <= config.maxEntries) {
      break;
    }

    cache.delete(key);
    currentSize -= entry.size;
    evictedCount++;
  }

  return evictedCount;
};

export const useFilePreviewCacheStore = create<FilePreviewCacheState>()(
  persist(
    (set, get) => ({
      runtimeCache: new Map(),
      config: DEFAULT_CONFIG,
      stats: {
        totalSize: 0,
        hitCount: 0,
        missCount: 0,
        evictionCount: 0,
      },

      get: (key: string) => {
        const state = get();
        const entry = state.runtimeCache.get(key);

        if (!entry) {
          // Cache miss
          set(state => ({
            stats: { ...state.stats, missCount: state.stats.missCount + 1 },
          }));
          return null;
        }

        // Check expiration
        if (isExpired(entry.timestamp, state.config.ttlMs)) {
          state.runtimeCache.delete(key);
          set(state => ({
            stats: {
              ...state.stats,
              missCount: state.stats.missCount + 1,
              totalSize: state.stats.totalSize - entry.size,
            },
          }));
          return null;
        }

        // Update access info
        entry.lastAccessed = Date.now();
        entry.accessCount++;

        // Cache hit
        set(state => ({
          stats: { ...state.stats, hitCount: state.stats.hitCount + 1 },
        }));

        return entry;
      },

      set: (
        key: string,
        content: Blob,
        headers: DifyFilePreviewResponse['headers']
      ) => {
        const state = get();
        const config = state.config;

        // Check if file is too large to cache
        if (!shouldCache(content.size, config)) {
          return false;
        }

        const now = Date.now();
        const entry: CacheEntry = {
          content,
          headers,
          timestamp: now,
          size: content.size,
          accessCount: 1,
          lastAccessed: now,
        };

        // Calculate size delta for existing entry replacement
        const existing = state.runtimeCache.get(key);
        const sizeDelta = existing
          ? content.size - existing.size
          : content.size;

        // Add new entry (this will replace existing if present)
        state.runtimeCache.set(key, entry);

        // Update total size with delta
        let newTotalSize = state.stats.totalSize + sizeDelta;

        // Evict if necessary
        let evictedCount = 0;
        if (
          newTotalSize > config.maxSizeBytes ||
          state.runtimeCache.size > config.maxEntries
        ) {
          evictedCount = evictLRU(
            state.runtimeCache,
            config.maxSizeBytes * 0.8, // Target 80% of max size
            config
          );

          // Recalculate size after eviction
          newTotalSize = Array.from(state.runtimeCache.values()).reduce(
            (sum, entry) => sum + entry.size,
            0
          );
        }

        set(state => ({
          stats: {
            ...state.stats,
            totalSize: newTotalSize,
            evictionCount: state.stats.evictionCount + evictedCount,
          },
        }));

        return true;
      },

      clear: () => {
        const state = get();
        state.runtimeCache.clear();
        set({
          stats: {
            totalSize: 0,
            hitCount: 0,
            missCount: 0,
            evictionCount: 0,
          },
        });
      },

      cleanup: () => {
        const state = get();
        const config = state.config;
        let removedSize = 0;
        let removedCount = 0;

        // Remove expired entries
        for (const [key, entry] of state.runtimeCache.entries()) {
          if (isExpired(entry.timestamp, config.ttlMs)) {
            state.runtimeCache.delete(key);
            removedSize += entry.size;
            removedCount++;
          }
        }

        set(state => ({
          stats: {
            ...state.stats,
            totalSize: state.stats.totalSize - removedSize,
            evictionCount: state.stats.evictionCount + removedCount,
          },
        }));
      },

      getCacheStats: () => {
        const state = get();
        return {
          ...state.stats,
          entryCount: state.runtimeCache.size,
          hitRate:
            state.stats.hitCount /
              (state.stats.hitCount + state.stats.missCount) || 0,
        };
      },

      updateConfig: (newConfig: Partial<CacheConfig>) => {
        const state = get();
        const updatedConfig = { ...state.config, ...newConfig };

        set(() => ({
          config: updatedConfig,
        }));

        // Trigger eviction if limits were reduced
        const currentState = get();
        if (
          currentState.runtimeCache.size > updatedConfig.maxEntries ||
          currentState.stats.totalSize > updatedConfig.maxSizeBytes
        ) {
          // Trigger eviction using LRU algorithm
          const evictedCount = evictLRU(
            currentState.runtimeCache,
            updatedConfig.maxSizeBytes * 0.8,
            updatedConfig
          );

          // Recalculate size after eviction
          const newTotalSize = Array.from(
            currentState.runtimeCache.values()
          ).reduce((sum, cacheEntry) => sum + cacheEntry.size, 0);

          if (evictedCount > 0) {
            set(() => ({
              stats: {
                ...currentState.stats,
                totalSize: newTotalSize,
                evictionCount: currentState.stats.evictionCount + evictedCount,
              },
            }));
          }
        }
      },
    }),
    {
      name: 'file-preview-cache-storage',
      storage: createJSONStorage(() => localStorage),

      // Only persist config and stats, runtime cache is memory-only for better performance
      partialize: state => ({
        config: state.config,
        stats: state.stats,
      }),

      // Initialize runtime cache on hydration
      onRehydrateStorage: () => state => {
        if (state) {
          state.runtimeCache = new Map();
        }
      },
    }
  )
);

// Utility function to generate cache keys
export const getCacheKey = (appId: string, fileId: string): string => {
  return `preview:${appId}:${fileId}`;
};

// Initialize cleanup interval (run every 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      const store = useFilePreviewCacheStore.getState();
      store.cleanup();
    },
    5 * 60 * 1000
  );
}
