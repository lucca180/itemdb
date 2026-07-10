import 'server-only';

import { ItemPrices, Prisma } from '@prisma/generated/client';
import { isValid } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { getManyItems } from '@pages/api/v1/items/many';
import { getItemDrops } from '@pages/api/v1/items/[id_name]/drops';
import prisma from '@utils/prisma';
import { ItemData, UserList } from '@types';
import {
  MAX_PRICE_CONTEXT_ITEM_IDS,
  MAX_PRICE_CONTEXT_LENGTH,
  parseBulkItemIdentifiers,
  type PriceContextDropPool,
  type PriceContextPreviewRow,
} from './priceContextShared';

export {
  MAX_PRICE_CONTEXT_ITEM_IDS,
  MAX_PRICE_CONTEXT_LENGTH,
  parseBulkItemIdentifiers,
  type PriceContextDropPool,
  type PriceContextPreviewRow,
} from './priceContextShared';

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
  | {
      source: 'bulk';
      identifiers?: unknown;
      text?: unknown;
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

export type PriceContextApplyResult = {
  updated: number;
  skipped: number;
  operation: PriceContextOperation;
  rows: PriceContextPreviewRow[];
};

export type PriceContextOperation = 'set' | 'clear';

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

export type PriceContextBulkSourceResult = {
  items: Record<number, ItemData>;
  notFound: string[];
};

export async function loadPriceContextBulkSourceItems(
  body: Extract<PriceContextItemSourceRequest, { source: 'bulk' }>
): Promise<PriceContextBulkSourceResult> {
  const identifiers = normalizeBulkIdentifiers(body);
  return loadBulkIdentifierItems(identifiers);
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
  if (itemIds.length > MAX_PRICE_CONTEXT_ITEM_IDS) {
    throw new PriceContextInputError(`Too many item IDs (max ${MAX_PRICE_CONTEXT_ITEM_IDS})`);
  }

  return itemIds;
}

export function normalizeStartDate(value: unknown) {
  if (typeof value !== 'string' || !value) throw new PriceContextInputError('Invalid startDate');
  if (!isValid(new Date(value))) throw new PriceContextInputError('Invalid startDate');

  return new UTCDate(new UTCDate(value).setHours(18));
}

export function normalizePriceContext(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new PriceContextInputError('Invalid priceContext');
  }

  const trimmed = value.trim();
  if (trimmed.length > MAX_PRICE_CONTEXT_LENGTH) {
    throw new PriceContextInputError(`priceContext exceeds ${MAX_PRICE_CONTEXT_LENGTH} characters`);
  }

  return trimmed;
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

function normalizeBulkIdentifiers(
  body: Extract<PriceContextItemSourceRequest, { source: 'bulk' }>
) {
  const identifiers =
    typeof body.text === 'string'
      ? parseBulkItemIdentifiers(body.text)
      : Array.isArray(body.identifiers)
        ? [...new Set(body.identifiers.map((value) => String(value).trim()).filter(Boolean))]
        : [];

  if (!identifiers.length) throw new PriceContextInputError('No valid item identifiers');
  if (identifiers.length > MAX_PRICE_CONTEXT_ITEM_IDS) {
    throw new PriceContextInputError(`Too many identifiers (max ${MAX_PRICE_CONTEXT_ITEM_IDS})`);
  }

  return identifiers;
}

async function loadBulkIdentifierItems(
  identifiers: string[]
): Promise<PriceContextBulkSourceResult> {
  const ids: string[] = [];
  const names: string[] = [];

  for (const identifier of identifiers) {
    const id = normalizeId(identifier);
    if (id) ids.push(String(id));
    else names.push(identifier);
  }

  const [itemsById, itemsByName] = await Promise.all([
    ids.length ? getManyItems({ id: ids }) : Promise.resolve({} as Record<string, ItemData>),
    names.length ? getManyItems({ name: names }) : Promise.resolve({} as Record<string, ItemData>),
  ]);

  const merged: Record<number, ItemData> = {};
  for (const item of [...Object.values(itemsById), ...Object.values(itemsByName)]) {
    merged[item.internal_id] = item;
  }

  const notFound = identifiers.filter((identifier) => {
    const id = normalizeId(identifier);
    if (id) return !itemsById[String(id)];
    return !itemsByName[identifier];
  });

  return { items: merged, notFound };
}

async function getFirstPricesAfterDate(
  itemIds: number[],
  startDate: Date,
  onlyInflationAlerts: boolean
) {
  if (!itemIds.length) return new Map<number, FirstPriceAfterDateRow>();

  const rows = await prisma.$queryRaw<FirstPriceAfterDateRow[]>`
    SELECT
      ranked.internal_id,
      ranked.item_iid,
      ranked.price,
      ranked.addedAt,
      ranked.priceContext,
      ranked.noInflation_id
    FROM (
      SELECT
        internal_id,
        item_iid,
        price,
        addedAt,
        priceContext,
        noInflation_id,
        ROW_NUMBER() OVER (
          PARTITION BY item_iid
          ORDER BY addedAt ASC, internal_id ASC
        ) AS rn
      FROM ItemPrices
      WHERE item_iid IN (${Prisma.join(itemIds)})
        AND addedAt >= ${startDate}
        AND (${onlyInflationAlerts ? 1 : 0} = 0 OR noInflation_id IS NOT NULL)
    ) AS ranked
    WHERE ranked.rn = 1
  `;

  const firstPriceByItem = new Map<number, FirstPriceAfterDateRow>();

  for (const row of rows) {
    if (!row.item_iid) continue;
    firstPriceByItem.set(row.item_iid, row);
  }

  return firstPriceByItem;
}

type FirstPriceAfterDateRow = Pick<
  ItemPrices,
  'internal_id' | 'item_iid' | 'price' | 'addedAt' | 'priceContext' | 'noInflation_id'
>;

function serializePrice(price: FirstPriceAfterDateRow) {
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
