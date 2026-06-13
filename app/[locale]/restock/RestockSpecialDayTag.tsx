'use client';

import { Tag } from '@chakra-ui/react';
import { getDateNST } from '@utils/utils';
import { useMemo } from 'react';

const specialDayColorPalette = {
  hpd: 'green',
  tyrannia: 'orange',
  usukicon: 'pink',
  festival: 'purple',
  halloween: 'orange',
} as const;

type SpecialDay = keyof typeof specialDayColorPalette | '';

type RestockSpecialDayTagProps = {
  labels: Record<Exclude<SpecialDay, ''>, string>;
};

export function RestockSpecialDayTag({ labels }: RestockSpecialDayTagProps) {
  const specialDay = useMemo((): SpecialDay => {
    const todayNST = getDateNST();
    if (todayNST.getDate() === 3) return 'hpd';
    if (todayNST.getMonth() === 4 && todayNST.getDate() === 12) return 'tyrannia';
    if (todayNST.getMonth() === 7 && todayNST.getDate() === 20) return 'usukicon';
    if (todayNST.getMonth() === 8 && todayNST.getDate() === 20) return 'festival';
    if (todayNST.getMonth() === 9 && todayNST.getDate() === 31) return 'halloween';
    return '';
  }, []);

  if (specialDay === '') return null;

  const label = labels[specialDay];
  if (!label) return null;

  return (
    <Tag.Root colorPalette={specialDayColorPalette[specialDay]}>
      <Tag.Label>{label}</Tag.Label>
    </Tag.Root>
  );
}
