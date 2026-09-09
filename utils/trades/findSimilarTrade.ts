import { shouldSkipTrade } from '@utils/utils';

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

// Includes instantBuy so lots that only share wishlist/size are not treated as
// the same match (e.g. none+2 mixed at IB 1.5M vs IB 3.7M).
export function buildSimilarTradeLookupKey(
  wishlist: string,
  itemsCount: number,
  isAllItemsEqual: boolean,
  itemSignature: string,
  instantBuy?: number | null
) {
  return `${wishlist}\0${itemsCount}\0${isAllItemsEqual}\0${itemSignature}\0${instantBuy ?? 'null'}`;
}

// True when an Instant Buy lot should be closed without similar matching:
// IB under 1M, wishlist "none", or a skip-wishlist (no usable NP ask).
// High IB + a real NP wishlist can still go to findSimilar (same IB only).
export function shouldSkipInstaBuySimilar(trade: { instantBuy?: number | null; wishlist: string }) {
  if (!trade.instantBuy) return false;
  return trade.instantBuy < 1000000 || trade.wishlist === 'none' || shouldSkipTrade(trade.wishlist);
}

// Item price above the lot Instant Buy is invalid — IB is the buy-it-now for
// the whole lot. Equal to IB is fine (IB applied to the expensive item).
export function itemPriceExceedsInstantBuy(
  price: number | string | null | undefined,
  instantBuy: number | null | undefined
) {
  if (!instantBuy || price == null || price === '') return false;
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return false;
  return n > instantBuy;
}

export function isWishlistBanned(
  wishlist: string,
  banWords: readonly string[] = DEFAULT_BAN_WORDS
) {
  const lower = wishlist.toLowerCase();
  return banWords.some((word) => lower.includes(word));
}

export { DEFAULT_BAN_WORDS };
