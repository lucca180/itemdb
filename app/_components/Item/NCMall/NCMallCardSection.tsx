import { Suspense } from 'react';
import NcMallCard from '@components/Items/NCMallCard';
import { loadNCMallData } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export function NCMallCardSection({ item }: Props) {
  if (!item.isNC) return null;

  return (
    <Suspense fallback={null}>
      <NCMallCardSectionContent item={item} />
    </Suspense>
  );
}

async function NCMallCardSectionContent({ item }: Props) {
  const ncMallData = await loadNCMallData(item.internal_id);
  if (!ncMallData) return null;

  return <NcMallCard item={item} ncMallData={ncMallData} />;
}

export default NCMallCardSection;
