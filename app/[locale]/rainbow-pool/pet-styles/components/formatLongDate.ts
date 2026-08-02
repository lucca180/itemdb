'use client';

import { useFormatter } from 'next-intl';

/** Same shape as NC trade / item-page long dates (`NCTradeHistoryCard`). */
export function useFormatLongDate() {
  const format = useFormatter();

  return (isoDate: string) =>
    format.dateTime(new Date(isoDate), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'utc',
    });
}
