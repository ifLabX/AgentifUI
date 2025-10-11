import type { SupportedLocale } from '@lib/config/language-config';
import { isValidLocale } from '@lib/config/language-config';
import { ContentTranslationService } from '@lib/services/admin/content/content-translation-service';
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
 * Request body interface for content translation endpoint
 */
interface ContentTranslateRequest {
  sourceLocale: SupportedLocale;
  targetLocales: SupportedLocale[];
  content: any;
  section: string;
}

/**
 * Read translation file from disk
 *
 * @param locale - Locale code (e.g., "en-US")
 * @returns Promise containing translation data object
 */
async function readTranslationFile(locale: string): Promise<TranslationData> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write translation file to disk
 *
 * @param locale - Locale code (e.g., "en-US")
 * @param data - Translation data object to write
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
 * Set nested value in object by path (e.g., "pages.home.title")
 *
 * @param obj - Object to modify
 * @param path - Dot-separated path (e.g., "pages.home")
 * @param value - Value to set
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
 * Sanitize section path to prevent directory traversal attacks
 *
 * @param section - Section path to sanitize
 * @returns Sanitized section path
 */
function sanitizeSection(section: string): string {
  // Only allow alphanumeric characters, dots, and underscores
  return section.replace(/[^a-zA-Z0-9._]/g, '');
}

/**
 * Validate section path
 *
 * @param section - Section path to validate
 * @returns True if section is valid
 */
function validateSection(section: string): boolean {
  // Prevent path traversal and ensure it starts with "pages."
  return !section.includes('..') && section.startsWith('pages.');
}

/**
 * POST /api/admin/content-translate
 * Translate content from source language to multiple target languages
 *
 * @param request - Next.js request object
 * @returns JSON response with translation results
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContentTranslateRequest;

    // Validate request body
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { sourceLocale, targetLocales, content, section } = body;

    // Sanitize and validate section path
    const sanitizedSection = sanitizeSection(section);
    if (!validateSection(sanitizedSection)) {
      return NextResponse.json(
        { success: false, error: 'Invalid section path' },
        { status: 400 }
      );
    }

    // Perform translation using ContentTranslationService
    const translationResult = await ContentTranslationService.translateContent(
      sourceLocale,
      targetLocales,
      content
    );

    // If all translations failed, return error
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

    // Save successful translations to files
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
            setNestedValue(
              existingData,
              sanitizedSection,
              result.translatedContent
            );

            // Write back to file
            await writeTranslationFile(locale, existingData);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            saveErrors.push(`${locale}: ${errorMessage}`);
          }
        }
      }

      // If some files failed to save
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
        error: `Content translation failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate content translation request body
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

  if (body.targetLocales.length > 10) {
    return {
      valid: false,
      error: 'targetLocales array cannot exceed 10 languages',
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
