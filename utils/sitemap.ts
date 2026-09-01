import type { ISitemapField } from 'next-sitemap';
import { toIso8601Utc } from './isoDate';

export const SITE_URL = 'https://itemdb.com.br';
export { toIso8601Utc as normalizeSitemapLastmod } from './isoDate';
/** Indexable static routes (no locale prefix). Keep in sync with App Router pages that are not noindex. */
export const STATIC_SITEMAP_PATHS = [
  '/',
  '/articles',
  '/contribute',
  '/faq',
  '/feedback',
  '/hub/faeriefestival',
  '/hub/item-effects',
  '/hub/missing-info',
  '/hub/the-void-within',
  '/lists/import',
  '/lists/official',
  '/mall',
  '/mall/leaving',
  '/restock',
  '/tools/price-calculator',
  '/tools/price-checker',
  '/rainbow-pool',
  '/rainbow-pool/pet-styles',
] as const;

export function enLoc(path: string): string {
  if (path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path}`;
}

export function ptLoc(path: string): string {
  if (path === '/') return `${SITE_URL}/pt`;
  return `${SITE_URL}/pt${path}`;
}

/** EN + PT entries with matching hreflang alternateRefs. */
export function bilingualSitemapFields(path: string, lastmod?: string): ISitemapField[] {
  const en = enLoc(path);
  const pt = ptLoc(path);
  const alternates = [
    { href: en, hreflang: 'en' },
    { href: pt, hreflang: 'pt' },
  ];
  const normalizedLastmod = lastmod ? toIso8601Utc(lastmod) : undefined;
  const base: Pick<ISitemapField, 'alternateRefs' | 'lastmod'> = {
    alternateRefs: alternates,
    ...(normalizedLastmod ? { lastmod: normalizedLastmod } : {}),
  };

  return [
    { loc: en, ...base },
    { loc: pt, ...base },
  ];
}
