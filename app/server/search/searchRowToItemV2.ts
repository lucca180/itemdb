import type { ItemIntent, ItemV2For } from '@types';
import { mapItemV2, type MapItemV2Options, type RawItemV2Row } from '@app/server/items/v2';

/**
 * Adapts a raw row produced by the v1 search query (`buildSearchQueryParts` in
 * `mode: 'items'`, which uses v1 column aliases) into the `RAW_COLUMNS` shape
 * `mapItemV2` expects, then delegates to the shared ItemV2 mapper.
 *
 * This keeps the search `queryBuilder` untouched while reusing the single source
 * of truth for price precedence, flags and every field mapper.
 *
 * Columns the search projection does not emit (`priceManualCheck`,
 * `priceContext`) stay undefined here: the `unconfirmed` flag and price
 * `context` are simply absent vs. `/api/v2/items` (accepted parity gap).
 */
export function searchRowToItemV2<I extends ItemIntent>(
  row: RawItemV2Row,
  intent: I,
  options?: MapItemV2Options
): ItemV2For<I> {
  const normalized: RawItemV2Row = {
    // `a.*` already carries the plain Items columns mapItemV2 reads
    // (internal_id, item_id, name, description, image, image_id, imgCacheOverride,
    // category, rarity, weight, type, isWearable/isNeohome/isBD, flags, est_val,
    // status, slug, comment, canonical_id, addedAt, canEat/canRead/canOpen/canPlay).
    ...row,

    // colorHex ← ItemColor `b.hex`
    colorHex: row.hex,

    // NP price ← ItemPrices (`c.price`, `c.addedAt as priceAdded`, `c.noInflation_id`)
    npPrice: row.price,
    priceAddedAt: row.priceAdded,
    priceInflationId: row.noInflation_id,

    // NC Mall ← NcMallData (`n.price as ncPrice`, `n.saleBegin`, ...)
    ncMallPrice: row.ncPrice,
    ncMallSaleBegin: row.saleBegin,
    ncMallSaleEnd: row.saleEnd,
    ncMallDiscountBegin: row.discountBegin,
    ncMallDiscountEnd: row.discountEnd,
    ncMallDiscountPrice: row.discountPrice,

    // itemdb NC value ← ncValues (`d.minValue`, `d.maxValue`, `d.valueRange`,
    // `d.addedAt as ncValueAddedAt` — already matching)
    ncValueMin: row.minValue,
    ncValueMax: row.maxValue,
    ncValueRange: row.valueRange,

    // owls NC value ← owlsPrice (`o.pricedAt as owlsPriced`, `o.value as owlsValue`,
    // `o.valueMin as owlsValueMin` — last two already matching)
    owlsPricedAt: row.owlsPriced,

    // sale status ← SaleStats (`s.stats as stats`, `s.addedAt as saleAdded` — matching)
    saleStats: row.stats,
  };

  return mapItemV2(normalized, intent, options);
}
