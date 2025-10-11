import type { SupportedLocale } from '@lib/config/language-config';

/**
 * Result of translation operation for a single target language
 */
export interface TranslationResult {
  locale: SupportedLocale;
  success: boolean;
  translatedContent?: any;
  error?: string;
}

/**
 * Complete result of auto-translation operation
 */
export interface AutoTranslationResponse {
  success: boolean;
  results: Record<string, TranslationResult>;
  errors: string[];
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
}

/**
 * Auto-translation service for content management
 * Translates content from one language to multiple target languages using MyMemory API
 */
export class AutoTranslationService {
  private static readonly TRANSLATION_API_URL =
    'https://api.mymemory.translated.net/get';
  private static readonly MAX_TEXT_LENGTH = 450;
  private static readonly DELAY_BETWEEN_REQUESTS = 200; // ms
  private static readonly EMAIL = 'license@iflabx.com';

  /**
   * Map locale codes to MyMemory API language codes
   */
  private static readonly LOCALE_TO_MYMEMORY_CODE: Record<string, string> = {
    'en-US': 'en',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'ja-JP': 'ja',
    'es-ES': 'es',
    'pt-PT': 'pt',
    'fr-FR': 'fr',
    'de-DE': 'de',
    'ru-RU': 'ru',
    'it-IT': 'it',
  };

  /**
   * Translate content from source language to multiple target languages
   *
   * @param sourceLocale - Source language code
   * @param targetLocales - Array of target language codes
   * @param content - Content object to translate
   * @returns Promise containing translation results for all target languages
   */
  static async translateContent(
    sourceLocale: SupportedLocale,
    targetLocales: SupportedLocale[],
    content: any
  ): Promise<AutoTranslationResponse> {
    const results: Record<string, TranslationResult> = {};
    const errors: string[] = [];
    let totalSuccess = 0;
    let totalErrors = 0;

    const sourceLang = this.getMyMemoryLangCode(sourceLocale);

    for (const targetLocale of targetLocales) {
      try {
        const targetLang = this.getMyMemoryLangCode(targetLocale);

        // Recursively translate the entire content object
        const translatedContent = await this.translateObject(
          content,
          sourceLang,
          targetLang
        );

        results[targetLocale] = {
          locale: targetLocale,
          success: true,
          translatedContent,
        };
        totalSuccess++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results[targetLocale] = {
          locale: targetLocale,
          success: false,
          error: errorMessage,
        };
        errors.push(`${targetLocale}: ${errorMessage}`);
        totalErrors++;
      }
    }

    return {
      success: totalErrors === 0,
      results,
      errors,
      totalProcessed: targetLocales.length,
      totalSuccess,
      totalErrors,
    };
  }

  /**
   * Recursively translate nested object structure
   *
   * @param obj - Object to translate
   * @param sourceLang - Source language code for MyMemory API
   * @param targetLang - Target language code for MyMemory API
   * @returns Promise containing translated object with same structure
   */
  private static async translateObject(
    obj: any,
    sourceLang: string,
    targetLang: string
  ): Promise<any> {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      const translatedArray = [];
      for (const item of obj) {
        translatedArray.push(
          await this.translateObject(item, sourceLang, targetLang)
        );
        // Add delay to avoid rate limiting
        await this.delay(this.DELAY_BETWEEN_REQUESTS);
      }
      return translatedArray;
    }

    // Handle objects
    if (typeof obj === 'object') {
      const translatedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Do not translate certain keys (metadata, IDs, types, etc.)
        if (this.isNonTranslatableKey(key)) {
          translatedObj[key] = value;
          continue;
        }

        translatedObj[key] = await this.translateObject(
          value,
          sourceLang,
          targetLang
        );

        // Add delay to avoid rate limiting
        await this.delay(this.DELAY_BETWEEN_REQUESTS);
      }
      return translatedObj;
    }

    // Handle strings
    if (typeof obj === 'string') {
      if (this.isTranslatableText(obj)) {
        return await this.translateText(obj, sourceLang, targetLang);
      }
      return obj;
    }

    // Return other types as-is (numbers, booleans, etc.)
    return obj;
  }

  /**
   * Translate a single text string using MyMemory API
   *
   * @param text - Text to translate
   * @param sourceLang - Source language code
   * @param targetLang - Target language code
   * @returns Promise containing translated text
   * @throws Error if translation fails
   */
  private static async translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    try {
      // Skip if text is too long
      if (text.length > this.MAX_TEXT_LENGTH) {
        console.warn(
          `Text too long for translation (${text.length} chars): "${text.substring(0, 50)}..."`
        );
        return text;
      }

      const url = new URL(this.TRANSLATION_API_URL);
      url.searchParams.append('q', text);
      url.searchParams.append('langpair', `${sourceLang}|${targetLang}`);
      url.searchParams.append('de', this.EMAIL);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'AgentifUI/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData) {
        const translated = data.responseData.translatedText;

        if (translated && translated !== text && translated.length > 0) {
          return translated;
        }
      }

      throw new Error(
        `Translation API error: ${data.responseDetails || 'Unknown error'}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        `Translation failed for "${text}" (${sourceLang} -> ${targetLang}): ${errorMessage}`
      );
      // Return original text on failure
      return text;
    }
  }

  /**
   * Convert locale code to MyMemory language code
   *
   * @param locale - Locale code (e.g., "en-US")
   * @returns MyMemory language code (e.g., "en")
   */
  private static getMyMemoryLangCode(locale: SupportedLocale): string {
    return (
      this.LOCALE_TO_MYMEMORY_CODE[locale] || locale.split('-')[0]
    );
  }

  /**
   * Check if text should be translated
   * Skips empty strings, variables, code, etc.
   *
   * @param text - Text to check
   * @returns True if text should be translated
   */
  private static isTranslatableText(text: string): boolean {
    if (typeof text !== 'string') return false;
    if (!text.trim()) return false;

    // Skip patterns that should not be translated
    const skipPatterns = [
      /^\{\{.*\}\}$/, // Handlebars variables
      /^\$\{.*\}$/, // Template literals
      /^<[^>]+>$/, // HTML tags
      /function\s*\(/, // Function definitions
      /^\w+\s*=.*$/, // Assignments
      /^[A-Z_][A-Z0-9_]*$/, // Constants (all caps)
      /^\d+(\.\d+)?$/, // Numbers only
      /^[a-z]+:[a-z0-9-]+$/i, // URLs/protocols
      /^\{[a-zA-Z0-9_]+\}$/, // Variables like {count}, {name}
      /^https?:\/\//, // URLs
      /^\.[a-z-]+$/, // CSS classes
      /^#[a-fA-F0-9]{3,8}$/, // Color codes
    ];

    return !skipPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Check if object key should not be translated
   * Metadata, IDs, types, URLs, etc. should be preserved
   *
   * @param key - Object key to check
   * @returns True if key's value should not be translated
   */
  private static isNonTranslatableKey(key: string): boolean {
    const nonTranslatableKeys = [
      'id',
      'type',
      'version',
      'author',
      'lastModified',
      'createdAt',
      'updatedAt',
      'metadata',
      'url',
      'href',
      'src',
      'imageUrl',
      'videoUrl',
      'link',
      'path',
      'icon',
      'className',
      'style',
      'variant',
      'size',
      'layout',
      'alignment',
      'columns',
      'gap',
      'padding',
      'margin',
      'width',
      'height',
      'color',
      'backgroundColor',
      'borderRadius',
      'shadow',
    ];

    // Only do exact match to avoid over-matching (e.g., 'value' was matching 'buttonValue')
    return nonTranslatableKeys.some(
      nonTranslatable =>
        key.toLowerCase() === nonTranslatable.toLowerCase()
    );
  }

  /**
   * Delay execution for specified milliseconds
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
