import { Suspense } from 'react';
import { getItemDrops } from '@pages/api/v1/items/[id_name]/drops';
import { ItemPageOutfitSection } from '@app/_components/Item/page/ItemPageOutfitSection';
import type { ItemData } from '@types';

const isPetDayCapsule = (name: string) => /Day Y\d+ Mini Mystery Capsule/i.test(name);

async function ItemPageOutfitSectionContent({ item }: { item: ItemData }) {
  const itemOpenable = await getItemDrops(item.internal_id, item.isNC);
  if (!itemOpenable) return null;

  return <ItemPageOutfitSection item={item} itemOpenable={itemOpenable} />;
}

type Props = {
  item: ItemData;
};

export function ItemPageOutfitSectionLoader({ item }: Props) {
  if (item.isWearable || !isPetDayCapsule(item.name)) return null;
  if (item.useTypes.canOpen === 'false') return null;

  return (
    <Suspense fallback={null}>
      <ItemPageOutfitSectionContent item={item} />
    </Suspense>
  );
}
