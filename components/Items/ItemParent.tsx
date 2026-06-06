import CardBase from '@components/Card/CardBase';
import { ItemParentGrid } from '@components/Items/ItemParentGrid';
import { getTranslations } from 'next-intl/server';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
  parent: {
    parents_iid: number[];
    itemData: ItemData[];
  };
};

export default async function ItemParent(props: Props) {
  const t = await getTranslations();
  const { item, parent } = props;
  const parentData = [...parent.itemData].sort(
    (a, b) => (b.item_id ?? b.internal_id) - (a.item_id ?? a.internal_id)
  );

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
