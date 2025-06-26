import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // --- BEGIN COMMENT ---
  // 动态语言配置：优先从 Cookie 读取，否则使用默认中文
  // --- END COMMENT ---
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'zh-CN';

  // --- BEGIN COMMENT ---
  // 验证语言代码是否支持
  // --- END COMMENT ---
  const supportedLocales = ['zh-CN', 'en-US'];
  const finalLocale = supportedLocales.includes(locale) ? locale : 'zh-CN';

  return {
    locale: finalLocale,
    messages: (await import(`../messages/${finalLocale}.json`)).default
  };
}); 