import {
  type SupportedLocale,
  getSupportedLocales,
  isValidLocale,
} from '@lib/config/language-config';

// translation service interface
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

// translation management service class
export class TranslationService {
  private static readonly API_BASE = '/api/admin/translations';

  // get supported languages list
  static getSupportedLanguages(): SupportedLocale[] {
    return getSupportedLocales();
  }

  // validate language code
  static isValidLanguage(locale: string): locale is SupportedLocale {
    return isValidLocale(locale);
  }

  // get all supported languages information
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

  // read translations for a specific language
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

  // get all translations for a specific section
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

  // update translation for a specific language
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

  // batch update translations for multiple languages
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

  // get translations for About page
  static async getAboutPageTranslations(): Promise<
    Record<SupportedLocale, any>
  > {
    return this.getAllTranslationsForSection('pages.about');
  }

  // update translations for About page
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

  // get translations for Home page
  static async getHomePageTranslations(): Promise<
    Record<SupportedLocale, any>
  > {
    return this.getAllTranslationsForSection('pages.home');
  }

  // update translations for Home page
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

  // get translation structure template for a specific section (for admin interface initialization)
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

  // validate translation data structure completeness
  static validateTranslationStructure(
    template: any,
    data: any,
    path: string = ''
  ): { isValid: boolean; missingKeys: string[]; extraKeys: string[] } {
    const missingKeys: string[] = [];
    const extraKeys: string[] = [];

    // check if all keys in template exist in data
    if (template && typeof template === 'object' && !Array.isArray(template)) {
      for (const key in template) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in data)) {
          missingKeys.push(currentPath);
        } else if (
          typeof template[key] === 'object' &&
          !Array.isArray(template[key])
        ) {
          // recursively check nested objects
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

    // check if there are keys in data that do not exist in template
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

  // create translation backup (before update)
  static async createBackup(
    section: string
  ): Promise<{ timestamp: string; data: Record<SupportedLocale, any> }> {
    const timestamp = new Date().toISOString();
    const data = await this.getAllTranslationsForSection(section);

    // here you can choose to store in localStorage or send to backend storage
    const backupKey = `translation_backup_${section}_${timestamp}`;
    localStorage.setItem(backupKey, JSON.stringify({ timestamp, data }));

    return { timestamp, data };
  }

  // restore translation backup
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
