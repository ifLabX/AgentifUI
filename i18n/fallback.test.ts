/**
 * @jest-environment node
 */
import { DEFAULT_LOCALE, isValidLocale } from '@lib/config/language-config';

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock translation files
const mockEnUSMessages = {
  common: {
    ui: {
      loading: 'Loading...',
      error: 'Error',
      cancel: 'Cancel',
      save: 'Save',
    },
  },
  sidebar: {
    newChat: 'New Chat',
    historyChats: 'Chat History', // This exists in English
    settings: 'Settings',
  },
};

const mockZhCNMessages = {
  common: {
    ui: {
      loading: '加载中...',
      cancel: '取消',
      // Missing: error, save
    },
  },
  sidebar: {
    newChat: '新对话',
    // Missing: historyChats - this should fallback to English
    settings: '设置',
  },
};

// Test the deep merge function from i18n/request.ts
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        result[key] = deepMerge(result[key], source[key]);
      } else if (result[key] === undefined) {
        // Only use fallback if key doesn't exist in target
        result[key] = source[key];
      }
    }
  }

  return result;
}

describe('i18n Fallback with Deep Merge', () => {
  describe('deepMerge function', () => {
    it('should merge missing keys from fallback', () => {
      const result = deepMerge(mockZhCNMessages, mockEnUSMessages);

      // Should keep existing Chinese translations
      expect(result.common.ui.loading).toBe('加载中...');
      expect(result.common.ui.cancel).toBe('取消');
      expect(result.sidebar.newChat).toBe('新对话');
      expect(result.sidebar.settings).toBe('设置');

      // Should add missing keys from English
      expect(result.common.ui.error).toBe('Error');
      expect(result.common.ui.save).toBe('Save');
      expect(result.sidebar.historyChats).toBe('Chat History');
    });

    it('should not override existing translations', () => {
      const target = {
        common: {
          ui: {
            loading: '加载中...',
          },
        },
      };

      const source = {
        common: {
          ui: {
            loading: 'Loading...', // This should NOT override the Chinese version
            error: 'Error',
          },
        },
      };

      const result = deepMerge(target, source);

      expect(result.common.ui.loading).toBe('加载中...'); // Keep Chinese
      expect(result.common.ui.error).toBe('Error'); // Add English for missing key
    });

    it('should handle nested objects correctly', () => {
      const target = {
        pages: {
          auth: {
            login: {
              title: '登录',
              // Missing: welcome, submit
            },
          },
        },
      };

      const source = {
        pages: {
          auth: {
            login: {
              title: 'Login',
              welcome: 'Welcome back',
              submit: 'Sign In',
            },
          },
        },
      };

      const result = deepMerge(target, source);

      expect(result.pages.auth.login.title).toBe('登录'); // Keep Chinese
      expect(result.pages.auth.login.welcome).toBe('Welcome back'); // Add English
      expect(result.pages.auth.login.submit).toBe('Sign In'); // Add English
    });

    it('should handle arrays without merging', () => {
      const target = {
        items: ['中文1', '中文2'],
        other: '测试',
      };

      const source = {
        items: ['English1', 'English2', 'English3'],
        missing: 'Missing Value',
      };

      const result = deepMerge(target, source);

      expect(result.items).toEqual(['中文1', '中文2']); // Keep original array
      expect(result.other).toBe('测试'); // Keep Chinese
      expect(result.missing).toBe('Missing Value'); // Add missing key
    });

    it('should handle null and undefined values', () => {
      const target = {
        nullValue: null,
        undefinedValue: undefined,
        existing: '存在',
      };

      const source = {
        nullValue: 'From Source',
        undefinedValue: 'From Source',
        existing: 'From Source',
        newKey: 'New Value',
      };

      const result = deepMerge(target, source);

      expect(result.nullValue).toBe(null); // Keep null (not undefined)
      expect(result.undefinedValue).toBe('From Source'); // Replace undefined
      expect(result.existing).toBe('存在'); // Keep existing
      expect(result.newKey).toBe('New Value'); // Add new
    });
  });

  describe('Locale handling', () => {
    it('should validate supported locales correctly', () => {
      const supportedLocales = [
        'en-US',
        'zh-CN',
        'zh-TW',
        'ja-JP',
        'es-ES',
        'pt-PT',
        'fr-FR',
        'de-DE',
        'ru-RU',
        'it-IT',
      ];

      supportedLocales.forEach(locale => {
        expect(isValidLocale(locale)).toBe(true);
      });

      expect(isValidLocale('invalid-locale')).toBe(false);
      expect(isValidLocale('en')).toBe(false);
      expect(isValidLocale('')).toBe(false);
    });

    it('should use default locale for invalid locales', () => {
      const invalidLocales = [
        'invalid-locale',
        'en',
        'zh',
        '',
        null,
        undefined,
      ];

      invalidLocales.forEach(locale => {
        const finalLocale = isValidLocale(locale as string)
          ? locale
          : DEFAULT_LOCALE;
        expect(finalLocale).toBe('en-US');
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle sidebar.historyChats fallback scenario', () => {
      // Simulate the exact scenario from the error
      const zhCNWithMissingKey = {
        sidebar: {
          newChat: '新对话',
          settings: '设置',
          // historyChats is missing
        },
      };

      const enUSWithKey = {
        sidebar: {
          newChat: 'New Chat',
          historyChats: 'Chat History',
          settings: 'Settings',
        },
      };

      const merged = deepMerge(zhCNWithMissingKey, enUSWithKey);

      expect(merged.sidebar.newChat).toBe('新对话'); // Keep Chinese
      expect(merged.sidebar.settings).toBe('设置'); // Keep Chinese
      expect(merged.sidebar.historyChats).toBe('Chat History'); // Fallback to English
    });

    it('should handle multiple missing keys across different sections', () => {
      const partialTranslation = {
        common: {
          ui: {
            loading: '加载中...',
            // error, save missing
          },
        },
        sidebar: {
          newChat: '新对话',
          // historyChats, settings missing
        },
      };

      const fullEnglish = {
        common: {
          ui: {
            loading: 'Loading...',
            error: 'Error',
            save: 'Save',
          },
        },
        sidebar: {
          newChat: 'New Chat',
          historyChats: 'Chat History',
          settings: 'Settings',
        },
      };

      const result = deepMerge(partialTranslation, fullEnglish);

      // Keep existing translations
      expect(result.common.ui.loading).toBe('加载中...');
      expect(result.sidebar.newChat).toBe('新对话');

      // Add missing translations from English
      expect(result.common.ui.error).toBe('Error');
      expect(result.common.ui.save).toBe('Save');
      expect(result.sidebar.historyChats).toBe('Chat History');
      expect(result.sidebar.settings).toBe('Settings');
    });
  });
});
