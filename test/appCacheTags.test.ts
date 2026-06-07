import { describe, expect, it } from 'vitest';
import {
  HomeRevalidateTags,
  ItemRevalidateTags,
  isAppCacheTag,
  itemRootTag,
  itemSectionCacheTags,
  itemSectionTag,
  parseItemSectionTag,
  parseItemTagInternalId,
} from '@utils/appCacheTags';

describe('appCacheTags', () => {
  it('builds root and section tags', () => {
    expect(itemRootTag(42)).toBe('item-42');
    expect(itemSectionTag(42, 'mme')).toBe('item-42-mme');
    expect(itemSectionCacheTags(7, 'drops')).toEqual(['item-7', 'item-7-drops']);
  });

  it('builds revalidation presets', () => {
    expect(ItemRevalidateTags.root(7)).toEqual(['item-7']);
    expect(ItemRevalidateTags.drops(7)).toEqual(['item-7-drops', 'item-7-drop-items']);
    expect(ItemRevalidateTags.effects(7)).toEqual(['item-7-effects', 'item-7-wearable']);
  });

  it('parses item tags', () => {
    expect(parseItemTagInternalId('item-99')).toBe(99);
    expect(parseItemTagInternalId('item-99-petpet')).toBe(99);
    expect(parseItemSectionTag('item-99-petpet')).toEqual({
      internalId: 99,
      scope: 'petpet',
    });
  });

  it('validates known tags', () => {
    expect(isAppCacheTag(HomeRevalidateTags.latestItems)).toBe(true);
    expect(isAppCacheTag(itemRootTag(1))).toBe(true);
    expect(isAppCacheTag(itemSectionTag(1, 'avy'))).toBe(true);
    expect(isAppCacheTag('item-1-unknown-scope')).toBe(false);
    expect(isAppCacheTag('not-a-tag')).toBe(false);
  });
});
