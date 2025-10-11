# Auto-Translation Feature Design Document

## 1. Overview

### Purpose
Add automatic translation functionality to the Admin Content Management system, allowing administrators to translate content from one language to multiple target languages with a single click.

### User Story
As an administrator, I want to edit content in one language (e.g., English) and automatically translate it to other languages, so I don't have to manually input translations for all 10 supported languages.

### Key Requirements
- ✅ Use existing MyMemory Translation API (from `scripts/auto-gen-i18n.js`)
- ✅ Allow manual selection of target languages to translate
- ✅ Use current selected language as source language
- ✅ Auto-save after translation completes
- ✅ Use existing Radix UI Dialog component for UI
- ✅ Do NOT modify existing translation API code

---

## 2. Technical Architecture

### 2.1 File Structure (New Files Only)

```
lib/services/admin/content/
  └── auto-translation-service.ts          [NEW] - Auto-translation business logic

app/api/admin/
  └── auto-translate/
      └── route.ts                          [NEW] - API endpoint for translation

components/admin/content/
  └── auto-translate-dialog.tsx            [NEW] - Translation dialog UI component

components/admin/content/
  ├── home-editor.tsx                       [MODIFIED] - Add translation button
  └── about-editor.tsx                      [MODIFIED] - Add translation button

messages/
  └── en-US.json                            [MODIFIED] - Add i18n keys for new UI
  └── (other language files)                [MODIFIED] - Add translations
```

### 2.2 Data Flow

```
┌─────────────────┐
│  Admin clicks   │
│ "Auto Translate"│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AutoTranslateDialog opens      │
│  - Show source language         │
│  - Show checkbox list of langs  │
│  - User selects target langs    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  POST /api/admin/auto-translate │
│  Body: {                        │
│    sourceLocale: "en-US"        │
│    targetLocales: ["zh-CN"...]  │
│    content: {...}               │
│    section: "pages.home"        │
│  }                              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  AutoTranslationService         │
│  - Extract translatable fields  │
│  - Call MyMemory API per field  │
│  - Reconstruct translated obj   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  TranslationService             │
│  - Save translations to files   │
│  - Return success/failure       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  UI updates                     │
│  - Show success toast           │
│  - Auto-save to backend         │
│  - Refresh editor state         │
└─────────────────────────────────┘
```

---

## 3. API Design

### 3.1 Translation API Endpoint

**Endpoint:** `POST /api/admin/auto-translate`

**Request Body:**
```typescript
{
  sourceLocale: SupportedLocale;        // e.g., "en-US"
  targetLocales: SupportedLocale[];     // e.g., ["zh-CN", "ja-JP"]
  content: AboutTranslationData | HomeTranslationData;  // Source content
  section: string;                      // e.g., "pages.home", "pages.about"
}
```

**Response:**
```typescript
{
  success: boolean;
  results: {
    [locale: string]: {
      success: boolean;
      translatedContent?: any;
      error?: string;
    }
  };
  errors: string[];
}
```

### 3.2 MyMemory API Integration

**Base API:** `https://api.mymemory.translated.net/get`

**Parameters:**
- `q`: Text to translate
- `langpair`: `{sourceLanguage}|{targetLanguage}` (e.g., `en|zh-CN`)
- `de`: Email identifier

**Language Code Mapping:**
```typescript
const LOCALE_TO_MYMEMORY_CODE = {
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

---

## 4. UI Design

### 4.1 Translation Button

**Location:** Next to language selector in editor toolbar

**Visual:**
```
┌──────────────────────────────────────────────┐
│ Edit Language: [English (en-US) ▼]  [✨ Auto Translate] │
└──────────────────────────────────────────────┘
```

**Button Specs:**
- Icon: Sparkles (✨) or Languages icon from lucide-react
- Text: Translation key from i18n
- Style: Match existing secondary button style
- State: Disabled when no content to translate

### 4.2 Translation Dialog

**Component:** `AutoTranslateDialog`

**Visual Design:**
```
┌────────────────────────────────────────────────┐
│  Auto-Translate Content                    [X] │
├────────────────────────────────────────────────┤
│                                                │
│  Source Language:                              │
│  ┌──────────────────────────────────────────┐ │
│  │  English (en-US)                         │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Select Target Languages:                      │
│  ┌──────────────────────────────────────────┐ │
│  │  ☑ 简体中文 (zh-CN)                      │ │
│  │  ☑ 繁體中文 (zh-TW)                      │ │
│  │  ☑ 日本語 (ja-JP)                        │ │
│  │  ☐ Español (es-ES)                       │ │
│  │  ☐ Português (pt-PT)                     │ │
│  │  ☐ Français (fr-FR)                      │ │
│  │  ☐ Deutsch (de-DE)                       │ │
│  │  ☐ Русский (ru-RU)                       │ │
│  │  ☐ Italiano (it-IT)                      │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ⚠ Warning: This will overwrite existing      │
│     translations for selected languages        │
│                                                │
│             [Cancel]  [Translate & Save]       │
└────────────────────────────────────────────────┘
```

**Dialog Features:**
- Use Radix UI Dialog component (existing in project)
- Source language is read-only (current editor language)
- Checkbox list for target languages
- "Select All" / "Deselect All" helper buttons (optional)
- Warning message about overwriting
- Disabled state for "Translate & Save" if no languages selected

### 4.3 Translation Progress & Feedback

**During Translation:**
- Show loading toast: "Translating content..."
- Optional: Replace dialog with progress indicator

**On Success:**
- Show success toast: "Successfully translated to 3 languages"
- Auto-save translations
- Close dialog
- Refresh editor to show new translations

**On Failure:**
- Show error toast with details
- Keep dialog open
- Allow retry

---

## 5. Implementation Details

### 5.1 AutoTranslationService

**File:** `lib/services/admin/content/auto-translation-service.ts`

**Key Functions:**

```typescript
export class AutoTranslationService {
  /**
   * Translate content from source language to multiple target languages
   */
  static async translateContent(
    sourceLocale: SupportedLocale,
    targetLocales: SupportedLocale[],
    content: any,
    section: string
  ): Promise<TranslationResult>;

  /**
   * Recursively translate nested object structure
   */
  private static async translateObject(
    obj: any,
    sourceLang: string,
    targetLang: string
  ): Promise<any>;

  /**
   * Call MyMemory API to translate single text
   */
  private static async translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string>;

  /**
   * Convert locale code to MyMemory language code
   */
  private static getMyMemoryLangCode(locale: SupportedLocale): string;

  /**
   * Check if text should be translated (skip variables, empty strings, etc.)
   */
  private static isTranslatableText(text: string): boolean;
}
```

**Translation Logic:**
1. Recursively traverse content object
2. For each string value:
   - Check if translatable (skip `{variables}`, empty strings, etc.)
   - If text length > 450 chars, split or skip
   - Call MyMemory API
   - Add delay between requests (200ms to avoid rate limiting)
3. Reconstruct object with translated values
4. Preserve structure, metadata, and non-translatable fields

### 5.2 API Route Handler

**File:** `app/api/admin/auto-translate/route.ts`

**Responsibilities:**
- Validate request parameters
- Call AutoTranslationService
- Save translations via TranslationService
- Return results with error handling

**Error Handling:**
- Invalid locale codes → 400 Bad Request
- Missing required fields → 400 Bad Request
- Translation API failures → Partial success with error details
- File write failures → 500 Internal Server Error

### 5.3 UI Component

**File:** `components/admin/content/auto-translate-dialog.tsx`

**Props:**
```typescript
interface AutoTranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceLocale: SupportedLocale;
  sourceContent: any;
  section: string;
  supportedLocales: SupportedLocale[];
  onTranslationComplete: () => void;
}
```

**State Management:**
- `selectedLocales`: Set<SupportedLocale>
- `isTranslating`: boolean
- `error`: string | null

**Behavior:**
- Filter out source locale from target language list
- Disable "Translate" button if no languages selected
- Show loading state during translation
- Call onTranslationComplete on success to refresh parent

---

## 6. Content Structure Support

### 6.1 Home Page Structure

```typescript
interface HomeTranslationData {
  title: string;                    // Translatable
  subtitle: string;                 // Translatable
  getStarted: string;               // Translatable
  learnMore: string;                // Translatable
  features: Array<{                 // Iterate and translate
    title: string;
    description: string;
  }>;
  copyright: {                      // Nested object
    prefix: string;
    linkText: string;
    suffix: string;
  };
}
```

### 6.2 About Page Structure (Dynamic Format)

```typescript
interface AboutTranslationData {
  sections: Array<{
    id: string;                     // Do NOT translate
    type: ComponentType;            // Do NOT translate
    props: {
      heading?: string;             // Translatable
      text?: string;                // Translatable
      content?: string;             // Translatable
      items?: Array<{               // Iterate and translate
        text: string;
        icon?: string;              // Do NOT translate
      }>;
      imageUrl?: string;            // Do NOT translate
      imageAlt?: string;            // Translatable
      // ... other props
    };
  }>;
  metadata: {                       // Do NOT translate
    version: string;
    lastModified: string;
    author: string;
  };
}
```

### 6.3 Translation Rules

**Translatable Fields:**
- All string values that are user-facing text
- Examples: title, subtitle, description, heading, text, content, label

**Non-Translatable Fields:**
- IDs, types, enum values
- URLs, file paths
- CSS classes, style values
- Metadata fields
- Variable placeholders like `{count}`, `{name}`

**Special Handling:**
- Arrays: Iterate and translate each element
- Objects: Recursively translate nested structure
- Long text (>450 chars): Split into sentences or skip with warning

---

## 7. i18n Keys

**New Translation Keys Required:**

```json
{
  "pages.admin.content.editor.autoTranslate": {
    "button": "Auto Translate",
    "dialogTitle": "Auto-Translate Content",
    "sourceLanguage": "Source Language",
    "selectTargetLanguages": "Select Target Languages",
    "warningMessage": "This will overwrite existing translations for selected languages",
    "cancel": "Cancel",
    "translateAndSave": "Translate & Save",
    "selectAll": "Select All",
    "deselectAll": "Deselect All",
    "noLanguagesSelected": "Please select at least one target language",
    "translating": "Translating content...",
    "successMessage": "Successfully translated to {count} languages",
    "errorMessage": "Translation failed: {error}",
    "partialSuccessMessage": "Translated {success} of {total} languages. {failed} failed."
  }
}
```

---

## 8. Testing Checklist

### 8.1 Unit Tests
- [ ] AutoTranslationService.translateText() - single text translation
- [ ] AutoTranslationService.translateObject() - nested object translation
- [ ] AutoTranslationService.isTranslatableText() - text validation
- [ ] Language code mapping conversion

### 8.2 Integration Tests
- [ ] API route POST /api/admin/auto-translate
- [ ] Translation with valid source and target locales
- [ ] Translation with invalid locale codes
- [ ] Translation with empty content
- [ ] Translation with special characters
- [ ] Rate limiting handling (multiple rapid requests)

### 8.3 UI Tests
- [ ] Dialog opens and closes correctly
- [ ] Language checkboxes work
- [ ] Cannot select source language as target
- [ ] Button disabled when no languages selected
- [ ] Success toast appears after translation
- [ ] Error toast appears on failure
- [ ] Editor refreshes with new translations

### 8.4 E2E Tests
- [ ] Full workflow: Edit English → Translate to Chinese → Verify Chinese content
- [ ] Translate multiple languages at once
- [ ] Verify auto-save after translation
- [ ] Verify translations persist after page reload
- [ ] Test with Home page content
- [ ] Test with About page content
- [ ] Test with dynamic pages

---

## 9. Performance Considerations

### 9.1 API Rate Limiting
- MyMemory free tier: 1000 requests/day, ~5 requests/second
- Solution: Add 200ms delay between translation requests
- For large content: Implement batching or queue system

### 9.2 Translation Time Estimation
- Single field: ~300-500ms (API call + network)
- Home page (~10 fields) × 1 language: ~3-5 seconds
- Home page × 9 languages: ~30-45 seconds
- Consider: Progress indicator for multi-language translations

### 9.3 Optimization Strategies
- Cache translations in memory during session
- Debounce translation button clicks
- Show estimated time based on field count
- Allow cancellation of in-progress translation

---

## 10. Future Enhancements

### 10.1 Phase 2 (Optional)
- [ ] Translation history/audit log
- [ ] Ability to review translations before saving
- [ ] Side-by-side comparison view (source vs translated)
- [ ] Custom glossary/translation memory
- [ ] Support for other translation APIs (Google Translate, DeepL)

### 10.2 Phase 3 (Optional)
- [ ] Batch translate multiple pages
- [ ] AI-powered context-aware translation
- [ ] Translation quality scoring
- [ ] Automatic detection of untranslated content

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MyMemory API downtime | High | Show user-friendly error, allow retry |
| Poor translation quality | Medium | Add manual review option, allow editing after translation |
| Rate limiting errors | Medium | Implement exponential backoff, show progress |
| Overwrite important manual translations | High | Add confirmation warning, consider backup/versioning |
| Long translation time | Low | Show progress indicator, allow cancellation |
| API cost (if switching to paid service) | Low | Monitor usage, set limits |

---

## 12. Success Metrics

### 12.1 Functional Goals
- ✅ Reduce time to translate content by 90%
- ✅ Support all 10 languages in the system
- ✅ 95%+ translation success rate
- ✅ Auto-save after translation

### 12.2 User Experience Goals
- ✅ Translation completes in <60 seconds for standard page
- ✅ Clear feedback during translation process
- ✅ Easy to use (max 3 clicks to translate)
- ✅ No manual coding required for admins

---

## 13. Implementation Plan

### Phase 1: Core Backend (Day 1)
1. Create `AutoTranslationService` with translation logic
2. Implement API route `/api/admin/auto-translate`
3. Add language code mapping
4. Test with Postman/curl

### Phase 2: UI Components (Day 2)
1. Create `AutoTranslateDialog` component
2. Add translation button to editors
3. Implement checkbox selection logic
4. Add i18n keys

### Phase 3: Integration (Day 3)
1. Connect dialog to API
2. Implement auto-save after translation
3. Add error handling and toast notifications
4. Test full workflow

### Phase 4: Polish & Testing (Day 4)
1. Add loading states and progress indicators
2. Improve error messages
3. Write unit tests
4. Manual testing across all pages
5. Documentation updates

---

## 14. Code Review Checklist

Before submitting for review:
- [ ] No modifications to existing `auto-gen-i18n.js`
- [ ] Follows existing code style (ESLint, Prettier)
- [ ] All comments in English (as per project guidelines)
- [ ] Uses existing UI components (Radix Dialog, Buttons, etc.)
- [ ] i18n keys added for all new UI text
- [ ] Error handling for all API calls
- [ ] TypeScript types properly defined
- [ ] No console.log in production code
- [ ] Commit messages follow conventional format: `feat(admin): add auto-translation feature`

---

## Appendix A: Example Translation Request

```typescript
// Example API call
const response = await fetch('/api/admin/auto-translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceLocale: 'en-US',
    targetLocales: ['zh-CN', 'ja-JP', 'es-ES'],
    section: 'pages.home',
    content: {
      title: 'Welcome to AgentifUI',
      subtitle: 'Build powerful AI applications with ease',
      features: [
        {
          title: 'Easy to Use',
          description: 'Intuitive interface for all users'
        },
        {
          title: 'Powerful',
          description: 'Advanced AI capabilities'
        }
      ],
      copyright: {
        prefix: 'Copyright © 2024',
        linkText: 'AgentifUI',
        suffix: 'All rights reserved'
      }
    }
  })
});
```

**Expected Response:**
```typescript
{
  success: true,
  results: {
    'zh-CN': {
      success: true,
      translatedContent: {
        title: '欢迎来到 AgentifUI',
        subtitle: '轻松构建强大的AI应用',
        features: [
          {
            title: '易于使用',
            description: '适合所有用户的直观界面'
          },
          {
            title: '强大',
            description: '先进的AI功能'
          }
        ],
        copyright: {
          prefix: '版权所有 © 2024',
          linkText: 'AgentifUI',
          suffix: '保留所有权利'
        }
      }
    },
    'ja-JP': { success: true, translatedContent: { /* ... */ } },
    'es-ES': { success: true, translatedContent: { /* ... */ } }
  },
  errors: []
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-04
**Author:** AI Assistant
**Status:** Ready for Review
