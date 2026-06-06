import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import CardBase from '@components/Card/CardBase';
import { ItemParentGrid } from '@app/_components/Item/ItemParent/ItemParentGrid';
import { getItemParent } from '@pages/api/v1/items/[id_name]/drops';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

const loadItemParentData = unstable_cache(
  async (internalId: number): Promise<ItemData[]> => {
    const { itemData } = await getItemParent(internalId);
    if (itemData.length === 0) return [];
    return [...itemData].sort(
      (a, b) => (b.item_id ?? b.internal_id) - (a.item_id ?? a.internal_id)
    );
  },
  ['item-parent'],
  { revalidate: 60 }
);

export async function ItemParent({ item }: Props) {
  return (
    <Suspense fallback={null}>
      <ItemParentContent item={item} />
    </Suspense>
  );
}

async function ItemParentContent({ item }: Props) {
  const [parentData, t] = await Promise.all([
    loadItemParentData(item.internal_id),
    getTranslations(),
  ]);

  if (parentData.length === 0) return null;

  return (
    <CardBase title={t('ItemPage.found-inside')} color={item.color.rgb}>
      <ItemParentGrid
        items={parentData}
        labels={{
          showMore: t('ItemPage.show-more'),
          showLess: t('ItemPage.show-less'),
        }}
      />
    </CardBase>
  );
}

export default ItemParent;
