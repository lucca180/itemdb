import { Prisma } from '@prisma/generated/client';
import type { UserList as RawList } from '@prisma/generated/client';
import pMap from 'p-map';
import prisma from '@utils/prisma';

type DbClient = typeof prisma | Prisma.TransactionClient;

const COUNT_CONCURRENCY = 5;

/** SQL update that recalculates `visibleItemCount` from non-hidden list items. Use inside `$transaction`. */
export function countSql(listId: number, tx: DbClient = prisma) {
  return tx.$executeRaw`
    UPDATE UserList SET visibleItemCount = (
      SELECT COUNT(*) FROM ListItems WHERE list_id = ${listId} AND isHidden = 0
    )
    WHERE internal_id = ${listId}
  `;
}

/** Recalculates and persists `visibleItemCount` for one list. Returns the new count. */
export async function updateCount(listId: number, tx: DbClient = prisma) {
  await countSql(listId, tx);

  const list = await tx.userList.findUnique({
    where: { internal_id: listId },
    select: { visibleItemCount: true },
  });

  return list?.visibleItemCount ?? 0;
}

/** Like `updateCount`, for multiple lists. Sequential when `tx` is a transaction client. */
export async function updateCounts(listIds: number[], tx: DbClient = prisma) {
  const unique = [...new Set(listIds)];

  if (tx !== prisma) {
    const counts: number[] = [];
    for (const id of unique) counts.push(await updateCount(id, tx));
    return counts;
  }

  return pMap(unique, (id) => updateCount(id, tx), { concurrency: COUNT_CONCURRENCY });
}

/** Returns cached count or backfills `visibleItemCount` on demand when it is `null`. */
export async function fillCount(list: Pick<RawList, 'internal_id' | 'visibleItemCount'>) {
  if (list.visibleItemCount != null) return list.visibleItemCount;
  return updateCount(list.internal_id);
}

/** Backfills `visibleItemCount` for lists with `null`, mutating each row in place. */
export async function fillCounts<T extends Pick<RawList, 'internal_id' | 'visibleItemCount'>>(
  lists: T[]
) {
  const missing = lists.filter((list) => list.visibleItemCount == null);
  if (!missing.length) return;

  await pMap(
    missing,
    async (list) => {
      list.visibleItemCount = await updateCount(list.internal_id);
    },
    { concurrency: COUNT_CONCURRENCY }
  );
}
