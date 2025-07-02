import {
  type SupportedLocale,
  getSupportedLocales,
  isValidLocale,
} from '@lib/config/language-config';

// --- BEGIN COMMENT ---
// 翻译服务接口定义
// --- END COMMENT ---
export interface TranslationResponse {
  locale: string;
  section?: string;
  data: any;
}

export interface UpdateTranslationRequest {
  locale: SupportedLocale;
  section?: string;
  updates: any;
  mode?: 'merge' | 'replace';
}

export interface BatchUpdateRequest {
  section: string;
  updates: Record<SupportedLocale, any>;
  mode?: 'merge' | 'replace';
}

export interface TranslationUpdateResult {
  success: boolean;
  locale: string;
  section: string;
  mode: string;
  updatedAt: string;
}

export interface BatchUpdateResult {
  success: boolean;
  section: string;
  mode: string;
  results: Array<{ locale: string; success: boolean; updatedAt: string }>;
  errors: Array<{ locale: string; error: string }>;
  totalProcessed: number;
  totalErrors: number;
}

// --- BEGIN COMMENT ---
// 翻译管理服务类
// --- END COMMENT ---
export class TranslationService {
  private static readonly API_BASE = '/api/admin/translations';

  // --- BEGIN COMMENT ---
  // 获取支持的语言列表
  // --- END COMMENT ---
  static getSupportedLanguages(): SupportedLocale[] {
    return getSupportedLocales();
  }

  // --- BEGIN COMMENT ---
  // 验证语言代码
  // --- END COMMENT ---
  static isValidLanguage(locale: string): locale is SupportedLocale {
    return isValidLocale(locale);
  }

  // --- BEGIN COMMENT ---
  // 获取所有支持的语言信息
  // --- END COMMENT ---
  static async getLanguageMetadata(): Promise<{
    supportedLocales: SupportedLocale[];
    availableLanguages: number;
    lastModified: string;
  }> {
    const response = await fetch(this.API_BASE);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch language metadata: ${response.statusText}`
      );
    }
    return response.json();
  }

  // --- BEGIN COMMENT ---
  // 读取指定语言的翻译内容
  // --- END COMMENT ---
  static async getTranslations(
    locale: SupportedLocale,
    section?: string
  ): Promise<TranslationResponse> {
    const params = new URLSearchParams({ locale });
    if (section) {
      params.append('section', section);
    }

    const response = await fetch(`${this.API_BASE}?${params}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch translations for ${locale}: ${response.statusText}`
      );
    }
    return response.json();
  }

  // --- BEGIN COMMENT ---
  // 获取所有语言的特定部分翻译
  // --- END COMMENT ---
  static async getAllTranslationsForSection(
    section: string
  ): Promise<Record<SupportedLocale, any>> {
    const locales = this.getSupportedLanguages();
    const results: Record<string, any> = {};

    await Promise.all(
      locales.map(async locale => {
        try {
          const response = await this.getTranslations(locale, section);
          results[locale] = response.data;
        } catch (error) {
          console.warn(`Failed to load ${section} for ${locale}:`, error);
          results[locale] = null;
        }
      })
    );

    return results as Record<SupportedLocale, any>;
  }

  // --- BEGIN COMMENT ---
  // 更新单个语言的翻译
  // --- END COMMENT ---
  static async updateTranslation(
    request: UpdateTranslationRequest
  ): Promise<TranslationUpdateResult> {
    const response = await fetch(this.API_BASE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || `Failed to update translation: ${response.statusText}`
      );
    }

    return response.json();
  }

  // --- BEGIN COMMENT ---
  // 批量更新多语言翻译
  // --- END COMMENT ---
  static async batchUpdateTranslations(
    request: BatchUpdateRequest
  ): Promise<BatchUpdateResult> {
    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error ||
          `Failed to batch update translations: ${response.statusText}`
      );
    }

    return response.json();
  }

  // --- BEGIN COMMENT ---
  // 专门用于About页面的翻译管理
  // --- END COMMENT ---
  static async getAboutPageTranslations(): Promise<
    Record<SupportedLocale, any>
  > {
    return this.getAllTranslationsForSection('pages.about');
  }

  // --- BEGIN COMMENT ---
  // 更新About页面翻译
  // --- END COMMENT ---
  static async updateAboutPageTranslations(
    updates: Record<SupportedLocale, any>,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<BatchUpdateResult> {
    return this.batchUpdateTranslations({
      section: 'pages.about',
      updates,
      mode,
    });
  }

  // --- BEGIN COMMENT ---
  // 专门用于Home页面的翻译管理
  // --- END COMMENT ---
  static async getHomePageTranslations(): Promise<
    Record<SupportedLocale, any>
  > {
    return this.getAllTranslationsForSection('pages.home');
  }

  // --- BEGIN COMMENT ---
  // 更新Home页面翻译
  // --- END COMMENT ---
  static async updateHomePageTranslations(
    updates: Record<SupportedLocale, any>,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<BatchUpdateResult> {
    return this.batchUpdateTranslations({
      section: 'pages.home',
      updates,
      mode,
    });
  }

  // --- BEGIN COMMENT ---
  // 获取特定部分的翻译结构模板 (用于管理界面初始化)
  // --- END COMMENT ---
  static async getTranslationTemplate(
    section: string,
    baseLocale: SupportedLocale = 'zh-CN'
  ): Promise<any> {
    try {
      const response = await this.getTranslations(baseLocale, section);
      return response.data;
    } catch (error) {
      console.warn(`Failed to get template for ${section}:`, error);
      return {};
    }
  }

  // --- BEGIN COMMENT ---
  // 验证翻译数据结构的完整性
  // --- END COMMENT ---
  static validateTranslationStructure(
    template: any,
    data: any,
    path: string = ''
  ): { isValid: boolean; missingKeys: string[]; extraKeys: string[] } {
    const missingKeys: string[] = [];
    const extraKeys: string[] = [];

    // 检查模板中的所有键是否在数据中存在
    if (template && typeof template === 'object' && !Array.isArray(template)) {
      for (const key in template) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in data)) {
          missingKeys.push(currentPath);
        } else if (
          typeof template[key] === 'object' &&
          !Array.isArray(template[key])
        ) {
          // 递归检查嵌套对象
          const nested = this.validateTranslationStructure(
            template[key],
            data[key],
            currentPath
          );
          missingKeys.push(...nested.missingKeys);
          extraKeys.push(...nested.extraKeys);
        }
      }
    }

    // 检查数据中是否有模板中不存在的键
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key in data) {
        const currentPath = path ? `${path}.${key}` : key;

        if (template && !(key in template)) {
          extraKeys.push(currentPath);
        }
      }
    }

    return {
      isValid: missingKeys.length === 0 && extraKeys.length === 0,
      missingKeys,
      extraKeys,
    };
  }

  // --- BEGIN COMMENT ---
  // 创建翻译备份 (在更新前)
  // --- END COMMENT ---
  static async createBackup(
    section: string
  ): Promise<{ timestamp: string; data: Record<SupportedLocale, any> }> {
    const timestamp = new Date().toISOString();
    const data = await this.getAllTranslationsForSection(section);

    // 这里可以选择存储到 localStorage 或发送到后端存储
    const backupKey = `translation_backup_${section}_${timestamp}`;
    localStorage.setItem(backupKey, JSON.stringify({ timestamp, data }));

    return { timestamp, data };
  }

  // --- BEGIN COMMENT ---
  // 恢复翻译备份
  // --- END COMMENT ---
  static async restoreFromBackup(
    section: string,
    timestamp: string
  ): Promise<BatchUpdateResult> {
    const backupKey = `translation_backup_${section}_${timestamp}`;
    const backupData = localStorage.getItem(backupKey);

    if (!backupData) {
      throw new Error(`Backup not found for ${section} at ${timestamp}`);
    }

    const { data } = JSON.parse(backupData);

    return this.batchUpdateTranslations({
      section,
      updates: data,
      mode: 'replace',
    });
  }
}
