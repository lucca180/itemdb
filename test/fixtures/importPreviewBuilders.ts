import type { ItemV2For } from '@types';
import type { ImportPreviewItem } from '@app/[locale]/lists/import/importShared';

type CardItem = ItemV2For<'card'>;

let nextInternalId = 100_000;

/** Minimal factory for card-intent items used in import preview tests. */
export function buildCardItem(
  overrides: Partial<CardItem> & Pick<CardItem, 'name' | 'image'>
): CardItem {
  const internal_id = overrides.internal_id ?? nextInternalId++;
  const item_id = overrides.item_id ?? internal_id - 90_000;

  return {
    internal_id,
    item_id,
    name: overrides.name,
    slug: overrides.slug ?? overrides.name.toLowerCase().replace(/\s+/g, '-'),
    image: overrides.image,
    type: overrides.type ?? 'np',
    description: overrides.description ?? '',
    status: overrides.status ?? 'active',
    flags: overrides.flags ?? [],
    colorHex: overrides.colorHex ?? '#4A5568',
    price: overrides.price ?? null,
    ncValue: overrides.ncValue,
    rarity: overrides.rarity ?? null,
    category: overrides.category ?? null,
    estVal: overrides.estVal ?? null,
  };
}

export function buildPreviewRow(key: string, item: CardItem, quantity: number): ImportPreviewItem {
  return { key, item, quantity };
}

/** Neopets CDN image helper for test fixtures. */
export function neopetsImage(id: string): CardItem['image'] {
  return {
    id,
    url: `https://images.neopets.com/items/${id}.gif`,
    hash: `test-${id}`,
  };
}
