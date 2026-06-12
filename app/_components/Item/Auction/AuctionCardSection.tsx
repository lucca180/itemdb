import { Suspense } from 'react';
import AuctionCard from '@components/Auctions/AuctionCard';
import TradeCard from '@components/Trades/TradeCard';
import { needsAuctionCard } from '@app/_components/Item/itemPageGates';
import { loadItemAuctions, loadItemTrades } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';
import { shouldShowTradeRelisting } from '@utils/tradeRelisting';

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
