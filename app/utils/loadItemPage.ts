import { cache } from 'react';
import type { Metadata } from 'next';
import { getCachedItem } from '@app/_components/Item/loadUtils';
import { ItemData } from '@types';
import { getItemDbCanonical, normalizeItemDbLocale } from '@app/utils/appPage';
import { getDefaultSEO } from '@utils/SEO';
import { cacheLife } from 'next/cache';

export type ItemPageRouteMetadataResult =
  | { type: 'notFound' }
  | { type: 'redirect'; href: `/item/${string}`; item: ItemData }
  | { type: 'ok'; item: ItemData };

function truncateString(str: string, num: number) {
  if (!str) return str;
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

function getMetaDescription(item: ItemData) {
  return truncateString(item.description, 130);
}

export function buildItemPageMetadata(item: ItemData, locale: string): Metadata {
  const normalizedLocale = normalizeItemDbLocale(locale);
  const pathname = `/item/${item.slug}` as const;
  const canonical = getItemDbCanonical(pathname, normalizedLocale);
  const description = getMetaDescription(item);
  const defaultSeo = getDefaultSEO(locale);

  return {
    title: item.name,
    description,
    // Keep only canonical in Metadata. `languages` becomes HTTP `Link: rel=alternate`
    // headers; with `partialPrefetching` + home `prefetch="auto"`, Next accumulates
    // hreflang Links from many prefetched items (~40KB+) and Nginx returns 502
    // ("upstream sent too big header"). HTML hreflang is rendered by ItemHreflangLinks.
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: item.name,
      description,
      siteName: defaultSeo.openGraph?.siteName,
      locale: defaultSeo.openGraph?.locale,
      images: [{ url: item.image, width: 80, height: 80, alt: item.name }],
    },
    twitter: {
      card: 'summary',
      site: defaultSeo.twitter?.site,
      title: item.name,
      description,
    },
    other: {
      'theme-color': item.color.hex,
    },
  };
}

async function resolveItemSlug(slugParam: string): Promise<ItemPageRouteMetadataResult> {
  'use cache';
  if (!slugParam) return { type: 'notFound' };

  const isIdNumber = !isNaN(Number(slugParam));
  let item: ItemData | null | undefined;

  if (isIdNumber) {
    item = await getCachedItem(Number(slugParam), true);
    if (!item) return { type: 'notFound' };
    if (item.slug) return { type: 'redirect', href: `/item/${item.slug}`, item };
  } else {
    item = await getCachedItem(slugParam, true);
    if (!item) return { type: 'notFound' };
    if (slugParam !== item.slug) {
      return { type: 'redirect', href: `/item/${item.slug}`, item };
    }
  }

  cacheLife('itemFast');

  return { type: 'ok', item };
}

export const resolveItemRoute = cache(
  async (slugParam: string): Promise<ItemPageRouteMetadataResult> => resolveItemSlug(slugParam)
);
