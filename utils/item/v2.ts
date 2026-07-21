import type { ItemFlags, ItemFindAt, ItemV2, ItemV2For, ListItemInfo } from '@types';
import Color from 'color';
import { getItemFindAtLinks, getRestockPrice, rarityToCCPoints } from '@utils/utils';

export function hasFlag(item: Pick<ItemV2, 'flags'>, flag: ItemFlags): boolean {
  return item.flags.includes(flag);
}

export type FindAtItemV2Input = Pick<
  ItemV2,
  'name' | 'flags' | 'item_id' | 'rarity' | 'type' | 'status' | 'category'
>;

export function getItemFindAtLinksV2(item: FindAtItemV2Input): ItemFindAt {
  return getItemFindAtLinks({
    name: item.name,
    isWearable: hasFlag(item, 'wearable'),
    item_id: item.item_id,
    rarity: item.rarity,
    type: item.type,
    status: item.status,
    category: item.category,
  });
}

export function getRestockProfitV2(
  item: Pick<ItemV2For<'card'>, 'category' | 'rarity' | 'estVal' | 'price'>,
  ignoreSpecialDays = false
): number | null {
  if (!item.price || item.price.type !== 'np' || !item.price.value) return null;

  const prices = getRestockPrice(
    {
      category: item.category,
      rarity: item.rarity,
      estVal: item.estVal,
    },
    ignoreSpecialDays
  );

  if (!prices) return null;

  return item.price.value - prices[1];
}

export function rarityToCCPointsV2(item: Pick<ItemV2, 'internal_id' | 'rarity'>): number {
  return rarityToCCPoints(item);
}

/** ~45% opacity hex alpha (matches legacy `rgba(..., .45)` gradient wash). */
export function colorHexWithAlpha(colorHex: string, alphaHex = '73'): string {
  const hex = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
  if (hex.length === 9) return hex;
  return `${hex}${alphaHex}`;
}

/** Sort key for list price / price×qty — mirrors legacy `getSortPrice` for ItemV2. */
export function getSortPriceV2(
  item: ItemV2For<'card'>,
  listInfo?: ListItemInfo,
  qty = false
): number {
  if (item.status === 'no trade') return -1;
  if (item.price?.type === 'np' && item.price.value) {
    return item.price.value * (qty ? listInfo?.amount || 1 : 1);
  }
  if (item.type === 'nc') {
    if (item.ncValue?.minValue) return item.ncValue.minValue;
    return -1;
  }
  return Infinity;
}

/** Client/server list-row sort using ItemV2 card payloads (HSV from colorHex). */
export function sortListItemsV2(
  a: ListItemInfo,
  b: ListItemInfo,
  sortBy: string,
  sortDir: string,
  items: { [id: string]: ItemV2For<'card'> }
): number {
  const itemA = items[a.item_iid];
  const itemB = items[b.item_iid];
  if (!itemA || !itemB) return 0;

  if (sortBy === 'name') {
    if (sortDir === 'asc') return itemA.name.localeCompare(itemB.name);
    return itemB.name.localeCompare(itemA.name);
  }

  if (sortBy === 'rarity') {
    if (sortDir === 'asc') return (itemA.rarity ?? 0) - (itemB.rarity ?? 0);
    return (itemB.rarity ?? 0) - (itemA.rarity ?? 0);
  }

  if (sortBy === 'price') {
    if (sortDir === 'asc') return getSortPriceV2(itemA) - getSortPriceV2(itemB);
    return getSortPriceV2(itemB) - getSortPriceV2(itemA);
  }

  if (sortBy === 'item_id') {
    if (sortDir === 'asc') return (itemA.item_id ?? 0) - (itemB.item_id ?? 0);
    return (itemB.item_id ?? 0) - (itemA.item_id ?? 0);
  }

  if (sortBy === 'addedAt') {
    const dateA = new Date(a.addedAt);
    const dateB = new Date(b.addedAt);
    if (sortDir === 'asc') return dateA.getTime() - dateB.getTime();
    return dateB.getTime() - dateA.getTime();
  }

  if (sortBy === 'color') {
    const hsvA = new Color(itemA.colorHex ?? '#000000').hsv().array();
    const hsvB = new Color(itemB.colorHex ?? '#000000').hsv().array();
    if (sortDir === 'asc') return hsvB[0] - hsvA[0] || hsvB[1] - hsvA[1] || hsvB[2] - hsvA[2];
    return hsvA[0] - hsvB[0] || hsvA[1] - hsvB[1] || hsvA[2] - hsvB[2];
  }

  if (sortBy === 'custom') {
    if (sortDir === 'asc') return (a.order ?? -1) - (b.order ?? -1);
    return (b.order ?? -1) - (a.order ?? -1);
  }

  if (sortBy === 'faerieFest') {
    const ffA = rarityToCCPointsV2(itemA);
    const ffB = rarityToCCPointsV2(itemB);
    if (sortDir === 'asc') return (ffA || 1000) - (ffB || 1000);
    return ffB - ffA;
  }

  if (sortBy === 'quantity') {
    if (sortDir === 'asc') return a.amount - b.amount;
    return b.amount - a.amount;
  }

  if (sortBy === 'price_qty') {
    const priceA = getSortPriceV2(itemA, a, true);
    const priceB = getSortPriceV2(itemB, b, true);
    if (sortDir === 'asc') return priceA - priceB;
    return priceB - priceA;
  }

  return 0;
}
