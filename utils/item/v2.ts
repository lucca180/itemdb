import type { ItemFlags, ItemFindAt, ItemV2, ItemV2For } from '@types';
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
