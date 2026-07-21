/**
 * Sole authorized module for mutating `ListItems` rows.
 *
 * Every exported write runs inside a transaction and refreshes `UserList.visibleItemCount`
 * via {@link countSql} so the cached count stays consistent with non-hidden items.
 */
import { UTCDate } from '@date-fns/utc';
import { Prisma } from '@prisma/generated/client';
import type { ListItemInfo } from '@types';
import { countSql } from '@services/list/listCount';
import { invalidateListItemIds } from '@services/list/listItemsV2Cache';
import prisma from '@utils/prisma';

type DbClient = typeof prisma | Prisma.TransactionClient;

/** Payload for bulk PUT upserts (`item_iid` and numeric fields arrive as strings from the API). */
export type PutListItemInput = {
  item_iid: string;
  capValue: string | undefined;
  amount: string | undefined;
  imported: boolean;
};

type ListItemRow = {
  list_id: number;
  item_iid: number;
  capValue?: number | null;
  isHighlight?: boolean;
  isHidden?: boolean;
  amount?: number;
  seriesStart?: Date | string | null;
  seriesEnd?: Date | string | null;
};

/** Batch mutations applied by dynamic list sync in a single transaction. */
export type DynamicItemChanges = {
  create?: ListItemRow[];
  deleteByInternalId?: number[];
  deleteByIid?: number[];
};

/**
 * Runs a write callback inside `$transaction`, then recalculates `visibleItemCount`
 * for every affected list (deduplicated).
 */
async function withItemWrite<T>(
  listIds: number[],
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const uniqueListIds = [...new Set(listIds)];
  const result = await prisma.$transaction(async (tx) => {
    const writeResult = await fn(tx);
    for (const listId of uniqueListIds) {
      await countSql(listId, tx);
    }
    return writeResult;
  });
  // API list-id Redis cache only — run after commit so readers never see stale membership.
  await invalidateListItemIds(uniqueListIds);
  return result;
}

/** Bumps `UserList.updatedAt` after an item mutation. */
async function touchList(listId: number, tx: DbClient) {
  return tx.userList.update({
    where: { internal_id: listId },
    data: { updatedAt: new Date() },
  });
}

/**
 * Updates metadata on existing list items (POST `action=update`).
 *
 * Mutates cap value, order, highlight/hidden flags, amount, and series dates.
 * Does not change `list_id` or `item_iid`.
 *
 * @param listId - Target list `internal_id`.
 * @param items - Rows identified by `internal_id`; only provided fields are written.
 */
export async function updateItems(listId: number, items: ListItemInfo[]) {
  await withItemWrite([listId], async (tx) => {
    await Promise.all(
      items.map((item) =>
        tx.listItems.updateMany({
          where: { internal_id: item.internal_id, list_id: listId },
          data: {
            capValue: item.capValue,
            updatedAt: new Date(),
            order: item.order,
            isHighlight: item.isHighlight,
            isHidden: item.isHidden,
            amount: item.amount,
            seriesStart: item.seriesStart
              ? new UTCDate(new UTCDate(item.seriesStart).setHours(18))
              : null,
            seriesEnd: item.seriesEnd
              ? new UTCDate(new UTCDate(item.seriesEnd).setHours(18))
              : null,
          },
        })
      )
    );
  });
}

/**
 * Hard-deletes list items by row `internal_id` (POST `action=delete`).
 *
 * @param listId - Source list; used for count refresh and `updatedAt`.
 * @param internalIds - `ListItems.internal_id` values to remove.
 * @returns Prisma `deleteMany` result (e.g. `count` of deleted rows).
 */
export async function deleteItemsByInternalId(listId: number, internalIds: number[]) {
  return withItemWrite([listId], async (tx) => {
    const deleteResult = await tx.listItems.deleteMany({
      where: { internal_id: { in: internalIds }, list_id: listId },
    });
    await touchList(listId, tx);
    return deleteResult;
  });
}

/**
 * Copies items into another list, optionally removing them from the source (POST move/copy).
 *
 * Uses `createMany` with `skipDuplicates` on the destination. When `move` is true, deletes
 * the source rows by `internal_id` and refreshes counts on both lists.
 *
 * @returns Prisma `createMany` result from the destination insert.
 */
export async function moveOrCopyItems({
  sourceListId,
  destListId,
  items,
  move,
}: {
  sourceListId: number;
  destListId: number;
  items: ListItemInfo[];
  move: boolean;
}) {
  const listIds = move ? [destListId, sourceListId] : [destListId];
  const ids = items.map((item) => item.internal_id);

  return withItemWrite(listIds, async (tx) => {
    const createResult = await tx.listItems.createMany({
      data: items.map((item) => ({
        list_id: destListId,
        item_iid: item.item_iid,
        capValue: item.capValue,
        isHighlight: item.isHighlight,
        isHidden: item.isHidden,
        amount: item.amount,
        seriesStart: item.seriesStart,
        seriesEnd: item.seriesEnd,
      })),
      skipDuplicates: true,
    });

    if (move) {
      await tx.listItems.deleteMany({
        where: { internal_id: { in: ids }, list_id: sourceListId },
      });
    }

    await tx.userList.updateMany({
      where: { internal_id: { in: move ? [destListId, sourceListId] : [destListId] } },
      data: { updatedAt: new Date() },
    });

    return createResult;
  });
}

/**
 * Bulk upserts items via raw SQL (HTTP PUT on list items).
 *
 * Inserts new rows or updates `capValue`, `amount`, `imported`, and `updatedAt` on duplicate
 * `(list_id, item_iid)`. No-op when `items` is empty.
 *
 * @returns `true` when rows were written, `null` when there was nothing to upsert.
 */
export async function upsertItems(listId: number, items: PutListItemInput[]) {
  const upsertQuery = buildBulkListItemsUpsertQuery(listId, items);
  if (!upsertQuery) return null;

  return withItemWrite([listId], async (tx) => {
    await tx.$executeRaw(upsertQuery);
    await touchList(listId, tx);
    return true;
  });
}

/**
 * Soft-hides items by game `item_iid` (DELETE with `hide=true`).
 *
 * Sets `isHidden = true`; rows remain in the table and are excluded from `visibleItemCount`.
 */
export async function hideItems(listId: number, itemIids: number[]) {
  return withItemWrite([listId], async (tx) => {
    await tx.listItems.updateMany({
      where: { list_id: listId, item_iid: { in: itemIids } },
      data: { isHidden: true },
    });
    await touchList(listId, tx);
  });
}

/**
 * Permanently removes items by game `item_iid` (DELETE with `hide=false`).
 *
 * Unlike {@link hideItems}, rows are deleted from `ListItems`.
 */
export async function removeItems(listId: number, itemIids: number[]) {
  return withItemWrite([listId], async (tx) => {
    await tx.listItems.deleteMany({
      where: { list_id: listId, item_iid: { in: itemIids } },
    });
    await touchList(listId, tx);
  });
}

/**
 * Applies batched create/delete operations for dynamic list sync.
 *
 * Runs all mutations and a single {@link countSql} refresh in one transaction.
 * Empty or omitted change arrays are skipped.
 *
 * @param listId - List receiving creates and `deleteByIid` removals.
 * @param changes - Optional `create`, `deleteByInternalId`, and `deleteByIid` batches.
 */
export async function applyDynamicItemChanges(listId: number, changes: DynamicItemChanges) {
  const creates = changes.create ?? [];
  const deleteByInternalId = changes.deleteByInternalId ?? [];
  const deleteByIid = changes.deleteByIid ?? [];

  if (!creates.length && !deleteByInternalId.length && !deleteByIid.length) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (creates.length) {
      await tx.listItems.createMany({ data: creates });
    }
    if (deleteByInternalId.length) {
      await tx.listItems.deleteMany({
        where: { internal_id: { in: deleteByInternalId }, list_id: listId },
      });
    }
    if (deleteByIid.length) {
      await tx.listItems.deleteMany({
        where: { list_id: listId, item_iid: { in: deleteByIid } },
      });
    }
    await countSql(listId, tx);
  });
  await invalidateListItemIds([listId]);
}

/** Builds a parameterized `INSERT … ON DUPLICATE KEY UPDATE` for {@link upsertItems}. */
function buildBulkListItemsUpsertQuery(listId: number, items: PutListItemInput[]) {
  if (items.length === 0) return null;

  const values = items.map((item) => {
    return Prisma.sql`(
      ${listId},
      ${Number(item.item_iid)},
      ${item.capValue ? Number(item.capValue) : 0},
      ${item.amount ? Number(item.amount) : 1},
      ${item.imported ?? false},
      NOW()
    )`;
  });

  return Prisma.sql`
    INSERT INTO ListItems (
      list_id,
      item_iid,
      capValue,
      amount,
      imported,
      updatedAt
    )
    VALUES ${Prisma.join(values)}
    ON DUPLICATE KEY UPDATE
      capValue = COALESCE(VALUES(capValue), capValue),
      amount = COALESCE(VALUES(amount), amount),
      imported = VALUES(imported),
      updatedAt = NOW()
  `;
}
