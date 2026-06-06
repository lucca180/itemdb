import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import NCTrade from '@components/NCTrades';
import { getNCTradeInsights } from '@pages/api/v1/mall/[iid]/insights';
import type { InsightsResponse, ItemData, UserList } from '@types';

type Props = {
  item: ItemData;
  tradeLists?: UserList[];
};

const loadNCTradeInsights = unstable_cache(
  async (internalId: number): Promise<InsightsResponse | null> => {
    return getNCTradeInsights(internalId);
  },
  ['item-nc-trade-insights'],
  { revalidate: 60 * 60 }
);

export async function NCTradeSection({ item, tradeLists }: Props) {
  if (!item.isNC) return null;

  return (
    <Suspense fallback={null}>
      <NCTradeContent item={item} tradeLists={tradeLists} />
    </Suspense>
  );
}

async function NCTradeContent({ item, tradeLists }: Props) {
  const insights = await loadNCTradeInsights(item.internal_id);
  return <NCTrade item={item} lists={tradeLists} insights={insights} />;
}

export default NCTradeSection;
