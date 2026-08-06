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

/**
 * Google requires W3C Datetime for lastmod (timezone required when time is present).
 * WordPress *_gmt fields often omit `Z`; Date#toISOString() includes milliseconds.
 */
export function normalizeSitemapLastmod(lastmod: string | Date): string | undefined {
  const date =
    lastmod instanceof Date
      ? lastmod
      : new Date(
          // Datetime without timezone (e.g. WP modified_gmt) → treat as UTC.
          /T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(lastmod) ? `${lastmod}Z` : lastmod
        );

  if (Number.isNaN(date.getTime())) return undefined;

  // Drop fractional seconds — Google examples use seconds precision only.
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** EN + PT entries with matching hreflang alternateRefs. */
export function bilingualSitemapFields(path: string, lastmod?: string): ISitemapField[] {
  const en = enLoc(path);
  const pt = ptLoc(path);
  const alternates = [
    { href: en, hreflang: 'en' },
    { href: pt, hreflang: 'pt' },
  ];
  const normalizedLastmod = lastmod ? normalizeSitemapLastmod(lastmod) : undefined;
  const base: Pick<ISitemapField, 'alternateRefs' | 'lastmod'> = {
    alternateRefs: alternates,
    ...(normalizedLastmod ? { lastmod: normalizedLastmod } : {}),
  };

  return [
    { loc: en, ...base },
    { loc: pt, ...base },
  ];
}
