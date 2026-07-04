type AuctionPriceSnapshot = {
  price: number | { toString(): string };
  ownerHash: string | null;
  ip_address: string | null;
};

type AuctionPriceInput = {
  price: number;
  ownerHash?: string | null;
  otherInfo?: string | null;
};

export function getAuctionSoldSuffix(otherInfo?: string | null) {
  return !otherInfo?.includes('nobody') ? ', auctionSold' : '';
}

export function auctionHasBuyer(otherInfo?: string | null) {
  return getAuctionSoldSuffix(otherInfo) !== '';
}

export function shouldUpdateAuctionPriceProcess(
  existing: AuctionPriceSnapshot,
  auction: AuctionPriceInput
) {
  if (Number(existing.price) !== auction.price) return true;
  if ((existing.ownerHash ?? null) !== (auction.ownerHash ?? null)) return true;

  const existingSold = existing.ip_address?.includes('auctionSold') ?? false;
  const newSold = auctionHasBuyer(auction.otherInfo);

  return existingSold !== newSold;
}
