import { Suspense } from 'react';
import ColorInfoCard from '@components/Items/ColorInfoCard';
import { loadItemColors } from '@app/_components/Item/loadUtils';
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
  const colors = await loadItemColors(item);
  if (!colors?.vibrant) return null;
  return <ColorInfoCard colors={colors as FullItemColors} />;
}
