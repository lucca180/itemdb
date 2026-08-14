import type { ItemData, TradeData } from '@types';

export const TRADE_LOT_VISIBLE_LIMIT = 5;

type TradeLotItem = TradeData['items'][number];
type FeaturedItem = Pick<ItemData, 'name' | 'image_id'>;

const itemKey = (item: { name: string; image_id?: string | null }) =>
  item.name + (item.image_id ?? '');

export function isFeaturedTradeItem(item: TradeLotItem, featuredItem?: FeaturedItem | null) {
  if (!featuredItem) return false;
  return itemKey(featuredItem) === itemKey(item);
}

/** Collapsed lot rows: keep every featured stack, fill the rest in original order. */
export function visibleTradeItems(
  items: TradeLotItem[],
  featuredItem?: FeaturedItem | null,
  limit = TRADE_LOT_VISIBLE_LIMIT
): TradeLotItem[] {
  if (items.length <= limit) return items;

  const featuredIndexes = items
    .map((item, index) => (isFeaturedTradeItem(item, featuredItem) ? index : -1))
    .filter((index) => index >= 0);

  if (featuredIndexes.length === 0 || featuredIndexes.every((index) => index < limit)) {
    return items.slice(0, limit);
  }

  const nonFeaturedSlots = Math.max(0, limit - featuredIndexes.length);
  let taken = 0;
  return items.filter((item) => {
    if (isFeaturedTradeItem(item, featuredItem)) return true;
    if (taken < nonFeaturedSlots) {
      taken += 1;
      return true;
    }
    return false;
  });
}
