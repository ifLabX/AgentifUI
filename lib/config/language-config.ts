// Language configuration file
// Centralized management of supported language list to avoid hardcoding in multiple places
export interface LanguageInfo {
  name: string;
  nativeName: string;
  code: string;
}

// Supported language configuration
// Keep consistent with supportedLocales in i18n/request.ts
export const SUPPORTED_LANGUAGES = {
  'en-US': {
    name: 'English (US)',
    nativeName: 'English',
    code: 'en-US',
  },
  'zh-CN': {
    name: 'Simplified Chinese',
    nativeName: '简体中文',
    code: 'zh-CN',
  },
  'zh-TW': {
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    code: 'zh-TW',
  },
  'ja-JP': {
    name: 'Japanese',
    nativeName: '日本語',
    code: 'ja-JP',
  },
  'es-ES': {
    name: 'Spanish (Spain)',
    nativeName: 'Español',
    code: 'es-ES',
  },
  'pt-PT': {
    name: 'Portuguese',
    nativeName: 'Português',
    code: 'pt-PT',
  },
  'fr-FR': {
    name: 'French',
    nativeName: 'Français',
    code: 'fr-FR',
  },
  'de-DE': {
    name: 'German',
    nativeName: 'Deutsch',
    code: 'de-DE',
  },
  'ru-RU': {
    name: 'Russian',
    nativeName: 'Русский',
    code: 'ru-RU',
  },
  'it-IT': {
    name: 'Italian',
    nativeName: 'Italiano',
    code: 'it-IT',
  },
} as const;

export type SupportedLocale = keyof typeof SUPPORTED_LANGUAGES;

// Default language
export const DEFAULT_LOCALE: SupportedLocale = 'en-US';

// Get all supported locale codes as an array
export const getSupportedLocales = (): SupportedLocale[] => {
  return Object.keys(SUPPORTED_LANGUAGES) as SupportedLocale[];
};

// Check if a locale code is supported
export const isValidLocale = (locale: string): locale is SupportedLocale => {
  return locale in SUPPORTED_LANGUAGES;
};

// Get language information by locale code
export const getLanguageInfo = (locale: SupportedLocale): LanguageInfo => {
  return SUPPORTED_LANGUAGES[locale];
};

// Set language cookie
export const setLanguageCookie = (locale: SupportedLocale): void => {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}`;
};

// Get current locale from cookie
export const getCurrentLocaleFromCookie = (): SupportedLocale => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const cookies = document.cookie.split(';');
  const localeCookie = cookies.find(cookie =>
    cookie.trim().startsWith('NEXT_LOCALE=')
  );

  if (localeCookie) {
    const locale = localeCookie.split('=')[1];
    return isValidLocale(locale) ? locale : DEFAULT_LOCALE;
  }

  return DEFAULT_LOCALE;
};
