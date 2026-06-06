'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { ItemData, ItemEffect, WearableData } from '@types';

const ItemPreview = dynamic(() => import('@components/Items/ItemPreview'));

type ItemPageWearablePreviewProps = {
  item: ItemData;
  itemEffects: ItemEffect[];
  wearableData: WearableData | null;
};

export function ItemPageWearablePreview({
  item,
  itemEffects,
  wearableData,
}: ItemPageWearablePreviewProps) {
  const colorSpeciesEffect = useMemo(() => {
    if (itemEffects.length === 0) return null;
    return itemEffects.find((effect) => effect.type === 'colorSpecies') ?? null;
  }, [itemEffects]);

  if (!item.isWearable && !colorSpeciesEffect) return null;

  return (
    <ItemPreview colorSpeciesEffect={colorSpeciesEffect} item={item} wearableData={wearableData} />
  );
}
