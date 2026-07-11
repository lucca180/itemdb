import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

const TIME_ZONE = 'America/Los_Angeles';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../translation/${locale}.json`)).default,
    timeZone: TIME_ZONE,
    now: new Date(),
  };
});
