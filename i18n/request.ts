import * as rootParams from 'next/root-params';
import { cookies, headers } from 'next/headers';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from './routing';
import { LOCALE_COOKIE_NAME } from '@utils/locales';

const TIME_ZONE = 'America/Los_Angeles';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();

    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else if (paramValue !== undefined) {
      // Invalid root param (e.g. /apple-touch-icon.png matching /[locale]).
      // Must not fall through to headers() below: this can run inside "use cache".
      notFound();
    } else {
      // No root param (e.g. global-not-found): use the locale prefix of the requested path
      // (set by proxy.ts), then the user's cookie, then the default.
      const currentPath = (await headers()).get('x-itemdb-current-path');
      const pathLocale = currentPath?.split(/[/?]/)[1];
      const cookieLocale = (await cookies()).get(LOCALE_COOKIE_NAME)?.value;

      if (hasLocale(routing.locales, pathLocale)) locale = pathLocale;
      else if (hasLocale(routing.locales, cookieLocale)) locale = cookieLocale;
      else locale = routing.defaultLocale;
    }
  }

  return {
    locale,
    messages: (await import(`../translation/${locale}.json`)).default,
    timeZone: TIME_ZONE,
  };
});
