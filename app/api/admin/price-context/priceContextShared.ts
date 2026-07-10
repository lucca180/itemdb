import { ItemData } from '@types';

export const MAX_PRICE_CONTEXT_ITEM_IDS = 500;
export const MAX_PRICE_CONTEXT_LENGTH = 191;

export function parseBulkItemIdentifiers(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,]+/)
        .map((token) => token.trim())
        .filter(Boolean)
    ),
  ];
}

export type PriceContextPreviewRow = {
  itemId: number;
  item: ItemData | null;
  price: {
    internal_id: number;
    price: number;
    addedAt: string;
    priceContext: string | null;
    inflated: boolean;
  } | null;
  skippedReason:
    | 'no-price-after-start-date'
    | 'no-inflation-price-after-start-date'
    | 'item-not-found'
    | null;
};

export type PriceContextDropPool = {
  name: string;
  itemCount: number;
  openings: number;
  totalDrops: number;
  minDrop: number;
  maxDrop: number;
};
