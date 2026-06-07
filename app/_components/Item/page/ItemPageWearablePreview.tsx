import { ItemPageWearablePreviewClient } from '@app/_components/Item/page/ItemPageWearablePreviewClient';
import type { ItemData, ItemEffect, WearableData } from '@types';

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
  const colorSpeciesEffect =
    itemEffects.length > 0
      ? (itemEffects.find((effect) => effect.type === 'colorSpecies') ?? null)
      : null;

  if (!item.isWearable && !colorSpeciesEffect) return null;

  return (
    <ItemPageWearablePreviewClient
      item={item}
      colorSpeciesEffect={colorSpeciesEffect}
      wearableData={wearableData}
    />
  );
}
