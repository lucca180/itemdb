import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, getManyItemsMock } = vi.hoisted(() => ({
  prismaMock: {
    $queryRaw: vi.fn(),
    listItems: { findMany: vi.fn() },
  },
  getManyItemsMock: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@services/ItemService', () => ({
  ItemService: { getManyItems: getManyItemsMock },
}));

import {
  decideImportCandidates,
  findImportCandidates,
  resolveImportItems,
  splitNameImageKey,
} from '@utils/list/resolveImportItems';

type Row = { internal_id: number; name: string; image_id: string };

const item = (internal_id: number, name: string) => ({
  internal_id,
  item_id: internal_id,
  name,
  slug: name.toLowerCase().replaceAll(' ', '-'),
  image: { id: `img-${internal_id}`, url: '' },
  description: '',
  type: 'np',
  status: 'active',
});

beforeEach(() => {
  vi.clearAllMocks();
  getManyItemsMock.mockImplementation(async (query: { data: number[] }) =>
    Object.fromEntries(query.data.map((id) => [String(id), item(id, `Item ${id}`)]))
  );
});

describe('splitNameImageKey', () => {
  it('splits on the last comma so names can contain commas', () => {
    expect(splitNameImageKey('Love, Laughs, Xweetoks,boo_love')).toEqual([
      'Love, Laughs, Xweetoks',
      'boo_love',
    ]);
    expect(splitNameImageKey('no image')).toEqual(['no image', '']);
  });
});

describe('decideImportCandidates', () => {
  const keys = ['single', 'pinanna', 'fondant', 'pizza', 'missing'];
  const candidates = new Map([
    ['single', [1]],
    ['pinanna', [10, 11, 12, 13]],
    ['fondant', [20, 21]],
    ['pizza', [30, 31]],
  ]);
  // 21 (Mega Ultra Fondant, r101) is not in the official list
  const eligible = new Set([1, 10, 11, 12, 13, 20, 30, 31]);

  it('takes every eligible candidate when the page count covers them', () => {
    const res = decideImportCandidates(keys, candidates, eligible, { pinanna: 4, pizza: 2 });

    expect(res.resolved.get('single')).toEqual([1]);
    expect(res.resolved.get('pinanna')).toEqual([10, 11, 12, 13]);
    expect(res.resolved.get('fondant')).toEqual([20]);
    expect(res.resolved.get('pizza')).toEqual([30, 31]);
    expect(res.ambiguous).toEqual([]);
    expect(res.notFoundKeys).toEqual(['missing']);
  });

  it('reports keys with more candidates than the page count as ambiguous', () => {
    const res = decideImportCandidates(keys, candidates, eligible, { pinanna: 2 });

    expect(res.resolved.has('pinanna')).toBe(false);
    expect(res.resolved.has('pizza')).toBe(false);
    expect(res.ambiguous).toEqual([
      { key: 'pinanna', count: 2, candidateIds: [10, 11, 12, 13] },
      { key: 'pizza', count: 1, candidateIds: [30, 31] },
    ]);
  });

  it('keeps every candidate when none of them is in the recommended list', () => {
    const res = decideImportCandidates(['fondant'], candidates, new Set([999]), {});
    expect(res.ambiguous).toEqual([{ key: 'fondant', count: 1, candidateIds: [20, 21] }]);
  });

  it('is ambiguous without a recommended list', () => {
    const res = decideImportCandidates(['fondant'], candidates, null, {});
    expect(res.ambiguous).toHaveLength(1);
  });

  it('keeps a lone candidate even outside the recommended list', () => {
    const res = decideImportCandidates(['single'], candidates, new Set([999]), {});
    expect(res.resolved.get('single')).toEqual([1]);
  });
});

describe('findImportCandidates', () => {
  it('groups image_id matches case-insensitively under the session key', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { internal_id: 7531, name: 'Guide to Maraquan Krawks', image_id: 'book_krawk_maraquan' },
      { internal_id: 8053, name: 'Tales from the Deep', image_id: 'Book_Krawk_Maraquan' },
    ] satisfies Row[]);

    const res = await findImportCandidates('image_id', ['book_krawk_maraquan']);
    expect(res.get('book_krawk_maraquan')).toEqual([7531, 8053]);
  });

  it('matches name_image_id exactly and falls back to the image for unmatched names', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([
        { internal_id: 8053, name: 'Tales from the Deep', image_id: 'book_krawk_maraquan' },
      ] satisfies Row[])
      .mockResolvedValueOnce([
        { internal_id: 7531, name: 'Guide to Maraquan Krawks', image_id: 'book_krawk_maraquan' },
        { internal_id: 8053, name: 'Tales from the Deep', image_id: 'book_krawk_maraquan' },
      ] satisfies Row[]);

    const res = await findImportCandidates('name_image_id', [
      'Tales from the Deep,book_krawk_maraquan',
      'Guide to Maraquan Krawkz,book_krawk_maraquan', // typo on the page
    ]);

    expect(res.get('Tales from the Deep,book_krawk_maraquan')).toEqual([8053]);
    // the book already claimed by name is not offered again
    expect(res.get('Guide to Maraquan Krawkz,book_krawk_maraquan')).toEqual([7531]);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('skips the image fallback when every name matched', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { internal_id: 1, name: 'Billy Blue Hat', image_id: 'book_billyblue' },
    ] satisfies Row[]);

    await findImportCandidates('name_image_id', ['Billy Blue Hat,book_billyblue']);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });
});

describe('resolveImportItems', () => {
  it('expands shared keys, reports ambiguity and loads candidates for the preview', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { internal_id: 1, name: 'Water Pizza', image_id: 'pizza_water' },
      { internal_id: 2, name: 'Deluxe Water Pizza', image_id: 'pizza_water' },
      { internal_id: 3, name: 'Pinanna Plus', image_id: 'tropical_pinenanna' },
      { internal_id: 4, name: 'Evil Pinanna', image_id: 'tropical_pinenanna' },
      { internal_id: 5, name: 'Asparagus Pie', image_id: 'food_asparagus3' },
    ] satisfies Row[]);
    prismaMock.listItems.findMany.mockResolvedValueOnce(
      [1, 2, 3, 4].map((item_iid) => ({ item_iid }))
    );

    const res = await resolveImportItems({
      indexType: 'image_id',
      keys: ['pizza_water', 'tropical_pinenanna', 'food_asparagus3', 'unknown'],
      keyCounts: { pizza_water: 2 },
      recommendedListId: 72,
      intent: 'card',
      withAmbiguousItems: true,
    });

    expect(Object.keys(res.data).sort()).toEqual([
      'food_asparagus3',
      'pizza_water#1',
      'pizza_water#2',
    ]);
    expect(res.notFoundKeys).toEqual(['unknown']);
    expect(res.ambiguous).toHaveLength(1);
    expect(res.ambiguous[0].key).toBe('tropical_pinenanna');
    expect(res.ambiguous[0].candidates.map((c) => c.internal_id)).toEqual([3, 4]);
    expect(prismaMock.listItems.findMany).toHaveBeenCalledWith({
      where: { list_id: 72, item_iid: { in: [1, 2, 3, 4] } },
      select: { item_iid: true },
    });
  });

  it('does not load ambiguous candidates when applying', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([
      { internal_id: 3, name: 'Pinanna Plus', image_id: 'tropical_pinenanna' },
      { internal_id: 4, name: 'Evil Pinanna', image_id: 'tropical_pinenanna' },
    ] satisfies Row[]);

    const res = await resolveImportItems({
      indexType: 'image_id',
      keys: ['tropical_pinenanna'],
      recommendedListId: null,
      intent: 'full',
    });

    expect(res.data).toEqual({});
    expect(res.ambiguous).toEqual([{ key: 'tropical_pinenanna', count: 1, candidates: [] }]);
    expect(getManyItemsMock).not.toHaveBeenCalled();
    expect(prismaMock.listItems.findMany).not.toHaveBeenCalled();
  });
});
