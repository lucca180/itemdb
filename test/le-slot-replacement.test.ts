import { describe, expect, test } from 'vitest';
import { doesLeReplaceSlot } from '@utils/item/leSlotReplacement';

const openings = (count: number, size: number, limitedEdition: boolean, prefix: string) =>
  Array.from({ length: count }, (_, index) =>
    Array.from({ length: size }, (_, position) => ({
      opening_id: `${prefix}-${index}`,
      // only one LE item per opening, the rest are regular drops
      limitedEdition: limitedEdition && position === 0,
    }))
  ).flat();

describe('doesLeReplaceSlot', () => {
  test('is true when openings have the same size with or without a LE', () => {
    expect(doesLeReplaceSlot([...openings(30, 1, false, 'r'), ...openings(5, 1, true, 'l')])).toBe(
      true
    );
    expect(doesLeReplaceSlot([...openings(30, 5, false, 'r'), ...openings(5, 5, true, 'l')])).toBe(
      true
    );
  });

  test('is false when the LE makes the opening bigger', () => {
    expect(doesLeReplaceSlot([...openings(30, 1, false, 'r'), ...openings(5, 2, true, 'l')])).toBe(
      false
    );
  });

  test('is false without enough openings on either side', () => {
    expect(doesLeReplaceSlot([...openings(30, 1, false, 'r'), ...openings(2, 1, true, 'l')])).toBe(
      false
    );
    expect(doesLeReplaceSlot([...openings(2, 1, false, 'r'), ...openings(30, 1, true, 'l')])).toBe(
      false
    );
    expect(doesLeReplaceSlot([])).toBe(false);
  });

  test('is false for mixed containers with no dominant size', () => {
    const mixed = [...openings(14, 1, false, 'r1'), ...openings(10, 2, false, 'r2')];
    expect(doesLeReplaceSlot([...mixed, ...openings(5, 1, true, 'l')])).toBe(false);
  });

  test('ignores a few oversized openings', () => {
    const noisy = [...openings(40, 1, false, 'r'), ...openings(1, 6, false, 'burst')];
    expect(doesLeReplaceSlot([...noisy, ...openings(6, 1, true, 'l')])).toBe(true);
  });
});
