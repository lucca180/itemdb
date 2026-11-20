import { describe, expect, test } from 'vitest';
import { getDynamicListSource, type LinkedListSourceRaw } from '@services/ListService';
import { computeChecklistProgress } from '@utils/list/checklistProgress';

const OWNER = 'list-owner';
const SOURCE_OWNER = 'source-owner';

const linkedList = (overrides: Partial<LinkedListSourceRaw> = {}): LinkedListSourceRaw => ({
  internal_id: 7,
  name: 'Faerie Stamps',
  slug: 'faerie-stamps',
  official: false,
  visibility: 'public',
  user_id: SOURCE_OWNER,
  user: { username: 'sourceuser' },
  ...overrides,
});

const baseList = {
  official: false,
  user_id: OWNER,
  dynamicType: 'fullSync' as const,
  dynamicQuery: null,
  linkedListId: 7,
};

describe('getDynamicListSource', () => {
  test('non dynamic and official lists have no source', () => {
    expect(getDynamicListSource({ ...baseList, dynamicType: null }, OWNER)).toBeNull();
    expect(
      getDynamicListSource({ ...baseList, official: true, linkedList: linkedList() }, OWNER)
    ).toBeNull();
  });

  test('a public source links to its owner, and an official one to /official', () => {
    expect(getDynamicListSource({ ...baseList, linkedList: linkedList() }, null)).toEqual({
      type: 'list',
      name: 'Faerie Stamps',
      href: '/lists/sourceuser/faerie-stamps',
    });

    expect(
      getDynamicListSource({ ...baseList, linkedList: linkedList({ official: true }) }, null)
    ).toMatchObject({ href: '/lists/official/faerie-stamps' });
  });

  test('falls back to the id when the source has no slug', () => {
    expect(
      getDynamicListSource({ ...baseList, linkedList: linkedList({ slug: null }) }, null)
    ).toMatchObject({ href: '/lists/sourceuser/7' });
  });

  test('a private source only shows to its own owner', () => {
    const list = { ...baseList, linkedList: linkedList({ visibility: 'private' }) };

    expect(getDynamicListSource(list, OWNER)).toEqual({ type: 'privateList' });
    expect(getDynamicListSource(list, null)).toEqual({ type: 'privateList' });
    expect(getDynamicListSource(list, SOURCE_OWNER)).toMatchObject({ type: 'list' });
  });

  test('an unlisted source is not revealed to visitors of the list', () => {
    const list = { ...baseList, linkedList: linkedList({ visibility: 'unlisted' }) };

    expect(getDynamicListSource(list, null)).toEqual({ type: 'privateList' });
    expect(getDynamicListSource(list, 'someone-else')).toEqual({ type: 'privateList' });
    expect(getDynamicListSource(list, OWNER)).toMatchObject({ type: 'list' });
  });

  test('a search source never exposes its query', () => {
    const source = { ...baseList, linkedListId: null };

    expect(
      getDynamicListSource({ ...source, dynamicQuery: { s: 'faerie toy', type: ['np'] } }, OWNER)
    ).toEqual({ type: 'search' });
    expect(
      getDynamicListSource({ ...source, dynamicQuery: [{ s: 'a' }, { s: 'b' }] }, null)
    ).toEqual({ type: 'search' });
  });

  test('without a source the list reads as deleted', () => {
    expect(getDynamicListSource({ ...baseList, linkedListId: null }, OWNER)).toEqual({
      type: 'deleted',
    });
  });
});

describe('computeChecklistProgress', () => {
  test('counts hidden rows as collected', () => {
    expect(
      computeChecklistProgress({
        1: { isHidden: true },
        2: { isHidden: false },
        3: { isHidden: true },
      })
    ).toEqual({ collected: 2, total: 3 });
    expect(computeChecklistProgress({})).toEqual({ collected: 0, total: 0 });
  });
});
