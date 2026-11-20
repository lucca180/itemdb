import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

const prismaMock = vi.hoisted(() => {
  const mock = {
    userList: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    listItems: { findMany: vi.fn() },
    listContext: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    listContextItem: { createMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: typeof mock) => unknown)(mock)
  );
  return mock;
});
const checkAuthMock = vi.hoisted(() => vi.fn());
const logOfficialListActionMock = vi.hoisted(() => vi.fn());

vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@utils/googleCloud', () => ({ CheckAuth: checkAuthMock }));
vi.mock('@utils/triggerAppRevalidation', () => ({ triggerAppRevalidation: vi.fn() }));
vi.mock('@services/OfficialListLogService', () => ({
  logOfficialListAction: logOfficialListActionMock,
}));

import { triggerAppRevalidation } from '@utils/triggerAppRevalidation';
import contextsHandle from '../pages/api/v1/lists/[username]/[list_id]/contexts/index';
import contextHandle from '../pages/api/v1/lists/[username]/[list_id]/contexts/[context_id]';

const CURATOR = { id: 'curator-id', username: 'curator', isAdmin: false, banned: false };
const ADMIN = { id: 'admin-id', username: 'admin', isAdmin: true, banned: false };

const officialList = {
  internal_id: 10,
  name: 'Event Prizes',
  slug: 'event-prizes',
  user_id: CURATOR.id,
  official: true,
  visibility: 'public',
  // read by revalidateListCaches
  user: { username: CURATOR.username },
};
const personalList = { ...officialList, internal_id: 20, official: false };

const DATE = new Date('2026-11-20T00:00:00Z');

const contextRow = (
  overrides: Record<string, unknown> = {},
  items: { item_iid: number; isHidden: boolean }[] = []
) => ({
  internal_id: 5,
  list_id: 10,
  badgeText: 'Bonus 1',
  title: null,
  description: null,
  color: '#d69e2e',
  order: 0,
  mode: 'both',
  createdAt: DATE,
  updatedAt: DATE,
  items: items.map((listItem) => ({ listItem })),
  ...overrides,
});

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
    setHeader(key: string, value: string) {
      this.headers[key] = value;
      return this;
    },
  };
  return res as typeof res & NextApiResponse;
}

const req = (method: string, query: Record<string, string>, body: unknown = {}) =>
  ({ method, query, body, headers: {}, cookies: {} }) as unknown as NextApiRequest;

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.listContext.count.mockResolvedValue(0);
  prismaMock.listContext.aggregate.mockResolvedValue({ _max: { order: 2 } });
  prismaMock.listContext.create.mockResolvedValue({ internal_id: 5 });
});

describe('POST /api/v1/lists/[username]/[list_id]/contexts', () => {
  test('curators cannot add contexts to their official lists', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    const res = mockRes();

    await contextsHandle(
      req('POST', { username: 'official', list_id: '10' }, { badgeText: 'A', color: '#fff' }),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(prismaMock.listContext.create).not.toHaveBeenCalled();
  });

  test('guests cannot add contexts', async () => {
    checkAuthMock.mockResolvedValue({ user: null });
    const res = mockRes();

    await contextsHandle(
      req('POST', { username: 'curator', list_id: '20' }, { badgeText: 'A', color: '#fff' }),
      res
    );

    expect(res.statusCode).toBe(401);
  });

  test('owners add contexts to their own lists', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.findUnique.mockResolvedValue(personalList);
    prismaMock.listContext.findUniqueOrThrow.mockResolvedValue(contextRow({ list_id: 20 }));
    const res = mockRes();

    await contextsHandle(
      req('POST', { username: 'curator', list_id: '20' }, { badgeText: 'A', color: '#fff' }),
      res
    );

    expect(res.statusCode).toBe(200);
    // item page tags are only revalidated for official lists
    expect(triggerAppRevalidation).toHaveBeenCalledTimes(1);
  });

  test('admins create a context linked to list items', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listItems.findMany.mockResolvedValue([
      { internal_id: 100, item_iid: 71440 },
      { internal_id: 101, item_iid: 71441 },
    ]);
    prismaMock.listContext.findUniqueOrThrow.mockResolvedValue(
      contextRow({}, [
        { item_iid: 71441, isHidden: false },
        { item_iid: 71440, isHidden: false },
      ])
    );
    const res = mockRes();

    await contextsHandle(
      req(
        'POST',
        { username: 'official', list_id: '10' },
        { badgeText: '  Bonus 1 ', color: '#d69e2e', title: ' ', itemIids: [71440, '71441', 71440] }
      ),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(prismaMock.listItems.findMany).toHaveBeenCalledWith({
      where: { list_id: 10, item_iid: { in: [71440, 71441] } },
      select: { internal_id: true, item_iid: true },
    });
    expect(prismaMock.listContext.create).toHaveBeenCalledWith({
      data: {
        list_id: 10,
        badgeText: 'Bonus 1',
        title: null,
        description: null,
        color: '#d69e2e',
        // after the last context (max order 2)
        order: 3,
        mode: 'both',
      },
    });
    expect(prismaMock.listContextItem.createMany).toHaveBeenCalledWith({
      data: [
        { context_id: 5, listItem_id: 100 },
        { context_id: 5, listItem_id: 101 },
      ],
      skipDuplicates: true,
    });
    expect(res.body).toMatchObject({
      internal_id: 5,
      badgeText: 'Bonus 1',
      itemIids: [71440, 71441],
    });
    expect(logOfficialListActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ internal_id: 10, official: true }),
      'createContext',
      { context_id: 5, badgeText: 'Bonus 1', item_iids: [71440, 71441] },
      ADMIN
    );

    const tags = vi.mocked(triggerAppRevalidation).mock.calls.flatMap(([p]) => p.tags);
    expect(tags).toContain('item-71440-lists');
    expect(tags).toContain('item-71441-lists');
  });

  test('items outside the list are rejected', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listItems.findMany.mockResolvedValue([{ internal_id: 100, item_iid: 71440 }]);
    const res = mockRes();

    await contextsHandle(
      req(
        'POST',
        { username: 'official', list_id: '10' },
        { badgeText: 'A', color: '#fff', itemIids: [71440, 999] }
      ),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Items not in this list: 999' });
    expect(prismaMock.listContext.create).not.toHaveBeenCalled();
  });

  test.each([
    [{ color: '#fff' }, 'badgeText is required'],
    [{ badgeText: '   ', color: '#fff' }, 'badgeText is required'],
    [{ badgeText: 'A', color: 'red' }, 'Invalid color (expected hex like #aabbcc)'],
    [{ badgeText: 'A', color: '#fff', itemIids: [1.5] }, 'Invalid itemIids'],
  ])('invalid body %j is rejected', async (body, error) => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    const res = mockRes();

    await contextsHandle(req('POST', { username: 'official', list_id: '10' }, body), res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error });
  });

  test('a list has a context limit', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listContext.count.mockResolvedValue(100);
    const res = mockRes();

    await contextsHandle(
      req('POST', { username: 'official', list_id: '10' }, { badgeText: 'A', color: '#fff' }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(prismaMock.listContext.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/lists/[username]/[list_id]/contexts', () => {
  test('guests do not see hidden items', async () => {
    checkAuthMock.mockResolvedValue({ user: null });
    prismaMock.userList.findFirst.mockResolvedValue({
      ...officialList,
      visibleItemCount: 2,
      createdAt: DATE,
      updatedAt: DATE,
      user: { ...CURATOR, neo_user: null, last_login: DATE },
    });
    prismaMock.listContext.findMany.mockResolvedValue([
      contextRow({}, [
        { item_iid: 2, isHidden: false },
        { item_iid: 1, isHidden: true },
      ]),
    ]);
    const res = mockRes();

    await contextsHandle(req('GET', { username: 'official', list_id: 'event-prizes' }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject([{ internal_id: 5, itemIids: [2] }]);
    expect(prismaMock.listContext.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { list_id: 10 },
        orderBy: [{ order: 'asc' }, { internal_id: 'asc' }],
      })
    );
    expect(res.headers['Cache-Control']).toContain('s-maxage');
  });
});

describe('PATCH/DELETE /api/v1/lists/[username]/[list_id]/contexts/[context_id]', () => {
  test('contexts of another list are not found', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listContext.findUnique.mockResolvedValue(contextRow({ list_id: 99 }));
    const res = mockRes();

    await contextHandle(
      req('PATCH', { username: 'official', list_id: '10', context_id: '5' }, { badgeText: 'B' }),
      res
    );

    expect(res.statusCode).toBe(404);
    expect(prismaMock.listContext.update).not.toHaveBeenCalled();
  });

  test('itemIids replace the context items', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listContext.findUnique.mockResolvedValue(
      contextRow({}, [
        { item_iid: 1, isHidden: false },
        { item_iid: 2, isHidden: false },
      ])
    );
    prismaMock.listItems.findMany.mockResolvedValue([
      { internal_id: 102, item_iid: 2 },
      { internal_id: 103, item_iid: 3 },
    ]);
    prismaMock.listContext.findUniqueOrThrow.mockResolvedValue(
      contextRow({ badgeText: 'B' }, [
        { item_iid: 2, isHidden: false },
        { item_iid: 3, isHidden: false },
      ])
    );
    const res = mockRes();

    await contextHandle(
      req(
        'PATCH',
        { username: 'official', list_id: '10', context_id: '5' },
        { badgeText: 'B', itemIids: [2, 3] }
      ),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(prismaMock.listContext.update).toHaveBeenCalledWith({
      where: { internal_id: 5 },
      data: { badgeText: 'B' },
    });
    expect(prismaMock.listContextItem.deleteMany).toHaveBeenCalledWith({
      where: { context_id: 5, listItem_id: { notIn: [102, 103] } },
    });
    expect(prismaMock.listContextItem.createMany).toHaveBeenCalledWith({
      data: [
        { context_id: 5, listItem_id: 102 },
        { context_id: 5, listItem_id: 103 },
      ],
      skipDuplicates: true,
    });

    // item 1 left the context, so its item page changes too
    const tags = vi.mocked(triggerAppRevalidation).mock.calls.flatMap(([p]) => p.tags);
    expect(tags).toEqual(expect.arrayContaining(['item-1-lists', 'item-2-lists', 'item-3-lists']));
  });

  test('fields left out are not changed', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listContext.findUnique.mockResolvedValue(contextRow());
    prismaMock.listContext.findUniqueOrThrow.mockResolvedValue(contextRow({ color: '#000' }));
    const res = mockRes();

    await contextHandle(
      req('PATCH', { username: 'official', list_id: '10', context_id: '5' }, { color: '#000' }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(prismaMock.listContext.update).toHaveBeenCalledWith({
      where: { internal_id: 5 },
      data: { color: '#000' },
    });
    expect(prismaMock.listContextItem.deleteMany).not.toHaveBeenCalled();
  });

  test('mode can be changed on its own', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listContext.findUnique.mockResolvedValue(contextRow());
    prismaMock.listContext.findUniqueOrThrow.mockResolvedValue(contextRow({ mode: 'grouping' }));
    const res = mockRes();

    await contextHandle(
      req('PATCH', { username: 'official', list_id: '10', context_id: '5' }, { mode: 'grouping' }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(prismaMock.listContext.update).toHaveBeenCalledWith({
      where: { internal_id: 5 },
      data: { mode: 'grouping' },
    });
    expect(res.body).toMatchObject({ mode: 'grouping' });
  });

  test('unknown modes are rejected', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    const res = mockRes();

    await contextsHandle(
      req(
        'POST',
        { username: 'official', list_id: '10' },
        { badgeText: 'A', color: '#fff', mode: 'hidden' }
      ),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(prismaMock.listContext.create).not.toHaveBeenCalled();
  });

  test('admins delete a context', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listContext.findUnique.mockResolvedValue(
      contextRow({}, [{ item_iid: 7, isHidden: false }])
    );
    const res = mockRes();

    await contextHandle(
      req('DELETE', { username: 'official', list_id: '10', context_id: '5' }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(prismaMock.listContext.delete).toHaveBeenCalledWith({ where: { internal_id: 5 } });
    expect(logOfficialListActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ internal_id: 10 }),
      'deleteContext',
      { context_id: 5, badgeText: 'Bonus 1', item_iids: [7] },
      ADMIN
    );
  });

  test('curators cannot delete contexts of official lists', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    const res = mockRes();

    await contextHandle(
      req('DELETE', { username: 'official', list_id: '10', context_id: '5' }),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(prismaMock.listContext.delete).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/v1/lists/[username]/[list_id]/contexts (reorder)', () => {
  test('admins reorder the contexts of a list', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listContext.findMany
      .mockResolvedValueOnce([{ internal_id: 5 }, { internal_id: 6 }])
      .mockResolvedValueOnce([
        contextRow({ internal_id: 6, order: 0 }, [{ item_iid: 8, isHidden: true }]),
        contextRow({ internal_id: 5, order: 1 }, [{ item_iid: 7, isHidden: false }]),
      ]);
    prismaMock.listContext.update.mockResolvedValue({});
    const res = mockRes();

    await contextsHandle(
      req('PATCH', { username: 'official', list_id: '10' }, { contextIds: [6, '5'] }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(prismaMock.listContext.update).toHaveBeenCalledWith({
      where: { internal_id: 6 },
      data: { order: 0 },
    });
    expect(prismaMock.listContext.update).toHaveBeenCalledWith({
      where: { internal_id: 5 },
      data: { order: 1 },
    });
    expect(prismaMock.listContext.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ orderBy: [{ order: 'asc' }, { internal_id: 'asc' }] })
    );
    // the editor needs hidden items too
    expect(res.body).toMatchObject([
      { internal_id: 6, order: 0, itemIids: [8] },
      { internal_id: 5, order: 1, itemIids: [7] },
    ]);
    expect(logOfficialListActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ internal_id: 10 }),
      'reorderContexts',
      { context_ids: [6, 5] },
      ADMIN
    );

    const tags = vi.mocked(triggerAppRevalidation).mock.calls.flatMap(([p]) => p.tags);
    expect(tags).toContain('item-7-lists');
    expect(tags).toContain('item-8-lists');
  });

  test.each([
    ['a context is missing', [6]],
    ['a context is repeated', [5, 5]],
    ['a context belongs to another list', [5, 99]],
    ['the ids are not a list', 5],
  ])('rejected when %s', async (_, contextIds) => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    prismaMock.listContext.findMany.mockResolvedValue([{ internal_id: 5 }, { internal_id: 6 }]);
    const res = mockRes();

    await contextsHandle(
      req('PATCH', { username: 'official', list_id: '10' }, { contextIds }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(prismaMock.listContext.update).not.toHaveBeenCalled();
  });

  test('curators cannot reorder contexts of official lists', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    const res = mockRes();

    await contextsHandle(
      req('PATCH', { username: 'official', list_id: '10' }, { contextIds: [5] }),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(prismaMock.listContext.update).not.toHaveBeenCalled();
  });
});
