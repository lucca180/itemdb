import { describe, expect, it } from 'vitest';
import {
  applyDragSortOrder,
  computeListQtyCount,
  filterHiddenItemInfoIds,
  filterItemInfoIdsBySearch,
  getOnlyHiddenEmptyState,
  hasServerFilters,
  shouldMergeListItems,
} from '@app/[locale]/lists/[username]/[list_id]/listPageStateHelpers';
import { defaultFilters } from '@utils/parseFilters';
import type { ItemV2For, ListItemInfo } from '@types';

const itemInfoRow = (
  id: number,
  item_iid: string,
  overrides: Partial<ListItemInfo> = {}
): ListItemInfo =>
  ({
    internal_id: id,
    item_iid,
    amount: 1,
    isHidden: false,
    isHighlight: false,
    order: id,
    ...overrides,
  }) as ListItemInfo;

describe('listPageStateHelpers', () => {
  it('keeps only hidden rows, in the given order', () => {
    const itemInfo = {
      1: itemInfoRow(1, '1', { isHidden: true }),
      2: itemInfoRow(2, '2'),
      3: itemInfoRow(3, '3', { isHidden: true }),
    };

    expect(filterHiddenItemInfoIds([3, 2, 1], itemInfo)).toEqual([3, 1]);
  });

  describe('getOnlyHiddenEmptyState', () => {
    const itemInfo = {
      1: itemInfoRow(1, '1', { isHidden: true }),
      2: itemInfoRow(2, '2', { isHidden: true }),
      3: itemInfoRow(3, '3'),
    };
    const base = { itemInfo, onlyHidden: false, isEdit: false, isLoading: false };

    it('points to the hidden rows when none of the matches is visible', () => {
      expect(getOnlyHiddenEmptyState({ ...base, matchingIds: [1, 2] })).toEqual({
        showing: 'visible',
        otherCount: 2,
      });
    });

    it('points to the visible rows when the switch finds nothing hidden', () => {
      expect(getOnlyHiddenEmptyState({ ...base, matchingIds: [3], onlyHidden: true })).toEqual({
        showing: 'hidden',
        otherCount: 1,
      });
    });

    it('still explains the empty switch view when nothing matches at all', () => {
      expect(getOnlyHiddenEmptyState({ ...base, matchingIds: [], onlyHidden: true })).toEqual({
        showing: 'hidden',
        otherCount: 0,
      });
    });

    it('stays out of the way when the view has rows or nothing matches', () => {
      expect(getOnlyHiddenEmptyState({ ...base, matchingIds: [1, 3] })).toBeNull();
      expect(getOnlyHiddenEmptyState({ ...base, matchingIds: [1], onlyHidden: true })).toBeNull();
      expect(getOnlyHiddenEmptyState({ ...base, matchingIds: [] })).toBeNull();
    });

    it('ignores loads and edit mode, which lists hidden rows', () => {
      expect(getOnlyHiddenEmptyState({ ...base, matchingIds: [1], isLoading: true })).toBeNull();
      expect(getOnlyHiddenEmptyState({ ...base, matchingIds: [1], isEdit: true })).toBeNull();
    });
  });

  it('detects active server filters', () => {
    expect(hasServerFilters(defaultFilters)).toBe(false);
    expect(hasServerFilters({ ...defaultFilters, rarity: ['rare'] })).toBe(true);
  });

  it('filters item ids by client search query', () => {
    const itemInfo = {
      1: itemInfoRow(1, '100', {}),
      2: itemInfoRow(2, '200', {}),
    };
    const items = {
      '100': { internal_id: 100, name: 'Apple' },
      '200': { internal_id: 200, name: 'Banana' },
    } as unknown as Record<string, ItemV2For<'card'>>;

    expect(filterItemInfoIdsBySearch([1, 2], itemInfo, items, 'app')).toEqual([1]);
  });

  it('uses the db unique count in the tooltip while tiered load is in progress', () => {
    const itemInfo = { 1: itemInfoRow(1, '100', { amount: 2 }) };
    const count = computeListQtyCount({
      displayedItemInfoIds: [1],
      itemInfo,
      isLoading: true,
      needsFullLoad: true,
      isServerFiltered: false,
      cachedVisibleCount: 99,
    });

    expect(count.visibleQty).toBe(2);
    expect(count.visible).toBe(99);
  });

  it('blocks stale suspense merges when server filters are active', () => {
    expect(shouldMergeListItems({ mergeGeneration: 0, fromSuspense: true }, 0, true)).toBe(false);
    expect(shouldMergeListItems({ mergeGeneration: 0, fromSuspense: true }, 1, false)).toBe(false);
    expect(shouldMergeListItems({ mergeGeneration: 0, fromSuspense: true }, 0, false)).toBe(true);
  });

  it('returns null when drag sort order is unchanged', () => {
    const itemInfo = {
      1: itemInfoRow(1, '100'),
      2: itemInfoRow(2, '200'),
    };

    expect(applyDragSortOrder([1, 2], itemInfo, [1, 2])).toBeNull();
  });
});
