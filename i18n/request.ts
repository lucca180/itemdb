import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { routing } from './routing';
import { getPathLocale } from '@utils/locales';

const TIME_ZONE = 'America/Los_Angeles';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const requestHeaders = await headers();
  const pathLocale = getPathLocale(requestHeaders.get('x-itemdb-current-path') ?? '/');
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : (pathLocale ?? routing.defaultLocale);

  return {
    locale,
    messages: (await import(`../translation/${locale}.json`)).default,
    timeZone: TIME_ZONE,
  };
});
