import { describe, expect, it } from 'vitest';
import {
  HomeRevalidateTags,
  ItemRevalidateTags,
  MAX_CACHE_TAG_LENGTH,
  fitCacheTag,
  isAppCacheTag,
  itemRootTag,
  itemSectionCacheTags,
  itemSectionTag,
  listItemsTag,
  listMutationCacheTags,
  parseItemSectionTag,
  parseItemTagInternalId,
  requiresImmediateRevalidation,
  userMatchesTag,
} from '@utils/appCacheTags';

describe('appCacheTags', () => {
  it('builds root and section tags', () => {
    expect(itemRootTag(42)).toBe('item-42');
    expect(itemSectionTag(42, 'mme')).toBe('item-42-mme');
    expect(itemSectionCacheTags(7, 'drops')).toEqual(['item-7', 'item-7-drops']);
    expect(itemSectionCacheTags(7, 'auction')).toEqual(['item-7', 'item-7-auction']);
    expect(itemSectionCacheTags(7, 'trade')).toEqual(['item-7', 'item-7-trade']);
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

  it('builds list mutation tag sets', () => {
    expect(listMutationCacheTags('lucca', 7)).toEqual([
      'list-items-lucca-7-preload',
      'list-items-lucca-7-full',
      'list-items-lucca-7-full-owner',
      'user-lists-lucca',
    ]);
  });

  it('requires immediate revalidation for list mutation tags only', () => {
    expect(requiresImmediateRevalidation(listItemsTag('lucca', 7, 'full'))).toBe(true);
    expect(requiresImmediateRevalidation('user-lists-lucca')).toBe(true);
    expect(requiresImmediateRevalidation(HomeRevalidateTags.latestItems)).toBe(false);
  });

  it('builds and validates list item cache tags', () => {
    expect(listItemsTag('official', 42, 'preload')).toBe('list-items-official-42-preload');
    expect(isAppCacheTag(listItemsTag('lucca', 7, 'full'))).toBe(true);
    expect(isAppCacheTag(listItemsTag('lucca', 7, 'full-owner'))).toBe(true);
    expect(isAppCacheTag('list-items-lucca-7-unknown')).toBe(false);
  });

  it('fitCacheTag truncates tags over MAX_CACHE_TAG_LENGTH', () => {
    const long = 'a'.repeat(250);
    expect(fitCacheTag(long)).toHaveLength(MAX_CACHE_TAG_LENGTH);
    expect(fitCacheTag('short')).toBe('short');
    expect(userMatchesTag('x'.repeat(120), 'y'.repeat(120)).length).toBeLessThanOrEqual(
      MAX_CACHE_TAG_LENGTH
    );
  });
});
