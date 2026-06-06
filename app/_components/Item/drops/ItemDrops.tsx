import CardBase from '@components/Card/CardBase';
import { ItemDropsContent } from '@app/_components/Item/drops/ItemDropsContent';
import { buildItemDropsContentProps } from '@app/_components/Item/drops/buildItemDropsContentProps';
import { loadDropItemCardData } from '@app/_components/Item/drops/loadItemDrops';
import { getTranslations } from 'next-intl/server';
import type { ItemData, ItemOpenable } from '@types';

type Props = {
  item: ItemData;
  itemOpenable: ItemOpenable;
};

export default async function ItemDrops({ item, itemOpenable }: Props) {
  const [dropItems, t, contentProps] = await Promise.all([
    loadDropItemCardData(Object.keys(itemOpenable.drops).map(Number)),
    getTranslations(),
    buildItemDropsContentProps(item, itemOpenable),
  ]);

  return (
    <CardBase title={t('Drops.item-drops')} color={item.color.rgb}>
      <ItemDropsContent
        item={item}
        itemOpenable={itemOpenable}
        dropItems={dropItems}
        {...contentProps}
      />
    </CardBase>
  );
}
