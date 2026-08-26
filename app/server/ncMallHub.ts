import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@utils/prisma';
import { getCachedNow } from '@utils/getCachedNow';
import { isEventActive } from '@app/_components/Item/NCTrade/ncTradeInsightsUtils';
import { ItemService } from '@services/ItemService';
import { ListService } from '@services/ListService';
import { getUmamiItemPageviews } from '@services/item/trendingItems';
import { getItemParent } from '@pages/api/v1/items/[id_name]/drops';
import { filterOfficialLists, getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getWearableData } from '@pages/api/v1/items/[id_name]/wearable';
import { listItemsTag } from '@utils/appCacheTags';
import { DYEWORKS_CURRENT_LIST_ID } from '@utils/dyeworks/sync';
import { getListLink } from '@utils/list/listLink';
import type { ItemV2For, UserList, WearableData } from '@types';

/** Official list: NC Collectible (`nc-collectible`). */
export const MALL_NC_COLLECTIBLE_LIST_ID = 6169;
/** Official list: Premium Collectible (`premium-collectible`). */
export const MALL_PREMIUM_COLLECTIBLE_LIST_ID = 5469;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ALSO_NEW_LIMIT = 12;
const ON_SALE_LIMIT = 24;
const LEAVING_STRIP_LIMIT = 5;
const LEAVING_ASIDE_LIMIT = 3;
const LEAVING_FETCH_LIMIT = LEAVING_STRIP_LIMIT + LEAVING_ASIDE_LIMIT;
const LEAVING_POOL_LIMIT = 100;
const LEBRON_LIMIT = 5;
const LEBRON_FETCH_LIMIT = 30;
/** Trending pool before filtering to NC (home uses 20; many hits are NP). */
const POPULAR_NC_TRENDING_POOL = 80;
const POPULAR_NC_LIMIT = 12;
const CAPSULES_LIMIT = 8;
const EVENTS_FETCH_LIMIT = 3000;
const EVENTS_LIMIT = 12;

export type MallOnSale = {
  items: ItemV2For<'card'>[];
  deepestCut: ItemV2For<'card'>;
};

function activeMallWhere(nowDate: Date) {
  return {
    active: true as const,
    OR: [{ saleEnd: { gte: nowDate } }, { saleEnd: null }],
  };
}

export type MallCoverFoundIn = {
  name: string;
  href: string;
  imageSrc: string;
  kind: 'item' | 'list';
};

export type MallCoverStory = {
  cover: ItemV2For<'card'>;
  alsoNew: ItemV2For<'card'>[];
  foundIn: MallCoverFoundIn | null;
  isLE: boolean;
  wearableZones: string[];
};

function hasMallSaleBegin(item: ItemV2For<'card'>): boolean {
  return item.price?.type === 'ncMall' && !!item.price.saleBegin;
}

export function hasNcMallOfficialTag(list: Pick<UserList, 'officialTag'>): boolean {
  return list.officialTag.some((tag) => tag.toLowerCase() === 'nc mall');
}

export function hasRetiredOfficialTag(list: Pick<UserList, 'officialTag'>): boolean {
  return list.officialTag.some((tag) => tag.toLowerCase() === 'retired');
}

/** Third official tag after comma-split (e.g. "NC Mall, Event, Wonderclaw" → "Wonderclaw"). */
export function mallEventCategoryTag(list: Pick<UserList, 'officialTag'>): string | null {
  const tag = list.officialTag[2]?.trim();
  return tag || null;
}

function pickOfficialList(lists: UserList[]): UserList | null {
  const official = filterOfficialLists(lists).filter(
    (list) => list.visibility === 'public' && !list.officialTag.includes('Avatar')
  );
  if (official.length === 0) return null;

  const ncMall = official.find(hasNcMallOfficialTag);
  if (ncMall) return ncMall;

  return official.find((list) => list.coverURL) ?? official[0];
}

function reportLooksLE(report: {
  limitedEdition: boolean;
  prizePool: string | null;
  notes: string | null;
}): boolean {
  return (
    report.limitedEdition ||
    !!report.notes?.toLowerCase().includes('le') ||
    !!report.prizePool?.toLowerCase().includes('le')
  );
}

async function isParentDropLE(itemIid: number, parentIid: number): Promise<boolean> {
  const reports = await prisma.openableItems.findMany({
    where: {
      parent_iid: parentIid,
      OR: [{ item_iid: itemIid }, { item: { canonical_id: itemIid } }],
    },
    select: { limitedEdition: true, prizePool: true, notes: true },
  });

  return reports.some(reportLooksLE);
}

async function resolveCoverFoundIn(
  internalId: number
): Promise<{ foundIn: MallCoverFoundIn | null; isLE: boolean }> {
  const [parentResult, listResult] = await Promise.all([
    getItemParent(internalId, 1).catch(() => ({ itemData: [] })),
    getItemLists(internalId, { includeOfficial: true, includeTrade: false }).catch(() => ({
      official: [] as UserList[],
    })),
  ]);

  const parent = parentResult.itemData[0];
  if (parent) {
    const isLE = await isParentDropLE(internalId, parent.internal_id);
    return {
      isLE,
      foundIn: {
        kind: 'item',
        name: parent.name,
        href: `/item/${parent.slug ?? parent.internal_id}`,
        imageSrc: parent.image_id
          ? `https://cdn.itemdb.com.br/items/${parent.image_id}.gif`
          : parent.image,
      },
    };
  }

  const list = pickOfficialList(listResult.official);
  if (!list) return { foundIn: null, isLE: false };

  return {
    isLE: false,
    foundIn: {
      kind: 'list',
      name: list.name,
      href: getListLink(list),
      imageSrc: list.coverURL || '/logo_icon.svg',
    },
  };
}

function mallSaleBeginMs(item: ItemV2For<'card'>): number {
  if (item.price?.type !== 'ncMall' || !item.price.saleBegin) return 0;
  return new Date(item.price.saleBegin).getTime();
}

function utcDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function compareCoverCandidates(
  a: ItemV2For<'card'>,
  b: ItemV2For<'card'>,
  popularity: Map<number, number>
): number {
  const popDelta = (popularity.get(b.internal_id) ?? 0) - (popularity.get(a.internal_id) ?? 0);
  if (popDelta !== 0) return popDelta;
  return mallSaleBeginMs(b) - mallSaleBeginMs(a) || a.name.localeCompare(b.name);
}

export function popularityFromPageviews(
  items: Pick<ItemV2For<'card'>, 'internal_id' | 'slug'>[],
  pageviews: Map<string, number>
): Map<number, number> {
  const popularity = new Map<number, number>();
  for (const item of items) {
    if (!item.slug) continue;
    popularity.set(item.internal_id, pageviews.get(item.slug) ?? 0);
  }
  return popularity;
}

export function rankAlsoNewThisWeek(
  items: ItemV2For<'card'>[],
  coverId: number,
  popularity: Map<number, number>,
  limit = ALSO_NEW_LIMIT
): ItemV2For<'card'>[] {
  return [...items]
    .filter((item) => item.internal_id !== coverId)
    .sort((a, b) => compareCoverCandidates(a, b, popularity))
    .slice(0, limit);
}

export function pickMallCoverWearable(
  newWearables: ItemV2For<'card'>[],
  mallWearables: ItemV2For<'card'>[],
  popularity: Map<number, number>
): ItemV2For<'card'> | null {
  if (newWearables.length > 0) {
    const ranked = [...newWearables].sort((a, b) => compareCoverCandidates(a, b, popularity));
    return ranked[0];
  }

  if (mallWearables.length === 0) return null;

  const latestBegin = Math.max(...mallWearables.map(mallSaleBeginMs));
  if (latestBegin <= 0) {
    const ranked = [...mallWearables].sort((a, b) => compareCoverCandidates(a, b, popularity));
    return ranked[0];
  }

  const latestDay = utcDayKey(latestBegin);
  const cohort = mallWearables.filter((item) => utcDayKey(mallSaleBeginMs(item)) === latestDay);
  const ranked = [...cohort].sort((a, b) => compareCoverCandidates(a, b, popularity));
  return ranked[0];
}

async function loadMallCoverStory(): Promise<MallCoverStory | null> {
  'use cache';
  cacheTag('mall-hub');
  cacheTag('home-latest-nc-mall');
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const nowMs = await getCachedNow();
  const nowDate = new Date(nowMs);
  const weekAgo = new Date(nowMs - WEEK_MS);
  const activeMall = activeMallWhere(nowDate);

  const [newWearableRows, mallWearableRows, recentRows, pageviews] = await Promise.all([
    prisma.items.findMany({
      where: {
        type: 'nc',
        isWearable: true,
        canonical_id: null,
        addedAt: { gte: weekAgo },
      },
      select: { internal_id: true },
      orderBy: { addedAt: 'desc' },
    }),
    prisma.ncMallData.findMany({
      where: {
        ...activeMall,
        item: { isWearable: true, type: 'nc', canonical_id: null },
      },
      select: { item_iid: true },
      orderBy: { saleBegin: 'desc' },
    }),
    prisma.items.findMany({
      where: {
        type: 'nc',
        canonical_id: null,
        OR: [
          { addedAt: { gte: weekAgo } },
          {
            ncMallData: {
              some: {
                saleBegin: { gte: weekAgo },
                OR: [{ saleEnd: null }, { saleEnd: { gte: nowDate } }],
              },
            },
          },
        ],
      },
      select: { internal_id: true },
    }),
    getUmamiItemPageviews({ nowMs, limit: 500 }).catch(() => new Map<string, number>()),
  ]);

  const ids = [
    ...new Set([
      ...newWearableRows.map((row) => row.internal_id),
      ...mallWearableRows.map((row) => row.item_iid),
      ...recentRows.map((row) => row.internal_id),
    ]),
  ];
  if (ids.length === 0) return null;

  const itemsById = await ItemService.getManyItems(
    { type: 'id', data: ids.map(String) },
    { intent: 'card' }
  );

  const newWearables = newWearableRows
    .map((row) => itemsById[String(row.internal_id)])
    .filter((item): item is ItemV2For<'card'> => !!item && item.flags.includes('wearable'));

  const mallWearables = mallWearableRows
    .map((row) => itemsById[String(row.item_iid)])
    .filter((item): item is ItemV2For<'card'> => !!item && item.flags.includes('wearable'));

  const alsoNewPool = recentRows
    .map((row) => itemsById[String(row.internal_id)])
    .filter((item): item is ItemV2For<'card'> => !!item && item.type === 'nc');

  const popularity = popularityFromPageviews(
    [...newWearables, ...mallWearables, ...alsoNewPool],
    pageviews
  );

  const cover = pickMallCoverWearable(newWearables, mallWearables, popularity);
  if (!cover) return null;

  const alsoNew = rankAlsoNewThisWeek(alsoNewPool, cover.internal_id, popularity);

  const [extras, wearable] = await Promise.all([
    hasMallSaleBegin(cover)
      ? Promise.resolve({ foundIn: null, isLE: false })
      : resolveCoverFoundIn(cover.internal_id),
    getWearableData(cover.internal_id).catch(() => null),
  ]);

  const wearableZones = isWearableSummary(wearable) ? wearable.zone_label.filter(Boolean) : [];

  return {
    cover,
    alsoNew,
    foundIn: extras.foundIn,
    isLE: extras.isLE,
    wearableZones,
  };
}

function isWearableSummary(data: unknown): data is WearableData {
  return (
    !!data && typeof data === 'object' && 'zone_label' in data && Array.isArray(data.zone_label)
  );
}

export function getMallCoverStory() {
  return loadMallCoverStory();
}

export function getMallDiscountPercent(item: ItemV2For<'card'>): number | null {
  if (item.price?.type !== 'ncMall') return null;
  const { price, discountPrice } = item.price;
  // Bundles/sync often store discountPrice 0 to mean "no markdown" — same as mallNumericPrice.
  if (discountPrice === null || discountPrice <= 0 || price <= 0 || discountPrice >= price) {
    return null;
  }
  return Math.round((1 - discountPrice / price) * 100);
}

export function compareOnSaleItems(a: ItemV2For<'card'>, b: ItemV2For<'card'>): number {
  const percentDelta = (getMallDiscountPercent(b) ?? 0) - (getMallDiscountPercent(a) ?? 0);
  if (percentDelta !== 0) return percentDelta;
  return a.name.localeCompare(b.name);
}

export function pickDeepestCut(items: ItemV2For<'card'>[]): ItemV2For<'card'> | null {
  if (items.length === 0) return null;
  return [...items].sort(compareOnSaleItems)[0];
}

async function loadMallOnSale(): Promise<MallOnSale | null> {
  'use cache';
  cacheTag('mall-hub');
  cacheTag('home-latest-nc-mall');
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const nowMs = await getCachedNow();
  const nowDate = new Date(nowMs);

  const rows = await prisma.ncMallData.findMany({
    where: {
      active: true,
      discountPrice: { not: null },
      discountEnd: { gt: nowDate },
      AND: [
        { OR: [{ saleEnd: { gte: nowDate } }, { saleEnd: null }] },
        { OR: [{ discountBegin: { lte: nowDate } }, { discountBegin: null }] },
      ],
    },
    select: { item_iid: true, price: true, discountPrice: true },
    orderBy: { discountEnd: 'asc' },
    take: 100,
  });

  const discountedRows = rows.filter(
    (row) => row.discountPrice !== null && row.discountPrice > 0 && row.discountPrice < row.price
  );
  if (discountedRows.length === 0) return null;

  const itemsById = await ItemService.getManyItems(
    { type: 'id', data: discountedRows.map((row) => String(row.item_iid)) },
    { intent: 'card' }
  );

  const items = discountedRows
    .map((row) => itemsById[String(row.item_iid)])
    .filter((item): item is ItemV2For<'card'> => !!item && getMallDiscountPercent(item) !== null)
    .sort(compareOnSaleItems)
    .slice(0, ON_SALE_LIMIT);

  const deepestCut = pickDeepestCut(items);
  if (!deepestCut) return null;

  return { items, deepestCut };
}

export function getMallOnSale() {
  return loadMallOnSale();
}

export type MallLeavingEntry = {
  item: ItemV2For<'card'>;
  saleEndMs: number;
};

export type MallLeavingGroup = {
  label: string;
  saleEndMs: number;
  items: ItemV2For<'card'>[];
};

export type MallLeaving = {
  stripItems: ItemV2For<'card'>[];
  asideItems: ItemV2For<'card'>[];
};

export function mallNumericPrice(price: number, discountPrice: number | null): number {
  if (discountPrice !== null && discountPrice > 0 && discountPrice < price) return discountPrice;
  return price;
}

export function mallSortPrice(item: ItemV2For<'card'>): number {
  if (item.price?.type !== 'ncMall') return Number.POSITIVE_INFINITY;
  return mallNumericPrice(item.price.price, item.price.discountPrice);
}

export function compareLeavingEntries(a: MallLeavingEntry, b: MallLeavingEntry): number {
  const dayDelta = utcDayKey(a.saleEndMs).localeCompare(utcDayKey(b.saleEndMs));
  if (dayDelta !== 0) return dayDelta;
  const priceDelta = mallSortPrice(a.item) - mallSortPrice(b.item);
  if (priceDelta !== 0) return priceDelta;
  return a.saleEndMs - b.saleEndMs || a.item.name.localeCompare(b.item.name);
}

export function pickNextOut(entries: MallLeavingEntry[]): MallLeavingEntry | null {
  if (entries.length === 0) return null;
  return [...entries].sort(compareLeavingEntries)[0];
}

export function groupLeavingByLabel(
  entries: MallLeavingEntry[],
  labelFor: (saleEndMs: number) => string
): MallLeavingGroup[] {
  const groups: MallLeavingGroup[] = [];
  const indexByLabel = new Map<string, number>();

  for (const entry of [...entries].sort(compareLeavingEntries)) {
    const label = labelFor(entry.saleEndMs);
    const existing = indexByLabel.get(label);
    if (existing === undefined) {
      indexByLabel.set(label, groups.length);
      groups.push({ label, saleEndMs: entry.saleEndMs, items: [entry.item] });
    } else {
      groups[existing].items.push(entry.item);
    }
  }

  return groups;
}

async function loadMallLeaving(): Promise<MallLeaving | null> {
  'use cache';
  cacheTag('mall-hub');
  cacheTag('home-latest-nc-mall');
  cacheLife({ stale: 180, revalidate: 180, expire: 3600 });

  const nowMs = await getCachedNow();
  const nowDate = new Date(nowMs);

  const rows = await prisma.ncMallData.findMany({
    where: {
      active: true,
      saleEnd: { gte: nowDate },
    },
    select: { item_iid: true, saleEnd: true },
    orderBy: [{ saleEnd: 'asc' }, { price: 'asc' }],
    take: LEAVING_POOL_LIMIT,
  });

  const datedRows = rows.filter((row) => row.saleEnd);
  if (datedRows.length === 0) return null;

  const itemsById = await ItemService.getManyItems(
    { type: 'id', data: datedRows.map((row) => String(row.item_iid)) },
    { intent: 'card' }
  );

  const items = datedRows
    .map((row) => {
      const item = itemsById[String(row.item_iid)];
      if (!item || !row.saleEnd) return null;
      return { item, saleEndMs: row.saleEnd.getTime() };
    })
    .filter((entry): entry is MallLeavingEntry => entry !== null);

  if (items.length === 0) return null;

  return splitMallLeaving(items);
}

export function splitMallLeaving(entries: MallLeavingEntry[]): MallLeaving {
  const items = [...entries].sort(compareLeavingEntries);
  return {
    stripItems: items.slice(0, LEAVING_STRIP_LIMIT).map((entry) => entry.item),
    asideItems: items.slice(LEAVING_STRIP_LIMIT, LEAVING_FETCH_LIMIT).map((entry) => entry.item),
  };
}

export function getMallLeaving() {
  return loadMallLeaving();
}

export function filterActiveMallEvents(lists: UserList[], now: number): UserList[] {
  return lists.filter(
    (list) => hasNcMallOfficialTag(list) && !hasRetiredOfficialTag(list) && isEventActive(list, now)
  );
}

function listDateMs(value: string | null | undefined, empty: number): number {
  if (!value) return empty;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : empty;
}

/** Missing ends sort last; avoid Infinity - Infinity (NaN) which breaks Array.sort. */
const OPEN_SERIES_END_MS = Number.MAX_SAFE_INTEGER;

/** Series end soonest first (open-ended last), then newest series start, then most recently updated. */
export function compareMallEvents(a: UserList, b: UserList): number {
  const endDelta =
    listDateMs(a.seriesEnd, OPEN_SERIES_END_MS) - listDateMs(b.seriesEnd, OPEN_SERIES_END_MS);
  if (endDelta !== 0) return endDelta;

  const startDelta = listDateMs(b.seriesStart, 0) - listDateMs(a.seriesStart, 0);
  if (startDelta !== 0) return startDelta;

  return listDateMs(b.updatedAt, 0) - listDateMs(a.updatedAt, 0);
}

export function sortMallEvents(lists: UserList[]): UserList[] {
  return [...lists].sort(compareMallEvents);
}

async function loadMallEvents(): Promise<UserList[] | null> {
  'use cache';
  cacheTag('mall-hub-events');
  cacheTag('mall-hub');
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const now = await getCachedNow();
  const listService = ListService.init();
  const tagged = await listService.getOfficialListsCat('nc mall', EVENTS_FETCH_LIMIT);
  const active = sortMallEvents(filterActiveMallEvents(tagged, now)).slice(0, EVENTS_LIMIT);
  return active.length > 0 ? active : null;
}

export function getMallEvents() {
  return loadMallEvents();
}

export type MallLebronDirection = 'up' | 'down' | 'new';

export type MallLebronRange = {
  min: number;
  max: number;
};

export type MallLebronUpdate = {
  item: ItemV2For<'card'>;
  previousRange: string | null;
  newRange: string;
  direction: MallLebronDirection;
  pricedAt: string;
  isVolatile: boolean;
};

export function parseOwlsRange(value: string): MallLebronRange | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null') return null;
  const parts = trimmed.split('-').map((part) => Number(part.trim()));
  if (parts.length === 0 || parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 1) return { min: parts[0], max: parts[0] };
  return { min: parts[0], max: parts[1] };
}

export function mallLebronDirection(
  previousValue: string | null,
  newValue: string
): MallLebronDirection {
  const current = parseOwlsRange(newValue);
  if (!current) return 'new';
  if (previousValue === null) return 'new';
  const previous = parseOwlsRange(previousValue);
  if (!previous) return 'new';

  const currentMid = (current.min + current.max) / 2;
  const previousMid = (previous.min + previous.max) / 2;
  if (currentMid !== previousMid) return currentMid > previousMid ? 'up' : 'down';
  if (current.min !== previous.min) return current.min > previous.min ? 'up' : 'down';
  if (current.max !== previous.max) return current.max > previous.max ? 'up' : 'down';
  return 'new';
}

export function owlsRangesEqual(a: string, b: string): boolean {
  if (a.trim() === b.trim()) return true;
  const rangeA = parseOwlsRange(a);
  const rangeB = parseOwlsRange(b);
  if (!rangeA || !rangeB) return false;
  return rangeA.min === rangeB.min && rangeA.max === rangeB.max;
}

/** Same cap range restated (Lebron often re-touches `pricedAt` without a move). */
export function isUnchangedLebronValue(previousValue: string | null, newValue: string): boolean {
  if (previousValue === null) return false;
  return owlsRangesEqual(previousValue, newValue);
}

export function previousOwlsValueByIid(
  rows: { item_iid: number; value: string; pricedAt: Date }[]
): Map<number, string> {
  const byIid = new Map<number, string>();
  const sorted = [...rows].sort((a, b) => b.pricedAt.getTime() - a.pricedAt.getTime());
  for (const row of sorted) {
    if (!byIid.has(row.item_iid)) byIid.set(row.item_iid, row.value);
  }
  return byIid;
}

async function loadMallLebronUpdates(): Promise<MallLebronUpdate[] | null> {
  'use cache';
  cacheTag('mall-hub-lebron');
  cacheLife('homeFast');

  const latest = await prisma.owlsPrice.findMany({
    where: { isLatest: true },
    select: {
      item_iid: true,
      value: true,
      pricedAt: true,
      isVolatile: true,
    },
    orderBy: { pricedAt: 'desc' },
    take: LEBRON_FETCH_LIMIT,
  });

  if (latest.length === 0) return null;

  const iids = latest.map((row) => row.item_iid);
  const [archived, itemsById] = await Promise.all([
    prisma.owlsPrice.findMany({
      where: { item_iid: { in: iids }, isLatest: null },
      select: { item_iid: true, value: true, pricedAt: true },
      orderBy: { pricedAt: 'desc' },
    }),
    ItemService.getManyItems({ type: 'id', data: iids.map(String) }, { intent: 'card' }),
  ]);

  const previousByIid = previousOwlsValueByIid(archived);
  const updates: MallLebronUpdate[] = [];

  for (const row of latest) {
    if (updates.length >= LEBRON_LIMIT) break;
    const item = itemsById[String(row.item_iid)];
    if (!item || !parseOwlsRange(row.value)) continue;
    const previousRange = previousByIid.get(row.item_iid) ?? null;
    if (isUnchangedLebronValue(previousRange, row.value)) continue;
    updates.push({
      item,
      previousRange,
      newRange: row.value,
      direction: mallLebronDirection(previousRange, row.value),
      pricedAt: row.pricedAt.toISOString(),
      isVolatile: row.isVolatile,
    });
  }

  return updates.length > 0 ? updates : null;
}

export function getMallLebronUpdates() {
  return loadMallLebronUpdates();
}

async function loadMallPopularNc(): Promise<ItemV2For<'card'>[] | null> {
  'use cache';
  cacheTag('home-trending-items');
  cacheLife('homeSlow');

  const trending = await ItemService.getTrending(POPULAR_NC_TRENDING_POOL).catch(() => []);
  const items = trending.filter((item) => item.type === 'nc').slice(0, POPULAR_NC_LIMIT);
  return items.length > 0 ? items : null;
}

export function getMallPopularNc() {
  return loadMallPopularNc();
}

async function loadMallCapsules(): Promise<ItemV2For<'card'>[] | null> {
  'use cache';
  cacheTag('mall-hub');
  cacheTag('home-latest-nc-mall');
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const nowMs = await getCachedNow();
  const nowDate = new Date(nowMs);

  const rows = await prisma.ncMallData.findMany({
    where: {
      ...activeMallWhere(nowDate),
      item: {
        canOpen: 'true',
        type: 'nc',
        canonical_id: null,
        NOT: { name: { contains: 'bundle' } },
      },
    },
    select: { item_iid: true },
    orderBy: { saleBegin: 'desc' },
    take: CAPSULES_LIMIT,
  });

  if (rows.length === 0) return null;

  const itemsById = await ItemService.getManyItems(
    { type: 'id', data: rows.map((row) => String(row.item_iid)) },
    { intent: 'card' }
  );

  const items = rows
    .map((row) => itemsById[String(row.item_iid)])
    .filter(
      (item): item is ItemV2For<'card'> => !!item && !item.name.toLowerCase().includes('bundle')
    );

  return items.length > 0 ? items : null;
}

export function getMallCapsules() {
  return loadMallCapsules();
}

export type MallMonthlyHighlightKind =
  | 'nc-collectible'
  | 'premium-collectible'
  | 'dyeworks'
  | 'gbc';

export type MallMonthlyHighlight = {
  kind: MallMonthlyHighlightKind;
  item: ItemV2For<'card'>;
  highlightedAt: string;
  listSlug: string | null;
  listHref: string | null;
  listLabel: string | null;
};

export type MallMonthlyHighlights = {
  ncCollectible: MallMonthlyHighlight | null;
  premiumCollectible: MallMonthlyHighlight | null;
  dyeworks: MallMonthlyHighlight | null;
  gbc: MallMonthlyHighlight | null;
};

export const MALL_GBC_NAME_MATCH = 'Gift Box Mystery Capsule';

type MonthlyListMeta = {
  id: number;
  slug: string;
  name: string;
};

type MembershipRow = {
  item_iid: number;
  highlightedAt: Date;
};

/** Prefer a wearable from the latest Dyeworks cohort; otherwise the first resolved card. */
export function pickDyeworksFeaturedItem(
  rows: MembershipRow[],
  itemsById: Record<string, ItemV2For<'card'> | undefined>
): { item: ItemV2For<'card'>; highlightedAt: Date } | null {
  const resolved: { item: ItemV2For<'card'>; highlightedAt: Date }[] = [];
  for (const row of rows) {
    const item = itemsById[String(row.item_iid)];
    if (item) resolved.push({ item, highlightedAt: row.highlightedAt });
  }
  if (resolved.length === 0) return null;
  return resolved.find((entry) => entry.item.flags.includes('wearable')) ?? resolved[0];
}

function membershipHighlightDate(row: { seriesStart: Date | null; addedAt: Date }): Date {
  return row.seriesStart ?? row.addedAt;
}

async function loadLatestCollectibleMembership(listId: number): Promise<MembershipRow | null> {
  const row = await prisma.listItems.findFirst({
    where: { list_id: listId, isHidden: false },
    orderBy: { addedAt: 'desc' },
    select: { item_iid: true, addedAt: true, seriesStart: true },
  });
  if (!row) return null;
  return { item_iid: row.item_iid, highlightedAt: membershipHighlightDate(row) };
}

async function loadLatestDyeworksMemberships(limit = 24): Promise<MembershipRow[]> {
  const rows = await prisma.listItems.findMany({
    where: { list_id: DYEWORKS_CURRENT_LIST_ID, isHidden: false },
    orderBy: [{ seriesStart: 'desc' }, { addedAt: 'desc' }],
    take: limit,
    select: { item_iid: true, addedAt: true, seriesStart: true },
  });
  return rows.map((row) => ({
    item_iid: row.item_iid,
    highlightedAt: membershipHighlightDate(row),
  }));
}

/** Active NC Mall GBC — newest Items.addedAt wins when several match. */
async function loadCurrentGbcMembership(nowDate: Date): Promise<MembershipRow | null> {
  const row = await prisma.ncMallData.findFirst({
    where: {
      ...activeMallWhere(nowDate),
      item: {
        type: 'nc',
        canonical_id: null,
        name: { contains: MALL_GBC_NAME_MATCH },
      },
    },
    select: {
      item_iid: true,
      item: { select: { addedAt: true } },
    },
    orderBy: { item: { addedAt: 'desc' } },
  });
  if (!row) return null;
  return { item_iid: row.item_iid, highlightedAt: row.item.addedAt };
}

function monthlyListHref(meta: MonthlyListMeta): string {
  return getListLink({
    internal_id: meta.id,
    slug: meta.slug,
    official: true,
    dynamicType: null,
    owner: { username: 'official' },
  } as UserList);
}

function monthlyHighlightFromMembership(
  kind: Exclude<MallMonthlyHighlightKind, 'gbc'>,
  row: MembershipRow | null,
  meta: MonthlyListMeta | undefined,
  item: ItemV2For<'card'> | undefined
): MallMonthlyHighlight | null {
  if (!row || !meta || !item) return null;
  return {
    kind,
    item,
    highlightedAt: row.highlightedAt.toISOString(),
    listSlug: meta.slug,
    listHref: monthlyListHref(meta),
    listLabel: meta.name,
  };
}

async function loadMallMonthlyHighlights(): Promise<MallMonthlyHighlights | null> {
  'use cache';
  cacheTag('mall-hub');
  cacheTag('home-latest-nc-mall');
  cacheTag(listItemsTag('official', MALL_NC_COLLECTIBLE_LIST_ID, 'preload'));
  cacheTag(listItemsTag('official', MALL_PREMIUM_COLLECTIBLE_LIST_ID, 'preload'));
  cacheTag(listItemsTag('official', DYEWORKS_CURRENT_LIST_ID, 'preload'));
  cacheLife({ stale: 600, revalidate: 600, expire: 3600 });

  const nowMs = await getCachedNow();
  const nowDate = new Date(nowMs);

  const listIds = [
    MALL_NC_COLLECTIBLE_LIST_ID,
    MALL_PREMIUM_COLLECTIBLE_LIST_ID,
    DYEWORKS_CURRENT_LIST_ID,
  ] as const;

  const [lists, ncRow, premiumRow, dyeworksRows, gbcRow] = await Promise.all([
    prisma.userList.findMany({
      where: { internal_id: { in: [...listIds] }, official: true },
      select: { internal_id: true, slug: true, name: true },
    }),
    loadLatestCollectibleMembership(MALL_NC_COLLECTIBLE_LIST_ID),
    loadLatestCollectibleMembership(MALL_PREMIUM_COLLECTIBLE_LIST_ID),
    loadLatestDyeworksMemberships(),
    loadCurrentGbcMembership(nowDate),
  ]);

  const metaById = new Map<number, MonthlyListMeta>();
  for (const list of lists) {
    if (!list.slug) continue;
    metaById.set(list.internal_id, {
      id: list.internal_id,
      slug: list.slug,
      name: list.name,
    });
  }

  const ncMeta = metaById.get(MALL_NC_COLLECTIBLE_LIST_ID);
  const premiumMeta = metaById.get(MALL_PREMIUM_COLLECTIBLE_LIST_ID);
  const dyeworksMeta = metaById.get(DYEWORKS_CURRENT_LIST_ID);

  const iids = [
    ...(ncRow ? [ncRow.item_iid] : []),
    ...(premiumRow ? [premiumRow.item_iid] : []),
    ...dyeworksRows.map((row) => row.item_iid),
    ...(gbcRow ? [gbcRow.item_iid] : []),
  ];
  if (iids.length === 0) return null;

  const uniqueIids = [...new Set(iids)];
  const itemsById = await ItemService.getManyItems(
    { type: 'id', data: uniqueIids.map(String) },
    { intent: 'card' }
  );

  const dyeworksPick = pickDyeworksFeaturedItem(dyeworksRows, itemsById);
  const gbcItem = gbcRow ? itemsById[String(gbcRow.item_iid)] : undefined;

  const highlights: MallMonthlyHighlights = {
    ncCollectible: monthlyHighlightFromMembership(
      'nc-collectible',
      ncRow,
      ncMeta,
      ncRow ? itemsById[String(ncRow.item_iid)] : undefined
    ),
    premiumCollectible: monthlyHighlightFromMembership(
      'premium-collectible',
      premiumRow,
      premiumMeta,
      premiumRow ? itemsById[String(premiumRow.item_iid)] : undefined
    ),
    dyeworks:
      dyeworksPick && dyeworksMeta
        ? {
            kind: 'dyeworks',
            item: dyeworksPick.item,
            highlightedAt: dyeworksPick.highlightedAt.toISOString(),
            listSlug: dyeworksMeta.slug,
            listHref: monthlyListHref(dyeworksMeta),
            listLabel: dyeworksMeta.name,
          }
        : null,
    gbc:
      gbcRow && gbcItem
        ? {
            kind: 'gbc',
            item: gbcItem,
            highlightedAt: gbcRow.highlightedAt.toISOString(),
            listSlug: null,
            listHref: null,
            listLabel: null,
          }
        : null,
  };

  if (
    !highlights.ncCollectible &&
    !highlights.premiumCollectible &&
    !highlights.dyeworks &&
    !highlights.gbc
  ) {
    return null;
  }

  return highlights;
}

export function getMallMonthlyHighlights() {
  return loadMallMonthlyHighlights();
}
