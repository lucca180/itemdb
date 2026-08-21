import { cacheLife } from 'next/cache';
import {
  buildPriceTableData,
  type PriceOrMarker,
} from '@app/_components/Item/Price/itemPriceUtils';
import type { PriceData, PriceMarker } from '@types';

export type PriceTableMarkerLabels = {
  unavailableAt: string;
  availableAt: string;
  availableOnlyAt: string;
  addedTo: string;
};

/**
 * Builds/sorts price table rows; caches so date-fns `tz()` may use `new Date()` during prerender.
 *
 * Args must stay deterministic across prerender phases — pass already-sorted arrays and
 * primitive label strings (not a labels object) so cache keys match warming vs final render.
 */
export async function getCachedPriceTableData(
  data: PriceData[],
  markers: PriceMarker[],
  unavailableAt: string,
  availableAt: string,
  availableOnlyAt: string,
  addedTo: string
): Promise<PriceOrMarker[]> {
  'use cache';
  cacheLife('hours');

  const t = (key: string) => {
    switch (key) {
      case 'ItemPage.unavailable-at':
        return unavailableAt;
      case 'ItemPage.available-at':
        return availableAt;
      case 'ItemPage.available-only-at':
        return availableOnlyAt;
      case 'ItemPage.added-to':
        return addedTo;
      default:
        return key;
    }
  };

  return buildPriceTableData(data, markers, t);
}

/** Stable order for `'use cache'` keys — sort before calling {@link getCachedPriceTableData}. */
export function sortPriceTableCacheArgs(data: PriceData[], markers: PriceMarker[]) {
  return {
    data: [...data].sort((a, b) => a.price_id - b.price_id),
    markers: [...markers].sort((a, b) => a.id.localeCompare(b.id)),
  };
}
