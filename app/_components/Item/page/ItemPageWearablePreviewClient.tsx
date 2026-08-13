'use client';

import ItemPreview from '@components/Items/ItemPreview';
import type { ItemData, ItemEffect, WearableData } from '@types';

type Props = {
  item: ItemData;
  colorSpeciesEffect: ItemEffect | null;
  wearableData: WearableData | null;
};

export function ItemPageWearablePreviewClient({ item, colorSpeciesEffect, wearableData }: Props) {
  return (
    <ItemPreview colorSpeciesEffect={colorSpeciesEffect} item={item} wearableData={wearableData} />
  );
}
