'use client';

import { Tag } from '@chakra-ui/react';
import { getShopRestockSpecialDay, type ShopRestockSpecialDay } from '@utils/utils';

const specialDayColorPalette = {
  hpd: 'green',
  tyrannia: 'orange',
  usukicon: 'pink',
  festival: 'purple',
  halloween: 'orange',
} as const satisfies Record<ShopRestockSpecialDay, string>;

type RestockShopSpecialDayTagProps = {
  shopId: string | number;
  labels: Record<ShopRestockSpecialDay, string>;
};

export function RestockShopSpecialDayTag({ shopId, labels }: RestockShopSpecialDayTagProps) {
  const specialDay = getShopRestockSpecialDay(shopId);
  if (!specialDay) return null;

  return (
    <Tag.Root colorPalette={specialDayColorPalette[specialDay]}>
      <Tag.Label>{labels[specialDay]}</Tag.Label>
    </Tag.Root>
  );
}
