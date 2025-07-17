import { DEFAULT_LOCALE, isValidLocale } from '@lib/config/language-config';

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Dynamic language configuration: prioritize Cookie, otherwise use default language
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || DEFAULT_LOCALE;

  const finalLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  return {
    locale: finalLocale,
    messages: (await import(`../messages/${finalLocale}.json`)).default,
    // Provide unified current time to avoid server-client hydration inconsistencies
    now: new Date(),
    // Timezone handling: don't hardcode timezone here, let format.dateTime use user's local timezone
  };
});
