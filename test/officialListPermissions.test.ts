import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

const prismaMock = vi.hoisted(() => ({
  userList: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
}));
const checkAuthMock = vi.hoisted(() => vi.fn());
const updateItemsMock = vi.hoisted(() => vi.fn());

vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@utils/googleCloud', () => ({ CheckAuth: checkAuthMock }));
vi.mock('@utils/triggerAppRevalidation', () => ({ triggerAppRevalidation: vi.fn() }));
vi.mock('@services/ListService', () => ({
  ListService: {
    updateItems: updateItemsMock,
    adminListSeoWriteData: () => ({}),
  },
}));

import { canDeleteList, canEditListInfo } from '@utils/list/listPermissions';
import listHandle from '../pages/api/v1/lists/[username]/[list_id]/index';
import listsHandle from '../pages/api/v1/lists/[username]/index';
import dynamicHandle from '../pages/api/v1/lists/[username]/[list_id]/dynamic';

const CURATOR = { id: 'curator-id', username: 'curator', isAdmin: false, banned: false };
const ADMIN = { id: 'admin-id', username: 'admin', isAdmin: true, banned: false };

const officialList = {
  internal_id: 10,
  name: 'Event Prizes',
  slug: 'event-prizes',
  user_id: CURATOR.id,
  official: true,
  // read by revalidateListCaches
  user: { username: CURATOR.username },
};

const personalList = { ...officialList, internal_id: 20, slug: 'my-list', official: false };

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res as typeof res & NextApiResponse;
}

const req = (method: string, query: Record<string, string>, body: Record<string, unknown>) =>
  ({ method, query, body, headers: {} }) as unknown as NextApiRequest;

describe('list permission rules', () => {
  test('owners edit their non-official lists', () => {
    expect(canEditListInfo({ official: false, ownerId: CURATOR.id }, CURATOR)).toBe(true);
  });

  test('curators cannot edit or delete their official lists', () => {
    expect(canEditListInfo({ official: true, ownerId: CURATOR.id }, CURATOR)).toBe(false);
    expect(canDeleteList({ official: true, ownerId: CURATOR.id }, CURATOR)).toBe(false);
  });

  test('admins edit and delete any list', () => {
    expect(canEditListInfo({ official: true, ownerId: CURATOR.id }, ADMIN)).toBe(true);
    expect(canDeleteList({ official: false, ownerId: CURATOR.id }, ADMIN)).toBe(true);
  });

  test('guests and other users cannot edit', () => {
    expect(canEditListInfo({ official: false, ownerId: CURATOR.id }, null)).toBe(false);
    expect(canEditListInfo({ official: false, ownerId: CURATOR.id }, { id: 'someone-else' })).toBe(
      false
    );
  });
});

describe('POST /api/v1/lists/[username]/[list_id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.userList.findMany.mockResolvedValue([]);
    prismaMock.userList.update.mockResolvedValue({});
  });

  test('curator cannot change official list info', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    const res = mockRes();

    await listHandle(
      req(
        'POST',
        { username: 'curator', list_id: '10' },
        { name: 'New name', visibility: 'private' }
      ),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(prismaMock.userList.update).not.toHaveBeenCalled();
  });

  test('curator can still update official list items', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    const res = mockRes();
    const itemInfo = [{ internal_id: 1, item_iid: 2, amount: 3 }];

    await listHandle(
      req('POST', { username: 'curator', list_id: '10' }, { action: 'update', itemInfo }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(updateItemsMock).toHaveBeenCalledWith(10, itemInfo);
    expect(prismaMock.userList.update).not.toHaveBeenCalled();
  });

  test('non-admins cannot set official-only fields on their own lists', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.findUnique.mockResolvedValue(personalList);
    const res = mockRes();

    await listHandle(
      req(
        'POST',
        { username: 'curator', list_id: '20' },
        {
          name: 'My list',
          official: true,
          officialTag: 'events',
          seriesType: 'listDates',
          seriesStart: '2026-01-01',
        }
      ),
      res
    );

    expect(res.statusCode).toBe(200);
    const { data } = prismaMock.userList.update.mock.calls[0][0];
    expect(data.name).toBe('My list');
    expect(data.official).toBeUndefined();
    expect(data.official_tag).toBeUndefined();
    expect(data).not.toHaveProperty('seriesType');
    expect(data).not.toHaveProperty('seriesStart');
    // `official: true` from the body is ignored, so the slug is not moved to the official namespace
    expect(data.slug).toBe(personalList.slug);
    expect(prismaMock.userList.findMany).not.toHaveBeenCalled();
  });

  test('admins can change official list info', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    prismaMock.userList.findUnique.mockResolvedValue(officialList);
    const res = mockRes();

    await listHandle(
      req(
        'POST',
        { username: 'official', list_id: '10' },
        { description: 'new', officialTag: 'events' }
      ),
      res
    );

    expect(res.statusCode).toBe(200);
    const { data } = prismaMock.userList.update.mock.calls[0][0];
    expect(data.description).toBe('new');
    expect(data.official_tag).toBe('events');
  });
});

describe('DELETE /api/v1/lists/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.userList.deleteMany.mockResolvedValue({ count: 1 });
  });

  test('curator cannot delete official lists', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.count.mockResolvedValue(1);
    const res = mockRes();

    await listsHandle(req('DELETE', { username: 'curator' }, { listIds: ['10', '20'] }), res);

    expect(res.statusCode).toBe(403);
    expect(prismaMock.userList.deleteMany).not.toHaveBeenCalled();
  });

  test('owners still delete their non-official lists', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.count.mockResolvedValue(0);
    const res = mockRes();

    await listsHandle(req('DELETE', { username: 'curator' }, { listIds: ['20'] }), res);

    expect(res.statusCode).toBe(200);
    expect(prismaMock.userList.deleteMany).toHaveBeenCalledOnce();
  });

  test('admins can delete official lists', async () => {
    checkAuthMock.mockResolvedValue({ user: ADMIN });
    const res = mockRes();

    await listsHandle(req('DELETE', { username: 'curator' }, { listIds: ['10'] }), res);

    expect(res.statusCode).toBe(200);
    expect(prismaMock.userList.count).not.toHaveBeenCalled();
    expect(prismaMock.userList.deleteMany).toHaveBeenCalledOnce();
  });
});

describe('POST /api/v1/lists/[username]/[list_id]/dynamic', () => {
  beforeEach(() => vi.clearAllMocks());

  test('curator cannot turn an official list into a dynamic list', async () => {
    checkAuthMock.mockResolvedValue({ user: CURATOR });
    prismaMock.userList.findFirst.mockResolvedValue(officialList);
    const res = mockRes();

    await dynamicHandle(
      req(
        'POST',
        { username: 'curator', list_id: '10' },
        { dynamicType: 'addOnly', queryData: { s: 'test' } }
      ),
      res
    );

    expect(res.statusCode).toBe(403);
    expect(prismaMock.userList.update).not.toHaveBeenCalled();
  });
});
