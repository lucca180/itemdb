import { cacheLife } from 'next/cache';
import { UTCDate } from '@date-fns/utc';

/** Primitive inputs only — full objects make `'use cache'` keys non-deterministic across prerender phases. */
export type NCMallDataDatesInput = {
  saleBegin: string | null;
  saleEnd: string | null;
  discountBegin: string | null;
  discountEnd: string | null;
  active: boolean;
  updatedAt: string;
  firstSeen: string | null;
};

/** Caches so UTCDate's constructor may use `new Date()` during prerender. */
export async function getNCMallDataDates(input: NCMallDataDatesInput) {
  'use cache';
  cacheLife('hours');

  const startDate = input.saleBegin
    ? maxDate(new UTCDate(input.saleBegin), new UTCDate(input.firstSeen ?? 0))
    : null;

  const endDate = !input.active
    ? minDate(new UTCDate(input.saleEnd ?? '2099-01-01'), new UTCDate(input.updatedAt))
    : input.saleEnd
      ? new UTCDate(input.saleEnd)
      : null;

  const discountBegin = input.discountBegin
    ? maxDate(startDate ?? new UTCDate(0), new UTCDate(input.discountBegin ?? 0))
    : null;

  const discountEnd = input.discountEnd
    ? minDate(endDate ?? new UTCDate(9999, 11, 31), new UTCDate(input.discountEnd ?? 0))
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
