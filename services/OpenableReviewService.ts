/**
 * Admin review of items that received community opening reports but are not marked openable
 * (`canOpen` = false/unknown). Admins review them at `/admin/openable-review` and can mark an
 * item as openable in one click.
 *
 * Flow:
 * - {@link listOpenableCandidates}: admin queue (admin page + `GET /api/admin/openable-review`)
 * - {@link markItemOpenable}: admin action (`POST /api/admin/openable-review`)
 *
 * This service owns all input validation; callers only handle auth/transport.
 */
import 'server-only';

import { Prisma } from '@prisma/generated/client';
import prisma from '@utils/prisma';
import { LogService } from '@services/ActionLogService';
import { ItemService } from '@services/ItemService';
import { AUTHORITATIVE_OPENING_IDS, evaluateDropEvidence } from '@utils/item/itemDropEvidence';
import { ItemRevalidateTags, revalidateItem } from '@utils/item/revalidateItem';
import type { ItemV2For, User } from '@types';

/** Initial opening window and how much "load older openings" extends it, in days. */
export const OPENABLE_REVIEW_DAYS_STEP = 7;
const MAX_DAYS = 3650;

/** How many of the most reported drops are shown per item. */
const TOP_DROPS = 6;

export type OpenableCandidateDrop = {
  item_iid: number;
  /** Distinct openings that reported this drop. */
  support: number;
  item: ItemV2For<'minimal'> | null;
};

export type OpenableCandidate = {
  internal_id: number;
  canOpen: 'false' | 'unknown';
  item: ItemV2For<'minimal'> | null;
  /** Distinct community openings inside the selected window. */
  recentOpenings: number;
  /** Distinct community openings of all time. */
  totalOpenings: number;
  lastOpeningAt: string;
  /** Whether the drops card would render if the item were marked openable. */
  wouldShowDrops: boolean;
  /** Most reported drops, accepted ones first. */
  drops: (OpenableCandidateDrop & { accepted: boolean })[];
};

export type OpenableCandidatesResult = {
  days: number;
  /** Whether community openings older than the window exist (more to load). */
  hasOlder: boolean;
  candidates: OpenableCandidate[];
};

type RecentParentRow = {
  parent_iid: number;
  recentOpenings: bigint | number;
  lastOpeningAt: Date | string;
};

/** Untrusted day count (query string) → integer in [step, MAX_DAYS]; defaults to one step. */
export function parseOpenableReviewDays(value: unknown): number {
  const days = Number(value);
  if (!Number.isInteger(days) || days < OPENABLE_REVIEW_DAYS_STEP) return OPENABLE_REVIEW_DAYS_STEP;
  return Math.min(days, MAX_DAYS);
}

/** Community openings of items not marked openable (false/unknown). */
const notOpenableCommunityOpenings = Prisma.sql`
  FROM OpenableItems o
  JOIN Items i ON i.internal_id = o.parent_iid
  WHERE i.canOpen IN ('false', 'unknown')
    AND o.opening_id NOT IN (${Prisma.join(AUTHORITATIVE_OPENING_IDS)})
`;

/**
 * Items not marked openable that got community opening reports in the last `days` days,
 * sorted by internal_id (newest items first).
 * With `onlyWouldShowDrops`, keeps only items whose drops card would render once marked openable.
 */
export async function listOpenableCandidates({
  days,
  onlyWouldShowDrops,
}: {
  days: number;
  onlyWouldShowDrops: boolean;
}): Promise<OpenableCandidatesResult> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [recent, older] = await Promise.all([
    prisma.$queryRaw<RecentParentRow[]>`
      SELECT o.parent_iid,
        COUNT(DISTINCT o.opening_id) AS recentOpenings,
        MAX(o.addedAt) AS lastOpeningAt
      ${notOpenableCommunityOpenings}
        AND o.addedAt >= ${since}
      GROUP BY o.parent_iid
    `,
    prisma.$queryRaw<{ found: number }[]>`
      SELECT 1 AS found
      ${notOpenableCommunityOpenings}
        AND o.addedAt < ${since}
      LIMIT 1
    `,
  ]);

  const hasOlder = older.length > 0 && days < MAX_DAYS;
  const candidates = await buildCandidates(recent, onlyWouldShowDrops);

  return { days, hasOlder, candidates };
}

async function buildCandidates(
  recent: RecentParentRow[],
  onlyWouldShowDrops: boolean
): Promise<OpenableCandidate[]> {
  if (!recent.length) return [];

  const parentIds = recent.map((row) => row.parent_iid);

  const [parents, rows] = await Promise.all([
    prisma.items.findMany({
      where: { internal_id: { in: parentIds } },
      select: {
        internal_id: true,
        isNC: true,
        canOpen: true,
        canPlay: true,
        canEat: true,
        canRead: true,
      },
    }),
    prisma.openableItems.findMany({
      where: { parent_iid: { in: parentIds } },
      select: { parent_iid: true, opening_id: true, item_iid: true, notes: true },
    }),
  ]);

  const rowsByParent = new Map<number, typeof rows>();
  for (const row of rows) {
    const parentRows = rowsByParent.get(row.parent_iid as number) ?? [];
    parentRows.push(row);
    rowsByParent.set(row.parent_iid as number, parentRows);
  }

  const recentById = new Map(recent.map((row) => [row.parent_iid, row]));

  const candidates = parents
    .map((parent) => {
      // Evaluate as if the admin already marked it openable: that is what the button does.
      const evidence = evaluateDropEvidence(
        { ...parent, canOpen: 'true' },
        rowsByParent.get(parent.internal_id) ?? []
      );

      const support = new Map<number, number>();
      for (const row of evidence.communityRows) {
        support.set(row.item_iid, (support.get(row.item_iid) ?? 0) + 1);
      }

      const drops = [...support.entries()]
        .map(([item_iid, count]) => ({
          item_iid,
          support: count,
          accepted: evidence.acceptedItemIds.has(item_iid),
        }))
        .sort((a, b) => Number(b.accepted) - Number(a.accepted) || b.support - a.support)
        .slice(0, TOP_DROPS);

      const recentRow = recentById.get(parent.internal_id)!;

      return {
        internal_id: parent.internal_id,
        canOpen: parent.canOpen as OpenableCandidate['canOpen'],
        recentOpenings: Number(recentRow.recentOpenings),
        totalOpenings: evidence.openingCount,
        lastOpeningAt: new Date(recentRow.lastOpeningAt).toJSON(),
        wouldShowDrops: evidence.acceptedItemIds.size > 0,
        drops,
      };
    })
    .filter((candidate) => !onlyWouldShowDrops || candidate.wouldShowDrops)
    .sort((a, b) => b.internal_id - a.internal_id);

  if (!candidates.length) return [];

  const itemIids = [
    ...new Set(candidates.flatMap((c) => [c.internal_id, ...c.drops.map((d) => d.item_iid)])),
  ];
  const items = await ItemService.getManyItems(
    { type: 'id', data: itemIids.map(String) },
    { intent: 'minimal', cached: false, limit: itemIids.length }
  );

  return candidates.map((candidate) => ({
    ...candidate,
    item: items[candidate.internal_id] ?? null,
    drops: candidate.drops.map((drop) => ({ ...drop, item: items[drop.item_iid] ?? null })),
  }));
}

/** Thrown for an invalid item id or an item that is already openable (maps to a 4xx). */
export class OpenableReviewInputError extends Error {
  code: 'invalid-item' | 'already-openable';

  constructor(code: OpenableReviewInputError['code']) {
    super(code);
    this.name = 'OpenableReviewInputError';
    this.code = code;
  }
}

/** Sets `canOpen = true`, logs the change under the admin and refreshes the item page. */
export async function markItemOpenable({
  itemIid,
  admin,
}: {
  itemIid: unknown;
  admin: User;
}): Promise<{ internal_id: number }> {
  const internalId = Number(itemIid);
  if (!Number.isInteger(internalId) || internalId <= 0)
    throw new OpenableReviewInputError('invalid-item');

  const item = await prisma.items.findUnique({
    where: { internal_id: internalId },
    select: { canOpen: true },
  });

  if (!item) throw new OpenableReviewInputError('invalid-item');
  if (item.canOpen === 'true') throw new OpenableReviewInputError('already-openable');

  await prisma.items.update({
    where: { internal_id: internalId },
    data: { canOpen: 'true' },
  });

  await Promise.all([
    LogService.createLog(
      'itemUpdate',
      { canOpen: { oldVal: item.canOpen, newVal: 'true' } },
      String(internalId),
      admin.id
    ),
    revalidateItem(internalId, ItemRevalidateTags.root(internalId)),
  ]);

  return { internal_id: internalId };
}
