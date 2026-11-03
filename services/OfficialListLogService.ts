/**
 * Audit trail for official lists: every manual change (items or list info) is written to
 * `ActionLogs` with `actionType = 'officialList'` and `subject_id = list internal_id`.
 *
 * Dynamic syncs keep their own `dynamicListSync` log and are not logged here.
 */
import { Prisma } from '@prisma/generated/client';
import { LogService } from '@services/ActionLogService';

export const OFFICIAL_LIST_LOG_TYPE = 'officialList';

export type OfficialListAction =
  | 'addItems'
  | 'updateItems'
  | 'removeItems'
  | 'hideItems'
  | 'moveItems'
  | 'copyItems'
  | 'updateInfo'
  | 'setDynamic'
  | 'reorder'
  | 'createList'
  | 'deleteList';

/**
 * Writes one `officialList` log row. No-op for non-official lists, so callers can use it
 * unconditionally. Never throws: a failed log must not fail the mutation.
 */
export async function logOfficialListAction(
  list: { internal_id: number; official: boolean },
  action: OfficialListAction,
  data: Record<string, unknown>,
  user: { id: string } | null | undefined
) {
  if (!list.official) return;

  try {
    await LogService.createLog(
      OFFICIAL_LIST_LOG_TYPE,
      { action, ...data } as Prisma.InputJsonValue,
      String(list.internal_id),
      user?.id
    );
  } catch (e) {
    console.error('[officialListLog] failed to write log', e);
  }
}
