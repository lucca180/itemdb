import { ItemPrices } from '@prisma/generated/client';
import { getManyItems } from '@pages/api/v1/items/many';
import { getItemDrops } from '@pages/api/v1/items/[id_name]/drops';
import prisma from '@utils/prisma';
import { ItemData, UserList } from '@types';

export type PriceContextItemSourceRequest =
  | {
      source: 'list';
      listId?: number;
      selectedList?: UserList;
    }
  | {
      source: 'drops';
      parentItemId: number;
      prizePool?: string;
    }
  | PriceContextDropPoolRequest;

export type PriceContextDropPoolRequest = {
  source: 'dropPools';
  parentItemId: number;
};

export type PriceContextPreviewRequest = {
  itemIds?: unknown;
  startDate?: unknown;
  onlyInflationAlerts?: unknown;
};

export type PriceContextApplyRequest = PriceContextPreviewRequest & {
  priceContext?: unknown;
  operation?: unknown;
};

export type PriceContextPreviewRow = {
  itemId: number;
  item: ItemData | null;
  price: {
    internal_id: number;
    price: number;
    addedAt: string;
    priceContext: string | null;
    inflated: boolean;
  } | null;
  skippedReason:
    | 'no-price-after-start-date'
    | 'no-inflation-price-after-start-date'
    | 'item-not-found'
    | null;
};

export type PriceContextApplyResult = {
  updated: number;
  skipped: number;
  operation: PriceContextOperation;
  rows: PriceContextPreviewRow[];
};

export type PriceContextOperation = 'set' | 'clear';

export type PriceContextDropPool = {
  name: string;
  itemCount: number;
  openings: number;
  totalDrops: number;
  minDrop: number;
  maxDrop: number;
};

export async function loadPriceContextSourceItems(body: PriceContextItemSourceRequest) {
  if (body.source === 'list') {
    const listId = normalizeListId(body.listId ?? body.selectedList?.internal_id);
    if (!listId) throw new PriceContextInputError('Invalid list_id');

    const listItems = await prisma.listItems.findMany({
      where: {
        list_id: listId,
        isHidden: false,
      },
      select: {
        item_iid: true,
      },
      orderBy: {
        addedAt: 'asc',
      },
    });

    return getItemsByIds(listItems.map((item) => item.item_iid));
  }

  if (body.source === 'drops') {
    const parentItemId = normalizeId(body.parentItemId);
    if (!parentItemId) throw new PriceContextInputError('Invalid parent item');

    const itemDrops = await getItemDrops(parentItemId);
    if (!itemDrops) return {};

    const poolName = body.prizePool?.trim();
    const itemIds = Object.values(itemDrops.drops)
      .filter((drop) => !poolName || drop.pool === poolName)
      .map((drop) => drop.item_iid);

    return getItemsByIds(itemIds);
  }

  throw new PriceContextInputError('Invalid source');
}

export async function loadPriceContextDropPools(
  parentItemId: number
): Promise<PriceContextDropPool[]> {
  const normalizedParentItemId = normalizeId(parentItemId);
  if (!normalizedParentItemId) throw new PriceContextInputError('Invalid parent item');

  const itemDrops = await getItemDrops(normalizedParentItemId);
  if (!itemDrops) return [];

  return Object.values(itemDrops.pools)
    .map((pool) => ({
      name: pool.name,
      itemCount: new Set(pool.items).size,
      openings: pool.openings,
      totalDrops: pool.totalDrops,
      minDrop: pool.minDrop,
      maxDrop: pool.maxDrop,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function previewPriceContextTargets(
  body: PriceContextPreviewRequest
): Promise<PriceContextPreviewRow[]> {
  const itemIds = normalizeItemIds(body.itemIds);
  const startDate = normalizeStartDate(body.startDate);
  const onlyInflationAlerts = body.onlyInflationAlerts === true;
  const [itemsById, pricesByItemId] = await Promise.all([
    getItemsByIds(itemIds),
    getFirstPricesAfterDate(itemIds, startDate, onlyInflationAlerts),
  ]);

  return itemIds.map((itemId) => {
    const item = itemsById[itemId] ?? null;
    const price = pricesByItemId.get(itemId) ?? null;

    return {
      itemId,
      item,
      price: price ? serializePrice(price) : null,
      skippedReason: !item
        ? 'item-not-found'
        : price
          ? null
          : onlyInflationAlerts
            ? 'no-inflation-price-after-start-date'
            : 'no-price-after-start-date',
    };
  });
}

export async function applyPriceContext(
  body: PriceContextApplyRequest
): Promise<PriceContextApplyResult> {
  const operation = normalizePriceContextOperation(body.operation);
  const priceContext = operation === 'clear' ? null : normalizePriceContext(body.priceContext);
  const rows = await previewPriceContextTargets(body);
  const priceIds = rows.flatMap((row) => (row.price ? [row.price.internal_id] : []));

  if (priceIds.length) {
    await prisma.itemPrices.updateMany({
      where: {
        internal_id: {
          in: priceIds,
        },
      },
      data: {
        priceContext,
      },
    });
  }

  return {
    updated: priceIds.length,
    skipped: rows.length - priceIds.length,
    operation,
    rows,
  };
}

export function normalizeItemIds(value: unknown) {
  if (!Array.isArray(value)) throw new PriceContextInputError('Invalid itemIds');

  const itemIds = [...new Set(value.map(normalizeId).filter(Boolean) as number[])];
  if (!itemIds.length) throw new PriceContextInputError('No valid item IDs');

  return itemIds;
}

export function normalizeStartDate(value: unknown) {
  if (typeof value !== 'string' || !value) throw new PriceContextInputError('Invalid startDate');

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new PriceContextInputError('Invalid startDate');

  return date;
}

export function normalizePriceContext(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new PriceContextInputError('Invalid priceContext');
  }

  return value.trim();
}

export function normalizePriceContextOperation(value: unknown): PriceContextOperation {
  if (value === undefined || value === null || value === 'set') return 'set';
  if (value === 'clear') return 'clear';

  throw new PriceContextInputError('Invalid operation');
}

export class PriceContextInputError extends Error {}

async function getItemsByIds(itemIds: number[]) {
  const ids = [...new Set(itemIds.map(String))];
  if (!ids.length) return {} as Record<number, ItemData>;

  const items = await getManyItems({ id: ids });
  return items as Record<number, ItemData>;
}

async function getFirstPricesAfterDate(
  itemIds: number[],
  startDate: Date,
  onlyInflationAlerts: boolean
) {
  const prices = await prisma.itemPrices.findMany({
    where: {
      item_iid: {
        in: itemIds,
      },
      addedAt: {
        gte: startDate,
      },
      noInflation_id: onlyInflationAlerts
        ? {
            not: null,
          }
        : undefined,
    },
    orderBy: [
      {
        item_iid: 'asc',
      },
      {
        addedAt: 'asc',
      },
    ],
  });

  const firstPriceByItem = new Map<number, ItemPrices>();

  for (const price of prices) {
    if (!price.item_iid || firstPriceByItem.has(price.item_iid)) continue;
    firstPriceByItem.set(price.item_iid, price);
  }

  return firstPriceByItem;
}

function serializePrice(price: ItemPrices) {
  return {
    internal_id: price.internal_id,
    price: Number(price.price),
    addedAt: price.addedAt.toJSON(),
    priceContext: price.priceContext,
    inflated: !!price.noInflation_id,
  };
}

function normalizeListId(value: unknown) {
  return normalizeId(value);
}

function normalizeId(value: unknown) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}
