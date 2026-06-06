import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import CardBase from '@components/Card/CardBase';
import { ItemAvyCardList } from '@app/_components/Item/Avy/ItemAvyCardList';
import { getOfficialItemLists } from '@app/utils/loadUtils';
import { getAvyData } from '@pages/api/v1/items/[id_name]/avys';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

const loadAvyData = unstable_cache(
  async (internalId: number) => {
    const officialLists = await getOfficialItemLists(internalId);
    return getAvyData(internalId, officialLists);
  },
  ['item-avy-card'],
  { revalidate: 60 * 60 }
);

export async function ItemAvyCard({ item }: Props) {
  return (
    <Suspense fallback={null}>
      <ItemAvyCardContent item={item} />
    </Suspense>
  );
}

async function ItemAvyCardContent({ item }: Props) {
  const [avyData, t] = await Promise.all([loadAvyData(item.internal_id), getTranslations()]);

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
