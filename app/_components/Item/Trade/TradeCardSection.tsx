import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import TradeCard from '@components/Trades/TradeCard';
import { getItemTrades } from '@pages/api/v1/trades';
import { itemSectionCacheTags } from '@utils/appCacheTags';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

async function loadItemTrades(internalId: number) {
  return unstable_cache(
    async () => getItemTrades({ item_iid: internalId }),
    ['item-trade-card', String(internalId)],
    { revalidate: 60 * 5, tags: [...itemSectionCacheTags(internalId, 'trade')] }
  )();
}

export async function TradeCardSection({ item }: Props) {
  if (item.isNC || item.status !== 'active') return null;

  return (
    <Suspense fallback={null}>
      <TradeCardContent item={item} />
    </Suspense>
  );
}

async function TradeCardContent({ item }: Props) {
  const trades = await loadItemTrades(item.internal_id);
  return <TradeCard trades={trades} item={item} />;
}

export default TradeCardSection;
