import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import CardBase from '@components/Card/CardBase';
import { ItemAvyCardList } from '@app/_components/Item/Avy/ItemAvyCardList';
import { getOfficialItemLists } from '@app/_components/Item/loadUtils';
import { getAvyData } from '@pages/api/v1/items/[id_name]/avys';
import { getTranslations } from 'next-intl/server';
import { applyItemSectionCacheTags } from '@utils/applyItemCacheTags';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

async function loadAvyData(internalId: number) {
  'use cache';
  applyItemSectionCacheTags(internalId, 'avy', 'lists');
  cacheLife('itemSection');
  const officialLists = await getOfficialItemLists(internalId);
  return getAvyData(internalId, officialLists);
}

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
