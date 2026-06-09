import type { ItemAuctionData } from '@types';

export const AUCTION_CARD_LIMIT = 20;

export function getAuctionCardEntries(auctions: ItemAuctionData[]) {
  return auctions.slice(0, AUCTION_CARD_LIMIT);
}

export function getAuctionCardCount(auctions: ItemAuctionData[]) {
  const count = Math.min(auctions.length, AUCTION_CARD_LIMIT);
  return `${count}${count === AUCTION_CARD_LIMIT ? '+' : ''}`;
}
