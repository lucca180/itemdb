import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import TradeCard from '@components/Trades/TradeCard';
import { getItemTrades } from '@pages/api/v1/trades';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

const loadItemTrades = unstable_cache(
  async (internalId: number) => getItemTrades({ item_iid: internalId }),
  ['item-trade-card'],
  { revalidate: 60 * 60 }
);

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
