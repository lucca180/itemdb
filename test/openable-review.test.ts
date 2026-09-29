import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  items: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  openableItems: {
    findMany: vi.fn(),
  },
}));

const getManyItemsMock = vi.hoisted(() => vi.fn());
const createLogMock = vi.hoisted(() => vi.fn());
const revalidateItemMock = vi.hoisted(() => vi.fn());

vi.mock('server-only', () => ({}));

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@services/ItemService', () => ({
  ItemService: { getManyItems: getManyItemsMock },
}));

vi.mock('@services/ActionLogService', () => ({
  LogService: { createLog: createLogMock },
}));

vi.mock('@utils/item/revalidateItem', () => ({
  revalidateItem: revalidateItemMock,
  ItemRevalidateTags: { root: (id: number) => [`item-${id}`] },
}));

import {
  listOpenableCandidates,
  markItemOpenable,
  OpenableReviewInputError,
  parseOpenableReviewDays,
} from '@services/OpenableReviewService';
import type { User } from '@types';

const admin = { id: 'admin-uid', isAdmin: true } as User;

const parent = (internal_id: number, overrides: Record<string, unknown> = {}) => ({
  internal_id,
  isNC: false,
  canOpen: 'false',
  canPlay: 'unknown',
  canEat: 'unknown',
  canRead: 'unknown',
  ...overrides,
});

/** One community opening per id, each reporting `item_iid`. */
const openings = (parent_iid: number, item_iid: number, count: number, prefix = 'op') =>
  Array.from({ length: count }, (_, i) => ({
    parent_iid,
    opening_id: `${prefix}-${parent_iid}-${item_iid}-${i}`,
    item_iid,
    notes: null,
  }));

beforeEach(() => {
  vi.clearAllMocks();
  getManyItemsMock.mockImplementation(async ({ data }: { data: string[] }) =>
    Object.fromEntries(data.map((id) => [Number(id), { internal_id: Number(id), name: `#${id}` }]))
  );
});

describe('parseOpenableReviewDays', () => {
  test('defaults to one 7-day step and keeps valid values', () => {
    expect(parseOpenableReviewDays(null)).toBe(7);
    expect(parseOpenableReviewDays('abc')).toBe(7);
    expect(parseOpenableReviewDays('3')).toBe(7);
    expect(parseOpenableReviewDays('14')).toBe(14);
    expect(parseOpenableReviewDays('999999')).toBe(3650);
  });
});

describe('listOpenableCandidates', () => {
  test('keeps items whose drops would show, newest internal_id first', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([
        { parent_iid: 10, recentOpenings: BigInt(2), lastOpeningAt: new Date('2026-09-20') },
        { parent_iid: 30, recentOpenings: BigInt(1), lastOpeningAt: '2026-09-25T00:00:00.000Z' },
        { parent_iid: 20, recentOpenings: BigInt(1), lastOpeningAt: new Date('2026-09-21') },
      ])
      .mockResolvedValueOnce([{ found: 1 }]);
    prismaMock.items.findMany.mockResolvedValue([parent(10), parent(20), parent(30)]);
    prismaMock.openableItems.findMany.mockResolvedValue([
      // 10: same drop in 2 openings -> accepted (NP neutral minimum support is 2)
      ...openings(10, 100, 2),
      // 20: single report -> not accepted
      ...openings(20, 200, 1),
      // 30: accepted drop plus a noisy one
      ...openings(30, 300, 3),
      ...openings(30, 301, 1, 'noise'),
    ]);

    const result = await listOpenableCandidates({ days: 7, onlyWouldShowDrops: true });

    expect(result.days).toBe(7);
    expect(result.hasOlder).toBe(true);
    expect(result.candidates.map((c) => c.internal_id)).toEqual([30, 10]);
    expect(result.candidates[0]).toMatchObject({
      recentOpenings: 1,
      totalOpenings: 4,
      lastOpeningAt: '2026-09-25T00:00:00.000Z',
      wouldShowDrops: true,
    });
    expect(result.candidates[0].drops.map((d) => [d.item_iid, d.accepted, d.support])).toEqual([
      [300, true, 3],
      [301, false, 1],
    ]);
  });

  test('includes items whose drops would not show when asked', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([
        { parent_iid: 20, recentOpenings: BigInt(1), lastOpeningAt: new Date() },
      ])
      .mockResolvedValueOnce([]);
    prismaMock.items.findMany.mockResolvedValue([parent(20)]);
    prismaMock.openableItems.findMany.mockResolvedValue(openings(20, 200, 1));

    const result = await listOpenableCandidates({ days: 7, onlyWouldShowDrops: false });

    expect(result.hasOlder).toBe(false);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].wouldShowDrops).toBe(false);
  });

  test('returns an empty list without loading items when nothing was reported', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await listOpenableCandidates({ days: 7, onlyWouldShowDrops: true });

    expect(result.candidates).toEqual([]);
    expect(prismaMock.items.findMany).not.toHaveBeenCalled();
    expect(getManyItemsMock).not.toHaveBeenCalled();
  });
});

describe('markItemOpenable', () => {
  test('marks the item, logs under the admin and revalidates it', async () => {
    prismaMock.items.findUnique.mockResolvedValue({ canOpen: 'false' });

    await expect(markItemOpenable({ itemIid: 42, admin })).resolves.toEqual({ internal_id: 42 });

    expect(prismaMock.items.update).toHaveBeenCalledWith({
      where: { internal_id: 42 },
      data: { canOpen: 'true' },
    });
    expect(createLogMock).toHaveBeenCalledWith(
      'itemUpdate',
      { canOpen: { oldVal: 'false', newVal: 'true' } },
      '42',
      'admin-uid'
    );
    expect(revalidateItemMock).toHaveBeenCalledWith(42, ['item-42']);
  });

  test('rejects invalid ids and items that are already openable', async () => {
    await expect(markItemOpenable({ itemIid: 'x', admin })).rejects.toBeInstanceOf(
      OpenableReviewInputError
    );

    prismaMock.items.findUnique.mockResolvedValue(null);
    await expect(markItemOpenable({ itemIid: 1, admin })).rejects.toMatchObject({
      code: 'invalid-item',
    });

    prismaMock.items.findUnique.mockResolvedValue({ canOpen: 'true' });
    await expect(markItemOpenable({ itemIid: 1, admin })).rejects.toMatchObject({
      code: 'already-openable',
    });

    expect(prismaMock.items.update).not.toHaveBeenCalled();
  });
});
