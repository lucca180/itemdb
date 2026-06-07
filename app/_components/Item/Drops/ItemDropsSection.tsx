import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import ItemDrops from '@app/_components/Item/Drops/ItemDrops';
import { ItemDropsFallbackShell } from '@app/_components/Item/Drops/ItemDropsFallbackShell';
import { loadItemOpenableMeta } from '@app/_components/Item/Drops/loadItemDrops';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export async function ItemDropsSection({ item }: Props) {
  const [itemOpenable, t] = await Promise.all([loadItemOpenableMeta(item), getTranslations()]);

  if (!itemOpenable) return null;

  const fallback = <ItemDropsFallbackShell item={item} title={t('Drops.item-drops')} />;

  return (
    <Suspense fallback={fallback}>
      <ItemDrops item={item} itemOpenable={itemOpenable} />
    </Suspense>
  );
}
