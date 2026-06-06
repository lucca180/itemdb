'use client';

import dynamic from 'next/dynamic';
import type { ItemData, ItemOpenable } from '@types';

const ItemOutfit = dynamic(() => import('@components/Items/ItemOutfit'));

const isPetDayCapsule = (name: string) => /Day Y\d+ Mini Mystery Capsule/i.test(name);

type ItemPageOutfitSectionProps = {
  item: ItemData;
  itemOpenable: ItemOpenable;
};

export function ItemPageOutfitSection({ item, itemOpenable }: ItemPageOutfitSectionProps) {
  if (item.isWearable || !isPetDayCapsule(item.name)) return null;

  return (
    <ItemOutfit
      outfitList={Object.keys(itemOpenable.drops).map((iid) => parseInt(iid))}
      item={item}
    />
  );
}
