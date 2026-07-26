import { getLocalizedHref, resolvePageLocale } from '@utils/locales';
import type { BreadcrumbItem, BreadcrumbJsonLdItem } from './types';

const SITE_ORIGIN = 'https://itemdb.com.br';

/** Absolute breadcrumb URLs for JSON-LD (locale-aware paths, no hooks). */
export function formatBreadcrumbJsonLd(
  breadcrumbList: BreadcrumbItem[],
  locale: string
): BreadcrumbJsonLdItem[] {
  const normalizedLocale = resolvePageLocale(locale);

  return breadcrumbList
    .filter((crumb) => !crumb.nofollow)
    .map((crumb, index) => ({
      position: index + 1,
      name: crumb.name,
      item: `${SITE_ORIGIN}${getLocalizedHref(crumb.item, normalizedLocale)}`,
    }));
}
