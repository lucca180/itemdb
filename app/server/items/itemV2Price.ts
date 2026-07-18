import { differenceInMonths } from 'date-fns';
import type { ItemPriceField, ItemPriceV2, NCValue } from '@types';
import { asJsonDate, asNumber, asString, type RawItemV2Row } from '@app/server/items/itemV2Raw';

export type MapItemV2Options = {
  ncValuesType?: string;
};

/** Same threshold as ItemCardBadge: price older than 6 months is outdated. */
const OUTDATED_AFTER_MONTHS = 6;

function mapMallPrice(raw: RawItemV2Row): ItemPriceField {
  const price = asNumber(raw.ncMallPrice);
  if (price === null) return null;

  return {
    type: 'ncMall',
    price,
    saleBegin: asJsonDate(raw.ncMallSaleBegin),
    saleEnd: asJsonDate(raw.ncMallSaleEnd),
    discountBegin: asJsonDate(raw.ncMallDiscountBegin),
    discountEnd: asJsonDate(raw.ncMallDiscountEnd),
    discountPrice: asNumber(raw.ncMallDiscountPrice),
  };
}

function mapOwlsNcValue(raw: RawItemV2Row): NCValue | null {
  const range = asString(raw.owlsValue);
  const minValue = asNumber(raw.owlsValueMin);
  const addedAt = asJsonDate(raw.owlsPricedAt);
  if (!range || range === 'null' || minValue === null || !addedAt) return null;

  return {
    minValue,
    maxValue: minValue,
    range,
    addedAt,
    source: 'lebron',
  };
}

function mapItemDbNcValue(raw: RawItemV2Row): NCValue | null {
  const range = asString(raw.ncValueRange);
  const minValue = asNumber(raw.ncValueMin);
  const maxValue = asNumber(raw.ncValueMax);
  const addedAt = asJsonDate(raw.ncValueAddedAt);
  if (!range || minValue === null || maxValue === null || !addedAt) return null;

  return {
    minValue,
    maxValue,
    range: minValue >= 30 ? '+30' : range,
    addedAt,
    source: 'itemdb',
  };
}

function isOutdatedPrice(addedAt: unknown): boolean {
  if (!(addedAt instanceof Date) && typeof addedAt !== 'string' && typeof addedAt !== 'number') {
    return false;
  }

  const date = addedAt instanceof Date ? addedAt : new Date(addedAt);
  if (Number.isNaN(date.getTime())) return false;

  return differenceInMonths(Date.now(), date) >= OUTDATED_AFTER_MONTHS;
}

/**
 * Acquisition price in one place: no-trade → NC Mall (for NC) → NP price.
 * NC secondary-market trade value is a separate concern (see {@link mapItemV2NcValue}).
 */
export function mapItemV2Price(raw: RawItemV2Row): ItemPriceField {
  if (raw.status === 'no trade') return null;

  // NC items are not bought with NP; their only acquisition price is the NC Mall (when active).
  if (raw.type === 'nc') return mapMallPrice(raw);

  if (raw.type === 'pb') return null;

  const value = asNumber(raw.npPrice) ?? 0;
  const flags: ItemPriceV2['flags'] = [];
  if (raw.priceInflationId) flags.push('inflation');
  if (isOutdatedPrice(raw.priceAddedAt)) flags.push('outdated');
  if (raw.priceManualCheck) flags.push('unconfirmed');
  if (value === 0) flags.push('unknown');

  return {
    type: 'np',
    value,
    flags,
    addedAt: asJsonDate(raw.priceAddedAt) ?? '',
    context: asString(raw.priceContext),
  };
}

/**
 * NC secondary-market trade value (owls/itemdb, in caps) — independent of the NC Mall price,
 * so an item can carry both. Returns `undefined` when there is no known value, so the
 * response omits the field entirely (only NC items ever have one).
 *
 * Matches v1's exact gate (`item.isNC && item.status === 'active'` in
 * `pages/api/v1/items/many.ts` / `[id_name]/index.ts`): a trade value is only ever
 * surfaced for `active` items, not just "not no-trade" — a retired/other-status NC
 * item should not show a possibly-stale trade value.
 */
export function mapItemV2NcValue(
  raw: RawItemV2Row,
  options: MapItemV2Options = {}
): NCValue | undefined {
  if (raw.status !== 'active' || raw.type !== 'nc') return undefined;

  const source = options.ncValuesType ?? process.env.NC_VALUES_TYPE;
  let value: NCValue | null = null;
  if (source === 'lebron') value = mapOwlsNcValue(raw);
  else if (source === 'itemdb') value = mapItemDbNcValue(raw);
  else if (source === 'best') value = mapOwlsNcValue(raw) ?? mapItemDbNcValue(raw);

  return value ?? undefined;
}
