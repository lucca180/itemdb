// MVP flag to switch item accent-color source: the legacy node-vibrant pipeline
// (ItemColor rows with type = 'Vibrant', pre-computed on ingest) vs. a colorthief-based
// main/secondary palette computed on demand and cached in the same ItemColor table
// (see utils/item/itemColorThief.ts). No backfill: on a cache miss the colorthief row is
// generated and persisted lazily by the single-item colors endpoint.
export const ITEM_COLOR_SOURCE: 'legacy' | 'colorthief' =
  process.env.ITEM_COLOR_SOURCE === 'colorthief' ? 'colorthief' : 'legacy';

export const ITEM_COLOR_TYPE = ITEM_COLOR_SOURCE === 'colorthief' ? 'main' : 'Vibrant';
