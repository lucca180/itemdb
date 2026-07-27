import { cacheLife } from 'next/cache';
import {
  buildPriceTableData,
  type PriceOrMarker,
} from '@app/_components/Item/Price/itemPriceUtils';
import type { PriceData, PriceMarker } from '@types';

export type PriceTableMarkerLabels = {
  unavailableAt: string;
  availableAt: string;
  addedTo: string;
};

/** Builds/sorts price table rows; caches so date-fns `tz()` may use `new Date()` during prerender. */
export async function getCachedPriceTableData(
  data: PriceData[],
  markers: PriceMarker[],
  labels: PriceTableMarkerLabels
): Promise<PriceOrMarker[]> {
  'use cache';
  cacheLife('hours');

  const t = (key: string) => {
    switch (key) {
      case 'ItemPage.unavailable-at':
        return labels.unavailableAt;
      case 'ItemPage.available-at':
        return labels.availableAt;
      case 'ItemPage.added-to':
        return labels.addedTo;
      default:
        return key;
    }
  };

  return buildPriceTableData(data, markers, t);
}
