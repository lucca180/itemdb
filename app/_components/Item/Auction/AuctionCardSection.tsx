import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { needsAuctionCard } from '@app/_components/Item/itemPageGates';
import { loadItemAuctions, loadItemTrades } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';
import { shouldShowTradeRelisting } from '@utils/item/tradeRelisting';

const AuctionCard = dynamic(() => import('@components/Auctions/AuctionCard'), {
  loading: () => null,
});
const TradeCard = dynamic(() => import('@components/Trades/TradeCard'), {
  loading: () => null,
});

type Props = {
  item: ItemData;
};

export async function AuctionCardSection({ item }: Props) {
  if (!needsAuctionCard(item)) return null;

  return (
    <Suspense fallback={null}>
      <AuctionCardContent item={item} />
    </Suspense>
  );
}

async function AuctionCardContent({ item }: Props) {
  const auctionData = await loadItemAuctions(item.internal_id);
  if (auctionData.recent.length === 0) {
    const trades = await loadItemTrades(item.internal_id, shouldShowTradeRelisting(item));
    return <TradeCard trades={trades} item={item} />;
  }

  return (
    <AuctionCard
      auctions={auctionData.recent}
      item={item}
      totalSold={auctionData.totalSold}
      soldMedianPrice={auctionData.soldMedianPrice}
    />
  );
}

export default AuctionCardSection;
