import type { SupportedLocale } from '@lib/config/language-config';
import { isValidLocale } from '@lib/config/language-config';
import { ContentTranslationService } from '@lib/services/admin/content/content-translation-service';

import { NextRequest, NextResponse } from 'next/server';

/**
 * Request body interface for text translation endpoint
 */
interface TranslateTextRequest {
  sourceLocale: SupportedLocale;
  targetLocales: SupportedLocale[];
  content: any;
}

/**
 * POST /api/admin/translate-text
 * Translate text content without saving to files
 * Used for temporary translations like page title auto-translate
 *
 * @param request - Next.js request object
 * @returns JSON response with translation results
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslateTextRequest;

    // Validate request body
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { sourceLocale, targetLocales, content } = body;

    // Perform translation using ContentTranslationService
    const translationResult = await ContentTranslationService.translateContent(
      sourceLocale,
      targetLocales,
      content
    );

    // Return translation results without saving to files
    return NextResponse.json({
      success: translationResult.totalErrors === 0,
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
        error: `Text translation failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate translate text request body
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
