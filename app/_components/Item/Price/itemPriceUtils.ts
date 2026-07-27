import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import type { ItemData, PriceData, PriceMarker, PricingInfo, UserList } from '@types';

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
  relativeTime: (date: Date, now?: number | Date) => string;
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
  format: FormatFn,
  now: number | Date
): LastSeenCardData[] {
  const isAlways = item.findAt.restockShop?.includes('hiddentower');
  const doesNotRestock = !item.findAt.restockShop;

  const buildSubtitle = (
    type: LastSeenCardData['type'],
    seen?: string | null,
    restockDoesNotRestock?: boolean,
    restockIsAlways?: boolean
  ) => {
    if (seen) return format.relativeTime(new Date(seen), now);
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
  /** Stable source marker id, used for collision-free React keys. */
  markerId?: string;
  markerEdge?: 'start' | 'end';
  /** Already-translated Badge copy (or custom manual badge). */
  badgeText?: string;
  /** List name / marker title shown under the badge. */
  title?: string;
  description?: string | null;
  color?: string;
  slug?: string | null;
  addedAt?: string;
  hasEnding?: boolean;
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

/**
 * Resolves badge copy for a table marker row.
 * - Custom non-empty string → as-is
 * - Explicit `""` → hide badge
 * - `null` / omitted → auto i18n (official lists always; manuals when toggle is on)
 */
function resolveMarkerBadgeText(
  marker: PriceMarker,
  edge: 'start' | 'end',
  hasEnding: boolean,
  t: TranslateFn
): string | undefined {
  if (marker.badgeText === '') return undefined;
  // Manual custom copy describes the opening edge. The closing edge keeps the
  // translated "Unavailable at" semantics used by official list ranges.
  if (marker.type === 'manual' && edge === 'end' && marker.badgeText) {
    return t('ItemPage.unavailable-at');
  }
  if (marker.badgeText) return marker.badgeText;

  // null / undefined → translated preset
  if (edge === 'end') return t('ItemPage.unavailable-at');
  return t(hasEnding ? 'ItemPage.available-at' : 'ItemPage.added-to');
}

/**
 * Interleaves price rows with presentation-ready markers.
 * Clamping / date validation already happened in the price-markers engine.
 * Official-list badge copy is resolved via i18n here into `badgeText`.
 * Manual markers: `null` = same auto i18n; `""` = no badge; other = custom.
 */
export function buildPriceTableData(
  data: PriceData[],
  markers: PriceMarker[] = [],
  t: TranslateFn = (key) => key
): PriceOrMarker[] {
  const sorted: PriceOrMarker[] = [...data];

  markers.forEach((marker) => {
    if (marker.title == null && marker.description == null && marker.badgeText == null) {
      return;
    }

    const hasEnding = !!marker.endAt;
    const slug = marker.type === 'officialList' ? marker.slug : null;

    if (marker.endAt) {
      sorted.push({
        marker: true,
        markerId: marker.id,
        markerEdge: 'end',
        badgeText: resolveMarkerBadgeText(marker, 'end', hasEnding, t),
        title: marker.title ?? undefined,
        // Avoid repeating the same body at both edges when a title identifies
        // the range. Description-only markers need their context on both rows.
        description: marker.title ? null : marker.description,
        slug,
        hasEnding,
        addedAt: marker.endAt,
        color: marker.color,
      });
    }

    sorted.push({
      marker: true,
      markerId: marker.id,
      markerEdge: 'start',
      badgeText: resolveMarkerBadgeText(marker, 'start', hasEnding, t),
      title: marker.title ?? undefined,
      description: marker.description,
      slug,
      addedAt: marker.startAt,
      color: marker.color,
      hasEnding,
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
