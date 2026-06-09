import { Suspense } from 'react';
import CardBase from '@components/Card/CardBase';
import { ItemAvyCardList } from '@app/_components/Item/Avy/ItemAvyCardList';
import { needsTradeLists } from '@app/_components/Item/itemPageGates';
import { loadAvyData } from '@app/_components/Item/loadUtils';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export async function ItemAvyCard({ item }: Props) {
  return (
    <Suspense fallback={null}>
      <ItemAvyCardContent item={item} />
    </Suspense>
  );
}

async function ItemAvyCardContent({ item }: Props) {
  const [avyData, t] = await Promise.all([
    loadAvyData(item.internal_id, needsTradeLists(item)),
    getTranslations(),
  ]);

  if (!avyData || avyData.length === 0) return null;

  return (
    <CardBase title={t('ItemPage.avatars')} color={item.color.rgb}>
      <ItemAvyCardList
        avyData={avyData}
        labels={{
          showMore: t('ItemPage.show-more'),
          showLess: t('ItemPage.show-less'),
          itemList: t('ItemPage.item-list'),
        }}
      />
    </CardBase>
  );
}

export default ItemAvyCard;
