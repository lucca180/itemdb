import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_LOCALE, isValidLocale } from '@utils/locales';
const TIME_ZONE = 'America/Los_Angeles';

export default getRequestConfig(async () => {
  const requestHeaders = await headers();
  const cookieStore = await cookies();

  const headerLocale = requestHeaders.get('x-itemdb-locale');
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale = isValidLocale(headerLocale)
    ? headerLocale
    : isValidLocale(cookieLocale)
      ? cookieLocale
      : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../translation/${locale}.json`)).default,
    timeZone: TIME_ZONE,
  };
});
