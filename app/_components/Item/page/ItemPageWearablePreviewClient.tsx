'use client';

import dynamic from 'next/dynamic';
import type { ItemData, ItemEffect, WearableData } from '@types';

const ItemPreview = dynamic(() => import('@components/Items/ItemPreview'));

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
