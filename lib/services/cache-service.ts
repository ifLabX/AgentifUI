/**
 * 统一的缓存服务
 * 
 * 提供内存级别的数据缓存，支持TTL（生存时间）管理
 * 用于减少数据库查询次数，提高应用性能
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheItem<any>>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // 每分钟清理一次过期缓存
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  /**
   * 获取缓存服务单例
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 获取缓存数据，如果不存在或过期则执行fetcher
   * @param key 缓存键
   * @param fetcher 数据获取函数
   * @param ttl 生存时间（毫秒），默认5分钟
   */
  async get<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    // 检查缓存是否存在且未过期
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`[缓存命中] 键: ${key}`);
      return cached.data;
    }

    // 缓存不存在或已过期，重新获取数据
    console.log(`[缓存未命中] 键: ${key}，重新获取数据`);
    const data = await fetcher();
    
    // 存储到缓存
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    return data;
  }

  /**
   * 直接设置缓存
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    if (Date.now() - cached.timestamp >= cached.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 删除指定缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 删除匹配模式的所有缓存
   */
  deletePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期的缓存项
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp >= item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[缓存清理] 清理了 ${cleanedCount} 个过期缓存项`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    expired: number;
    totalMemorySize: number;
  } {
    const now = Date.now();
    let expired = 0;
    let totalMemorySize = 0;
    
    for (const [key, item] of this.cache.entries()) {
      // 计算内存大小（粗略估算）
      totalMemorySize += key.length * 2 + JSON.stringify(item.data).length * 2;
      
      if (now - item.timestamp >= item.ttl) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      expired,
      totalMemorySize
    };
  }

  /**
   * 销毁缓存服务
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}

// 导出单例实例
export const cacheService = CacheService.getInstance();

// 常用的缓存键生成器
export const CacheKeys = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  userConversations: (userId: string, page: number = 0) => `user:conversations:${userId}:${page}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  conversationMessages: (conversationId: string, page: number = 0) => `conversation:messages:${conversationId}:${page}`,
  providers: () => 'providers:active',
  serviceInstances: (providerId: string) => `service:instances:${providerId}`,
  apiKey: (serviceInstanceId: string) => `api:key:${serviceInstanceId}`,
  conversationByExternalId: (externalId: string) => `conversation:external:${externalId}`,
}; 