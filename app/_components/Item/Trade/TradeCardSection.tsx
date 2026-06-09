import { Suspense } from 'react';
import TradeCard from '@components/Trades/TradeCard';
import { needsTradeCard } from '@app/_components/Item/itemPageGates';
import { loadItemTrades } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';

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
  const trades = await loadItemTrades(item.internal_id);
  return <TradeCard trades={trades} item={item} />;
}

export default TradeCardSection;
