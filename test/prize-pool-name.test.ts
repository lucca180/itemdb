import { describe, expect, test } from 'vitest';
import {
  composePoolName,
  decomposePoolName,
  emptyPoolNameOptions,
  getPoolNameWarnings,
  parsePoolName,
  validatePoolNameOptions,
} from '@utils/item/prizePoolName';

describe('prize pool names', () => {
  test('composes every flag in an order getItemDrops parses back', () => {
    const name = composePoolName({
      ...emptyPoolNameOptions,
      base: 'Cat 1',
      isOld: true,
      isChance: true,
      isLE: true,
      minDrop: 1,
      maxDrop: 3,
    });

    expect(name).toBe('old-1-3-cat-1-chance-le');
    expect(parsePoolName(name)).toEqual({
      isLE: true,
      isChance: true,
      isOld: true,
      isGram: false,
      isBonus: false,
      minDrop: 1,
      maxDrop: 3,
    });
  });

  test('puts the drop range before a base ending in a digit', () => {
    const name = composePoolName({ ...emptyPoolNameOptions, base: 'cat1', minDrop: 2, maxDrop: 4 });

    expect(name).toBe('2-4-cat1');
    expect(parsePoolName(name)).toMatchObject({ minDrop: 2, maxDrop: 4 });
  });

  test('bonus ignores every other field', () => {
    expect(composePoolName({ ...emptyPoolNameOptions, base: 'x', isLE: true, isBonus: true })).toBe(
      'bonus'
    );
    expect(decomposePoolName('Bonus')).toEqual({ ...emptyPoolNameOptions, isBonus: true });
  });

  test('decomposes a composed name back into the same options', () => {
    const options = {
      ...emptyPoolNameOptions,
      base: 'normal',
      isOld: true,
      isGram: true,
      minDrop: 1,
      maxDrop: 2,
    };

    expect(decomposePoolName(composePoolName(options))).toEqual(options);
  });

  test('validates the name and the drop range', () => {
    expect(validatePoolNameOptions(emptyPoolNameOptions)).toBe('Enter a pool name');
    expect(validatePoolNameOptions({ ...emptyPoolNameOptions, isLE: true })).toBeNull();
    expect(validatePoolNameOptions({ ...emptyPoolNameOptions, base: 'a', minDrop: 1 })).toBe(
      'Fill both min and max, or leave both empty'
    );
    expect(
      validatePoolNameOptions({ ...emptyPoolNameOptions, base: 'a', minDrop: 3, maxDrop: 1 })
    ).toBe("Min can't be greater than max");
  });

  test('warns about flags the base name triggers by accident', () => {
    expect(getPoolNameWarnings({ ...emptyPoolNameOptions, base: 'programs' })).toHaveLength(1);
    expect(
      getPoolNameWarnings({ ...emptyPoolNameOptions, base: 'programs', isGram: true })
    ).toEqual([]);
    expect(getPoolNameWarnings({ ...emptyPoolNameOptions, base: 'cat1-2' })).toHaveLength(1);
  });
});
