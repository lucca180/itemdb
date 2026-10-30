import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

const prismaMock = vi.hoisted(() => ({
  items: { findFirst: vi.fn() },
  openableItems: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  wearableData: { findMany: vi.fn() },
}));

const checkAuthMock = vi.hoisted(() => vi.fn());
const getItemMock = vi.hoisted(() => vi.fn());

vi.mock('@utils/prisma', () => ({ default: prismaMock }));
vi.mock('@utils/googleCloud', () => ({ CheckAuth: checkAuthMock }));
vi.mock('@pages/api/v1/items/[id_name]', () => ({ getItem: getItemMock }));
vi.mock('@pages/api/v1/items/many', () => ({ getManyItems: vi.fn() }));
vi.mock('@utils/api/redis', () => ({ redis_setDataCount: vi.fn() }));
vi.mock('@utils/item/revalidateItem', () => ({
  ItemRevalidateTags: { drops: vi.fn() },
  revalidateItem: vi.fn(),
}));
vi.mock('@utils/item/markNcItemOpenableFromDrops', () => ({
  maybeMarkNcItemOpenableFromDrops: vi.fn(),
}));

import handler from '@pages/api/v1/items/[id_name]/drops';
import { MANUAL_OPENING_ID } from '@utils/item/itemDropEvidence';

const PARENT_ITEM_ID = 10;
const DROP_ID = 101;

const manualPool = (prizePool: string) => ({
  parent_iid: PARENT_ITEM_ID,
  prizePool,
  opening_id: MANUAL_OPENING_ID,
  isManual: true,
});

const patch = async (body: Record<string, unknown>) => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };

  await handler(
    {
      method: 'PATCH',
      query: { id_name: String(PARENT_ITEM_ID) },
      body,
    } as unknown as NextApiRequest,
    res as unknown as NextApiResponse
  );

  return res;
};

describe('PATCH /api/v1/items/[id_name]/drops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkAuthMock.mockResolvedValue({ user: { isAdmin: true } });
    getItemMock.mockResolvedValue({ internal_id: PARENT_ITEM_ID });
    prismaMock.items.findFirst.mockResolvedValue(null);
    prismaMock.openableItems.findFirst.mockResolvedValue(null);
    prismaMock.openableItems.findMany.mockResolvedValue([]);
    prismaMock.openableItems.updateMany.mockResolvedValue({ count: 0 });
  });

  test('rejects non admins', async () => {
    checkAuthMock.mockResolvedValue({ user: { isAdmin: false } });

    expect((await patch({ action: 'add', poolName: 'normal', drop_id: DROP_ID })).statusCode).toBe(
      401
    );
  });

  test('requires drop_id for drop actions and rejects unknown actions', async () => {
    expect((await patch({ action: 'set-le', poolName: 'normal', isLE: true })).statusCode).toBe(
      400
    );
    expect((await patch({ action: 'nope', poolName: 'normal' })).statusCode).toBe(400);
    expect(prismaMock.openableItems.updateMany).not.toHaveBeenCalled();
  });

  test('adds a manual drop as LE', async () => {
    const res = await patch({ action: 'add', poolName: 'normal', drop_id: DROP_ID, isLE: true });

    expect(res.statusCode).toBe(200);
    expect(prismaMock.openableItems.create).toHaveBeenCalledWith({
      data: { ...manualPool('normal'), item_iid: DROP_ID, limitedEdition: true },
    });
  });

  test('adding a drop already in the pool creates no duplicate row', async () => {
    prismaMock.openableItems.findFirst.mockResolvedValue({ item_iid: DROP_ID });

    const res = await patch({ action: 'add', poolName: 'normal', drop_id: DROP_ID });

    expect(res.statusCode).toBe(200);
    expect(prismaMock.openableItems.findFirst).toHaveBeenCalledWith({
      where: { ...manualPool('normal'), item_iid: DROP_ID },
    });
    expect(prismaMock.openableItems.create).not.toHaveBeenCalled();
  });

  test('set-le updates the manual row of the pool', async () => {
    prismaMock.openableItems.updateMany.mockResolvedValue({ count: 1 });

    await patch({ action: 'set-le', poolName: 'normal', drop_id: DROP_ID, isLE: false });

    expect(prismaMock.openableItems.updateMany).toHaveBeenCalledWith({
      where: { ...manualPool('normal'), item_iid: DROP_ID },
      data: { limitedEdition: false },
    });
    expect(prismaMock.openableItems.create).not.toHaveBeenCalled();
  });

  test('set-le creates a manual LE row when the pool has none for the drop', async () => {
    await patch({ action: 'set-le', poolName: 'clothing', drop_id: DROP_ID, isLE: true });

    expect(prismaMock.openableItems.create).toHaveBeenCalledWith({
      data: { ...manualPool('clothing'), item_iid: DROP_ID, limitedEdition: true },
    });
  });

  test('unmarking without a manual row creates nothing', async () => {
    await patch({ action: 'set-le', poolName: 'clothing', drop_id: DROP_ID, isLE: false });

    expect(prismaMock.openableItems.create).not.toHaveBeenCalled();
  });

  test('renames only the manual rows of a pool', async () => {
    await patch({ action: 'rename-pool', poolName: 'normal', newPoolName: ' Old Normal ' });

    expect(prismaMock.openableItems.updateMany).toHaveBeenCalledWith({
      where: manualPool('normal'),
      data: { prizePool: 'old-normal' },
    });
  });

  test('rejects an empty new pool name', async () => {
    expect(
      (await patch({ action: 'rename-pool', poolName: 'normal', newPoolName: '  ' })).statusCode
    ).toBe(400);
  });

  test('deletes only the manual rows of a pool', async () => {
    const res = await patch({ action: 'delete-pool', poolName: 'normal' });

    expect(prismaMock.openableItems.deleteMany).toHaveBeenCalledWith({
      where: manualPool('normal'),
    });
    expect(res.body).toEqual({ dropUpdate: null, sources: {} });
  });
});
