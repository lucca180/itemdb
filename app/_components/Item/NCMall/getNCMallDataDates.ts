export type NCMallDataDatesInput = {
  saleBegin: string | null;
  saleEnd: string | null;
  discountBegin: string | null;
  discountEnd: string | null;
  active: boolean;
  updatedAt: string;
  firstSeen: string | null;
};

const FAR_FUTURE_SALE_END = Date.parse('2099-01-01');
const FAR_FUTURE_DISCOUNT_END = Date.UTC(9999, 11, 31);

/**
 * Pure timestamp math (no `new Date()` without args), so it is safe during prerender
 * without `'use cache'`. Deep `'use cache'` calls here were missed by the cache warming phase.
 */
export function getNCMallDataDates(input: NCMallDataDatesInput) {
  const startDate = input.saleBegin
    ? Math.max(Date.parse(input.saleBegin), toTime(input.firstSeen))
    : null;

  const endDate = !input.active
    ? Math.min(
        input.saleEnd ? Date.parse(input.saleEnd) : FAR_FUTURE_SALE_END,
        Date.parse(input.updatedAt)
      )
    : input.saleEnd
      ? Date.parse(input.saleEnd)
      : null;

  const discountBegin = input.discountBegin
    ? Math.max(startDate ?? 0, Date.parse(input.discountBegin))
    : null;

  const discountEnd = input.discountEnd
    ? Math.min(endDate ?? FAR_FUTURE_DISCOUNT_END, Date.parse(input.discountEnd))
    : null;

  return { startDate, endDate, discountBegin, discountEnd };
}

function toTime(value: string | null) {
  return value ? Date.parse(value) : 0;
}
