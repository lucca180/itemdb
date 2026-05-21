export const VALID_LOCALES = ['en', 'pt'] as const;

export type AppLocale = (typeof VALID_LOCALES)[number];
export type LocalizedAppRoute = {
  appPath: string;
  localizedPath: string;
};

export const DEFAULT_LOCALE: AppLocale = 'en';

export function isValidLocale(locale: string | undefined | null): locale is AppLocale {
  return locale !== undefined && locale !== null && VALID_LOCALES.includes(locale as AppLocale);
}

export function getLocalePrefix(locale: AppLocale) {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

export function getPathLocale(pathname: string): AppLocale | null {
  const firstSegment = pathname.split('/')[1];
  if (!isValidLocale(firstSegment) || firstSegment === DEFAULT_LOCALE) return null;

  return firstSegment;
}

export function getNextUrlLocale(locale: string): AppLocale | null {
  if (!isValidLocale(locale) || locale === DEFAULT_LOCALE) return null;

  return locale;
}

export function stripLocalePrefix(pathname: string, locale: AppLocale) {
  const prefix = `/${locale}`;
  if (pathname === prefix) return '/';
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);

  return pathname;
}

export function withLocalePrefix(pathname: string, locale: AppLocale) {
  if (locale === DEFAULT_LOCALE) {
    return pathname;
  }

  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
}

export function getLocalizedAppRoute({
  pathname,
  cookieLocale,
  nextUrlLocale,
  routes,
}: {
  pathname: string;
  cookieLocale?: string | null;
  nextUrlLocale: string;
  routes: readonly LocalizedAppRoute[];
}) {
  const pathLocale = getPathLocale(pathname);
  const locale =
    pathLocale ??
    (isValidLocale(cookieLocale) ? cookieLocale : null) ??
    getNextUrlLocale(nextUrlLocale);
  if (!locale) return null;

  const normalizedPathname = pathLocale ? stripLocalePrefix(pathname, pathLocale) : pathname;
  const route = routes.find(({ localizedPath }) => normalizedPathname === localizedPath);
  if (!route) return null;

  return {
    appPath: route.appPath,
    locale,
    currentPath: withLocalePrefix(route.localizedPath, locale),
  };
}

export function getCurrentPath(pathname: string, search: string, localizedCurrentPath?: string) {
  const searchParams = new URLSearchParams(search);
  searchParams.delete('_rsc');
  const normalizedSearch = searchParams.toString();
  const currentPath = localizedCurrentPath ?? pathname;

  return `${currentPath}${normalizedSearch ? `?${normalizedSearch}` : ''}`;
}
