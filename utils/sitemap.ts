import type { ISitemapField } from 'next-sitemap';

export const SITE_URL = 'https://itemdb.com.br';

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
  '/mall/leaving',
  '/restock',
  '/tools/price-calculator',
  '/tools/rainbow-pool',
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
  const base: Pick<ISitemapField, 'alternateRefs' | 'lastmod'> = {
    alternateRefs: alternates,
    ...(lastmod ? { lastmod } : {}),
  };

  return [
    { loc: en, ...base },
    { loc: pt, ...base },
  ];
}
