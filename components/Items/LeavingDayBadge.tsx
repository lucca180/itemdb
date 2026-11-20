'use client';

import { Badge, type BadgeProps } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useClientNow } from '@utils/useClientNow';
import { getNSTDayDiff } from '@utils/utils';

type LeavingDayBadgeProps = BadgeProps & {
  saleEnd: Date | string | number;
};

/** "Today!" / "Tomorrow" badge for NC Mall items leaving on the current or next NST day. */
export function LeavingDayBadge({ saleEnd, ...badgeProps }: LeavingDayBadgeProps) {
  const t = useTranslations();
  const now = useClientNow();
  if (now === null) return null;

  const dayDiff = getNSTDayDiff(saleEnd, now);
  if (dayDiff !== 0 && dayDiff !== 1) return null;

  return (
    <Badge colorPalette={dayDiff === 0 ? 'red' : 'orange'} {...badgeProps}>
      {dayDiff === 0 ? t('NcMall.leaving-today') : t('NcMall.leaving-tomorrow')}
    </Badge>
  );
}
