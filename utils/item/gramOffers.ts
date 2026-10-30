import { GRAM_OPTION_NOTE } from '@utils/item/itemDropEvidence';

/** An option offered in less than this share of openings is treated as rotating. */
export const ROTATING_OPTION_MAX_RATE = 0.5;

/** Openings an option needs, counted after it existed in itemdb, before it can be rotating. */
export const ROTATING_OPTION_MIN_OPENINGS = 10;

type GramOptionRow = {
  opening_id: string;
  item_iid: number;
  notes: string | null;
  addedAt: Date | null;
};

export type GramOfferStats = (itemIds: number[]) => { offered: number; total: number };

export const isGramOptionRow = (row: { notes: string | null }) =>
  !!row.notes?.toLowerCase().includes(GRAM_OPTION_NOTE);

/**
 * Counts how often items are offered among a gram's options. An option is only recorded when the
 * item already exists in itemdb, so openings before an item was added don't count against it.
 */
export const buildGramOfferStats = (
  rows: GramOptionRow[],
  itemAddedAt: Map<number, Date>
): GramOfferStats => {
  const openings = new Map<string, { at: number; items: Set<number> }>();

  for (const row of rows) {
    if (!isGramOptionRow(row)) continue;

    const at = row.addedAt?.getTime() ?? 0;
    const opening = openings.get(row.opening_id) ?? { at, items: new Set<number>() };

    opening.at = Math.min(opening.at, at);
    opening.items.add(row.item_iid);
    openings.set(row.opening_id, opening);
  }

  return (itemIds) => {
    const since = Math.max(0, ...itemIds.map((id) => itemAddedAt.get(id)?.getTime() ?? 0));
    let offered = 0;
    let total = 0;

    for (const opening of openings.values()) {
      if (opening.at < since) continue;

      total++;
      if (itemIds.some((id) => opening.items.has(id))) offered++;
    }

    return { offered, total };
  };
};

/**
 * Options offered too rarely to be a regular choice of the gram. `getItemDrops` treats them as
 * the gram's LE, which is a weak rule based on how grams have worked so far.
 */
export const getRotatingOptions = (itemIds: number[], offerStats: GramOfferStats) =>
  new Set(
    itemIds.filter((id) => {
      const { offered, total } = offerStats([id]);
      return total >= ROTATING_OPTION_MIN_OPENINGS && offered / total < ROTATING_OPTION_MAX_RATE;
    })
  );

/** Share (0-100) of openings that offered at least one of the pool's items. */
export const getOfferChance = (itemIds: number[], offerStats: GramOfferStats) => {
  const { offered, total } = offerStats(itemIds);
  if (!offered || !total) return undefined;

  return Number(((offered / total) * 100).toFixed(2));
};
