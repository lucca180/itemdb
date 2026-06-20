import type { TradeData } from '@types';

type TradeItemWithOrder = {
  order: number;
  amount?: number | null;
};

export const normalizeCanonicalWishlist = (wishlist: string) =>
  wishlist.toLowerCase().trim().replace(/\s/g, '');

export const getCanonicalItemsCount = (items: TradeItemWithOrder[]) =>
  items.reduce((sum, item) => sum + (item.amount || 1), 0);

export const getTradeItemByOrder = <T extends TradeItemWithOrder>(items: T[], order: number) =>
  items.find((item) => item.order === order);

export const isTradeAllItemsEqual = (trade: Pick<TradeData, 'items'>) =>
  trade.items.every(
    (item) => item.name === trade.items[0]?.name && item.image_id === trade.items[0]?.image_id
  );
