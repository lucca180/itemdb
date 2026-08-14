'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { getOrCreatePrefetch } from '@app/_components/Item/prefetchCache';
import {
  loadNCOwlsTrades,
  loadNCTradeListTable,
  type NCTradeListTable,
  type NCTradeListType,
} from '@app/_components/Item/NCTrade/actions';
import type { LebronTrade } from '@types';

const listsCache = new Map<string, Promise<NCTradeListTable>>();
const owlsCache = new Map<string, Promise<LebronTrade[]>>();

function prefetchNCTradeListTable(internalId: number, locale: string, type: NCTradeListType) {
  return getOrCreatePrefetch(listsCache, `${internalId}:${locale}:${type}`, () =>
    loadNCTradeListTable(internalId, locale, type)
  );
}

export function usePrefetchNCTradeListTable() {
  const locale = useLocale();
  return useCallback(
    (internalId: number, type: NCTradeListType) =>
      prefetchNCTradeListTable(internalId, locale, type),
    [locale]
  );
}

export function prefetchNCOwlsTrades(internalId: number, itemName: string) {
  return getOrCreatePrefetch(owlsCache, `${internalId}:${itemName}`, () =>
    loadNCOwlsTrades(internalId, itemName)
  );
}
