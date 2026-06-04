import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: true,
  localeCookie: {
    name: 'NEXT_LOCALE',
    maxAge: 60 * 60 * 24 * 365 * 5,
    sameSite: 'none',
    secure: true,
  },
});

export type AppLocale = (typeof routing.locales)[number];

export const VALID_LOCALES = routing.locales;
export const DEFAULT_LOCALE = routing.defaultLocale;
