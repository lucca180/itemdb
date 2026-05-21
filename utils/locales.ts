export const VALID_LOCALES = ['en', 'pt'] as const;

export type AppLocale = (typeof VALID_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export function isValidLocale(locale: string | undefined | null): locale is AppLocale {
  return locale !== undefined && locale !== null && VALID_LOCALES.includes(locale as AppLocale);
}

export function getLocalePrefix(locale: AppLocale) {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}
