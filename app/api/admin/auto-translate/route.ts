import type { SupportedLocale } from '@lib/config/language-config';
import { isValidLocale } from '@lib/config/language-config';
import { AutoTranslationService } from '@lib/services/admin/content/auto-translation-service';
import { promises as fs } from 'fs';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

// Translation file path configuration
const MESSAGES_DIR = path.join(process.cwd(), 'messages');

// Define a recursive type for translation data
type TranslationData = {
  [key: string]: string | TranslationData;
};

/**
 * Request body interface for auto-translation endpoint
 */
interface AutoTranslateRequest {
  sourceLocale: SupportedLocale;
  targetLocales: SupportedLocale[];
  content: any;
  section: string;
}

/**
 * Read translation file from disk
 */
async function readTranslationFile(locale: string): Promise<TranslationData> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write translation file to disk
 */
async function writeTranslationFile(
  locale: string,
  data: TranslationData
): Promise<void> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const fileContent = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, fileContent, 'utf-8');
}

/**
 * Deep merge objects for nested translation structure
 */
function deepMerge(
  target: TranslationData,
  source: TranslationData
): TranslationData {
  const result: TranslationData = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as TranslationData,
        sourceValue as TranslationData
      );
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Get nested value from object by path (e.g., "pages.home.title")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Set nested value in object by path (e.g., "pages.home.title")
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * POST /api/admin/auto-translate
 * Auto-translate content from source language to multiple target languages
 *
 * @param request - Next.js request object
 * @returns JSON response with translation results
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AutoTranslateRequest;

    // Validate request body
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { sourceLocale, targetLocales, content, section } = body;

    // Perform translation
    const translationResult = await AutoTranslationService.translateContent(
      sourceLocale,
      targetLocales,
      content
    );

    // If translation failed completely, return error
    if (translationResult.totalSuccess === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'All translations failed',
          errors: translationResult.errors,
        },
        { status: 500 }
      );
    }

    // Save translations to files
    const saveErrors: string[] = [];
    try {
      for (const [locale, result] of Object.entries(
        translationResult.results
      )) {
        if (result.success && result.translatedContent) {
          try {
            // Read existing translation file
            const existingData = await readTranslationFile(locale);

            // Update the specific section with translated content
            setNestedValue(existingData, section, result.translatedContent);

            // Write back to file
            await writeTranslationFile(locale, existingData);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            saveErrors.push(`${locale}: ${errorMessage}`);
          }
        }
      }

      if (saveErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Translation succeeded but save failed for some languages`,
            saveErrors,
            translationResults: translationResult,
          },
          { status: 500 }
        );
      }
    } catch (saveError) {
      const errorMessage =
        saveError instanceof Error ? saveError.message : 'Unknown save error';
      return NextResponse.json(
        {
          success: false,
          error: `Translation succeeded but save failed: ${errorMessage}`,
          translationResults: translationResult,
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      results: translationResult.results,
      totalProcessed: translationResult.totalProcessed,
      totalSuccess: translationResult.totalSuccess,
      totalErrors: translationResult.totalErrors,
      errors: translationResult.errors,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: `Auto-translation failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate auto-translate request body
 *
 * @param body - Request body to validate
 * @returns Validation result with error message if invalid
 */
function validateRequest(
  body: any
): { valid: boolean; error?: string } {
  // Check required fields
  if (!body.sourceLocale) {
    return { valid: false, error: 'Missing required field: sourceLocale' };
  }

  if (!body.targetLocales || !Array.isArray(body.targetLocales)) {
    return {
      valid: false,
      error: 'Missing or invalid field: targetLocales (must be array)',
    };
  }

  if (body.targetLocales.length === 0) {
    return {
      valid: false,
      error: 'targetLocales array cannot be empty',
    };
  }

  if (!body.content) {
    return { valid: false, error: 'Missing required field: content' };
  }

  if (!body.section || typeof body.section !== 'string') {
    return {
      valid: false,
      error: 'Missing or invalid field: section (must be string)',
    };
  }

  // Validate locale codes
  if (!isValidLocale(body.sourceLocale)) {
    return {
      valid: false,
      error: `Invalid source locale: ${body.sourceLocale}`,
    };
  }

  for (const locale of body.targetLocales) {
    if (!isValidLocale(locale)) {
      return { valid: false, error: `Invalid target locale: ${locale}` };
    }
  }

  // Validate that source locale is not in target locales
  if (body.targetLocales.includes(body.sourceLocale)) {
    return {
      valid: false,
      error: 'Source locale cannot be in target locales list',
    };
  }

  return { valid: true };
}
