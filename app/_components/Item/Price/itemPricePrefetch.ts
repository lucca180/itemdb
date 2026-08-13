import {
  loadItemPriceHistory,
  loadItemTradeLists,
  type ItemPriceHistory,
  type ItemTradeListTables,
} from '@app/_components/Item/Price/actions';

const historyCache = new Map<number, Promise<ItemPriceHistory>>();
const listsCache = new Map<number, Promise<ItemTradeListTables>>();

export function prefetchItemPriceHistory(internalId: number) {
  let pending = historyCache.get(internalId);
  if (!pending) {
    pending = loadItemPriceHistory(internalId);
    historyCache.set(internalId, pending);
  }
  return pending;
}

export function prefetchItemTradeLists(internalId: number) {
  let pending = listsCache.get(internalId);
  if (!pending) {
    pending = loadItemTradeLists(internalId);
    listsCache.set(internalId, pending);
  }
  return pending;
}
