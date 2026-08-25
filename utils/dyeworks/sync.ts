import { UTCDate } from '@date-fns/utc';
import type { ListItemInfo } from '@types';
import { ListService } from '@services/ListService';
import prisma from '@utils/prisma';
import {
  expandDyeworksEntries,
  type DyeworksListEntry,
  type DyeworksSnapshotItem,
} from '@utils/dyeworks/parseCategories';

export const DYEWORKS_CURRENT_LIST_ID = 28472;
export const DYEWORKS_RETIRED_LIST_ID = 28473;

export type MatchedDyeworksItem = {
  item_id: number;
  item_iid: number;
  name: string;
  kind: DyeworksListEntry['kind'];
  end: string | null;
};

export type DyeworksMatchResult = {
  matched: MatchedDyeworksItem[];
  unmatched: Array<{
    item_id: number;
    name: string;
    image: string;
    kind: DyeworksListEntry['kind'];
  }>;
};

export type DyeworksListDiff = {
  toAdd: number[];
  toRemove: number[];
};

export type DyeworksSyncResult = {
  snapshotCount: number;
  entryCount: number;
  matched: number;
  unmatched: number;
  addedOriginals: number;
  addedColors: number;
  removedOriginals: number;
  retiredColors: number;
  unmatchedItems: DyeworksMatchResult['unmatched'];
};

/** Same UTC 18:00 convention used by list series date writers. */
export function toListSeriesDate(value: Date = new Date()): Date {
  return new UTCDate(new UTCDate(value).setHours(18));
}

/**
 * Parse Neopets Dyeworks `mm/dd` into a list series date (UTC 18:00).
 * End dates are always in the future — use this year, or next year if that
 * day has already passed.
 */
export function parseDyeworksEndDate(
  end: string | null | undefined,
  now: Date = new Date()
): Date | null {
  if (!end) return null;
  const match = end.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const year = now.getUTCFullYear();
  let date = new Date(Date.UTC(year, month - 1, day));
  if (date.getTime() <= now.getTime()) {
    date = new Date(Date.UTC(year + 1, month - 1, day));
  }

  return toListSeriesDate(date);
}

export function imageIdFromUrl(image: string): string {
  return image.match(/[^./]+(?=\.gif)/)?.[0] ?? '';
}

export function diffDyeworksListMembership(
  snapshotItemIids: Iterable<number>,
  currentListItemIids: Iterable<number>
): DyeworksListDiff {
  const snapshot = new Set(snapshotItemIids);
  const current = new Set(currentListItemIids);

  const toAdd: number[] = [];
  for (const iid of snapshot) {
    if (!current.has(iid)) toAdd.push(iid);
  }

  const toRemove: number[] = [];
  for (const iid of current) {
    if (!snapshot.has(iid)) toRemove.push(iid);
  }

  return { toAdd, toRemove };
}

/**
 * Resolve Neopets `item_id`s to itemdb `internal_id`s.
 * Prefer `Items.item_id`; fall back to `(name, image_id)`.
 */
export async function matchDyeworksEntries(
  entries: DyeworksListEntry[]
): Promise<DyeworksMatchResult> {
  if (entries.length === 0) {
    return { matched: [], unmatched: [] };
  }

  const byItemId = await prisma.items.findMany({
    where: { item_id: { in: entries.map((item) => item.item_id) } },
    select: { item_id: true, internal_id: true, name: true, image_id: true },
  });

  const itemIdMap = new Map(
    byItemId.filter((row) => row.item_id != null).map((row) => [row.item_id!, row])
  );

  const missing = entries.filter((item) => !itemIdMap.has(item.item_id));

  const nameImageMap = new Map<string, { internal_id: number; name: string; image_id: string }>();
  if (missing.length > 0) {
    const byNameImage = await prisma.items.findMany({
      where: {
        OR: missing.map((item) => ({
          name: item.name,
          image_id: imageIdFromUrl(item.image),
        })),
      },
      select: { internal_id: true, name: true, image_id: true },
    });
    for (const row of byNameImage) {
      nameImageMap.set(`${row.name}::${row.image_id ?? ''}`, {
        internal_id: row.internal_id,
        name: row.name,
        image_id: row.image_id ?? '',
      });
    }
  }

  const matched: MatchedDyeworksItem[] = [];
  const unmatched: DyeworksMatchResult['unmatched'] = [];

  for (const item of entries) {
    const byId = itemIdMap.get(item.item_id);
    if (byId) {
      matched.push({
        item_id: item.item_id,
        item_iid: byId.internal_id,
        name: item.name,
        kind: item.kind,
        end: item.end,
      });
      continue;
    }

    const byName = nameImageMap.get(`${item.name}::${imageIdFromUrl(item.image)}`);
    if (byName) {
      matched.push({
        item_id: item.item_id,
        item_iid: byName.internal_id,
        name: item.name,
        kind: item.kind,
        end: item.end,
      });
      continue;
    }

    unmatched.push({
      item_id: item.item_id,
      name: item.name,
      image: item.image,
      kind: item.kind,
    });
  }

  return { matched, unmatched };
}

function toListItemInfo(
  row: {
    internal_id: number;
    list_id: number;
    item_iid: number;
    addedAt: Date;
    updatedAt: Date;
    amount: number;
    capValue: number | null;
    imported: boolean;
    order: number | null;
    isHighlight: boolean;
    isHidden: boolean;
    seriesStart: Date | null;
    seriesEnd: Date | null;
  },
  overrides?: Partial<Pick<ListItemInfo, 'seriesStart' | 'seriesEnd' | 'isHighlight'>>
): ListItemInfo {
  return {
    internal_id: row.internal_id,
    list_id: row.list_id,
    item_iid: row.item_iid,
    addedAt: row.addedAt.toJSON(),
    updatedAt: row.updatedAt.toJSON(),
    amount: row.amount,
    capValue: row.capValue,
    imported: row.imported,
    order: row.order,
    isHighlight: overrides?.isHighlight ?? row.isHighlight,
    isHidden: row.isHidden,
    seriesStart: overrides?.seriesStart ?? (row.seriesStart ? row.seriesStart.toJSON() : null),
    seriesEnd: overrides?.seriesEnd ?? (row.seriesEnd ? row.seriesEnd.toJSON() : null),
  };
}

/**
 * Sync Dyeworks availability onto official current/retired lists.
 *
 * - Originals: current + highlight; when gone, delete from current (never retired).
 * - Color variants: current; when gone, move to retired with seriesEnd.
 * - `end: "mm/dd"` from Neopets is written to `seriesEnd` (UTC 18:00).
 *
 * Leaving items are classified by `isHighlight` on the current list row
 * (originals are always stored highlighted).
 */
export async function syncDyeworksLists(
  snapshot: DyeworksSnapshotItem[],
  now: Date = new Date()
): Promise<DyeworksSyncResult> {
  const entries = expandDyeworksEntries(snapshot);
  const { matched, unmatched } = await matchDyeworksEntries(entries);

  const matchedByIid = new Map(matched.map((item) => [item.item_iid, item]));
  const originalIids = new Set(
    matched.filter((item) => item.kind === 'original').map((item) => item.item_iid)
  );
  const colorIids = new Set(
    matched.filter((item) => item.kind === 'color').map((item) => item.item_iid)
  );
  const snapshotIids = new Set([...originalIids, ...colorIids]);
  const seriesNow = toListSeriesDate(now);

  const currentRows = await prisma.listItems.findMany({
    where: { list_id: DYEWORKS_CURRENT_LIST_ID, isHidden: false },
  });
  const currentByIid = new Map(currentRows.map((row) => [row.item_iid, row]));

  const { toAdd, toRemove } = diffDyeworksListMembership(
    snapshotIids,
    currentRows.map((row) => row.item_iid)
  );

  const toAddOriginals = toAdd.filter((iid) => originalIids.has(iid));
  const toAddColors = toAdd.filter((iid) => colorIids.has(iid));

  const removeOriginalIids: number[] = [];
  const retireColorIids: number[] = [];
  for (const iid of toRemove) {
    const row = currentByIid.get(iid);
    if (!row) continue;
    if (row.isHighlight) removeOriginalIids.push(iid);
    else retireColorIids.push(iid);
  }

  const seriesEndFor = (item_iid: number): Date | null =>
    parseDyeworksEndDate(matchedByIid.get(item_iid)?.end ?? null, now);

  const creates = [
    ...toAddOriginals.map((item_iid) => ({
      list_id: DYEWORKS_CURRENT_LIST_ID,
      item_iid,
      isHighlight: true,
      seriesStart: seriesNow,
      seriesEnd: seriesEndFor(item_iid),
    })),
    ...toAddColors.map((item_iid) => ({
      list_id: DYEWORKS_CURRENT_LIST_ID,
      item_iid,
      isHighlight: false,
      seriesStart: seriesNow,
      seriesEnd: seriesEndFor(item_iid),
    })),
  ];

  if (creates.length > 0 || removeOriginalIids.length > 0) {
    await ListService.applyDynamicItemChanges(DYEWORKS_CURRENT_LIST_ID, {
      create: creates.length > 0 ? creates : undefined,
      deleteByIid: removeOriginalIids.length > 0 ? removeOriginalIids : undefined,
    });
  }

  // Keep highlight + seriesEnd in sync for items already on the current list.
  const existingToUpdate = currentRows.filter((row) => {
    if (!snapshotIids.has(row.item_iid)) return false;
    const matchedItem = matchedByIid.get(row.item_iid);
    if (!matchedItem) return false;

    const shouldHighlight = matchedItem.kind === 'original';
    const desiredEnd = seriesEndFor(row.item_iid);
    const currentEndMs = row.seriesEnd?.getTime() ?? null;
    const desiredEndMs = desiredEnd?.getTime() ?? null;

    return row.isHighlight !== shouldHighlight || currentEndMs !== desiredEndMs;
  });

  if (existingToUpdate.length > 0) {
    await ListService.updateItems(
      DYEWORKS_CURRENT_LIST_ID,
      existingToUpdate.map((row) => {
        const matchedItem = matchedByIid.get(row.item_iid)!;
        const desiredEnd = seriesEndFor(row.item_iid);
        return toListItemInfo(row, {
          isHighlight: matchedItem.kind === 'original',
          seriesStart: row.seriesStart ? row.seriesStart.toJSON() : null,
          seriesEnd: desiredEnd ? desiredEnd.toJSON() : null,
        });
      })
    );
  }

  if (retireColorIids.length > 0) {
    const retireRows = retireColorIids
      .map((iid) => currentByIid.get(iid))
      .filter((row): row is NonNullable<typeof row> => !!row);
    const seriesEndIso = seriesNow.toJSON();

    await ListService.moveOrCopyItems({
      sourceListId: DYEWORKS_CURRENT_LIST_ID,
      destListId: DYEWORKS_RETIRED_LIST_ID,
      items: retireRows.map((row) =>
        toListItemInfo(row, {
          seriesStart: row.seriesStart
            ? row.seriesStart.toJSON()
            : toListSeriesDate(row.addedAt).toJSON(),
          // Prefer the Neopets end date already on the row; otherwise close now.
          seriesEnd: row.seriesEnd ? row.seriesEnd.toJSON() : seriesEndIso,
        })
      ),
      move: true,
    });
  }

  return {
    snapshotCount: snapshot.length,
    entryCount: entries.length,
    matched: matched.length,
    unmatched: unmatched.length,
    addedOriginals: toAddOriginals.length,
    addedColors: toAddColors.length,
    removedOriginals: removeOriginalIids.length,
    retiredColors: retireColorIids.length,
    unmatchedItems: unmatched,
  };
}
