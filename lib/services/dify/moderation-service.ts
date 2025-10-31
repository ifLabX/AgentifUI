/**
 * Content moderation service
 * @description Core service for moderating user messages via direct Dify API calls
 * @module lib/services/dify/moderation-service
 */
import { ModerationError, type ModerationResult } from './moderation-types';

/**
 * Moderate message content using Dify moderation app
 * @description Sends message DIRECTLY to Dify API backend (bypasses internal proxy for zero-database dependency)
 *
 * @param text - Message text to moderate
 * @param moderationApiUrl - Dify API base URL (e.g., https://api.dify.ai/v1)
 * @param moderationApiKey - Dify application API key for authentication
 * @param timeoutMs - Timeout in milliseconds for API call
 * @param userId - User ID for API request tracking
 * @returns Promise resolving to ModerationResult with safety status
 * @throws ModerationError if moderation check fails or times out
 */
export async function moderateContent(
  text: string,
  moderationApiUrl: string,
  moderationApiKey: string,
  timeoutMs: number,
  userId: string
): Promise<ModerationResult> {
  const startTime = Date.now();

  // Construct direct API URL to Dify backend
  // Use chat-messages endpoint as the moderation app is a Chat App type
  const apiUrl = `${moderationApiUrl}/chat-messages`;

  // Create abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Call Dify API DIRECTLY with Bearer token authentication
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${moderationApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {}, // Required for chat apps
        query: text, // User message to moderate
        response_mode: 'blocking',
        user: userId,
        conversation_id: '', // Empty for new conversation
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-200 responses
    if (!response.ok) {
      throw new ModerationError(
        `Moderation API returned ${response.status}`,
        'api_error',
        response.status >= 500 // Retryable if server error
      );
    }

    // Parse JSON response
    const data = await response.json();

    if (!data.answer) {
      throw new ModerationError(
        'Moderation API response missing answer field',
        'parse_error',
        false
      );
    }

    // Parse moderation result from response
    const parsedResult = parseModerationResponse(data.answer);

    // Construct complete result with timing
    const result: ModerationResult = {
      ...parsedResult,
      responseTimeMs: Date.now() - startTime,
    };

    // Log result for monitoring
    console.log(
      `[Moderation] Result - Safe: ${result.isSafe}, Time: ${result.responseTimeMs}ms, Categories: ${result.categories.join(', ') || 'None'}`
    );

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ModerationError('Moderation timeout', 'timeout', true);
    }

    // Re-throw ModerationError as-is
    if (error instanceof ModerationError) {
      throw error;
    }

    // Handle network and other errors
    throw new ModerationError(
      'Moderation network error',
      'network_error',
      true
    );
  }
}

/**
 * Parse moderation API response text
 * @description Extracts safety status and categories from Dify response format
 *
 * Expected response format examples:
 * - Safe: "Safety: Safe Categories: None"
 * - Unsafe: "Safety: Unsafe Categories: violence, hate_speech"
 *
 * @param responseText - Raw response text from Dify moderation API
 * @returns Moderation result (without responseTimeMs, added by caller)
 */
function parseModerationResponse(
  responseText: string
): Omit<ModerationResult, 'responseTimeMs'> {
  const normalized = responseText.trim();

  // Parse safety status using case-insensitive regex
  const isSafe = /safety:\s*safe/i.test(normalized);

  // Parse categories list
  const categoriesMatch = normalized.match(/categories:\s*(.+?)(?:\n|$)/i);
  let categories: string[] = [];

  if (categoriesMatch) {
    const categoriesText = categoriesMatch[1].trim();

    // Split by comma and filter out empty/none values
    if (categoriesText && categoriesText.toLowerCase() !== 'none') {
      categories = categoriesText
        .split(',')
        .map(c => c.trim())
        .filter(c => c && c.toLowerCase() !== 'none');
    }
  }

  return {
    isSafe,
    categories,
    rawResponse: responseText,
  };
}

/**
 * Extract message text from request body
 * @description Helper to extract user message from various Dify request formats
 *
 * Supports:
 * - Chat messages: body.query
 * - Completion messages: body.inputs.query
 *
 * @param body - Request body object from API call
 * @returns Message text or null if not found
 */
export function extractMessageText(
  body: Record<string, unknown>
): string | null {
  // Chat messages: body.query
  if (typeof body.query === 'string' && body.query.trim()) {
    return body.query;
  }

  // Completion messages: body.inputs.query
  if (body.inputs && typeof body.inputs === 'object') {
    const inputs = body.inputs as Record<string, unknown>;
    if (typeof inputs.query === 'string' && inputs.query.trim()) {
      return inputs.query;
    }
  }

  return null;
}
