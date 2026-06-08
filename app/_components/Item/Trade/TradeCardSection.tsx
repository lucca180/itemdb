import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import TradeCard from '@components/Trades/TradeCard';
import { getItemTrades } from '@pages/api/v1/trades';
import { applyItemSectionCacheTags } from '@utils/applyItemCacheTags';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

async function loadItemTrades(internalId: number) {
  'use cache';
  applyItemSectionCacheTags(internalId, 'trade');
  cacheLife('itemSection');
  return getItemTrades({ item_iid: internalId });
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
