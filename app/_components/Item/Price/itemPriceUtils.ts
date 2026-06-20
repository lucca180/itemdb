import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import type { ItemData, PriceData, PricingInfo, UserList } from '@types';
import { resolveItemListSeries } from '@utils/item/itemListSeries';

export type ItemPriceStatLabels = {
  inflation: string;
  noInfo: string;
  wrongPrice: string;
};

export type ItemPriceHelpLabels = {
  title: string;
  description: string;
  priceTradeLots: string | null;
  voteSuggestions: string | null;
};

export type ItemPriceEmptyLabels = {
  noData: string;
  learnHelp: string;
};

export type LastSeenCardData = {
  type: 'sw' | 'tp' | 'auction' | 'restock';
  title: string;
  subtitle?: string;
  canOpenModal?: boolean;
};

type LastSeenData = {
  sw?: string | null;
  tp?: string | null;
  auction?: string | null;
  restock?: string | null;
};

type TranslateFn = (key: string) => string;
type FormatFn = {
  relativeTime: (date: Date) => string;
};

const LAST_SEEN_CARD_TYPES = ['sw', 'tp', 'auction', 'restock'] as const;

const SEEN_TITLE_KEYS: Record<(typeof LAST_SEEN_CARD_TYPES)[number], string> = {
  sw: 'General.shop-wizard',
  tp: 'General.trading-post',
  auction: 'General.auction-house',
  restock: 'General.restock-shop',
};

export function buildLastSeenStaticCards(t: TranslateFn): LastSeenCardData[] {
  return LAST_SEEN_CARD_TYPES.map((type) => ({
    type,
    title: t(SEEN_TITLE_KEYS[type]),
  }));
}

export function buildLastSeenCards(
  item: ItemData,
  lastSeen: LastSeenData | null | undefined,
  t: TranslateFn,
  format: FormatFn
): LastSeenCardData[] {
  const isAlways = item.findAt.restockShop?.includes('hiddentower');
  const doesNotRestock = !item.findAt.restockShop;

  const buildSubtitle = (
    type: LastSeenCardData['type'],
    seen?: string | null,
    restockDoesNotRestock?: boolean,
    restockIsAlways?: boolean
  ) => {
    if (seen) return format.relativeTime(new Date(seen));
    if (type === 'restock' && restockDoesNotRestock) return t('ItemPage.does-not-restock');
    if (restockIsAlways) return t('General.always');
    return t('General.never');
  };

  const buildCard = (
    type: LastSeenCardData['type'],
    seen?: string | null,
    options?: { doesNotRestock?: boolean; isAlways?: boolean }
  ): LastSeenCardData => {
    const canOpenModal =
      !!seen && ['tp', 'auction', 'restock'].includes(type) && !options?.doesNotRestock;

    return {
      type,
      title: t(SEEN_TITLE_KEYS[type]),
      subtitle: buildSubtitle(type, seen, options?.doesNotRestock, options?.isAlways),
      canOpenModal,
    };
  };

  return [
    buildCard('sw', lastSeen?.sw),
    buildCard('tp', lastSeen?.tp),
    buildCard('auction', lastSeen?.auction),
    buildCard('restock', lastSeen?.restock, { doesNotRestock, isAlways }),
  ];
}

export type PriceOrMarker = Partial<PriceData> & {
  marker?: boolean;
  title?: string;
  color?: string;
  slug?: string;
  addedAt?: string;
  hasEnding?: boolean;
  markerType?: 'added-to' | 'available-at' | 'unavailable-at';
};

const dateMax = (...dates: Date[]) => {
  return dates.reduce((max, date) => (date > max ? date : max), new Date(0));
};

export function filterNPSeekingLists(lists?: UserList[]) {
  return lists?.filter((list) => list.purpose === 'seeking') ?? [];
}

export function filterNPTradingLists(lists?: UserList[]) {
  return lists?.filter((list) => list.purpose === 'trading') ?? [];
}

export function getLatestPrice(prices: PriceData[]) {
  return prices.find((p) => p.isLatest);
}

export function getPriceDiff(prices: PriceData[]) {
  if (prices.length < 2) return null;
  const priceZeroIndex = prices.findIndex((p) => p.isLatest);
  const price = prices[priceZeroIndex];
  const priceOne = prices[priceZeroIndex + 1];
  if (!price?.value || !priceOne?.value) return null;
  return price.value - priceOne.value;
}

export function getHelpNeededData(
  priceStatus: PricingInfo | null,
  price: PriceData | undefined
): { needPricing: number; needVoting: number } | null {
  if (!priceStatus) return null;
  if (priceStatus.dataStatus.fresh >= 10) return null;

  const hasTrades =
    priceStatus.waitingTrades.needPricing + priceStatus.waitingTrades.needVoting >= 5;
  if (!hasTrades) return null;

  const shouldShow =
    !price || (differenceInCalendarDays(new Date(), new Date(price.addedAt)) > 15 && hasTrades);

  if (!shouldShow) return null;

  return {
    needPricing: priceStatus.waitingTrades.needPricing,
    needVoting: priceStatus.waitingTrades.needVoting,
  };
}

export function buildPriceTableData(
  data: PriceData[],
  lists: UserList[] | undefined,
  item: ItemData
): PriceOrMarker[] {
  const sorted: PriceOrMarker[] = [...data];
  const itemAdded = new Date(item.firstSeen ?? 0);

  resolveItemListSeries(lists).forEach((series) => {
    let startDate: string | null = series.startAt;
    let markerType = 'added-to';
    let hasEnding = !!series.endAt;

    if (series.endAt) {
      markerType = 'available-at';

      if (new Date(series.endAt) <= itemAdded) return;

      hasEnding = !!startDate;

      sorted.push({
        marker: true,
        title: series.name,
        slug: series.slug,
        hasEnding: hasEnding,
        addedAt: series.endAt,
        color: series.color,
        markerType: 'unavailable-at',
      });
    }

    startDate = startDate ? dateMax(itemAdded, new Date(startDate)).toJSON() : null;

    if (startDate)
      sorted.push({
        marker: true,
        title: series.name,
        slug: series.slug,
        addedAt: startDate,
        color: series.color,
        hasEnding: hasEnding,
        markerType: markerType as 'added-to' | 'available-at' | 'unavailable-at',
      });
  });

  sorted.sort((a, b) => {
    const aDate = new Date(a.addedAt!);
    const bDate = new Date(b.addedAt!);

    if (
      isSameDay(aDate, bDate, {
        in: tz('America/Los_Angeles'),
      })
    ) {
      if (a.marker && b.marker) return bDate.getTime() - aDate.getTime();
      return b.marker ? -1 : 1;
    }

    return bDate.getTime() - aDate.getTime();
  });

  let markerColor = '';
  sorted.forEach((row) => {
    if (!row.marker && markerColor) row.color = markerColor;

    if (markerColor && row.marker && markerColor === row.color) {
      markerColor = '';
      return;
    }

    if (!markerColor && row.marker && row.hasEnding) {
      markerColor = row.color!;
    }
  });

  return sorted;
}

export function getNextPrice(sortedData: PriceOrMarker[], index: number): PriceData | undefined {
  let nextIndex = index + 1;
  let next = sortedData[nextIndex];
  while (next && next.marker) {
    nextIndex++;
    next = sortedData[nextIndex];
  }
  return next as PriceData | undefined;
}

export function getPercentChange(newPrice: number, oldPrice: number) {
  const isPositive = newPrice - oldPrice > 0;
  const val = ((newPrice - oldPrice) / oldPrice) * 100;
  return `${isPositive ? '+' : ''}${val.toFixed(Math.abs(val) < 1 ? 1 : 0)}`;
}
