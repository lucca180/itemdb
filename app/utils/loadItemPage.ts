import { cache } from 'react';
import type { Metadata } from 'next';
import {
  loadNCTradeInsights,
  loadNPPrices,
  loadPriceStatus,
} from '@app/_components/Item/loadUtils';
import { InsightsResponse, ItemData, NCMallData, PriceData, PricingInfo } from '@types';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  buildItemDbHreflangAlternates,
  getItemDbCanonical,
  normalizeItemDbLocale,
} from '@utils/appPage';
import { getDefaultSEO } from '@utils/SEO';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getItemNCMall } from '@pages/api/v1/items/[id_name]/ncmall';
import * as Sentry from '@sentry/nextjs';

export type ItemPageData = {
  item: ItemData;
  ncMallData: NCMallData | null;
  /** Preloaded for NC items — blocks page render until resolved. */
  ncTradeInsights: InsightsResponse | null;
  /** Preloaded for NP items — blocks page render until resolved. */
  npPrices: PriceData[];
  npPriceStatus: PricingInfo | null;
};

export type ItemPageRouteResult =
  | { type: 'redirect'; href: `/item/${string}` }
  | { type: 'notFound' }
  | { type: 'ok'; data: ItemPageData };

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
  const hreflang = buildItemDbHreflangAlternates(pathname);
  const description = getMetaDescription(item);
  const defaultSeo = getDefaultSEO(locale);

  return {
    title: item.name,
    description,
    alternates: {
      canonical,
      languages: {
        ...hreflang.languages,
      },
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
  if (!slugParam) return { type: 'notFound' };

  const isIdNumber = !isNaN(Number(slugParam));
  let item: ItemData | null | undefined;

  if (isIdNumber) {
    item = await getItem(Number(slugParam), true);
    if (!item) return { type: 'notFound' };
    if (item.slug) return { type: 'redirect', href: `/item/${item.slug}`, item };
  } else {
    item = await getItem(slugParam, true);
    if (!item) return { type: 'notFound' };
    if (slugParam !== item.slug) {
      return { type: 'redirect', href: `/item/${item.slug}`, item };
    }
  }

  return { type: 'ok', item };
}

/** Lightweight slug resolution for generateMetadata — no price/NC preload. */
export const resolveItemRoute = cache(
  async (slugParam: string): Promise<ItemPageRouteMetadataResult> => resolveItemSlug(slugParam)
);

async function fetchItemPageData(item: ItemData): Promise<ItemPageData> {
  const { user } = await getServerCurrentUser();

  const [ncMallData, ncTradeInsights, npPrices, npPriceStatus] = await Sentry.startSpan(
    {
      name: 'itemLoad',
      attributes: {
        itemName: item.name,
        item_iid: item.internal_id,
        isWearable: item.isWearable,
        isNC: item.isNC,
      },
      forceTransaction: true,
    },
    async () =>
      Promise.all([
        item.isNC ? getItemNCMall(item.internal_id) : null,
        item.isNC ? loadNCTradeInsights(item.internal_id) : null,
        !item.isNC ? loadNPPrices(item.internal_id) : [],
        !item.isNC ? loadPriceStatus(item.internal_id, user?.id) : null,
      ])
  );

  return {
    item,
    ncMallData,
    ncTradeInsights,
    npPrices,
    npPriceStatus,
  };
}

export const getItemPageData = cache(async (item: ItemData) => fetchItemPageData(item));

export const resolveItemPage = cache(async (slugParam: string): Promise<ItemPageRouteResult> => {
  const route = await resolveItemSlug(slugParam);

  if (route.type === 'notFound') return { type: 'notFound' };
  if (route.type === 'redirect') return { type: 'redirect', href: route.href };

  const data = await getItemPageData(route.item);

  return { type: 'ok', data };
});
