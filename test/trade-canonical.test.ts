import { describe, expect, test } from 'vitest';
import { canonicalFitsTradeItems } from '@utils/item/tradeCanonical';

const slots = (...amounts: number[]) => amounts.map((amount, order) => ({ order, amount }));

describe('canonicalFitsTradeItems', () => {
  test('fits a lot with the same slots', () => {
    expect(canonicalFitsTradeItems(slots(1, 1), slots(1, 1))).toBe(true);
    expect(canonicalFitsTradeItems(slots(3), slots(3))).toBe(true);
  });

  test('rejects a stacked slot that shares the itemsCount (ITEMDB-88F)', () => {
    expect(canonicalFitsTradeItems(slots(1, 1), slots(2))).toBe(false);
    expect(canonicalFitsTradeItems(slots(2), slots(1, 1))).toBe(false);
  });

  test('rejects the same slot count with other amounts', () => {
    expect(canonicalFitsTradeItems(slots(2, 1), slots(1, 2))).toBe(false);
  });

  test('rejects slots with other orders', () => {
    expect(
      canonicalFitsTradeItems(
        [
          { order: 0, amount: 1 },
          { order: 1, amount: 1 },
        ],
        [
          { order: 0, amount: 1 },
          { order: 2, amount: 1 },
        ]
      )
    ).toBe(false);
  });

  test('treats a missing amount as 1', () => {
    expect(canonicalFitsTradeItems([{ order: 0, amount: null }], [{ order: 0, amount: 1 }])).toBe(
      true
    );
  });
});
