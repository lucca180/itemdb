'use client';

import { useEffect, useState } from 'react';
import { NCMatchTable } from '@app/_components/Item/NCTrade/NCMatchTable';
import { NCTradeHistory } from '@app/_components/Item/NCTrade/NCTradeHistory';
import { NCTradePanelSkeleton } from '@app/_components/Item/NCTrade/NCTradePanelSkeleton';
import {
  prefetchNCOwlsTrades,
  usePrefetchNCTradeListTable,
} from '@app/_components/Item/NCTrade/ncTradePrefetch';
import type { NCTradeListTable, NCTradeListType } from '@app/_components/Item/NCTrade/actions';
import type { ItemData, LebronTrade } from '@types';

export function NCTradeListsPanel({ itemId, type }: { itemId: number; type: NCTradeListType }) {
  const prefetchListTable = usePrefetchNCTradeListTable();
  const [table, setTable] = useState<NCTradeListTable | null>(null);

  useEffect(() => {
    prefetchListTable(itemId, type).then(setTable);
  }, [itemId, type, prefetchListTable]);

  if (!table) return <NCTradePanelSkeleton />;

  return <NCMatchTable data={table.rows} matchCounts={table.matchCounts} type={type} />;
}

export function NCTradeOwlsPanel({ item }: { item: ItemData }) {
  const [trades, setTrades] = useState<LebronTrade[] | null>(null);

  useEffect(() => {
    prefetchNCOwlsTrades(item.internal_id, item.name).then(setTrades);
  }, [item.internal_id, item.name]);

  if (!trades) return <NCTradePanelSkeleton />;

  return <NCTradeHistory item={item} ncTrades={trades} />;
}
