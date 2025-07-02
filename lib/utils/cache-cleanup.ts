/**
 * 统一缓存清理服务
 * 用于在登录、登出、切换用户时清理所有相关缓存
 */
import { clearDifyConfigCache } from '@lib/config/dify-config';
import { clearProfileCache } from '@lib/hooks/use-profile';

// --- BEGIN COMMENT ---
// 所有需要清理的localStorage键名
// --- END COMMENT ---
const CACHE_KEYS = {
  // 用户相关缓存
  USER_PROFILE: 'user_profile_cache',

  // 主题相关（可选保留，用户偏好）
  THEME: 'theme',

  // 应用相关缓存
  LAST_USED_MODEL_APP: 'last-used-model-app-id',

  // 关于页面配置（可选保留，全局配置） - 已被移除
  // ABOUT_PAGE_CONFIG: 'about-page-config',

  // 其他需要清理的键名前缀
  RESIZABLE_PANE_PREFIX: 'split-pane-',
} as const;

// --- BEGIN COMMENT ---
// 敏感缓存：包含用户敏感信息，必须在登出时清理
// --- END COMMENT ---
const SENSITIVE_CACHE_KEYS = [
  CACHE_KEYS.USER_PROFILE,
  CACHE_KEYS.LAST_USED_MODEL_APP,
];

// --- BEGIN COMMENT ---
// 用户相关缓存：与特定用户绑定，切换用户时需要清理
// --- END COMMENT ---
const USER_SPECIFIC_CACHE_KEYS = [
  CACHE_KEYS.USER_PROFILE,
  CACHE_KEYS.LAST_USED_MODEL_APP,
];

// --- BEGIN COMMENT ---
// 全局配置缓存：可以跨用户保留的配置
// --- END COMMENT ---
const GLOBAL_CONFIG_CACHE_KEYS = [
  CACHE_KEYS.THEME,
  // CACHE_KEYS.ABOUT_PAGE_CONFIG, // 已被移除
];

// --- BEGIN COMMENT ---
// 登出时需要清理的缓存
// 将敏感缓存和用户特定缓存合并
// --- END COMMENT ---
const LOGOUT_CLEANUP_KEYS = [
  ...new Set([...SENSITIVE_CACHE_KEYS, ...USER_SPECIFIC_CACHE_KEYS]),
];

/**
 * 清理敏感缓存
 * 用于登出时，清理所有包含用户敏感信息的缓存
 */
export const clearSensitiveCache = (): void => {
  console.log('[缓存清理] 开始清理敏感缓存');

  try {
    // 清理用户资料缓存
    clearProfileCache();

    // 清理Dify配置缓存
    clearDifyConfigCache();

    // 清理其他敏感localStorage项
    SENSITIVE_CACHE_KEYS.forEach(key => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
        console.log(`[缓存清理] 已清理敏感缓存: ${key}`);
      }
    });

    // 清理带前缀的缓存（如分割面板位置）
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_KEYS.RESIZABLE_PANE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[缓存清理] 已清理UI缓存: ${key}`);
      });
    }

    // 清理Zustand持久化存储
    clearZustandCache();

    console.log('[缓存清理] 敏感缓存清理完成');
  } catch (error) {
    console.error('[缓存清理] 敏感缓存清理失败:', error);
  }
};

/**
 * 清理用户特定缓存
 * 用于切换用户时，清理与特定用户相关的缓存
 */
export const clearUserSpecificCache = (): void => {
  console.log('[缓存清理] 开始清理用户特定缓存');

  try {
    // 清理用户资料缓存
    clearProfileCache();

    // 清理Dify配置缓存
    clearDifyConfigCache();

    // 清理用户特定的localStorage项
    USER_SPECIFIC_CACHE_KEYS.forEach(key => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
        console.log(`[缓存清理] 已清理用户缓存: ${key}`);
      }
    });

    // 清理Zustand持久化存储中的用户相关数据
    clearZustandUserCache();

    console.log('[缓存清理] 用户特定缓存清理完成');
  } catch (error) {
    console.error('[缓存清理] 用户特定缓存清理失败:', error);
  }
};

/**
 * 清理所有缓存
 * 用于系统重置或完全清理
 */
export const clearAllCache = (): void => {
  console.log('[缓存清理] 开始清理所有缓存');

  try {
    // 清理用户资料缓存
    clearProfileCache();

    // 清理Dify配置缓存
    clearDifyConfigCache();

    // 清理所有localStorage（除了关键系统配置）
    if (typeof window !== 'undefined') {
      const keysToPreserve = new Set<string>();

      // 可选：保留主题设置
      const preserveTheme = true;
      if (preserveTheme && localStorage.getItem(CACHE_KEYS.THEME)) {
        keysToPreserve.add(CACHE_KEYS.THEME);
      }

      // 备份需要保留的数据
      const preservedData: Record<string, string> = {};
      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          preservedData[key] = value;
        }
      });

      // 清理所有localStorage
      localStorage.clear();

      // 恢复保留的数据
      Object.entries(preservedData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
        console.log(`[缓存清理] 已恢复保留项: ${key}`);
      });
    }

    // 清理所有Zustand持久化存储
    clearZustandCache();

    console.log('[缓存清理] 所有缓存清理完成');
  } catch (error) {
    console.error('[缓存清理] 全量缓存清理失败:', error);
  }
};

/**
 * 清理Zustand持久化存储
 */
const clearZustandCache = (): void => {
  try {
    if (typeof window === 'undefined') return;

    // 清理常用应用存储
    localStorage.removeItem('favorite-apps-storage');

    // 清理当前应用存储
    localStorage.removeItem('current-app-storage');

    // 清理其他Zustand存储（如果有的话）
    const zustandKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes('-storage') || key?.includes('-store')) {
        zustandKeys.push(key);
      }
    }

    zustandKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`[缓存清理] 已清理Zustand存储: ${key}`);
    });
  } catch (error) {
    console.warn('[缓存清理] Zustand缓存清理失败:', error);
  }
};

/**
 * 清理Zustand中的用户相关缓存
 */
const clearZustandUserCache = (): void => {
  try {
    if (typeof window === 'undefined') return;

    // 清理常用应用存储（用户相关）
    localStorage.removeItem('favorite-apps-storage');

    // 清理当前应用存储（用户相关）
    localStorage.removeItem('current-app-storage');

    console.log('[缓存清理] Zustand用户缓存清理完成');
  } catch (error) {
    console.warn('[缓存清理] Zustand用户缓存清理失败:', error);
  }
};

/**
 * 在登录时清理前一个用户的缓存
 */
export const clearCacheOnLogin = (): void => {
  console.log('[缓存清理] 登录时清理缓存');
  clearUserSpecificCache();
};

/**
 * 在登出时清理敏感缓存
 */
export const clearCacheOnLogout = (): void => {
  console.log('[缓存清理] 登出时清理缓存');
  clearSensitiveCache();
};

/**
 * 获取缓存清理状态报告
 */
export const getCacheCleanupReport = (): {
  sensitiveKeys: string[];
  userSpecificKeys: string[];
  globalConfigKeys: string[];
  currentCacheSize: number;
} => {
  let currentCacheSize = 0;

  if (typeof window !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key || '');
      if (key && value) {
        currentCacheSize += key.length + value.length;
      }
    }
  }

  return {
    sensitiveKeys: SENSITIVE_CACHE_KEYS,
    userSpecificKeys: USER_SPECIFIC_CACHE_KEYS,
    globalConfigKeys: GLOBAL_CONFIG_CACHE_KEYS,
    currentCacheSize,
  };
};
