import type { ImportPreviewItem } from '@app/[locale]/lists/import/importShared';
import { getNpPriceValue } from '@utils/item/v2';

export type ImportSummary = {
  resolvedCount: number;
  totalQuantity: number;
  pricedNpCount: number;
  unpricedNpCount: number;
  ncCount: number;
  pbCount: number;
  totalNpUnitValue: number;
  totalNpValueWithQty: number;
  totalNcTradeMinValue: number;
};

export function computeImportSummary(items: ImportPreviewItem[]): ImportSummary {
  let totalQuantity = 0;
  let pricedNpCount = 0;
  let unpricedNpCount = 0;
  let ncCount = 0;
  let pbCount = 0;
  let totalNpUnitValue = 0;
  let totalNpValueWithQty = 0;
  let totalNcTradeMinValue = 0;

  for (const { item, quantity } of items) {
    totalQuantity += quantity;

    if (item.type === 'nc') {
      ncCount += 1;
      if (item.ncValue?.minValue) totalNcTradeMinValue += item.ncValue.minValue * quantity;
      continue;
    }

    if (item.type === 'pb') pbCount += 1;

    const unitNp = getNpPriceValue(item.price);
    if (unitNp !== null) {
      pricedNpCount += 1;
      totalNpUnitValue += unitNp;
      totalNpValueWithQty += unitNp * quantity;
    } else if (item.type === 'np') {
      unpricedNpCount += 1;
    }
  }

  return {
    resolvedCount: items.length,
    totalQuantity,
    pricedNpCount,
    unpricedNpCount,
    ncCount,
    pbCount,
    totalNpUnitValue,
    totalNpValueWithQty,
    totalNcTradeMinValue,
  };
}
