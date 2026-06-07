import Color from 'color';
import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import type { ItemData, PriceData, PricingInfo, UserList } from '@types';

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

  lists?.forEach((list) => {
    if (!list.seriesType) return;

    const color = Color(list.colorHex ?? '#000')
      .lightness(70)
      .hex();

    let startDate: string | null = list.itemInfo?.[0].seriesStart || list.createdAt;
    let endDate: string | null = null;
    let markerType = 'added-to';

    if (list.seriesType === 'itemAddition' && list.itemInfo?.[0].addedAt)
      startDate = list.itemInfo?.[0].seriesStart || list.itemInfo?.[0].addedAt;

    if (list.seriesType === 'listDates') {
      startDate = list.itemInfo?.[0].seriesStart || list.seriesStart || null;
    }

    let hasEnding = !!list.itemInfo?.[0].seriesEnd;

    if (list.seriesEnd || hasEnding) {
      markerType = 'available-at';
      endDate = list.itemInfo?.[0].seriesEnd || (list.seriesEnd as string);

      if (new Date(endDate) <= itemAdded) return;

      hasEnding = !!startDate;

      sorted.push({
        marker: true,
        title: list.name,
        slug: list.slug ?? '',
        hasEnding: hasEnding,
        addedAt: endDate,
        color: color,
        markerType: 'unavailable-at',
      });
    }

    startDate = startDate ? dateMax(itemAdded, new Date(startDate)).toJSON() : null;

    if (startDate)
      sorted.push({
        marker: true,
        title: list.name,
        slug: list.slug ?? '',
        addedAt: startDate,
        color: color,
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
    )
      return b.marker ? -1 : 1;

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
