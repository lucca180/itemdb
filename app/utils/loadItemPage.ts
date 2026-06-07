import { cache } from 'react';
import type { Metadata } from 'next';
import {
  getOfficialItemLists,
  loadNCTradeInsights,
  loadNPPrices,
  loadPriceStatus,
} from '@app/_components/Item/loadUtils';
import {
  FullItemColors,
  InsightsResponse,
  ItemData,
  ItemEffect,
  NCMallData,
  PriceData,
  PricingInfo,
  UserList,
  WearableData,
} from '@types';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { getItemDbCanonical, normalizeItemDbLocale } from '@utils/appPage';
import { shouldShowTradeLists } from '@utils/utils';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getItemEffects } from '@pages/api/v1/items/[id_name]/effects';
import { getWearableData } from '@pages/api/v1/items/[id_name]/wearable';
import { getItemNCMall } from '@pages/api/v1/items/[id_name]/ncmall';
import { getSingleItemColor } from '@pages/api/v1/items/[id_name]/colors';
import * as Sentry from '@sentry/nextjs';

export type ItemPageData = {
  item: ItemData;
  colors: FullItemColors;
  lists?: UserList[];
  tradeLists?: UserList[];
  itemEffects: ItemEffect[];
  wearableData: WearableData | null;
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

  return {
    title: item.name,
    description: getMetaDescription(item),
    alternates: {
      canonical,
      languages: {
        en: getItemDbCanonical(pathname, 'en'),
        pt: getItemDbCanonical(pathname, 'pt'),
      },
    },
    openGraph: {
      images: [{ url: item.image, width: 80, height: 80, alt: item.name }],
    },
    other: {
      'theme-color': item.color.hex,
    },
  };
}

async function fetchItemPageData(item: ItemData): Promise<ItemPageData | null> {
  const [
    colors,
    lists,
    tradeLists,
    itemEffects,
    wearableData,
    NCMallData,
    ncTradeInsights,
    npPrices,
    npPriceStatus,
  ] = await Sentry.startSpan(
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
    async () => {
      const { user } = await getServerCurrentUser();
      return Promise.all([
        getSingleItemColor(item),
        getOfficialItemLists(item.internal_id),
        item.isNC && shouldShowTradeLists(item) ? getItemLists(item.internal_id, false) : [],
        getItemEffects(item),
        item.isWearable ? (getWearableData(item.internal_id) as Promise<WearableData>) : null,
        item.isNC ? getItemNCMall(item.internal_id) : null,
        item.isNC ? loadNCTradeInsights(item.internal_id) : null,
        !item.isNC ? loadNPPrices(item.internal_id) : [],
        !item.isNC ? loadPriceStatus(item.internal_id, user?.id) : null,
      ]);
    }
  );

  if (!colors) return null;

  return {
    item,
    lists: lists.filter((l) => !l.officialTag.includes('Avatar')),
    colors: colors as FullItemColors,
    tradeLists,
    itemEffects,
    wearableData,
    ncMallData: NCMallData,
    ncTradeInsights,
    npPrices,
    npPriceStatus,
  };
}

export const getItemPageData = cache(async (item: ItemData) => fetchItemPageData(item));

export const resolveItemPage = cache(async (slugParam: string): Promise<ItemPageRouteResult> => {
  if (!slugParam) return { type: 'notFound' };

  const isIdNumber = !isNaN(Number(slugParam));
  let item: ItemData | null | undefined;

  if (isIdNumber) {
    item = await getItem(Number(slugParam), true);
    if (!item) return { type: 'notFound' };
    if (item.slug) return { type: 'redirect', href: `/item/${item.slug}` };
  } else {
    item = await getItem(slugParam, true);
    if (!item) return { type: 'notFound' };
    if (slugParam !== item.slug) return { type: 'redirect', href: `/item/${item.slug}` };
  }

  const data = await getItemPageData(item);
  if (!data) return { type: 'notFound' };

  return { type: 'ok', data };
});
