import { getLocale } from 'next-intl/server';
import { NCMatchTable } from '@app/_components/Item/NCTrade/NCMatchTable';
import {
  labelMatchTableLastSeen,
  toMatchCounts,
  toMatchTableRows,
} from '@app/_components/Item/NCTrade/matchTableView';
import type { UserList } from '@types';

type Props = {
  data: UserList[];
  matches: { [key: string]: number[] } | null;
  type: 'seeking' | 'trading';
};

export async function MatchTable({ data, matches, type }: Props) {
  const locale = await getLocale();
  const labeled = await labelMatchTableLastSeen(toMatchTableRows(data), locale);
  return <NCMatchTable data={labeled} matchCounts={toMatchCounts(matches)} type={type} />;
}

export default MatchTable;
