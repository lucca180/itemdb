import type { ItemV2For } from '@types';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** UTC-only so the mock renders identically on server and client, without a locale formatter. */
export function formatDayMonth(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatIssueDate(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export type MallPricing = {
  price: number;
  discountPrice: number | null;
  isDiscounted: boolean;
  saleBegin: string | null;
  saleEnd: string | null;
  discountEnd: string | null;
};

export function getMallPricing(item: ItemV2For<'card'>): MallPricing | null {
  if (item.price?.type !== 'ncMall') return null;

  const { price, discountPrice, discountEnd, saleBegin, saleEnd } = item.price;

  return {
    price,
    discountPrice,
    isDiscounted: discountPrice !== null && discountPrice < price,
    saleBegin,
    saleEnd,
    discountEnd,
  };
}

export function getDiscountPercent(item: ItemV2For<'card'>): number | null {
  const pricing = getMallPricing(item);
  if (!pricing?.isDiscounted || pricing.discountPrice === null || pricing.price === 0) return null;
  return Math.round((1 - pricing.discountPrice / pricing.price) * 100);
}

/** Items without an end date sort last. */
export function getSaleEndTime(item: ItemV2For<'card'>): number {
  const pricing = getMallPricing(item);
  return pricing?.saleEnd ? new Date(pricing.saleEnd).getTime() : Number.POSITIVE_INFINITY;
}

export function formatNcPrice(value: number): string {
  return value === 0 ? 'Free' : `${value.toLocaleString('en-US')} NC`;
}

/** Caption under a new-arrival card. */
export function newArrivalCaption(item: ItemV2For<'card'>): string {
  const pricing = getMallPricing(item);
  if (!pricing) return item.category ?? 'NC item';
  const added = pricing.saleBegin ? `Added ${formatDayMonth(pricing.saleBegin)}` : 'New';
  return `${added} · ${formatNcPrice(pricing.price)}`;
}

/** Caption under a discounted card. */
export function saleCaption(item: ItemV2For<'card'>): string {
  const pricing = getMallPricing(item);
  if (!pricing) return 'On sale';
  const priceLine = pricing.isDiscounted
    ? `${pricing.price.toLocaleString('en-US')} → ${formatNcPrice(pricing.discountPrice ?? pricing.price)}`
    : formatNcPrice(pricing.price);
  const endsLine = pricing.discountEnd ? ` · ends ${formatDayMonth(pricing.discountEnd)}` : '';
  return `${priceLine}${endsLine}`;
}

/** Caption under a leaving-soon card. */
export function leavingCaption(item: ItemV2For<'card'>): string {
  const pricing = getMallPricing(item);
  if (!pricing?.saleEnd) return 'Leaving the mall';
  return `Leaves ${formatDayMonth(pricing.saleEnd)} · ${formatNcPrice(pricing.price)}`;
}
