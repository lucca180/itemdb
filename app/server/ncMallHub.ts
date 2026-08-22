import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@utils/prisma';
import { getCachedNow } from '@utils/getCachedNow';
import { ItemService } from '@services/ItemService';
import { getItemParent } from '@pages/api/v1/items/[id_name]/drops';
import { filterOfficialLists, getItemLists } from '@pages/api/v1/items/[id_name]/lists';
import { getWearableData } from '@pages/api/v1/items/[id_name]/wearable';
import { getListLink } from '@utils/list/listLink';
import type { ItemV2For, UserList, WearableData } from '@types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ALSO_NEW_LIMIT = 12;
const ON_SALE_LIMIT = 24;

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

function pickOfficialList(lists: UserList[]): UserList | null {
  const official = filterOfficialLists(lists).filter(
    (list) => list.visibility === 'public' && !list.officialTag.includes('Avatar')
  );
  if (official.length === 0) return null;

  const ncMall = official.find((list) =>
    list.officialTag.some((tag) => tag.toLowerCase() === 'nc mall')
  );
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

  const [newWearableRows, mallWearableRows, recentRows, trending] = await Promise.all([
    prisma.items.findMany({
      where: {
        type: 'nc',
        isWearable: true,
        canonical_id: null,
        OR: [{ addedAt: { gte: weekAgo } }, { releaseDate: { gte: weekAgo } }],
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
    prisma.ncMallData.findMany({
      where: {
        ...activeMall,
        saleBegin: { gte: weekAgo },
      },
      select: { item_iid: true },
      orderBy: { saleBegin: 'desc' },
      take: 24,
    }),
    ItemService.getTrending(50).catch(() => [] as ItemV2For<'card'>[]),
  ]);

  const ids = [
    ...new Set([
      ...newWearableRows.map((row) => row.internal_id),
      ...mallWearableRows.map((row) => row.item_iid),
      ...recentRows.map((row) => row.item_iid),
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

  const popularity = new Map(
    trending.map((item, index) => [item.internal_id, trending.length - index])
  );

  const cover = pickMallCoverWearable(newWearables, mallWearables, popularity);
  if (!cover) return null;

  const alsoNew = recentRows
    .map((row) => itemsById[String(row.item_iid)])
    .filter((item): item is ItemV2For<'card'> => !!item && item.internal_id !== cover.internal_id)
    .slice(0, ALSO_NEW_LIMIT);

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
  if (discountPrice === null || price <= 0 || discountPrice >= price) return null;
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
    (row) => row.discountPrice !== null && row.discountPrice < row.price
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
