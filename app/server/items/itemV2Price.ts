import { differenceInMonths } from 'date-fns';
import type { ItemPriceField, ItemPriceV2 } from '@types';
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

function mapOwlsPrice(raw: RawItemV2Row): ItemPriceField {
  const range = asString(raw.owlsValue);
  const minValue = asNumber(raw.owlsValueMin);
  const addedAt = asJsonDate(raw.owlsPricedAt);
  if (!range || range === 'null' || minValue === null || !addedAt) return null;

  return {
    type: 'ncValue',
    minValue,
    maxValue: minValue,
    range,
    addedAt,
    source: 'lebron',
  };
}

function mapItemDbNCValue(raw: RawItemV2Row): ItemPriceField {
  const range = asString(raw.ncValueRange);
  const minValue = asNumber(raw.ncValueMin);
  const maxValue = asNumber(raw.ncValueMax);
  const addedAt = asJsonDate(raw.ncValueAddedAt);
  if (!range || minValue === null || maxValue === null || !addedAt) return null;

  return {
    type: 'ncValue',
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
 * Applies the price precedence in one place:
 * no-trade → NC Mall → configured NC value → NP price.
 */
export function mapItemV2Price(raw: RawItemV2Row, options: MapItemV2Options = {}): ItemPriceField {
  if (raw.status === 'no trade') return null;

  if (raw.type === 'nc') {
    const mallPrice = mapMallPrice(raw);
    if (mallPrice) return mallPrice;

    const source = options.ncValuesType ?? process.env.NC_VALUES_TYPE;
    if (source === 'lebron') return mapOwlsPrice(raw);
    if (source === 'itemdb') return mapItemDbNCValue(raw);
    if (source === 'best') return mapOwlsPrice(raw) ?? mapItemDbNCValue(raw);
    return null;
  }

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
