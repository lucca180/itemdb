import { getLocalizedHref, resolvePageLocale } from '@utils/locales';
import type { BreadcrumbItem, BreadcrumbJsonLdItem } from './types';

const SITE_ORIGIN = 'https://itemdb.com.br';

/** Absolute breadcrumb URLs for JSON-LD (locale-aware paths, no hooks). */
export function formatBreadcrumbJsonLd(
  breadcrumbList: BreadcrumbItem[],
  locale: string
): BreadcrumbJsonLdItem[] {
  const normalizedLocale = resolvePageLocale(locale);

  return breadcrumbList.map((crumb) => ({
    ...crumb,
    item: `${SITE_ORIGIN}${getLocalizedHref(crumb.item, normalizedLocale)}`,
  }));
}
