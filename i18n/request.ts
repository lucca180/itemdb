import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const VALID_LOCALES = ['en', 'pt'] as const;
type Locale = (typeof VALID_LOCALES)[number];

const DEFAULT_LOCALE: Locale = 'en';
const TIME_ZONE = 'America/Los_Angeles';

function isLocale(locale: string | undefined | null): locale is Locale {
  return locale !== undefined && VALID_LOCALES.includes(locale as Locale);
}

export default getRequestConfig(async () => {
  const requestHeaders = await headers();
  const cookieStore = await cookies();

  const headerLocale = requestHeaders.get('x-itemdb-locale');
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = isLocale(headerLocale)
    ? headerLocale
    : isLocale(cookieLocale)
      ? cookieLocale
      : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../translation/${locale}.json`)).default,
    timeZone: TIME_ZONE,
  };
});
