import { Suspense } from 'react';
import { ItemPageWearablePreviewClient } from '@app/_components/Item/page/ItemPageWearablePreviewClient';
import { loadItemEffects, loadItemWearableData } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export function ItemPageWearablePreview({ item }: Props) {
  return (
    <Suspense fallback={null}>
      <ItemPageWearablePreviewContent item={item} />
    </Suspense>
  );
}

async function ItemPageWearablePreviewContent({ item }: Props) {
  const itemEffects = await loadItemEffects(item);
  const colorSpeciesEffect =
    itemEffects.length > 0
      ? (itemEffects.find((effect) => effect.type === 'colorSpecies') ?? null)
      : null;

  if (!item.isWearable && !colorSpeciesEffect) return null;

  const wearableData = item.isWearable ? await loadItemWearableData(item.internal_id) : null;

  return (
    <ItemPageWearablePreviewClient
      item={item}
      colorSpeciesEffect={colorSpeciesEffect}
      wearableData={wearableData}
    />
  );
}
