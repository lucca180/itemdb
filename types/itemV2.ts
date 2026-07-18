import type { ItemData, ItemMallData, NCValue } from './types';

export type ItemFlags = 'wearable' | 'neohome' | 'bd' | 'missingInfo' | (string & {});

export type ItemPriceV2 = {
  value: number;
  flags: ('inflation' | 'outdated' | 'unconfirmed' | 'unknown')[];
  addedAt: string;
  context?: string | null;
  type: 'np';
};

/** Acquisition price: NP market price or active NC Mall price. NC trade value lives in `ItemV2.ncValue`. */
export type ItemPriceField = ItemPriceV2 | (ItemMallData & { type: 'ncMall' }) | null;

/** Slim liquidity badge — full sold/percent details stay on `/saleStats` (v1). */
export type ItemSaleStatusV2 = {
  status: 'ets' | 'regular' | 'hts';
  addedAt: string;
};

export type ItemV2 = {
  internal_id: number;
  item_id: number | null;
  name: string;
  description: string;
  image: { url: string; id: string; hash?: string };
  category: string | null;
  rarity: number | null;
  weight: number | null;
  type: 'np' | 'nc' | 'pb';
  flags: ItemFlags[];
  estVal: number | null;
  status: string | null;
  colorHex: string | null;
  price: ItemPriceField;
  /** NC secondary-market trade value (owls/itemdb, in caps). Present only for NC items with a known value. */
  ncValue?: NCValue;
  saleStatus: ItemSaleStatusV2 | null;
  slug: string | null;
  comment: string | null;
  canonical_id: number | null;
  firstSeen: string | null;
  useTypes: ItemData['useTypes'];
};

/**
 * Single source of truth for response presets.
 * HTTP parsing, JOINs, and `ItemV2For<>` all derive from this map.
 * `full` means every `ItemV2` field — resolved at query time from the engine registry.
 */
const MINIMAL_FIELDS = [
  'internal_id',
  'item_id',
  'name',
  'slug',
  'image',
  'type',
  'description',
  'status',
] as const satisfies readonly (keyof ItemV2)[];

const CARD_FIELDS = [
  ...MINIMAL_FIELDS,
  'flags',
  'colorHex',
  'price',
  'ncValue',
  'rarity',
  'category',
  'estVal',
] as const satisfies readonly (keyof ItemV2)[];

const PRICER_FIELDS = [
  'internal_id',
  'item_id',
  'image',
  'name',
  'slug',
  'type',
  'status',
  'rarity',
  'price',
  'ncValue',
  'saleStatus',
] as const satisfies readonly (keyof ItemV2)[];

export const ALL_ITEM_V2_FIELDS = 'all' as const;

/**
 * Central intent registry: response fields + Redis/CDN TTL (`ttlSeconds`).
 * `minimal` lasts longer (no volatile `price`);
 */
export const itemIntents = {
  minimal: { fields: MINIMAL_FIELDS, ttlSeconds: 2 * 60 * 60 },
  card: { fields: CARD_FIELDS, ttlSeconds: 15 * 60 },
  pricer: { fields: PRICER_FIELDS, ttlSeconds: 60 * 60 },
  full: { fields: ALL_ITEM_V2_FIELDS, ttlSeconds: 30 * 60 },
} as const;

export type ItemIntent = keyof typeof itemIntents;

type IntentFields<I extends ItemIntent> = (typeof itemIntents)[I]['fields'];

/** Response shape for a given intent — driven by `itemIntents`, not a parallel map. */
export type ItemV2For<I extends ItemIntent> = I extends ItemIntent
  ? IntentFields<I> extends 'all'
    ? ItemV2
    : IntentFields<I> extends readonly (keyof ItemV2)[]
      ? Pick<ItemV2, IntentFields<I>[number]>
      : never
  : never;

export function getIntentFields<I extends ItemIntent>(intent: I): IntentFields<I> {
  return itemIntents[intent].fields;
}

/** Redis EX + CDN `s-maxage` for this intent (seconds). */
export function getIntentTtl(intent: ItemIntent): number {
  return itemIntents[intent].ttlSeconds;
}

export function isItemIntent(value: unknown): value is ItemIntent {
  return typeof value === 'string' && value in itemIntents;
}

/** Empty / missing → fallback; unknown string → null. */
export function parseItemIntent(value: unknown, fallback: ItemIntent): ItemIntent | null {
  if (value === undefined || value === null || value === '') return fallback;
  return isItemIntent(value) ? value : null;
}
