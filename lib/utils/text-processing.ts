/**
 * Text processing utilities for dynamic content
 *
 * Handles placeholder replacement in text content
 */

/**
 * Process text placeholders and replace them with actual values
 *
 * Currently supports:
 * - {year} - Current year (e.g., 2025)
 *
 * @param text - The text containing placeholders to process
 * @returns Text with placeholders replaced by actual values
 */
export function processTextPlaceholders(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Replace {year} with current year
  const currentYear = new Date().getFullYear();
  return text.replace(/\{year\}/g, currentYear.toString());
}
