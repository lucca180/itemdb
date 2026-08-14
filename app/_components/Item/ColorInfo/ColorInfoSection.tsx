import { Suspense } from 'react';
import ColorInfoCard from '@components/Items/ColorInfoCard';
import { loadItemColors } from '@app/_components/Item/loadUtils';
import { DeferredItemSection } from '@app/_components/Item/page/DeferredItemSection';
import type { FullItemColors, ItemData } from '@types';

type Props = {
  item: ItemData;
};

export function ColorInfoSection({ item }: Props) {
  return (
    <Suspense fallback={null}>
      <ColorInfoSectionContent item={item} />
    </Suspense>
  );
}

async function ColorInfoSectionContent({ item }: Props) {
  const colors = await loadItemColors(item.internal_id);
  if (!colors?.vibrant) return null;
  return (
    <DeferredItemSection intrinsicSize="240px">
      <ColorInfoCard colors={colors as FullItemColors} />
    </DeferredItemSection>
  );
}
