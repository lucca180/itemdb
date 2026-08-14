'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { getOrCreatePrefetch } from '@app/_components/Item/prefetchCache';
import {
  loadItemPriceHistory,
  loadItemTradeLists,
  type ItemPriceHistory,
  type ItemTradeListTables,
} from '@app/_components/Item/Price/actions';

const historyCache = new Map<number, Promise<ItemPriceHistory>>();
const listsCache = new Map<string, Promise<ItemTradeListTables>>();

export function prefetchItemPriceHistory(internalId: number) {
  return getOrCreatePrefetch(historyCache, internalId, () => loadItemPriceHistory(internalId));
}

function prefetchItemTradeLists(internalId: number, locale: string) {
  return getOrCreatePrefetch(listsCache, `${internalId}:${locale}`, () =>
    loadItemTradeLists(internalId, locale)
  );
}

export function usePrefetchItemTradeLists() {
  const locale = useLocale();
  return useCallback((internalId: number) => prefetchItemTradeLists(internalId, locale), [locale]);
}
