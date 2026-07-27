import { cacheLife } from 'next/cache';
import { UTCDate } from '@date-fns/utc';
import type { ItemData, NCMallData } from '@types';

/** Caches so UTCDate's constructor may use `new Date()` during prerender. */
export async function getNCMallDataDates(ncMallData: NCMallData, item: ItemData) {
  'use cache';
  cacheLife('hours');

  const startDate = ncMallData.saleBegin
    ? maxDate(new UTCDate(ncMallData.saleBegin), new UTCDate(item.firstSeen ?? 0))
    : null;

  const endDate = !ncMallData.active
    ? minDate(new UTCDate(ncMallData.saleEnd ?? '2099-01-01'), new UTCDate(ncMallData.updatedAt))
    : ncMallData.saleEnd
      ? new UTCDate(ncMallData.saleEnd)
      : null;

  const discountBegin = ncMallData.discountBegin
    ? maxDate(startDate ?? new UTCDate(0), new UTCDate(ncMallData.discountBegin ?? 0))
    : null;

  const discountEnd = ncMallData.discountEnd
    ? minDate(endDate ?? new UTCDate(9999, 11, 31), new UTCDate(ncMallData.discountEnd ?? 0))
    : null;

  return {
    startDate: startDate?.getTime() ?? null,
    endDate: endDate?.getTime() ?? null,
    discountBegin: discountBegin?.getTime() ?? null,
    discountEnd: discountEnd?.getTime() ?? null,
  };
}

function maxDate(...dates: Date[]): Date {
  return new UTCDate(Math.max(...dates.map((d) => d.getTime())));
}

function minDate(...dates: Date[]): Date {
  return new UTCDate(Math.min(...dates.map((d) => d.getTime())));
}
