import { differenceInCalendarDays, isSameDay } from 'date-fns';
import { tz } from '@date-fns/tz';
import type { ItemData, PriceData, PriceMarker, PricingInfo, UserList } from '@types';

const LA = tz('America/Los_Angeles');

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
  markerEdge?: 'start' | 'end' | 'range';
  /** Already-translated Badge copy (or custom manual badge). */
  badgeText?: string;
  /** List name / marker title shown under the badge. */
  title?: string;
  description?: string | null;
  color?: string;
  slug?: string | null;
  addedAt?: string;
  /** Closing date when start+end were collapsed into one range row. */
  rangeEndAt?: string;
  hasEnding?: boolean;
};

export function filterNPSeekingLists(lists?: UserList[]) {
  return lists?.filter((list) => list.purpose === 'seeking') ?? [];
}

export function filterNPTradingLists(lists?: UserList[]) {
  return lists?.filter((list) => list.purpose === 'trading') ?? [];
}

export const PRICE_TABLE_INITIAL_LIMIT = 20;

export function toPriceSummary(prices: PriceData[], limit = PRICE_TABLE_INITIAL_LIMIT) {
  return {
    prices: prices.slice(0, limit),
    hasMore: prices.length > limit,
  };
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
 * Adjacent start+end of the same series (no rows between) collapse into one range row.
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

    if (isSameDay(aDate, bDate, { in: LA })) {
      if (a.marker && b.marker) return bDate.getTime() - aDate.getTime();
      return b.marker ? -1 : 1;
    }

    return bDate.getTime() - aDate.getTime();
  });

  const collapsed = collapseAdjacentRangeMarkers(sorted, t);

  let markerColor = '';
  collapsed.forEach((row) => {
    if (!row.marker && markerColor) row.color = markerColor;

    if (markerColor && row.marker && markerColor === row.color) {
      markerColor = '';
      return;
    }

    if (!markerColor && row.marker && row.hasEnding) {
      markerColor = row.color!;
    }
  });

  return collapsed;
}

function collapseAdjacentRangeMarkers(rows: PriceOrMarker[], t: TranslateFn): PriceOrMarker[] {
  const collapsed: PriceOrMarker[] = [];

  for (let i = 0; i < rows.length; i++) {
    const current = rows[i];
    const next = rows[i + 1];

    if (current && next && isStartEndPair(current, next)) {
      collapsed.push(mergeRangeRows(current, next, t));
      i += 1;
      continue;
    }

    collapsed.push(current);
  }

  return collapsed;
}

function isStartEndPair(a: PriceOrMarker, b: PriceOrMarker): boolean {
  if (!a.marker || !b.marker || a.markerId !== b.markerId) return false;
  const edges = new Set([a.markerEdge, b.markerEdge]);
  return edges.has('start') && edges.has('end');
}

function mergeRangeRows(a: PriceOrMarker, b: PriceOrMarker, t: TranslateFn): PriceOrMarker {
  const startRow = a.markerEdge === 'start' ? a : b;
  const endRow = a.markerEdge === 'end' ? a : b;
  const startDate = new Date(startRow.addedAt!);
  const endDate = new Date(endRow.addedAt!);
  const sameDay = isSameDay(startDate, endDate, { in: LA });

  return {
    ...startRow,
    markerEdge: 'range',
    rangeEndAt: sameDay ? undefined : endRow.addedAt,
    hasEnding: false,
    badgeText: resolveCollapsedRangeBadge(startRow.badgeText, sameDay, t),
    description: startRow.description,
  };
}

function resolveCollapsedRangeBadge(
  startBadge: string | undefined,
  sameDay: boolean,
  t: TranslateFn
): string | undefined {
  if (startBadge === undefined) return undefined;

  const autoStart =
    startBadge === t('ItemPage.available-at') || startBadge === t('ItemPage.added-to');
  if (!autoStart) return startBadge;

  return t(sameDay ? 'ItemPage.available-only-at' : 'ItemPage.available-at');
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
