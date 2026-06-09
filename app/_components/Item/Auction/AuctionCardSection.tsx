import { Suspense } from 'react';
import AuctionCard from '@components/Auctions/AuctionCard';
import { needsAuctionCard } from '@app/_components/Item/itemPageGates';
import { loadItemAuctions } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';

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
