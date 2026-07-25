'use server';

import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import { ListService } from '@services/ListService';
import prisma from '@utils/prisma';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export type DynamicLogCursor = {
  addedAt: string;
  logId: number;
};

export type DynamicLogEntry = {
  logId: number;
  added: number[];
  removed: number[];
  addedAt: string;
};

export type DynamicLogsPage = {
  logs: DynamicLogEntry[];
  nextCursor: DynamicLogCursor | null;
};

type DynamicSyncLogData = {
  added?: unknown;
  removed?: unknown;
};

function asIdArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter((n) => Number.isFinite(n));
}

/**
 * Paginated dynamic-list sync history for the site modal.
 * Uses `skipSync: true` so opening history never triggers a list sync.
 */
export async function loadDynamicLogs(
  username: string,
  listId: number,
  cursor: DynamicLogCursor | null = null,
  limit = DEFAULT_PAGE_SIZE
): Promise<DynamicLogsPage> {
  if (!username || !Number.isFinite(listId) || listId <= 0) {
    throw new Error('Invalid list');
  }

  const { user } = await getServerCurrentUser();
  const isOfficial = username === 'official';
  const listService = ListService.initUser(user);

  const list = await listService.getList({
    username,
    listId,
    isOfficial,
    skipSync: true,
  });

  if (!list) throw new Error('List not found');

  const canShow = isOfficial || list.owner.username === user?.username;
  if (!canShow) throw new Error('Unauthorized');
  if (!list.dynamicType) throw new Error('List is not dynamic');

  const take = Math.min(Math.max(1, Math.trunc(limit) || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);

  const cursorDate = cursor?.addedAt ? new Date(cursor.addedAt) : null;
  const cursorValid = !!(cursor && cursorDate && !Number.isNaN(cursorDate.getTime()));

  const rows = await prisma.actionLogs.findMany({
    where: {
      subject_id: list.internal_id.toString(),
      actionType: 'dynamicListSync',
      ...(cursorValid
        ? {
            OR: [
              { addedAt: { lt: cursorDate! } },
              {
                AND: [{ addedAt: cursorDate! }, { log_id: { lt: cursor!.logId } }],
              },
            ],
          }
        : {}),
    },
    orderBy: [{ addedAt: 'desc' }, { log_id: 'desc' }],
    take: take + 1,
    select: {
      log_id: true,
      addedAt: true,
      logData: true,
    },
  });

  const hasMore = rows.length > take;
  const pageRows = hasMore ? rows.slice(0, take) : rows;

  const logs: DynamicLogEntry[] = pageRows.map((row) => {
    const data = (row.logData ?? {}) as DynamicSyncLogData;
    return {
      logId: row.log_id,
      added: asIdArray(data.added),
      removed: asIdArray(data.removed),
      addedAt: row.addedAt.toISOString(),
    };
  });

  const last = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && last ? { addedAt: last.addedAt.toISOString(), logId: last.log_id } : null;

  return { logs, nextCursor };
}
