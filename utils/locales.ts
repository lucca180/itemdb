import { hasLocale } from 'next-intl';
import type { NextRouter } from 'next/router';
import { routing, type AppLocale } from '../i18n/routing';

export { routing, type AppLocale };
export const VALID_LOCALES = routing.locales;
export const DEFAULT_LOCALE = routing.defaultLocale;

export function isValidLocale(locale: string | undefined | null): locale is AppLocale {
  return hasLocale(routing.locales, locale);
}

export function getLocalePrefix(locale: AppLocale) {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

export function getPathLocale(pathname: string): AppLocale | null {
  const firstSegment = pathname.split('/')[1];
  if (!isValidLocale(firstSegment) || firstSegment === DEFAULT_LOCALE) return null;

  return firstSegment;
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

export function getLocalizedHref(pathWithSearch: string, locale: AppLocale) {
  const searchIndex = pathWithSearch.indexOf('?');
  const pathname = searchIndex === -1 ? pathWithSearch : pathWithSearch.slice(0, searchIndex);
  const search = searchIndex === -1 ? '' : pathWithSearch.slice(searchIndex);
  const pathLocale = getPathLocale(pathname);
  const internalPath = pathLocale ? stripLocalePrefix(pathname, pathLocale) : pathname;

  return `${withLocalePrefix(internalPath, locale)}${search}`;
}

export function getLocalizedLoginRedirect(locale: AppLocale, redirectPath: string) {
  return `${withLocalePrefix('/login', locale)}?redirect=${encodeURIComponent(redirectPath)}`;
}

export function isLocalizableHref(href: string, isExternal?: boolean) {
  if (isExternal) return false;
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('#')
  ) {
    return false;
  }

  return !href.startsWith('/api');
}

export function localizeInternalHref(
  href: string | undefined,
  locale: AppLocale,
  options?: { isExternal?: boolean }
) {
  const path = href || '/';

  if (!isLocalizableHref(path, options?.isExternal)) {
    return path;
  }

  return getLocalizedHref(path, locale);
}

export function getLocaleStaticPaths() {
  return {
    paths: routing.locales.map((locale) => ({ params: { locale } })),
    fallback: false as const,
  };
}

export function resolvePageLocale(locale: string | undefined): AppLocale {
  return isValidLocale(locale) ? locale : DEFAULT_LOCALE;
}

/** Current pathname from Pages Router, without query or hash. */
export function getPageRouterBasePath(router: Pick<NextRouter, 'asPath'>) {
  return router.asPath.split('?')[0].split('#')[0];
}

/** Locale param from pages/[locale]/* routes. */
export function getPageRouterLocale(router: Pick<NextRouter, 'query'>) {
  return resolvePageLocale(router.query.locale as string | undefined);
}

/**
 * Build a client navigation href for pages/[locale]/* routes.
 * Prefer this over router.pathname, which returns `/[locale]/...` and breaks Next.js href interpolation.
 */
export function getPageRouterHref(
  router: Pick<NextRouter, 'asPath' | 'query'>,
  internalPathWithSearch: string
) {
  return getLocalizedHref(internalPathWithSearch, getPageRouterLocale(router));
}

export function getCurrentPath(pathname: string, search: string, localizedCurrentPath?: string) {
  const searchParams = new URLSearchParams(search);
  searchParams.delete('_rsc');
  const normalizedSearch = searchParams.toString();
  const currentPath = localizedCurrentPath ?? pathname;

  return `${currentPath}${normalizedSearch ? `?${normalizedSearch}` : ''}`;
}
