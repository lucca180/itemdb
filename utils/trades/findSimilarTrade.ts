const DEFAULT_BAN_WORDS = ['cool negg', 'baby', 'bby', 'bb'];

type TradeItemsShape = { item_iid: number | null };

type TradeItemSignatureShape = {
  order: number;
  item_iid: number | null;
  amount?: number | null;
};

type TradeShape = {
  isAllItemsEqual: boolean | null;
  items: TradeItemsShape[];
};

export function getTradeIsAllItemsEqual(trade: TradeShape) {
  if (trade.isAllItemsEqual != null) return trade.isAllItemsEqual;
  if (trade.items.length === 0) return false;
  return trade.items.every((item) => item.item_iid === trade.items[0].item_iid);
}

export function buildTradeItemSignature(items: TradeItemSignatureShape[]) {
  return [...items]
    .sort((a, b) => a.order - b.order)
    .map((item) => `${item.order}:${item.item_iid ?? 'null'}:${item.amount ?? 1}`)
    .join('|');
}

export function buildSimilarTradeLookupKey(
  wishlist: string,
  itemsCount: number,
  isAllItemsEqual: boolean,
  itemSignature: string
) {
  return `${wishlist}\0${itemsCount}\0${isAllItemsEqual}\0${itemSignature}`;
}

export function isWishlistBanned(
  wishlist: string,
  banWords: readonly string[] = DEFAULT_BAN_WORDS
) {
  const lower = wishlist.toLowerCase();
  return banWords.some((word) => lower.includes(word));
}

export { DEFAULT_BAN_WORDS };
