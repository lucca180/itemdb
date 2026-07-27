import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { needsTradeCard } from '@app/_components/Item/itemPageGates';
import { loadItemTrades } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';
import { shouldShowTradeRelisting } from '@utils/item/tradeRelisting';

const TradeCard = dynamic(() => import('@components/Trades/TradeCard'), {
  loading: () => null,
});

type Props = {
  item: ItemData;
};

export async function TradeCardSection({ item }: Props) {
  if (!needsTradeCard(item)) return null;

  return (
    <Suspense fallback={null}>
      <TradeCardContent item={item} />
    </Suspense>
  );
}

async function TradeCardContent({ item }: Props) {
  const trades = await loadItemTrades(item.internal_id, shouldShowTradeRelisting(item));
  return <TradeCard trades={trades} item={item} />;
}

export default TradeCardSection;
