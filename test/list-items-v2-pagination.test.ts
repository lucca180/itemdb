import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@utils/api/redis', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@utils/api/redis')>();
  return { ...actual, trackItemQuota: vi.fn() };
});

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return { ...actual, after: vi.fn() };
});

vi.mock('@utils/auth/getServerCurrentUser', () => ({
  getServerCurrentUser: vi.fn().mockResolvedValue({ user: null }),
}));

vi.mock('@services/list/listItemsV2Cache', () => ({
  readListItemIds: vi.fn().mockResolvedValue(null),
  scheduleListItemIdsWrite: vi.fn(),
}));

import { GET } from '@app/api/v2/lists/[username]/[list_id]/itemdata/route';
import { ItemService } from '@services/ItemService';
import { ListService } from '@services/ListService';
import { LIST_ITEMS_MAX_LIMIT, fetchListItemsV2 } from '@services/list/listItemsV2';
import type { UserList } from '@types';

const makeIds = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

const mockMembers = (ids: number[]) => {
  vi.spyOn(ItemService, 'search').mockResolvedValue({
    content: ids.map((internal_id) => ({ internal_id })),
  } as any);

  return vi.spyOn(ItemService, 'getCachedManyItems').mockImplementation((async (query: any) => {
    const body: Record<string, { internal_id: number }> = {};
    for (const id of query.data) body[id] = { internal_id: Number(id) };
    return { body: JSON.stringify(body), dbCount: query.data.length };
  }) as any);
};

const baseOpts = {
  includeHidden: false,
  intent: 'card' as const,
  asObject: false,
  fresh: false,
};

const list = { internal_id: 1, official: false } as UserList;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchListItemsV2 pagination', () => {
  test('returns only the requested page and flags a next page', async () => {
    const getMany = mockMembers(makeIds(10));

    const res = await fetchListItemsV2(list, { ...baseOpts, page: 1, limit: 4 });

    expect((res.data as any[]).map((i) => i.internal_id)).toEqual([1, 2, 3, 4]);
    expect(res.hasNextPage).toBe(true);
    expect(getMany.mock.calls[0][0]).toEqual({ type: 'id', data: ['1', '2', '3', '4'] });
  });

  test('last page is partial and has no next page', async () => {
    mockMembers(makeIds(10));

    const res = await fetchListItemsV2(list, { ...baseOpts, page: 3, limit: 4 });

    expect((res.data as any[]).map((i) => i.internal_id)).toEqual([9, 10]);
    expect(res.hasNextPage).toBe(false);
  });

  test('a page that ends exactly on the last item has no next page', async () => {
    mockMembers(makeIds(8));

    const res = await fetchListItemsV2(list, { ...baseOpts, page: 2, limit: 4 });

    expect((res.data as any[]).map((i) => i.internal_id)).toEqual([5, 6, 7, 8]);
    expect(res.hasNextPage).toBe(false);
  });

  test('a page past the end is empty', async () => {
    mockMembers(makeIds(3));

    const res = await fetchListItemsV2(list, { ...baseOpts, page: 5, limit: 4 });

    expect(res.data).toEqual([]);
    expect(res.hasNextPage).toBe(false);
  });

  test('asObject only holds the requested page', async () => {
    mockMembers(makeIds(10));

    const res = await fetchListItemsV2(list, { ...baseOpts, asObject: true, page: 2, limit: 4 });

    expect(Object.keys(res.data)).toEqual(['5', '6', '7', '8']);
    expect(res.hasNextPage).toBe(true);
  });
});

describe('GET /api/v2/lists/[username]/[list_id]/itemdata', () => {
  const callRoute = async (query = '') => {
    const getListItemsV2 = vi.fn().mockResolvedValue({
      data: [],
      dbCount: 0,
      hasNextPage: true,
      list,
    });
    vi.spyOn(ListService, 'initUser').mockReturnValue({ getListItemsV2 } as any);

    const request = new NextRequest(`http://localhost/api/v2/lists/lucca/7470/itemdata${query}`);
    const response = await GET(request, {
      params: Promise.resolve({ username: 'lucca', list_id: '7470' }),
    });

    return { response, params: getListItemsV2.mock.calls[0][0] };
  };

  test('defaults to page 1 and the maximum limit', async () => {
    const { params } = await callRoute();

    expect(params.page).toBe(1);
    expect(params.limit).toBe(LIST_ITEMS_MAX_LIMIT);
  });

  test('clamps limit to the maximum and page to at least 1', async () => {
    const { params } = await callRoute('?limit=999999&page=-3');

    expect(params.limit).toBe(LIST_ITEMS_MAX_LIMIT);
    expect(params.page).toBe(1);
  });

  test('forwards a valid page and limit', async () => {
    const { params } = await callRoute('?limit=100&page=3');

    expect(params.limit).toBe(100);
    expect(params.page).toBe(3);
  });

  test('exposes whether there is a next page in a header', async () => {
    const { response } = await callRoute();

    expect(response.headers.get('x-itemdb-has-next-page')).toBe('true');
  });
});
