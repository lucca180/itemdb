import 'server-only';

import { Prisma } from '@prisma/generated/client';
import { ItemService } from '@services/ItemService';
import prisma from '@utils/prisma';
import type { ItemIntent, ItemV2For } from '@types';

/**
 * Lookup kinds whose key can match more than one item (e.g. books sharing an image,
 * foods whose variants reuse one image). `id` / `item_id` / `slug` are unique.
 */
export const AMBIGUOUS_IMPORT_LOOKUP_TYPES = ['image_id', 'name', 'name_image_id'] as const;
export type AmbiguousImportLookupType = (typeof AMBIGUOUS_IMPORT_LOOKUP_TYPES)[number];

export function isAmbiguousImportLookupType(value: unknown): value is AmbiguousImportLookupType {
  return (AMBIGUOUS_IMPORT_LOOKUP_TYPES as readonly unknown[]).includes(value);
}

export type ImportAmbiguityCandidate = Pick<
  ItemV2For<'minimal'>,
  'internal_id' | 'item_id' | 'name' | 'slug' | 'image' | 'description'
>;

/** A session key we could not pin down to specific items; nothing is applied for it. */
export type ImportAmbiguity = {
  key: string;
  /** How many distinct items the source page says this key stands for. */
  count: number;
  candidates: ImportAmbiguityCandidate[];
};

export type ImportCandidateDecision = {
  /** Session key → the internal ids it resolves to (one or more). */
  resolved: Map<string, number[]>;
  ambiguous: { key: string; count: number; candidateIds: number[] }[];
  notFoundKeys: string[];
};

/** Splits a `name,image_id` session key on its last comma (image ids never contain commas). */
export function splitNameImageKey(key: string): [string, string] {
  const i = key.lastIndexOf(',');
  return i < 0 ? [key, ''] : [key.slice(0, i), key.slice(i + 1)];
}

/** Keys are matched the way MariaDB compares them (case-insensitive, trailing spaces ignored). */
const norm = (value: string) => value.toLowerCase().trimEnd();

/**
 * Picks which candidates each session key stands for.
 *
 * - One candidate → that item.
 * - Several → narrow to the ones in the recommended (official) list, when any are there.
 *   If what is left fits in the key's page count (e.g. 4 Pinanna icons → 4 Pinannas),
 *   take them all; otherwise the key is ambiguous and nothing is applied for it.
 */
export function decideImportCandidates(
  keys: string[],
  candidatesByKey: Map<string, number[]>,
  eligible: Set<number> | null,
  keyCounts: Record<string, number>
): ImportCandidateDecision {
  const resolved = new Map<string, number[]>();
  const ambiguous: ImportCandidateDecision['ambiguous'] = [];
  const notFoundKeys: string[] = [];

  for (const key of keys) {
    const candidates = candidatesByKey.get(key) ?? [];
    if (!candidates.length) {
      notFoundKeys.push(key);
      continue;
    }

    let pool = candidates;
    if (candidates.length > 1 && eligible) {
      const inList = candidates.filter((id) => eligible.has(id));
      if (inList.length) pool = inList;
    }

    const count = Math.max(1, keyCounts[key] ?? 1);
    if (pool.length <= count) resolved.set(key, pool);
    else ambiguous.push({ key, count, candidateIds: pool });
  }

  return { resolved, ambiguous, notFoundKeys };
}

type CandidateRow = { internal_id: number; name: string; image_id: string };

function selectCandidates(where: Prisma.Sql) {
  return prisma.$queryRaw<CandidateRow[]>(Prisma.sql`
    SELECT a.internal_id, a.name, a.image_id
    FROM Items AS a
    WHERE ${where} AND a.canonical_id IS NULL
    ORDER BY a.internal_id
  `);
}

function push(map: Map<string, number[]>, key: string | undefined, id: number) {
  if (key === undefined) return;
  const list = map.get(key);
  if (!list) map.set(key, [id]);
  else if (!list.includes(id)) list.push(id);
}

/** Every non-clone item each session key matches (not just one per key). */
export async function findImportCandidates(
  indexType: AmbiguousImportLookupType,
  keys: string[]
): Promise<Map<string, number[]>> {
  const byKey = new Map<string, number[]>();
  if (!keys.length) return byKey;

  if (indexType === 'image_id' || indexType === 'name') {
    const column = indexType === 'image_id' ? Prisma.sql`a.image_id` : Prisma.sql`a.name`;
    const keyByNorm = new Map(keys.map((key) => [norm(key), key]));
    const rows = await selectCandidates(Prisma.sql`${column} IN (${Prisma.join(keys)})`);

    for (const row of rows) {
      const value = indexType === 'image_id' ? row.image_id : row.name;
      push(byKey, keyByNorm.get(norm(String(value))), Number(row.internal_id));
    }
    return byKey;
  }

  // name_image_id: exact (name, image) first…
  const pairs = keys.map(splitNameImageKey);
  const keyByPair = new Map(keys.map((key, i) => [norm(pairs[i].join(',')), key]));
  const tuples = pairs.map(([name, imageId]) => Prisma.sql`(${name}, ${imageId})`);
  const rows = await selectCandidates(Prisma.sql`(a.name, a.image_id) IN (${Prisma.join(tuples)})`);

  const matchedIds = new Set<number>();
  for (const row of rows) {
    const id = Number(row.internal_id);
    matchedIds.add(id);
    push(byKey, keyByPair.get(norm(`${row.name},${row.image_id}`)), id);
  }

  // …then, for names that did not match (renamed items, typos), fall back to the image —
  // skipping items another key already claimed by name.
  const missing = keys.filter((key) => !byKey.has(key));
  const missingImages = [...new Set(missing.map((key) => splitNameImageKey(key)[1]))].filter(
    Boolean
  );
  if (!missingImages.length) return byKey;

  const imageRows = await selectCandidates(
    Prisma.sql`a.image_id IN (${Prisma.join(missingImages)})`
  );
  for (const key of missing) {
    const image = norm(splitNameImageKey(key)[1]);
    for (const row of imageRows) {
      const id = Number(row.internal_id);
      if (norm(String(row.image_id)) === image && !matchedIds.has(id)) push(byKey, key, id);
    }
  }

  return byKey;
}

async function findEligibleIds(listId: number, ids: number[]): Promise<Set<number>> {
  if (!ids.length) return new Set();
  const rows = await prisma.listItems.findMany({
    where: { list_id: listId, item_iid: { in: ids } },
    select: { item_iid: true },
  });
  return new Set(rows.map((row) => row.item_iid));
}

function parseKeyCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const counts: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) counts[key] = Math.floor(n);
  }
  return counts;
}

export type ResolveImportItemsResult<I extends ItemIntent> = {
  /** Session key (or `key#internal_id` when one key stands for several items) → item. */
  data: Record<string, ItemV2For<I>>;
  ambiguous: ImportAmbiguity[];
  /** Session keys that matched no item. */
  notFoundKeys: string[];
};

/**
 * Resolves an `image_id` / `name` / `name_image_id` import without silently collapsing
 * items that share the same key. See {@link decideImportCandidates}.
 */
export async function resolveImportItems<I extends Exclude<ItemIntent, 'pricer'>>(input: {
  indexType: AmbiguousImportLookupType;
  keys: string[];
  /** `meta.keyCounts` from the userscript: how many times each key shows up on the page. */
  keyCounts?: unknown;
  recommendedListId: number | null;
  intent: I;
  /** Load candidate items for ambiguous keys (preview only). */
  withAmbiguousItems?: boolean;
}): Promise<ResolveImportItemsResult<I>> {
  const { indexType, keys, recommendedListId, intent, withAmbiguousItems = false } = input;

  const candidatesByKey = await findImportCandidates(indexType, keys);
  const collidingIds = [...candidatesByKey.values()].filter((ids) => ids.length > 1).flat();
  const eligible =
    recommendedListId && collidingIds.length
      ? await findEligibleIds(recommendedListId, collidingIds)
      : null;

  const decision = decideImportCandidates(
    keys,
    candidatesByKey,
    eligible,
    parseKeyCounts(input.keyCounts)
  );

  const ids = new Set<number>([...decision.resolved.values()].flat());
  if (withAmbiguousItems) decision.ambiguous.forEach((a) => a.candidateIds.forEach(ids.add, ids));

  const items = ids.size
    ? await ItemService.getManyItems({ type: 'id', data: [...ids] }, { intent, limit: ids.size })
    : {};

  const data: Record<string, ItemV2For<I>> = {};
  for (const [key, keyIds] of decision.resolved) {
    for (const id of keyIds) {
      const item = items[id];
      if (item) data[keyIds.length === 1 ? key : `${key}#${id}`] = item;
    }
  }

  const ambiguous: ImportAmbiguity[] = decision.ambiguous.map(({ key, count, candidateIds }) => ({
    key,
    count,
    candidates: withAmbiguousItems
      ? candidateIds.flatMap((id) => {
          const item = items[id] as ItemV2For<'minimal'> | undefined;
          if (!item) return [];
          const { internal_id, item_id, name, slug, image, description } = item;
          return [{ internal_id, item_id, name, slug, image, description }];
        })
      : [],
  }));

  return { data, ambiguous, notFoundKeys: decision.notFoundKeys };
}
