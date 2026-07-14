import type { ItemData, ItemMallData, NCValue } from './types';

export type ItemFlags = 'wearable' | 'neohome' | 'bd' | 'missingInfo' | (string & {});

export type ItemPriceV2 = {
  value: number;
  flags: ('inflation' | 'outdated' | 'unconfirmed' | 'unknown')[];
  addedAt: string;
  context?: string | null;
  type: 'np';
};

export type ItemPriceField =
  | ItemPriceV2
  | (ItemMallData & { type: 'ncMall' })
  | (NCValue & { type: 'ncValue' })
  | null;

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
] as const satisfies readonly (keyof ItemV2)[];

export const ALL_ITEM_V2_FIELDS = 'all' as const;

export const itemIntents = {
  minimal: { fields: MINIMAL_FIELDS },
  card: { fields: CARD_FIELDS },
  pricer: { fields: PRICER_FIELDS },
  full: { fields: ALL_ITEM_V2_FIELDS },
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

export function isItemIntent(value: unknown): value is ItemIntent {
  return typeof value === 'string' && value in itemIntents;
}

/** Empty / missing → fallback; unknown string → null. */
export function parseItemIntent(value: unknown, fallback: ItemIntent): ItemIntent | null {
  if (value === undefined || value === null || value === '') return fallback;
  return isItemIntent(value) ? value : null;
}
