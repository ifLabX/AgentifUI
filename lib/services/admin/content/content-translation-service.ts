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
 * Complete result of content translation operation
 */
export interface ContentTranslationResponse {
  success: boolean;
  results: Record<string, TranslationResult>;
  errors: string[];
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
}

/**
 * Progress callback for real-time translation updates
 */
export type TranslationProgressCallback = (progress: {
  locale: SupportedLocale;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  translatedFields?: number;
  totalFields?: number;
  error?: string;
}) => void;

/**
 * Content translation service for admin content management
 * Translates content from any source language to multiple target languages using MyMemory API
 * Supports flexible source language selection (not hardcoded to en-US)
 */
export class ContentTranslationService {
  private static readonly TRANSLATION_API_URL =
    'https://api.mymemory.translated.net/get';
  private static readonly MAX_TEXT_LENGTH = 450;
  private static readonly DELAY_BETWEEN_REQUESTS = 200; // ms
  private static readonly EMAIL = 'license@iflabx.com';
  private static readonly MAX_RETRIES = 3;

  /**
   * Map locale codes to MyMemory API language codes
   * Supports bidirectional translation between any language pair
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
   * This is the main entry point for content translation
   *
   * @param sourceLocale - Source language code (e.g., "zh-CN", "en-US", "ja-JP")
   * @param targetLocales - Array of target language codes
   * @param content - Content object to translate
   * @param onProgress - Optional callback for real-time progress updates
   * @returns Promise containing translation results for all target languages
   */
  static async translateContent(
    sourceLocale: SupportedLocale,
    targetLocales: SupportedLocale[],
    content: any,
    onProgress?: TranslationProgressCallback
  ): Promise<ContentTranslationResponse> {
    const results: Record<string, TranslationResult> = {};
    const errors: string[] = [];
    let totalSuccess = 0;
    let totalErrors = 0;

    const sourceLang = this.getMyMemoryLangCode(sourceLocale);

    // Count total fields for progress tracking
    const totalFields = this.countTranslatableFields(content);

    for (const targetLocale of targetLocales) {
      // Notify pending status
      onProgress?.({
        locale: targetLocale,
        status: 'pending',
        translatedFields: 0,
        totalFields,
      });

      try {
        const targetLang = this.getMyMemoryLangCode(targetLocale);

        // Notify in_progress status
        onProgress?.({
          locale: targetLocale,
          status: 'in_progress',
          translatedFields: 0,
          totalFields,
        });

        // Recursively translate the entire content object
        const translatedContent = await this.translateObject(
          content,
          sourceLang,
          targetLang,
          (translatedFields) => {
            // Update progress during translation
            onProgress?.({
              locale: targetLocale,
              status: 'in_progress',
              translatedFields,
              totalFields,
            });
          }
        );

        results[targetLocale] = {
          locale: targetLocale,
          success: true,
          translatedContent,
        };
        totalSuccess++;

        // Notify completed status
        onProgress?.({
          locale: targetLocale,
          status: 'completed',
          translatedFields: totalFields,
          totalFields,
        });
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

        // Notify failed status
        onProgress?.({
          locale: targetLocale,
          status: 'failed',
          error: errorMessage,
        });
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
   * Count total translatable fields in content
   * Used for progress tracking
   *
   * @param obj - Content object to analyze
   * @returns Total number of translatable string fields
   */
  private static countTranslatableFields(obj: any): number {
    let count = 0;

    const traverse = (value: any, key?: string): void => {
      if (value === null || value === undefined) return;

      if (typeof value === 'string') {
        if (!key || !this.isNonTranslatableKey(key)) {
          if (this.isTranslatableText(value)) {
            count++;
          }
        }
      } else if (Array.isArray(value)) {
        value.forEach(item => traverse(item));
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => traverse(v, k));
      }
    };

    traverse(obj);
    return count;
  }

  /**
   * Recursively translate nested object structure
   * Preserves structure and skips non-translatable fields
   *
   * @param obj - Object to translate
   * @param sourceLang - Source language code for MyMemory API (e.g., "zh-CN", "en")
   * @param targetLang - Target language code for MyMemory API (e.g., "en", "ja")
   * @param onFieldTranslated - Optional callback when each field is translated
   * @returns Promise containing translated object with same structure
   */
  private static async translateObject(
    obj: any,
    sourceLang: string,
    targetLang: string,
    onFieldTranslated?: (translatedCount: number) => void
  ): Promise<any> {
    let translatedFieldsCount = 0;
    if (obj === null || obj === undefined) {
      return obj;
    }

    const translate = async (value: any, key?: string): Promise<any> => {
      if (value === null || value === undefined) {
        return value;
      }

      // Skip non-translatable keys
      if (key && this.isNonTranslatableKey(key)) {
        return value;
      }

      // Handle strings
      if (typeof value === 'string') {
        if (this.isTranslatableText(value)) {
          const translated = await this.translateTextWithRetry(
            value,
            sourceLang,
            targetLang
          );
          translatedFieldsCount++;
          onFieldTranslated?.(translatedFieldsCount);

          // Add delay to avoid rate limiting
          await this.delay(this.DELAY_BETWEEN_REQUESTS);
          return translated;
        }
        return value;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        const translatedArray = [];
        for (const item of value) {
          translatedArray.push(await translate(item));
        }
        return translatedArray;
      }

      // Handle objects
      if (typeof value === 'object') {
        const translatedObj: any = {};
        for (const [k, v] of Object.entries(value)) {
          translatedObj[k] = await translate(v, k);
        }
        return translatedObj;
      }

      // Return other types as-is (numbers, booleans, etc.)
      return value;
    };

    return translate(obj);
  }

  /**
   * Translate a single text string with retry mechanism
   * Implements exponential backoff for failed requests
   *
   * @param text - Text to translate
   * @param sourceLang - Source language code
   * @param targetLang - Target language code
   * @returns Promise containing translated text
   */
  private static async translateTextWithRetry(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.translateText(text, sourceLang, targetLang);
        // If translation succeeded and is different from original, return it
        if (result !== text) {
          return result;
        }
        // If API returns same text (already in target language), accept it without retry
        return text;
      } catch (error) {
        if (attempt === this.MAX_RETRIES - 1) {
          // Last attempt failed, return original text silently
          return text;
        }

        // Calculate exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await this.delay(delay);
      }
    }

    return text;
  }

  /**
   * Translate a single text string using MyMemory API
   *
   * @param text - Text to translate
   * @param sourceLang - Source language code (e.g., "zh-CN", "en")
   * @param targetLang - Target language code (e.g., "en", "ja")
   * @returns Promise containing translated text
   * @throws Error if translation fails
   */
  private static async translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
  }

  /**
   * Convert locale code to MyMemory language code
   *
   * @param locale - Locale code (e.g., "en-US", "zh-CN")
   * @returns MyMemory language code (e.g., "en", "zh-CN")
   */
  private static getMyMemoryLangCode(locale: SupportedLocale): string {
    return this.LOCALE_TO_MYMEMORY_CODE[locale] || locale.split('-')[0];
  }

  /**
   * Check if text should be translated
   * Skips empty strings, variables, code, URLs, CSS values, etc.
   *
   * @param text - Text to check
   * @returns True if text should be translated
   */
  private static isTranslatableText(text: string): boolean {
    if (typeof text !== 'string') return false;
    if (!text.trim()) return false;

    const trimmed = text.trim();

    // Common CSS/UI property values that should NOT be translated
    const cssValues = [
      'auto', 'none', 'inherit', 'initial', 'unset', 'revert',
      'left', 'right', 'center', 'top', 'bottom', 'middle',
      'normal', 'bold', 'italic', 'flex', 'grid', 'block', 'inline',
      'hidden', 'visible', 'absolute', 'relative', 'fixed', 'sticky',
      'start', 'end', 'stretch', 'baseline', 'wrap', 'nowrap',
      'row', 'column', 'default', 'pointer', 'text', 'move',
    ];

    // Skip if it's a common CSS value (case-insensitive)
    if (cssValues.includes(trimmed.toLowerCase())) {
      return false;
    }

    // Skip very short single words (likely to be CSS values or codes)
    if (trimmed.length <= 10 && !/[\s]/.test(trimmed) && /^[a-z-]+$/i.test(trimmed)) {
      // But allow common words that should be translated
      const allowedShortWords = ['yes', 'no', 'ok', 'error', 'success', 'warning', 'info', 'help', 'home', 'about', 'contact'];
      if (!allowedShortWords.includes(trimmed.toLowerCase())) {
        return false;
      }
    }

    // Skip patterns that should not be translated
    const skipPatterns = [
      /^\{\{.*\}\}$/, // Handlebars variables: {{variable}}
      /^\$\{.*\}$/, // Template literals: ${variable}
      /^\{[a-zA-Z0-9_]+\}$/, // Variables: {count}, {name}
      /^<[^>]+>$/, // HTML tags: <div>, <span>
      /^https?:\/\//, // URLs
      /^[a-z]+:[a-z0-9-]+$/i, // Protocols: http:, mailto:
      /^\.[a-z-]+$/, // CSS classes: .btn, .card
      /^#[a-fA-F0-9]{3,8}$/, // Color codes: #fff, #123456
      /^\d+(\.\d+)?$/, // Numbers only: 123, 45.67
      /^\d+(px|em|rem|%|vh|vw)$/, // CSS units: 10px, 2em, 50%
      /^[A-Z_][A-Z0-9_]*$/, // Constants: API_KEY, MAX_VALUE
      /function\s*\(/, // Function definitions
      /^\w+\s*=.*$/, // Assignments: foo = bar
      /^[a-z]+-[a-z-]+$/i, // Kebab-case identifiers: my-component
    ];

    return !skipPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Check if object key should not be translated
   * Metadata, IDs, types, URLs, CSS properties, etc. should be preserved
   *
   * @param key - Object key to check
   * @returns True if key's value should not be translated
   */
  private static isNonTranslatableKey(key: string): boolean {
    const nonTranslatableKeys = [
      // IDs and metadata
      'id',
      'type',
      'version',
      'author',
      'lastModified',
      'createdAt',
      'updatedAt',
      'metadata',

      // URLs and paths
      'url',
      'href',
      'src',
      'imageUrl',
      'videoUrl',
      'audioUrl',
      'link',
      'path',
      'icon',
      'emoji',

      // CSS and styling
      'className',
      'style',
      'variant',
      'size',
      'layout',
      'alignment',
      // 'columns', // REMOVED: columns can contain content that needs translation
      'gap',
      'padding',
      'margin',
      'width',
      'height',
      'color',
      'backgroundColor',
      'borderRadius',
      'shadow',
      'display',
      'position',
      'zIndex',
      'overflow',
      'visibility',
      'opacity',
      'transform',
      'transition',
      'animation',
      'cursor',
      'textAlign',
      'textDecoration',
      'fontWeight',
      'fontSize',
      'fontFamily',
      'lineHeight',
      'letterSpacing',
      'wordSpacing',
      'whiteSpace',
      'flex',
      'flexDirection',
      'flexWrap',
      'justifyContent',
      'alignItems',
      'alignContent',
      'order',
      'flexGrow',
      'flexShrink',
      'flexBasis',
      'gridTemplateColumns',
      'gridTemplateRows',
      'gridGap',
      'gridColumn',
      'gridRow',
    ];

    // Exact match to avoid over-matching
    const keyLower = key.toLowerCase();
    return nonTranslatableKeys.some(
      nonTranslatable => keyLower === nonTranslatable.toLowerCase()
    );
  }

  /**
   * Delay execution for specified milliseconds
   * Used for rate limiting API requests
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
