import type { ItemAuctionData, ListingRelisting } from '@types';

type AuctionOwnerHashes = ReadonlyMap<number, string | null>;

type AuctionChain = {
  head: ItemAuctionData;
  since: string;
  history: ListingRelisting['history'];
};

/**
 * Collapses relisting chains into their most recent auction.
 * A chain continues when the same owner lists the item again after an auction with no buyer.
 * Keeps the input order; `ownerHashes` is keyed by `internal_id` and never exposed.
 */
export const collapseAuctionRelistings = (
  auctions: ItemAuctionData[],
  ownerHashes: AuctionOwnerHashes
): ItemAuctionData[] => {
  const chains = new Map<string, AuctionChain>();
  const collapsed = new Set<number>();
  const relistings = new Map<number, ListingRelisting>();

  const chronologicalAuctions = [...auctions].sort((a, b) => {
    const dateDifference = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    return dateDifference || a.internal_id - b.internal_id;
  });

  chronologicalAuctions.forEach((auction) => {
    // Auctions without ownerHash have no reliable owner identity, so they are not tracked.
    const ownerHash = ownerHashes.get(auction.internal_id);
    if (!ownerHash) return;

    const chain = chains.get(ownerHash);

    if (!chain || chain.head.hasBuyer) {
      chains.set(ownerHash, { head: auction, since: auction.addedAt, history: [] });
      return;
    }

    chain.history.push({ price: chain.head.price, date: chain.head.addedAt });
    collapsed.add(chain.head.internal_id);
    chain.head = auction;

    relistings.set(auction.internal_id, {
      count: chain.history.length,
      since: chain.since,
      history: [...chain.history].reverse(),
    });
  });

  return auctions
    .filter((auction) => !collapsed.has(auction.internal_id))
    .map((auction) => {
      const relisting = relistings.get(auction.internal_id);
      return relisting ? { ...auction, relisting } : auction;
    });
};
