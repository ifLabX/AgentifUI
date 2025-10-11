# Content Translation Feature - Design Document

## 1. Overview

### Purpose
Add a flexible content translation feature to the Admin Content Management system, allowing administrators to translate page content from any source language to selectively chosen target languages.

### User Story
As an administrator, after editing and saving content in one language (e.g., Chinese), I want to click an "Auto Translate" button next to the language selector, choose which target languages to translate to, and have the system automatically translate the current page content while preserving formatting and structure.

### Key Requirements
- ✅ Trigger translation **after** saving current language content
- ✅ Support **any source language → multiple target languages** (not just en-US → others)
- ✅ Allow manual selection of **which target languages** to translate to (not all by default)
- ✅ Use MyMemory Translation API (same as existing translation systems)
- ✅ Create **NEW files only** - do NOT modify existing translation logic files
- ✅ Preserve content structure and formatting (reference existing translation logic)
- ✅ Use existing Radix UI components for dialog

---

## 2. Technical Architecture

### 2.1 File Structure (New Files Only)

```
lib/services/admin/content/
  └── content-translation-service.ts      [NEW] - Independent translation service
                                                 (Can reference but NOT modify auto-translation-service.ts)

app/api/admin/content-translate/
  └── route.ts                            [NEW] - New API endpoint for content translation

components/admin/content/
  └── content-translate-dialog.tsx        [NEW] - Translation dialog component
  ├── home-editor.tsx                     [MODIFY] - Add translation button
  └── about-editor.tsx                    [MODIFY] - Add translation button

messages/
  └── en-US.json                          [MODIFY] - Add i18n keys for new UI
  └── (other language files)              [MODIFY] - Add translations
```

### 2.2 User Interaction Flow

```
Step 1: Admin edits Home page content (current language: zh-CN)
        │
        ▼
Step 2: Click "Save" button → Content saved to messages/zh-CN.json
        │
        ▼
Step 3: Click "Auto Translate" button (next to language selector)
        │
        ▼
Step 4: Dialog opens with options:
        ┌─────────────────────────────────────────┐
        │ Content Auto-Translation            [X] │
        ├─────────────────────────────────────────┤
        │                                         │
        │ Source Language:                        │
        │ ┌─────────────────────────────────────┐ │
        │ │ 简体中文 (zh-CN)          [dropdown]│ │
        │ └─────────────────────────────────────┘ │
        │                                         │
        │ Select Target Languages:                │
        │ ┌─────────────────────────────────────┐ │
        │ │ ☑ English (en-US)                   │ │
        │ │ ☑ 日本語 (ja-JP)                    │ │
        │ │ ☐ Español (es-ES)                   │ │
        │ │ ☐ Português (pt-PT)                 │ │
        │ │ ☐ Français (fr-FR)                  │ │
        │ │ ☐ Deutsch (de-DE)                   │ │
        │ │ ☐ Русский (ru-RU)                   │ │
        │ │ ☐ Italiano (it-IT)                  │ │
        │ │ ☐ 繁體中文 (zh-TW)                  │ │
        │ └─────────────────────────────────────┘ │
        │                                         │
        │ [Select All] [Deselect All]             │
        │                                         │
        │ ⚠ Warning: This will overwrite existing │
        │   content for selected target languages │
        │                                         │
        │          [Cancel]  [Start Translation]  │
        └─────────────────────────────────────────┘
        │
        ▼
Step 5: Click "Start Translation"
        │
        ▼
Step 6: Translation progress shown
        ┌─────────────────────────────────────────┐
        │ Translating...                      [X] │
        ├─────────────────────────────────────────┤
        │                                         │
        │ Progress: 2 / 3 languages completed     │
        │                                         │
        │ ✅ English (en-US) - Success            │
        │ ✅ 日本語 (ja-JP) - Success             │
        │ 🔄 Español (es-ES) - Translating...     │
        │                                         │
        │ [Progress Bar: ██████████░░░░ 66%]      │
        │                                         │
        └─────────────────────────────────────────┘
        │
        ▼
Step 7: Translation complete
        ┌─────────────────────────────────────────┐
        │ Translation Complete                [X] │
        ├─────────────────────────────────────────┤
        │                                         │
        │ ✅ Successfully translated to:          │
        │    • English (en-US)                    │
        │    • 日本語 (ja-JP)                     │
        │    • Español (es-ES)                    │
        │                                         │
        │ All translations have been saved.       │
        │                                         │
        │                          [Close]        │
        └─────────────────────────────────────────┘
```

### 2.3 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Auto Translate" button                          │
│    (After saving current language content)                      │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ContentTranslateDialog opens                                 │
│    - Read current locale from editor state                      │
│    - Show source language (current locale)                      │
│    - Show checkbox list (all locales except source)             │
│    - User selects target languages                              │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. POST /api/admin/content-translate                            │
│    Request Body:                                                │
│    {                                                            │
│      sourceLocale: "zh-CN",                                     │
│      targetLocales: ["en-US", "ja-JP", "es-ES"],               │
│      content: { title: "...", features: [...], ... },          │
│      section: "pages.home"  // or "pages.about"                │
│    }                                                            │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. ContentTranslationService.translateContent()                 │
│    - Extract source language code (zh-CN)                       │
│    - For each target language:                                  │
│      • Extract target language code (en, ja, es)                │
│      • Call translateObject() recursively                       │
│      • Preserve structure & skip non-translatable fields        │
│      • Delay 200ms between API calls (rate limiting)            │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. MyMemory Translation API                                     │
│    URL: https://api.mymemory.translated.net/get                 │
│    Params:                                                      │
│    - q: "欢迎来到AgentifUI"                                      │
│    - langpair: "zh-CN|en"                                       │
│    - de: "license@iflabx.com"                                   │
│                                                                 │
│    Response:                                                    │
│    {                                                            │
│      responseStatus: 200,                                       │
│      responseData: {                                            │
│        translatedText: "Welcome to AgentifUI"                   │
│      }                                                          │
│    }                                                            │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Save translations to files                                   │
│    For each successful translation:                             │
│    - Read existing messages/{locale}.json                       │
│    - Update specific section (e.g., pages.home)                 │
│    - Write back to file with proper formatting                  │
│                                                                 │
│    Example:                                                     │
│    messages/en-US.json:                                         │
│    {                                                            │
│      "pages": {                                                 │
│        "home": {                                                │
│          "title": "Welcome to AgentifUI",  // ← Updated         │
│          "features": [...]                 // ← Updated         │
│        }                                                        │
│      }                                                          │
│    }                                                            │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Return response to client                                    │
│    {                                                            │
│      success: true,                                             │
│      results: {                                                 │
│        "en-US": { success: true, translatedContent: {...} },    │
│        "ja-JP": { success: true, translatedContent: {...} },    │
│        "es-ES": { success: true, translatedContent: {...} }     │
│      },                                                         │
│      totalProcessed: 3,                                         │
│      totalSuccess: 3,                                           │
│      totalErrors: 0,                                            │
│      errors: []                                                 │
│    }                                                            │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. UI updates                                                   │
│    - Show success toast                                         │
│    - Close dialog                                               │
│    - Optionally refresh editor to show translated content       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. API Design

### 3.1 Translation API Endpoint

**Endpoint:** `POST /api/admin/content-translate`

**Request Body:**
```typescript
{
  sourceLocale: SupportedLocale;        // e.g., "zh-CN", "en-US", "ja-JP"
  targetLocales: SupportedLocale[];     // e.g., ["en-US", "ja-JP", "es-ES"]
  content: Record<string, any>;         // Current page content object
  section: string;                      // e.g., "pages.home", "pages.about"
}
```

**Response (Success):**
```typescript
{
  success: true,
  results: {
    "en-US": {
      success: true,
      translatedContent: { /* translated object */ }
    },
    "ja-JP": {
      success: true,
      translatedContent: { /* translated object */ }
    },
    "es-ES": {
      success: true,
      translatedContent: { /* translated object */ }
    }
  },
  totalProcessed: 3,
  totalSuccess: 3,
  totalErrors: 0,
  errors: []
}
```

**Response (Partial Failure):**
```typescript
{
  success: false,  // Overall success if ANY translation succeeded
  results: {
    "en-US": {
      success: true,
      translatedContent: { /* translated object */ }
    },
    "ja-JP": {
      success: false,
      error: "Translation API timeout"
    }
  },
  totalProcessed: 2,
  totalSuccess: 1,
  totalErrors: 1,
  errors: ["ja-JP: Translation API timeout"]
}
```

**Response (Complete Failure):**
```typescript
{
  success: false,
  error: "All translations failed",
  errors: [
    "en-US: Invalid API response",
    "ja-JP: Network error"
  ]
}
```

### 3.2 MyMemory API Integration

**Base API:** `https://api.mymemory.translated.net/get`

**Parameters:**
- `q`: Text to translate (max 450 characters)
- `langpair`: `{sourceLanguage}|{targetLanguage}` (e.g., `zh-CN|en`, `ja|es`)
- `de`: Email identifier (`license@iflabx.com`)

**Language Code Mapping:**
```typescript
const LOCALE_TO_MYMEMORY_CODE: Record<string, string> = {
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
```

**Key Differences from Existing Services:**
- **Source language flexibility**: Not hardcoded to `en`, supports any source language
- **Bidirectional mapping**: Can translate from any language to any other language
- **Example langpairs**:
  - `zh-CN|en` (Chinese → English)
  - `ja|zh-CN` (Japanese → Chinese)
  - `es|ja` (Spanish → Japanese)

---

## 4. UI Design

### 4.1 Translation Button Placement

**Location:** Next to language selector in editor toolbar (right side)

**Visual Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ Content Management - Home Page                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Edit Language: [简体中文 (zh-CN) ▼]  [✨ Auto Translate ▼] │
│                                                              │
│ Title: _______________________________________________       │
│                                                              │
│ ...                                                          │
│                                                              │
│                                          [Save]              │
└──────────────────────────────────────────────────────────────┘
```

**Button Specifications:**
- **Icon**: Languages or Sparkles icon from `lucide-react`
- **Text**: Translation key from i18n (e.g., "Auto Translate")
- **Style**: Match existing button styles (secondary variant)
- **Dropdown**: Opens translation dialog (similar to language selector behavior)
- **State**:
  - Enabled: When content has been saved
  - Disabled: When content is unsaved (show tooltip: "Please save first")

### 4.2 Translation Dialog Component

**Component Name:** `ContentTranslateDialog`

**Visual Design:**

```
┌────────────────────────────────────────────────────────────┐
│  Content Auto-Translation                              [X] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Source Language:                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  简体中文 (zh-CN)                          [Dropdown]│ │
│  └──────────────────────────────────────────────────────┘ │
│  (Optional: Allow changing source language)                │
│                                                            │
│  Select Target Languages:                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  ☑ English (en-US)                                   │ │
│  │  ☑ 日本語 (ja-JP)                                    │ │
│  │  ☑ Español (es-ES)                                   │ │
│  │  ☐ Português (pt-PT)                                 │ │
│  │  ☐ Français (fr-FR)                                  │ │
│  │  ☐ Deutsch (de-DE)                                   │ │
│  │  ☐ Русский (ru-RU)                                   │ │
│  │  ☐ Italiano (it-IT)                                  │ │
│  │  ☐ 繁體中文 (zh-TW)                                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Select All]  [Deselect All]                              │
│                                                            │
│  ⚠ Warning: This will overwrite existing content for      │
│     selected target languages                              │
│                                                            │
│                     [Cancel]  [Start Translation]          │
└────────────────────────────────────────────────────────────┘
```

**Dialog Features:**
1. **Source Language Selector**
   - Default: Current editor language
   - Optional dropdown to change source (if needed)
   - Read-only display of source language name

2. **Target Language Checkboxes**
   - Scrollable list of all languages except source
   - Show native language name + locale code
   - Support for bulk select/deselect

3. **Helper Buttons**
   - "Select All" - Check all target languages
   - "Deselect All" - Uncheck all target languages

4. **Warning Message**
   - Clear indication that existing content will be overwritten
   - Different color or icon to draw attention

5. **Action Buttons**
   - "Cancel" - Close dialog without action
   - "Start Translation" - Disabled if no languages selected

### 4.3 Translation Progress & Feedback

**During Translation:**

```
┌────────────────────────────────────────────────────────────┐
│  Translating Content...                                [X] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Progress: 2 / 5 languages completed                       │
│                                                            │
│  ✅ English (en-US) - Completed                            │
│  ✅ 日本語 (ja-JP) - Completed                             │
│  🔄 Español (es-ES) - Translating...                       │
│  ⏳ Français (fr-FR) - Pending                             │
│  ⏳ Deutsch (de-DE) - Pending                              │
│                                                            │
│  [████████████░░░░░░░░░░░░ 40%]                            │
│                                                            │
│  Estimated time remaining: ~2 minutes                      │
│                                                            │
│                                       [Cancel Translation] │
└────────────────────────────────────────────────────────────┘
```

**On Success:**

```
┌────────────────────────────────────────────────────────────┐
│  Translation Complete                                  [X] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Successfully translated to 5 languages:                │
│                                                            │
│     • English (en-US)                                      │
│     • 日本語 (ja-JP)                                       │
│     • Español (es-ES)                                      │
│     • Français (fr-FR)                                     │
│     • Deutsch (de-DE)                                      │
│                                                            │
│  All translations have been saved automatically.           │
│                                                            │
│                                              [Close]       │
└────────────────────────────────────────────────────────────┘

+ Toast notification: "✅ Successfully translated to 5 languages"
```

**On Partial Failure:**

```
┌────────────────────────────────────────────────────────────┐
│  Translation Completed with Errors                     [X] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Successfully translated (3):                           │
│     • English (en-US)                                      │
│     • 日本語 (ja-JP)                                       │
│     • Español (es-ES)                                      │
│                                                            │
│  ❌ Failed to translate (2):                               │
│     • Français (fr-FR) - API timeout                       │
│     • Deutsch (de-DE) - Network error                      │
│                                                            │
│  Successful translations have been saved.                  │
│                                                            │
│                               [Retry Failed]  [Close]      │
└────────────────────────────────────────────────────────────┘

+ Toast notification: "⚠ Translated 3 of 5 languages. 2 failed."
```

**On Complete Failure:**

```
┌────────────────────────────────────────────────────────────┐
│  Translation Failed                                    [X] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ❌ All translations failed                                │
│                                                            │
│  Error details:                                            │
│     • MyMemory API is currently unavailable                │
│     • Please try again later                               │
│                                                            │
│                                       [Retry]  [Close]     │
└────────────────────────────────────────────────────────────┘

+ Toast notification: "❌ Translation failed. Please try again."
```

---

## 5. Implementation Details

### 5.1 ContentTranslationService

**File:** `lib/services/admin/content/content-translation-service.ts`

**Key Functions:**

```typescript
export class ContentTranslationService {
  /**
   * Translate content from source language to multiple target languages
   *
   * @param sourceLocale - Source language code (e.g., "zh-CN", "en-US")
   * @param targetLocales - Array of target language codes
   * @param content - Content object to translate
   * @returns Promise containing translation results for all target languages
   */
  static async translateContent(
    sourceLocale: SupportedLocale,
    targetLocales: SupportedLocale[],
    content: any
  ): Promise<TranslationResult>;

  /**
   * Recursively translate nested object structure
   * Preserves formatting and skips non-translatable fields
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
  ): Promise<any>;

  /**
   * Translate a single text string using MyMemory API
   * Handles retries and rate limiting
   *
   * @param text - Text to translate
   * @param sourceLang - Source language code (e.g., "zh-CN", "en")
   * @param targetLang - Target language code (e.g., "en", "ja")
   * @returns Promise containing translated text
   * @throws Error if translation fails after retries
   */
  private static async translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string>;

  /**
   * Convert locale code to MyMemory language code
   *
   * @param locale - Locale code (e.g., "en-US", "zh-CN")
   * @returns MyMemory language code (e.g., "en", "zh-CN")
   */
  private static getMyMemoryLangCode(locale: SupportedLocale): string;

  /**
   * Check if text should be translated
   * Skips variables, empty strings, URLs, code, etc.
   *
   * @param text - Text to check
   * @returns True if text should be translated
   */
  private static isTranslatableText(text: string): boolean;

  /**
   * Check if object key should not be translated
   * IDs, types, URLs, metadata should be preserved
   *
   * @param key - Object key to check
   * @returns True if key's value should not be translated
   */
  private static isNonTranslatableKey(key: string): boolean;

  /**
   * Delay execution for rate limiting
   *
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private static delay(ms: number): Promise<void>;
}
```

**Translation Logic Flow:**

```typescript
// 1. Main translation function
async translateContent(sourceLocale, targetLocales, content) {
  const sourceLang = getMyMemoryLangCode(sourceLocale); // e.g., "zh-CN"

  for (const targetLocale of targetLocales) {
    const targetLang = getMyMemoryLangCode(targetLocale); // e.g., "en"

    // Recursively translate entire content object
    const translatedContent = await translateObject(content, sourceLang, targetLang);

    // Store result
    results[targetLocale] = { success: true, translatedContent };
  }

  return results;
}

// 2. Recursive object translation
async translateObject(obj, sourceLang, targetLang) {
  // Handle arrays
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item =>
      translateObject(item, sourceLang, targetLang)
    ));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip non-translatable keys (id, type, url, etc.)
      if (isNonTranslatableKey(key)) {
        result[key] = value;
        continue;
      }

      // Recursively translate nested objects
      result[key] = await translateObject(value, sourceLang, targetLang);
      await delay(200); // Rate limiting
    }
    return result;
  }

  // Handle strings
  if (typeof obj === 'string' && isTranslatableText(obj)) {
    return await translateText(obj, sourceLang, targetLang);
  }

  // Return primitives as-is
  return obj;
}

// 3. Text translation with MyMemory API
async translateText(text, sourceLang, targetLang) {
  // Skip if too long
  if (text.length > 450) {
    console.warn(`Text too long: ${text.substring(0, 50)}...`);
    return text;
  }

  // Build API URL
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.append('q', text);
  url.searchParams.append('langpair', `${sourceLang}|${targetLang}`);
  url.searchParams.append('de', 'license@iflabx.com');

  // Call API
  const response = await fetch(url.toString());
  const data = await response.json();

  // Extract translated text
  if (data.responseStatus === 200) {
    return data.responseData.translatedText;
  }

  // Fallback to original text on error
  console.warn(`Translation failed: ${data.responseDetails}`);
  return text;
}
```

**Skip Patterns (Reference from existing files):**

```typescript
// Text patterns that should NOT be translated
const SKIP_TEXT_PATTERNS = [
  /^\{\{.*\}\}$/,           // Handlebars: {{variable}}
  /^\$\{.*\}$/,             // Template literals: ${variable}
  /^\{[a-zA-Z0-9_]+\}$/,    // Variables: {count}, {name}
  /^<[^>]+>$/,              // HTML tags: <div>, <span>
  /^https?:\/\//,           // URLs
  /^[a-z]+:[a-z0-9-]+$/i,   // Protocols: http:, mailto:
  /^\.[a-z-]+$/,            // CSS classes: .btn, .card
  /^#[a-fA-F0-9]{3,8}$/,    // Color codes: #fff, #123456
  /^\d+(\.\d+)?$/,          // Numbers only: 123, 45.67
  /^[A-Z_][A-Z0-9_]*$/,     // Constants: API_KEY, MAX_VALUE
  /function\s*\(/,          // Function definitions
  /^\w+\s*=.*$/,            // Assignments: foo = bar
];

// Object keys that should NOT be translated
const NON_TRANSLATABLE_KEYS = [
  'id', 'type', 'version', 'author',
  'createdAt', 'updatedAt', 'lastModified',
  'metadata',
  'url', 'href', 'src', 'link', 'path',
  'imageUrl', 'videoUrl', 'audioUrl',
  'icon', 'emoji',
  'className', 'style',
  'variant', 'size', 'layout', 'alignment',
  'columns', 'gap', 'padding', 'margin',
  'width', 'height',
  'color', 'backgroundColor', 'borderRadius',
  'shadow',
];
```

### 5.2 API Route Handler

**File:** `app/api/admin/content-translate/route.ts`

**Request Flow:**

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();
    const { sourceLocale, targetLocales, content, section } = body;

    // 2. Validate request
    if (!isValidLocale(sourceLocale)) {
      return NextResponse.json(
        { success: false, error: 'Invalid source locale' },
        { status: 400 }
      );
    }

    if (!Array.isArray(targetLocales) || targetLocales.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Target locales must be non-empty array' },
        { status: 400 }
      );
    }

    if (targetLocales.includes(sourceLocale)) {
      return NextResponse.json(
        { success: false, error: 'Source locale cannot be in target locales' },
        { status: 400 }
      );
    }

    // 3. Perform translation
    const translationResult = await ContentTranslationService.translateContent(
      sourceLocale,
      targetLocales,
      content
    );

    // 4. Save translations to files
    for (const [locale, result] of Object.entries(translationResult.results)) {
      if (result.success) {
        // Read existing file
        const existingData = await readTranslationFile(locale);

        // Update specific section
        setNestedValue(existingData, section, result.translatedContent);

        // Write back to file
        await writeTranslationFile(locale, existingData);
      }
    }

    // 5. Return success response
    return NextResponse.json({
      success: true,
      results: translationResult.results,
      totalProcessed: translationResult.totalProcessed,
      totalSuccess: translationResult.totalSuccess,
      totalErrors: translationResult.totalErrors,
      errors: translationResult.errors,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

**Error Handling:**

| Error Case | Status Code | Response |
|------------|-------------|----------|
| Missing required fields | 400 | `{ success: false, error: "Missing field: ..." }` |
| Invalid locale code | 400 | `{ success: false, error: "Invalid locale: ..." }` |
| Source in target list | 400 | `{ success: false, error: "Source cannot be target" }` |
| Translation API failure | 200* | `{ success: false, errors: [...] }` with partial results |
| File write failure | 500 | `{ success: false, error: "Save failed: ..." }` |
| Unknown error | 500 | `{ success: false, error: "Unknown error" }` |

*Note: Partial success returns 200 with `success: false` but includes successful translations

### 5.3 UI Component

**File:** `components/admin/content/content-translate-dialog.tsx`

**Component Interface:**

```typescript
interface ContentTranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLocale: SupportedLocale;
  currentContent: any;
  section: string;  // e.g., "pages.home", "pages.about"
  supportedLocales: SupportedLocale[];
  onTranslationComplete?: (results: TranslationResults) => void;
}

interface ContentTranslateDialogState {
  selectedSourceLocale: SupportedLocale;  // Allow changing source
  selectedTargetLocales: Set<SupportedLocale>;
  isTranslating: boolean;
  translationProgress: {
    current: number;
    total: number;
    status: Record<SupportedLocale, 'pending' | 'translating' | 'success' | 'error'>;
    errors: Record<SupportedLocale, string>;
  };
  error: string | null;
}
```

**Component Behavior:**

```typescript
export function ContentTranslateDialog(props: ContentTranslateDialogProps) {
  const [selectedSourceLocale, setSelectedSourceLocale] = useState(props.sourceLocale);
  const [selectedTargetLocales, setSelectedTargetLocales] = useState<Set<SupportedLocale>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Filter out source locale from available targets
  const availableTargets = props.supportedLocales.filter(
    locale => locale !== selectedSourceLocale
  );

  // Handle target language toggle
  const toggleTargetLocale = (locale: SupportedLocale) => {
    const newSelected = new Set(selectedTargetLocales);
    if (newSelected.has(locale)) {
      newSelected.delete(locale);
    } else {
      newSelected.add(locale);
    }
    setSelectedTargetLocales(newSelected);
  };

  // Handle select all
  const selectAll = () => {
    setSelectedTargetLocales(new Set(availableTargets));
  };

  // Handle deselect all
  const deselectAll = () => {
    setSelectedTargetLocales(new Set());
  };

  // Handle translation
  const handleTranslate = async () => {
    setIsTranslating(true);
    setProgress({ current: 0, total: selectedTargetLocales.size });

    try {
      const response = await fetch('/api/admin/content-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLocale: selectedSourceLocale,
          targetLocales: Array.from(selectedTargetLocales),
          content: props.currentContent,
          section: props.section,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Show success toast
        toast.success(`Successfully translated to ${result.totalSuccess} languages`);
        props.onTranslationComplete?.(result);
        props.onOpenChange(false);
      } else {
        // Show partial success or error
        if (result.totalSuccess > 0) {
          toast.warning(
            `Translated ${result.totalSuccess} of ${result.totalProcessed} languages. ${result.totalErrors} failed.`
          );
        } else {
          toast.error('Translation failed. Please try again.');
        }
      }
    } catch (error) {
      toast.error('Translation failed: ' + error.message);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('contentTranslate.title')}</DialogTitle>
        </DialogHeader>

        {/* Source Language Selector */}
        <div>
          <Label>{t('contentTranslate.sourceLanguage')}</Label>
          <Select value={selectedSourceLocale} onValueChange={setSelectedSourceLocale}>
            {/* Language options */}
          </Select>
        </div>

        {/* Target Language Checkboxes */}
        <div>
          <Label>{t('contentTranslate.selectTargetLanguages')}</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableTargets.map(locale => (
              <Checkbox
                key={locale}
                checked={selectedTargetLocales.has(locale)}
                onCheckedChange={() => toggleTargetLocale(locale)}
                label={getLanguageInfo(locale).nativeName}
              />
            ))}
          </div>
        </div>

        {/* Helper Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={selectAll}>
            {t('contentTranslate.selectAll')}
          </Button>
          <Button variant="outline" onClick={deselectAll}>
            {t('contentTranslate.deselectAll')}
          </Button>
        </div>

        {/* Warning */}
        <Alert variant="warning">
          <AlertDescription>
            {t('contentTranslate.warningMessage')}
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('common.ui.cancel')}
          </Button>
          <Button
            onClick={handleTranslate}
            disabled={selectedTargetLocales.size === 0 || isTranslating}
          >
            {isTranslating ? t('contentTranslate.translating') : t('contentTranslate.startTranslation')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.4 Integration with Editors

**Modifications to `home-editor.tsx` and `about-editor.tsx`:**

```typescript
// Add state for translation dialog
const [showTranslateDialog, setShowTranslateDialog] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Add translation button next to language selector
<div className="flex items-center gap-2">
  {/* Existing language selector */}
  <Select value={currentLocale} onValueChange={onLocaleChange}>
    {/* ... */}
  </Select>

  {/* New translation button */}
  <Button
    variant="outline"
    onClick={() => setShowTranslateDialog(true)}
    disabled={hasUnsavedChanges}
    title={hasUnsavedChanges ? t('contentTranslate.saveFirst') : undefined}
  >
    <Languages className="w-4 h-4 mr-2" />
    {t('contentTranslate.button')}
  </Button>
</div>

{/* Translation dialog */}
<ContentTranslateDialog
  open={showTranslateDialog}
  onOpenChange={setShowTranslateDialog}
  sourceLocale={currentLocale}
  currentContent={translations[currentLocale]}
  section="pages.home"  // or "pages.about"
  supportedLocales={supportedLocales}
  onTranslationComplete={(results) => {
    // Optionally refresh editor to show translated content
    console.log('Translation completed:', results);
  }}
/>
```

---

## 6. Content Structure Support

### 6.1 Home Page Structure

**Translation Data Format:**
```typescript
interface HomeTranslation {
  title: string;                    // ✅ Translatable
  subtitle: string;                 // ✅ Translatable
  getStarted: string;               // ✅ Translatable
  learnMore: string;                // ✅ Translatable
  features: Array<{                 // ✅ Iterate and translate
    title: string;                  // ✅ Translatable
    description: string;            // ✅ Translatable
  }>;
  copyright: {                      // ✅ Nested object
    prefix: string;                 // ✅ Translatable
    linkText: string;               // ✅ Translatable
    suffix: string;                 // ✅ Translatable
  };
}
```

**Example Translation:**
```json
// Source (zh-CN):
{
  "title": "欢迎来到 AgentifUI",
  "subtitle": "轻松构建强大的AI应用",
  "features": [
    {
      "title": "易于使用",
      "description": "直观的界面设计"
    }
  ],
  "copyright": {
    "prefix": "版权所有 ©",
    "linkText": "AgentifUI",
    "suffix": "保留所有权利"
  }
}

// Target (en-US) after translation:
{
  "title": "Welcome to AgentifUI",
  "subtitle": "Build powerful AI applications with ease",
  "features": [
    {
      "title": "Easy to Use",
      "description": "Intuitive interface design"
    }
  ],
  "copyright": {
    "prefix": "Copyright ©",
    "linkText": "AgentifUI",  // ⚠️ Preserved (non-translatable pattern)
    "suffix": "All rights reserved"
  }
}
```

### 6.2 About Page Structure (Dynamic Format)

**Translation Data Format:**
```typescript
interface AboutTranslation {
  sections: Array<{
    id: string;                     // ❌ Do NOT translate
    type: ComponentType;            // ❌ Do NOT translate
    props: {
      heading?: string;             // ✅ Translatable
      text?: string;                // ✅ Translatable
      content?: string;             // ✅ Translatable
      items?: Array<{               // ✅ Iterate and translate
        text: string;               // ✅ Translatable
        icon?: string;              // ❌ Do NOT translate
      }>;
      imageUrl?: string;            // ❌ Do NOT translate
      imageAlt?: string;            // ✅ Translatable
      buttonText?: string;          // ✅ Translatable
      buttonUrl?: string;           // ❌ Do NOT translate
    };
  }>;
  metadata: {                       // ❌ Do NOT translate entire object
    version: string;
    lastModified: string;
    author: string;
  };
}
```

**Example Translation:**
```json
// Source (ja-JP):
{
  "sections": [
    {
      "id": "section-1",              // Preserved
      "type": "hero",                 // Preserved
      "props": {
        "heading": "私たちについて",   // → Translate
        "text": "革新的なソリューション", // → Translate
        "imageUrl": "/about.jpg",     // Preserved
        "imageAlt": "チームの写真"     // → Translate
      }
    }
  ],
  "metadata": {                       // Entire object preserved
    "version": "1.0",
    "lastModified": "2025-01-01",
    "author": "AgentifUI Team"
  }
}

// Target (es-ES) after translation:
{
  "sections": [
    {
      "id": "section-1",
      "type": "hero",
      "props": {
        "heading": "Acerca de nosotros",
        "text": "Soluciones innovadoras",
        "imageUrl": "/about.jpg",
        "imageAlt": "Foto del equipo"
      }
    }
  ],
  "metadata": {
    "version": "1.0",
    "lastModified": "2025-01-01",
    "author": "AgentifUI Team"
  }
}
```

### 6.3 Translation Rules Summary

**✅ Translatable Fields:**
- User-facing text content
- Headings, titles, subtitles
- Descriptions, labels, messages
- Button text, link text
- Image alt text
- Array items containing text

**❌ Non-Translatable Fields:**
- IDs, types, enum values
- URLs, file paths, links
- CSS classes, style values
- Metadata (version, author, timestamps)
- Variable placeholders (`{count}`, `{name}`)
- Code snippets, function names
- Icon names, emoji codes
- Numeric values without text

**🔧 Special Handling:**
- **Arrays**: Iterate and translate each element
- **Objects**: Recursively traverse and translate nested fields
- **Long text (>450 chars)**: Skip with warning or split into chunks
- **Mixed content**: Preserve formatting tags while translating text

---

## 7. i18n Keys

**New Translation Keys Required:**

Add to `messages/en-US.json` (and translate to all other languages):

```json
{
  "pages": {
    "admin": {
      "content": {
        "editor": {
          "contentTranslate": {
            "button": "Auto Translate",
            "title": "Content Auto-Translation",
            "sourceLanguage": "Source Language",
            "selectTargetLanguages": "Select Target Languages",
            "selectAll": "Select All",
            "deselectAll": "Deselect All",
            "warningMessage": "This will overwrite existing content for selected target languages",
            "startTranslation": "Start Translation",
            "translating": "Translating...",
            "saveFirst": "Please save your changes first",

            "progress": {
              "title": "Translating Content...",
              "current": "Progress: {current} / {total} languages completed",
              "estimatedTime": "Estimated time remaining: ~{minutes} minutes",
              "cancelButton": "Cancel Translation"
            },

            "success": {
              "title": "Translation Complete",
              "message": "Successfully translated to {count} languages:",
              "saved": "All translations have been saved automatically.",
              "closeButton": "Close"
            },

            "partialSuccess": {
              "title": "Translation Completed with Errors",
              "successMessage": "Successfully translated ({count}):",
              "failedMessage": "Failed to translate ({count}):",
              "saved": "Successful translations have been saved.",
              "retryButton": "Retry Failed",
              "closeButton": "Close"
            },

            "error": {
              "title": "Translation Failed",
              "allFailed": "All translations failed",
              "details": "Error details:",
              "retryLater": "Please try again later",
              "retryButton": "Retry",
              "closeButton": "Close"
            },

            "toast": {
              "success": "Successfully translated to {count} languages",
              "partialSuccess": "Translated {success} of {total} languages. {failed} failed.",
              "error": "Translation failed. Please try again.",
              "noLanguagesSelected": "Please select at least one target language"
            }
          }
        }
      }
    }
  }
}
```

---

## 8. Performance Considerations

### 8.1 API Rate Limiting

**MyMemory API Constraints:**
- Free tier limit: **1000 requests/day**, ~**5 requests/second**
- Maximum text length: **450 characters** per request

**Mitigation Strategy:**
- Add **200ms delay** between consecutive API calls
- Skip text longer than 450 characters (with warning)
- Implement exponential backoff on API errors
- Consider caching translations during session

### 8.2 Translation Time Estimation

**Time Estimates (approximate):**

| Content Size | Languages | API Calls | Estimated Time |
|--------------|-----------|-----------|----------------|
| Home page (~10 fields) | 1 language | ~10 calls | 3-5 seconds |
| Home page (~10 fields) | 5 languages | ~50 calls | 15-20 seconds |
| About page (~30 fields) | 1 language | ~30 calls | 8-12 seconds |
| About page (~30 fields) | 9 languages | ~270 calls | 60-90 seconds |

**Formula:**
```
Estimated Time (seconds) = (Number of Fields × Number of Languages × 0.3) + (Number of Fields × Number of Languages × 0.2)
                         = Field Count × Language Count × 0.5
```

### 8.3 Optimization Strategies

1. **Progress Indicator**
   - Show real-time progress: "2 / 5 languages completed"
   - Display percentage: "40% complete"
   - Show estimated time remaining

2. **Cancellation Support**
   - Allow users to cancel long-running translations
   - Save partial results before cancelling
   - Provide option to resume later

3. **Batch Processing**
   - Process multiple fields in parallel (with rate limiting)
   - Use Promise.all() for concurrent API calls within limits

4. **Caching**
   - Cache translations in memory during session
   - Avoid re-translating identical text
   - Clear cache on dialog close

5. **Smart Skipping**
   - Skip fields that are already identical across languages
   - Skip empty or whitespace-only strings
   - Skip numeric-only values

---

## 9. Error Handling & Edge Cases

### 9.1 Error Scenarios

| Scenario | Handling Strategy |
|----------|-------------------|
| **MyMemory API down** | Show error toast, allow retry, return original text |
| **Network timeout** | Retry with exponential backoff (3 attempts max) |
| **Rate limit exceeded** | Increase delay between requests, show warning |
| **Invalid API response** | Log error, return original text, notify user |
| **File write failure** | Show error, save successful translations, allow retry |
| **Partial translation failure** | Show which languages succeeded/failed, save successes |
| **User cancels mid-translation** | Stop processing, save completed translations |
| **Text too long (>450 chars)** | Skip with warning, keep original text |
| **Source = Target language** | Prevent in UI validation, return error if bypassed |
| **Empty content** | Show validation error, disable translate button |
| **Unsaved changes** | Disable translate button, show tooltip "Save first" |

### 9.2 Edge Cases

**Case 1: Identical Text Across Languages**
```typescript
// If source text matches existing target text, skip translation
if (existingTargetText === sourceText) {
  return existingTargetText; // No API call needed
}
```

**Case 2: Mixed Language Content**
```json
// Source (en-US) with mixed content:
{
  "title": "Welcome to AgentifUI",
  "subtitle": "Build AI apps with Dify API"  // Contains brand name
}

// Translation should preserve brand names:
// Target (zh-CN):
{
  "title": "欢迎来到 AgentifUI",
  "subtitle": "使用 Dify API 构建 AI 应用"  // "AgentifUI" and "Dify API" preserved
}
```

**Case 3: Variable Interpolation**
```json
// Source with variables:
{
  "message": "Hello {name}, you have {count} messages"
}

// Should preserve variable placeholders:
// Target (ja-JP):
{
  "message": "こんにちは {name}、{count} 件のメッセージがあります"
}
```

**Case 4: HTML/Markdown Content**
```json
// Source with formatting:
{
  "description": "Visit our <a href='/docs'>documentation</a> for more info"
}

// Should ideally preserve HTML tags (limitation: MyMemory may alter tags)
// Workaround: Extract text, translate, reconstruct
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Service Layer Tests:**
```typescript
// content-translation-service.test.ts

describe('ContentTranslationService', () => {
  test('translateText() - successful translation', async () => {
    const result = await ContentTranslationService.translateText(
      'Hello',
      'en',
      'ja'
    );
    expect(result).toBe('こんにちは');
  });

  test('translateObject() - nested object translation', async () => {
    const input = {
      title: 'Hello',
      features: [{ name: 'Feature 1' }]
    };
    const result = await ContentTranslationService.translateObject(
      input,
      'en',
      'ja'
    );
    expect(result.title).toBe('こんにちは');
    expect(result.features[0].name).toBe('機能1');
  });

  test('isTranslatableText() - skip variables', () => {
    expect(ContentTranslationService.isTranslatableText('{count}')).toBe(false);
    expect(ContentTranslationService.isTranslatableText('Hello')).toBe(true);
  });

  test('isNonTranslatableKey() - preserve IDs', () => {
    expect(ContentTranslationService.isNonTranslatableKey('id')).toBe(true);
    expect(ContentTranslationService.isNonTranslatableKey('title')).toBe(false);
  });

  test('getMyMemoryLangCode() - locale conversion', () => {
    expect(ContentTranslationService.getMyMemoryLangCode('en-US')).toBe('en');
    expect(ContentTranslationService.getMyMemoryLangCode('zh-CN')).toBe('zh-CN');
  });
});
```

### 10.2 Integration Tests

**API Route Tests:**
```typescript
// route.test.ts

describe('POST /api/admin/content-translate', () => {
  test('successful translation', async () => {
    const response = await fetch('/api/admin/content-translate', {
      method: 'POST',
      body: JSON.stringify({
        sourceLocale: 'en-US',
        targetLocales: ['ja-JP'],
        content: { title: 'Hello' },
        section: 'pages.home'
      })
    });

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.totalSuccess).toBe(1);
  });

  test('invalid locale - 400 error', async () => {
    const response = await fetch('/api/admin/content-translate', {
      method: 'POST',
      body: JSON.stringify({
        sourceLocale: 'invalid',
        targetLocales: ['ja-JP'],
        content: { title: 'Hello' },
        section: 'pages.home'
      })
    });

    expect(response.status).toBe(400);
  });

  test('source in targets - validation error', async () => {
    const response = await fetch('/api/admin/content-translate', {
      method: 'POST',
      body: JSON.stringify({
        sourceLocale: 'en-US',
        targetLocales: ['en-US', 'ja-JP'],
        content: { title: 'Hello' },
        section: 'pages.home'
      })
    });

    const result = await response.json();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Source locale cannot be in target');
  });
});
```

### 10.3 UI Component Tests

**Dialog Component Tests:**
```typescript
// content-translate-dialog.test.tsx

describe('ContentTranslateDialog', () => {
  test('renders with correct source language', () => {
    render(
      <ContentTranslateDialog
        open={true}
        sourceLocale="zh-CN"
        currentContent={{}}
        section="pages.home"
        supportedLocales={['en-US', 'zh-CN', 'ja-JP']}
      />
    );

    expect(screen.getByText('简体中文 (zh-CN)')).toBeInTheDocument();
  });

  test('filters out source language from targets', () => {
    render(
      <ContentTranslateDialog
        open={true}
        sourceLocale="zh-CN"
        currentContent={{}}
        section="pages.home"
        supportedLocales={['en-US', 'zh-CN', 'ja-JP']}
      />
    );

    // Should not show zh-CN in target list
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2); // Only en-US and ja-JP
  });

  test('disables translate button when no languages selected', () => {
    render(
      <ContentTranslateDialog
        open={true}
        sourceLocale="en-US"
        currentContent={{}}
        section="pages.home"
        supportedLocales={['en-US', 'ja-JP']}
      />
    );

    const translateButton = screen.getByText('Start Translation');
    expect(translateButton).toBeDisabled();
  });

  test('select all / deselect all buttons work', () => {
    const { container } = render(
      <ContentTranslateDialog
        open={true}
        sourceLocale="en-US"
        currentContent={{}}
        section="pages.home"
        supportedLocales={['en-US', 'zh-CN', 'ja-JP', 'es-ES']}
      />
    );

    // Click select all
    fireEvent.click(screen.getByText('Select All'));
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    expect(checkboxes).toHaveLength(3); // All except source

    // Click deselect all
    fireEvent.click(screen.getByText('Deselect All'));
    expect(container.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(0);
  });
});
```

### 10.4 E2E Tests

**Full Translation Workflow:**
```typescript
// e2e/content-translation.spec.ts

test('admin can translate home page content', async ({ page }) => {
  // 1. Login as admin
  await page.goto('/admin/login');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 2. Navigate to content management
  await page.goto('/admin/content');
  await page.click('text=Home Page');

  // 3. Select English as editing language
  await page.selectOption('[aria-label="Edit Language"]', 'en-US');

  // 4. Edit content
  await page.fill('[name="title"]', 'Welcome to AgentifUI');
  await page.fill('[name="subtitle"]', 'Build powerful AI apps');

  // 5. Save changes
  await page.click('button:has-text("Save")');
  await page.waitForSelector('text=Saved successfully');

  // 6. Open translation dialog
  await page.click('button:has-text("Auto Translate")');
  await page.waitForSelector('text=Content Auto-Translation');

  // 7. Select target languages
  await page.check('label:has-text("简体中文")');
  await page.check('label:has-text("日本語")');

  // 8. Start translation
  await page.click('button:has-text("Start Translation")');

  // 9. Wait for completion
  await page.waitForSelector('text=Translation Complete', { timeout: 30000 });

  // 10. Verify success message
  await expect(page.locator('text=Successfully translated to 2 languages')).toBeVisible();

  // 11. Close dialog
  await page.click('button:has-text("Close")');

  // 12. Verify Chinese translation exists
  await page.selectOption('[aria-label="Edit Language"]', 'zh-CN');
  await expect(page.locator('[name="title"]')).toHaveValue('欢迎来到 AgentifUI');

  // 13. Verify Japanese translation exists
  await page.selectOption('[aria-label="Edit Language"]', 'ja-JP');
  await expect(page.locator('[name="title"]')).toHaveValue('AgentifUIへようこそ');
});
```

---

## 11. Security Considerations

### 11.1 Input Validation

**API Endpoint Security:**
```typescript
// Validate all inputs
const validationRules = {
  sourceLocale: {
    type: 'string',
    required: true,
    validator: isValidLocale,
  },
  targetLocales: {
    type: 'array',
    required: true,
    minLength: 1,
    maxLength: 10, // Prevent abuse
    itemValidator: isValidLocale,
  },
  content: {
    type: 'object',
    required: true,
    maxDepth: 10, // Prevent deeply nested objects
    maxSize: 1024 * 100, // Max 100KB
  },
  section: {
    type: 'string',
    required: true,
    pattern: /^[a-zA-Z0-9.]+$/, // Whitelist characters
    maxLength: 100,
  },
};

// Prevent injection attacks
function sanitizeSection(section: string): string {
  // Only allow alphanumeric and dots
  return section.replace(/[^a-zA-Z0-9.]/g, '');
}

// Prevent path traversal
function validateSection(section: string): boolean {
  return !section.includes('..') && section.startsWith('pages.');
}
```

### 11.2 Rate Limiting

**Prevent Abuse:**
```typescript
// Server-side rate limiting (per user)
const rateLimiter = new Map<string, { count: number; resetAt: Date }>();

function checkRateLimit(userId: string): boolean {
  const limit = rateLimiter.get(userId);
  const now = new Date();

  if (!limit || now > limit.resetAt) {
    rateLimiter.set(userId, {
      count: 1,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
    });
    return true;
  }

  if (limit.count >= 10) { // Max 10 translations per hour
    return false;
  }

  limit.count++;
  return true;
}
```

### 11.3 Authentication & Authorization

**Ensure Admin-Only Access:**
```typescript
// In API route
export async function POST(request: NextRequest) {
  // 1. Verify user is authenticated
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 2. Verify user has admin role
  const user = await getUserById(session.userId);
  if (!user.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    );
  }

  // 3. Proceed with translation
  // ...
}
```

### 11.4 Data Sanitization

**Prevent XSS and Injection:**
```typescript
// Sanitize translated text before saving
import DOMPurify from 'isomorphic-dompurify';

function sanitizeTranslatedContent(content: any): any {
  if (typeof content === 'string') {
    // Remove potentially malicious HTML/JS
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
    });
  }

  if (Array.isArray(content)) {
    return content.map(sanitizeTranslatedContent);
  }

  if (typeof content === 'object' && content !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(content)) {
      sanitized[key] = sanitizeTranslatedContent(value);
    }
    return sanitized;
  }

  return content;
}
```

---

## 12. Future Enhancements (Optional)

### 12.1 Phase 2 Features

- [ ] **Translation History/Audit Log**
  - Track who translated what and when
  - Allow rollback to previous translations
  - Show diff between versions

- [ ] **Preview Before Save**
  - Show side-by-side comparison (source vs translated)
  - Allow manual editing before saving
  - Highlight potential issues (too long, too short, etc.)

- [ ] **Custom Translation Glossary**
  - Define custom term translations (e.g., "AgentifUI" → "AgentifUI")
  - Preserve brand names, technical terms
  - User-editable glossary in admin panel

- [ ] **Batch Page Translation**
  - Translate multiple pages at once (Home + About + Contact)
  - Scheduled translation jobs
  - Background processing with email notification

### 12.2 Phase 3 Features

- [ ] **Alternative Translation Providers**
  - Google Translate API
  - DeepL API (higher quality)
  - Azure Translator
  - Allow switching between providers

- [ ] **AI-Powered Context-Aware Translation**
  - Use GPT-4 for better context understanding
  - Handle complex sentences better
  - Preserve tone and style

- [ ] **Translation Quality Scoring**
  - Confidence score from translation API
  - Flag low-quality translations for review
  - Suggest improvements

- [ ] **Automatic Detection of Untranslated Content**
  - Scan all language files for missing translations
  - Show dashboard of translation coverage
  - Auto-suggest translations for missing keys

- [ ] **Real-time Collaboration**
  - Multiple admins can review translations simultaneously
  - Comment on specific translations
  - Approval workflow

---

## 13. Implementation Checklist

### Phase 1: Core Backend (Day 1-2)

- [ ] Create `content-translation-service.ts` with all core functions
- [ ] Implement `translateContent()` main function
- [ ] Implement `translateObject()` recursive function
- [ ] Implement `translateText()` MyMemory API call
- [ ] Implement `isTranslatableText()` validation
- [ ] Implement `isNonTranslatableKey()` validation
- [ ] Implement language code mapping
- [ ] Add proper error handling and retries
- [ ] Write unit tests for service layer

### Phase 2: API Endpoint (Day 2-3)

- [ ] Create `app/api/admin/content-translate/route.ts`
- [ ] Implement POST handler
- [ ] Add request validation
- [ ] Add authentication/authorization checks
- [ ] Implement file read/write logic
- [ ] Add error handling for all edge cases
- [ ] Write integration tests for API

### Phase 3: UI Components (Day 3-4)

- [ ] Create `content-translate-dialog.tsx` component
- [ ] Implement source language selector
- [ ] Implement target language checkboxes
- [ ] Add select all / deselect all functionality
- [ ] Implement translation progress UI
- [ ] Add success/error/partial success states
- [ ] Write component tests

### Phase 4: Editor Integration (Day 4-5)

- [ ] Add translation button to `home-editor.tsx`
- [ ] Add translation button to `about-editor.tsx`
- [ ] Implement button enable/disable logic
- [ ] Wire up dialog to editor state
- [ ] Handle translation completion callback
- [ ] Test full workflow in dev environment

### Phase 5: i18n Keys (Day 5)

- [ ] Add all new translation keys to `messages/en-US.json`
- [ ] Translate keys to all supported languages
- [ ] Run `pnpm i18n:check` to validate
- [ ] Fix any validation errors

### Phase 6: Testing & QA (Day 6-7)

- [ ] Run all unit tests (`pnpm test`)
- [ ] Run all integration tests
- [ ] Perform manual E2E testing
- [ ] Test with different language combinations
- [ ] Test error scenarios (API down, network failure)
- [ ] Test with large content (performance)
- [ ] Test with special characters and edge cases
- [ ] Browser compatibility testing

### Phase 7: Documentation & Polish (Day 7)

- [ ] Update README with new feature
- [ ] Add inline code comments
- [ ] Create user guide for admins
- [ ] Record demo video (optional)
- [ ] Code review and refactoring
- [ ] Run final type check (`pnpm type-check`)
- [ ] Run final linting (`pnpm lint`)

---

## 14. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **MyMemory API downtime** | High | Medium | Implement retry logic, show clear error messages, allow manual retry |
| **Poor translation quality** | Medium | High | Add preview feature, allow manual editing, consider alternative APIs |
| **Rate limiting errors** | Medium | Medium | Implement proper delays, show progress, allow cancellation |
| **Overwriting important content** | High | Low | Show clear warning, add confirmation dialog, consider backup/versioning |
| **Long translation time** | Low | High | Show progress indicator, allow cancellation, optimize with parallel requests |
| **API cost (future)** | Low | Low | Monitor usage, set quotas, consider caching |
| **Browser timeout on large content** | Medium | Low | Process in batches, show progress, consider backend job queue |
| **Network failures mid-translation** | Medium | Medium | Save partial results, allow resume, show which languages completed |

---

## 15. Success Metrics

### 15.1 Functional Goals

- ✅ Support translation from **any source language** to **any target language**
- ✅ Allow selective translation to **chosen languages only**
- ✅ **95%+ translation success rate** under normal conditions
- ✅ **100% structure preservation** (no data loss or corruption)
- ✅ Auto-save after successful translation

### 15.2 Performance Goals

- ✅ Translation completes in **<60 seconds** for standard page (10 fields × 5 languages)
- ✅ API response time: **<500ms** per text field (avg)
- ✅ UI remains responsive during translation
- ✅ Progress updates every **1 second**

### 15.3 User Experience Goals

- ✅ **Max 3 clicks** to start translation (Open dialog → Select languages → Translate)
- ✅ Clear progress feedback during translation
- ✅ Helpful error messages with retry options
- ✅ No manual coding required for admins
- ✅ Works seamlessly with existing editor workflow

---

## 16. Comparison with Existing Translation Systems

| Feature | auto-gen-i18n.js | auto-translation-service.ts | **content-translation-service.ts** (NEW) |
|---------|------------------|----------------------------|------------------------------------------|
| **Trigger** | CLI command | Web UI button | Web UI button |
| **Use Case** | Dev: Translate missing i18n keys | Admin: Translate page content (auto-translate all) | Admin: Translate page content (selective) |
| **Source Language** | Hardcoded `en-US` | Hardcoded `en-US` | **Any language (flexible)** |
| **Target Selection** | All languages (or --lang flag) | All languages (auto) | **Manual selection (checkboxes)** |
| **Translation Scope** | Entire i18n file (missing keys only) | Specific section (overwrites all) | Specific section (overwrites selected) |
| **Coverage Strategy** | Only missing keys | Overwrite all languages | **Overwrite selected languages only** |
| **Retry Mechanism** | Exponential backoff (3 retries) | Single attempt | Exponential backoff (3 retries) |
| **Progress UI** | Console logs | None (silent) | **Real-time progress dialog** |
| **File Modification** | Direct (as intended) | Do NOT modify | Do NOT modify (can reference) |

**Key Innovation:**
This new service provides **maximum flexibility** for admins:
- Choose **any source language** (not just English)
- Select **specific target languages** (not all or nothing)
- Get **real-time feedback** during translation
- Works **after saving** (safer workflow)

---

## 17. Appendix

### A. Example API Request/Response

**Request:**
```bash
curl -X POST http://localhost:3000/api/admin/content-translate \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLocale": "zh-CN",
    "targetLocales": ["en-US", "ja-JP"],
    "section": "pages.home",
    "content": {
      "title": "欢迎来到 AgentifUI",
      "subtitle": "轻松构建强大的AI应用",
      "features": [
        {
          "title": "易于使用",
          "description": "直观的界面设计"
        }
      ]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "results": {
    "en-US": {
      "success": true,
      "translatedContent": {
        "title": "Welcome to AgentifUI",
        "subtitle": "Build powerful AI applications with ease",
        "features": [
          {
            "title": "Easy to Use",
            "description": "Intuitive interface design"
          }
        ]
      }
    },
    "ja-JP": {
      "success": true,
      "translatedContent": {
        "title": "AgentifUIへようこそ",
        "subtitle": "強力なAIアプリケーションを簡単に構築",
        "features": [
          {
            "title": "使いやすい",
            "description": "直感的なインターフェース設計"
          }
        ]
      }
    }
  },
  "totalProcessed": 2,
  "totalSuccess": 2,
  "totalErrors": 0,
  "errors": []
}
```

### B. MyMemory API Examples

**Example 1: Chinese → English**
```
GET https://api.mymemory.translated.net/get?q=欢迎来到AgentifUI&langpair=zh-CN|en&de=license@iflabx.com

Response:
{
  "responseStatus": 200,
  "responseData": {
    "translatedText": "Welcome to AgentifUI"
  }
}
```

**Example 2: Japanese → Spanish**
```
GET https://api.mymemory.translated.net/get?q=こんにちは&langpair=ja|es&de=license@iflabx.com

Response:
{
  "responseStatus": 200,
  "responseData": {
    "translatedText": "Hola"
  }
}
```

### C. Language Code Reference

| Locale | Language Name (English) | Native Name | MyMemory Code |
|--------|-------------------------|-------------|---------------|
| en-US | English | English | en |
| zh-CN | Simplified Chinese | 简体中文 | zh-CN |
| zh-TW | Traditional Chinese | 繁體中文 | zh-TW |
| ja-JP | Japanese | 日本語 | ja |
| es-ES | Spanish | Español | es |
| pt-PT | Portuguese | Português | pt |
| fr-FR | French | Français | fr |
| de-DE | German | Deutsch | de |
| ru-RU | Russian | Русский | ru |
| it-IT | Italian | Italiano | it |

---

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Author:** AI Assistant (Claude)
**Status:** ✅ Ready for Review and Implementation
