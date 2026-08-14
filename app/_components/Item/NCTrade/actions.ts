'use server';

import { cookies } from 'next/headers';
import { loadLebronTradeHistory, loadTradeLists } from '@app/_components/Item/loadUtils';
import {
  labelMatchTableLastSeen,
  toMatchCounts,
  toMatchTableRows,
  type MatchTableLabeledRow,
} from '@app/_components/Item/NCTrade/matchTableView';
import { loadListMatches } from '@app/_components/Item/NCTrade/ncTradeMatches';
import {
  filterSeekingLists,
  filterTradingLists,
} from '@app/_components/Item/NCTrade/ncTradeListFilters';
import type { LebronTrade } from '@types';

export type NCTradeListType = 'seeking' | 'trading';

export type NCTradeListTable = {
  rows: MatchTableLabeledRow[];
  matchCounts: { [username: string]: number } | null;
};

export async function loadNCTradeListTable(
  internalId: number,
  locale: string,
  type: NCTradeListType
): Promise<NCTradeListTable> {
  const [lists, cookieStore] = await Promise.all([loadTradeLists(internalId), cookies()]);
  const sessionCookie = cookieStore.get('session')?.value;
  const filtered = type === 'seeking' ? filterSeekingLists(lists) : filterTradingLists(lists);

  const [rows, matches] = await Promise.all([
    labelMatchTableLastSeen(toMatchTableRows(filtered), locale),
    loadListMatches(filtered, type === 'seeking' ? 'seeker' : 'offerer', sessionCookie),
  ]);

  return { rows, matchCounts: toMatchCounts(matches) };
}

export async function loadNCOwlsTrades(
  internalId: number,
  itemName: string
): Promise<LebronTrade[]> {
  return loadLebronTradeHistory(internalId, itemName);
}
