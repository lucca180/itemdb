import { describe, expect, test } from 'vitest';
import { getImageId } from '@utils/item/imageId';

describe('getImageId', () => {
  test('extracts the image id from Neopets item URLs', () => {
    expect(getImageId('https://images.neopets.com/items/mall_mutant_cape.gif')).toBe(
      'mall_mutant_cape'
    );
    expect(getImageId('//images.neopets.com/items/foo-bar_1.gif?v=2')).toBe('foo-bar_1');
    expect(getImageId('foo.gif')).toBe('foo');
  });

  test('returns undefined when there is no .gif', () => {
    expect(getImageId('https://images.neopets.com/items/foo.png')).toBeUndefined();
    expect(getImageId('')).toBeUndefined();
  });

  test('stays linear on long inputs without separators', () => {
    const start = performance.now();
    getImageId('-'.repeat(1_000_000));
    getImageId('https://images.neopets.com/items/' + '-'.repeat(1_000_000) + '.png');
    expect(performance.now() - start).toBeLessThan(500);
  });
});
