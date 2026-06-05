import { cache } from 'react';
import type { Metadata } from 'next';
import {
  AvyData,
  BDData,
  FullItemColors,
  InsightsResponse,
  ItemData,
  ItemEffect,
  ItemLastSeen,
  ItemMMEData,
  ItemOpenable,
  ItemPetpetData,
  ItemRecipe,
  NCMallData,
  PriceData,
  TradeData,
  UserList,
  WearableData,
} from '@types';
import { getItemDbCanonical, normalizeItemDbLocale } from '@utils/appPage';
import { shouldShowTradeLists } from '@utils/utils';
import { getItem } from '@pages/api/v1/items/[id_name]';
import { getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getSimilarItems } from '@pages/api/v1/items/[id_name]/similar';
import { getItemDrops, getItemParent } from '@pages/api/v1/items/[id_name]/drops';
import { getItemPrices } from '@pages/api/v1/items/[id_name]/prices';
import { getItemTrades } from '@pages/api/v1/trades';
import { getLastSeen } from '@pages/api/v1/prices/stats';
import { getItemEffects } from '@pages/api/v1/items/[id_name]/effects';
import { getWearableData } from '@pages/api/v1/items/[id_name]/wearable';
import { getItemNCMall } from '@pages/api/v1/items/[id_name]/ncmall';
import { getItemRecipes } from '@pages/api/v1/items/[id_name]/recipes';
import { getMMEData, isMME } from '@pages/api/v1/items/[id_name]/mme';
import { DyeworksData, getDyeworksData } from '@pages/api/v1/items/[id_name]/dyeworks';
import { getSingleItemColor } from '@pages/api/v1/items/[id_name]/colors';
import { getPetpetData } from '@pages/api/v1/items/[id_name]/petpet';
import { getNCTradeInsights } from '@pages/api/v1/mall/[iid]/insights';
import { getAvyData } from '@pages/api/v1/items/[id_name]/avys';
import * as Sentry from '@sentry/nextjs';

export type ItemPageData = {
  item: ItemData;
  colors: FullItemColors;
  similarItems: ItemData[];
  lists?: UserList[];
  tradeLists?: UserList[];
  avyData: AvyData[] | null;
  itemOpenable: ItemOpenable | null;
  itemParent: {
    parents_iid: number[];
    itemData: ItemData[];
  };
  lastSeen: ItemLastSeen | null;
  NPTrades: TradeData[];
  NPPrices: PriceData[];
  itemEffects: ItemEffect[];
  wearableData: WearableData | null;
  ncMallData: NCMallData | null;
  itemRecipes: ItemRecipe[] | null;
  mmeData: ItemMMEData | null;
  dyeData: DyeworksData | null;
  petpetData: ItemPetpetData | null;
  ncInsights: InsightsResponse | null;
  bdData: BDData | null;
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
    similarItems,
    tradeLists,
    itemOpenable,
    itemParent,
    itemPrices,
    NPTrades,
    lastSeen,
    itemEffects,
    wearableData,
    NCMallData,
    itemRecipes,
    mmeData,
    dyeData,
    petpetData,
    ncInsights,
    bdData,
    avyData,
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
      return Promise.all([
        getSingleItemColor(item),
        getItemLists(item.internal_id, true),
        getSimilarItems(item),
        shouldShowTradeLists(item) ? getItemLists(item.internal_id, false) : [],
        item.useTypes.canOpen !== 'false' ? getItemDrops(item.internal_id, item.isNC) : null,
        getItemParent(item.internal_id, 4),
        !item.isNC ? getItemPrices({ iid: item.internal_id, includeUnconfirmed: true }) : [],
        !item.isNC ? getItemTrades({ item_iid: item.internal_id }) : [],
        !item.isNC
          ? getLastSeen({ item_id: item.item_id, name: item.name, image_id: item.image_id })
          : null,
        getItemEffects(item),
        item.isWearable ? (getWearableData(item.internal_id) as Promise<WearableData>) : null,
        item.isNC ? getItemNCMall(item.internal_id) : null,
        !item.isNC ? getItemRecipes(item.internal_id) : null,
        isMME(item.name) ? getMMEData(item) : null,
        item.isNC && item.isWearable ? getDyeworksData(item) : null,
        !item.isNC && !item.isWearable && !item.isBD && !item.isNeohome
          ? getPetpetData(item)
          : null,
        item.isNC ? getNCTradeInsights(item.internal_id) : null,
        null,
        getAvyData(item.internal_id),
      ]);
    }
  );

  if (!colors) return null;

  return {
    item,
    lists: lists.filter((l) => !l.officialTag.includes('Avatar')),
    similarItems,
    colors: colors as FullItemColors,
    tradeLists,
    itemOpenable,
    itemParent,
    NPTrades,
    NPPrices: itemPrices,
    lastSeen,
    itemEffects,
    wearableData,
    ncMallData: NCMallData,
    itemRecipes,
    mmeData,
    dyeData,
    petpetData,
    ncInsights,
    bdData,
    avyData,
  };
}

export const getItemPageData = cache(async (slug: string) => {
  const item = await getItem(slug, true);
  if (!item?.slug || slug !== item.slug) return null;
  return fetchItemPageData(item);
});

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

  const data = await getItemPageData(item.slug!);
  if (!data) return { type: 'notFound' };

  return { type: 'ok', data };
});
