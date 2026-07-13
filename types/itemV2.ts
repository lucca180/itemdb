import type { ItemData, ItemMallData, NCValue } from './types';

export type ItemFlags = 'wearable' | 'neohome' | 'bd' | 'missingInfo';

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
  status: 'active' | 'no trade' | null;
  colorHex: string;
  price: ItemPriceField;
  slug: string | null;
  comment: string | null;
  canonical_id: number | null;
  firstSeen: string | null;
  useTypes: ItemData['useTypes'];
};

/**
 * Response presets. JOINs are **not** declared here — the Phase 1 query
 * engine derives them from the fields each intent needs.
 */
export type ItemIntent = 'minimal' | 'card' | 'detail';

const MINIMAL_FIELDS = [
  'internal_id',
  'item_id',
  'name',
  'slug',
  'image',
  'type',
  'flags',
  'description',
] as const satisfies readonly (keyof ItemV2)[];

const CARD_FIELDS = [
  ...MINIMAL_FIELDS,
  'colorHex',
  'price',
  'rarity',
  'status',
  'category',
] as const satisfies readonly (keyof ItemV2)[];

const DETAIL_FIELDS = [
  'internal_id',
  'item_id',
  'name',
  'description',
  'image',
  'category',
  'rarity',
  'weight',
  'type',
  'flags',
  'estVal',
  'status',
  'colorHex',
  'price',
  'slug',
  'comment',
  'canonical_id',
  'firstSeen',
  'useTypes',
] as const satisfies readonly (keyof ItemV2)[];

export const itemIntents = {
  minimal: { fields: MINIMAL_FIELDS },
  card: { fields: CARD_FIELDS },
  detail: { fields: DETAIL_FIELDS },
} as const satisfies Record<ItemIntent, { fields: readonly (keyof ItemV2)[] }>;

export function getIntentFields(intent: ItemIntent): readonly (keyof ItemV2)[] {
  return itemIntents[intent].fields;
}

type MinimalKeys = (typeof MINIMAL_FIELDS)[number];
type CardKeys = (typeof CARD_FIELDS)[number];
type DetailKeys = (typeof DETAIL_FIELDS)[number];

/** Response shape for a given intent. */
export type ItemV2For<I extends ItemIntent> = I extends 'minimal'
  ? Pick<ItemV2, MinimalKeys>
  : I extends 'card'
    ? Pick<ItemV2, CardKeys>
    : Pick<ItemV2, DetailKeys>;

// ----- PoC: ItemData → ItemV2 ----- //

export function mapItemFlags(item: ItemData): ItemFlags[] {
  const flags: ItemFlags[] = [];
  if (item.isWearable) flags.push('wearable');
  if (item.isNeohome) flags.push('neohome');
  if (item.isBD) flags.push('bd');
  if (item.isMissingInfo) flags.push('missingInfo');
  return flags;
}

/**
 * Discriminated `price` from legacy ItemData fields.
 * @see docs/api-v2-migration.md — price mapping rules
 */
export function mapItemPriceField(item: ItemData): ItemPriceField {
  if (item.status === 'no trade') return null;

  const isNC = item.type === 'nc' || item.isNC;

  if (isNC) {
    if (item.mallData) return { ...item.mallData, type: 'ncMall' };
    if (item.ncValue) return { ...item.ncValue, type: 'ncValue' };
    return null;
  }

  const value = item.price?.value ?? null;
  const addedAt = item.price?.addedAt ?? null;

  if (value === null) return null;

  const flags: ItemPriceV2['flags'] = [];
  if (item.price?.inflated) flags.push('inflation');
  if (value === 0) flags.push('unknown');

  return {
    value,
    flags,
    addedAt: addedAt ?? '',
    type: 'np',
  };
}

/** Full envelope. Prefer {@link itemDataToItemV2For} when an intent is known. */
export function itemDataToItemV2(item: ItemData): ItemV2 {
  return {
    internal_id: item.internal_id,
    item_id: item.item_id,
    name: item.name,
    description: item.description,
    image: {
      url: item.image,
      id: item.image_id,
      ...(item.cacheHash ? { hash: item.cacheHash } : {}),
    },
    category: item.category,
    rarity: item.rarity,
    weight: item.weight,
    type: item.type,
    flags: mapItemFlags(item),
    estVal: item.estVal,
    status: item.status,
    colorHex: item.color?.hex ?? null,
    price: mapItemPriceField(item),
    slug: item.slug,
    comment: item.comment,
    canonical_id: item.canonical_id,
    firstSeen: item.firstSeen,
    useTypes: item.useTypes,
  };
}

/** PoC helper: reshape `ItemData` into the fields for `intent`. */
export function itemDataToItemV2For<I extends ItemIntent>(item: ItemData, intent: I): ItemV2For<I> {
  const full = itemDataToItemV2(item);
  const fields = getIntentFields(intent);

  return Object.fromEntries(fields.map((key) => [key, full[key]])) as ItemV2For<I>;
}
