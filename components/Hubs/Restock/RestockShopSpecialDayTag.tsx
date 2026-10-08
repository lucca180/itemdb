import { Tag } from '@chakra-ui/react';
import { getCachedNow } from '@utils/getCachedNow';
import { getDateNST, getShopRestockSpecialDay, type ShopRestockSpecialDay } from '@utils/utils';

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

export async function RestockShopSpecialDayTag({ shopId, labels }: RestockShopSpecialDayTagProps) {
  // Cached clock: a bare `new Date()` aborts runtime prerenders
  const specialDay = getShopRestockSpecialDay(shopId, getDateNST(await getCachedNow()));
  if (!specialDay) return null;

  return (
    <Tag.Root colorPalette={specialDayColorPalette[specialDay]}>
      <Tag.Label>{labels[specialDay]}</Tag.Label>
    </Tag.Root>
  );
}
