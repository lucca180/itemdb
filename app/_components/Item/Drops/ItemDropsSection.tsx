import { Suspense } from 'react';
import { after } from 'next/server';
import { getTranslations } from 'next-intl/server';
import ItemDrops from '@app/_components/Item/Drops/ItemDrops';
import { ItemDropsFallbackShell } from '@app/_components/Item/Drops/ItemDropsFallbackShell';
import { loadItemOpenableMeta } from '@app/_components/Item/Drops/loadItemDrops';
import {
  isNcUnknownOpenable,
  maybeMarkNcItemOpenableFromDrops,
} from '@utils/item/markNcItemOpenableFromDrops';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export async function ItemDropsSection({ item }: Props) {
  const [itemOpenable, t] = await Promise.all([
    loadItemOpenableMeta(item.internal_id, item.useTypes.canOpen),
    getTranslations(),
  ]);

  if (!itemOpenable) return null;

  if (isNcUnknownOpenable(item)) {
    after(async () => {
      await maybeMarkNcItemOpenableFromDrops(item);
    });
  }

  const fallback = <ItemDropsFallbackShell item={item} title={t('Drops.item-drops')} />;

  return (
    <Suspense fallback={fallback}>
      <ItemDrops item={item} itemOpenable={itemOpenable} />
    </Suspense>
  );
}
