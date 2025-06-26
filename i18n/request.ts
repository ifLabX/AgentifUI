import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { getSupportedLocales, DEFAULT_LOCALE, isValidLocale } from '@lib/config/language-config';

export default getRequestConfig(async () => {
  // --- BEGIN COMMENT ---
  // 动态语言配置：优先从 Cookie 读取，否则使用默认语言
  // --- END COMMENT ---
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || DEFAULT_LOCALE;

  // --- BEGIN COMMENT ---
  // 验证语言代码是否支持
  // --- END COMMENT ---
  const supportedLocales = getSupportedLocales();
  const finalLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  return {
    locale: finalLocale,
    messages: (await import(`../messages/${finalLocale}.json`)).default
  };
}); 