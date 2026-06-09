import { Suspense } from 'react';
import CardBase from '@components/Card/CardBase';
import { ItemParentGrid } from '@app/_components/Item/ItemParent/ItemParentGrid';
import { loadItemParentData } from '@app/_components/Item/loadUtils';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

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
