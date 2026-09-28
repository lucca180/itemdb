import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  itemProcess: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  items: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
}));

const createLogMock = vi.hoisted(() => vi.fn());
const revalidateItemMock = vi.hoisted(() => vi.fn());

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@utils/item/detectWearable', () => ({
  detectWearable: vi.fn().mockResolvedValue(false),
}));

vi.mock('@services/ActionLogService', () => ({
  LogService: { createLog: createLogMock },
}));

vi.mock('@utils/item/revalidateItem', () => ({
  revalidateItem: revalidateItemMock,
  ItemRevalidateTags: { root: (id: number) => [`item-${id}`] },
}));

import type { ItemProcess, Items } from '@prisma/generated/client';
import { updateOrAddDB, type ProcessContext } from '@utils/item/processItemQueue';
import { markNcItemOpenableFromDrops } from '@utils/item/markNcItemOpenableFromDrops';

const itemProcess = (overrides: Partial<ItemProcess> = {}): ItemProcess =>
  ({
    internal_id: 1,
    item_id: null,
    name: 'Item',
    description: null,
    image: 'https://images.neopets.com/items/item.gif',
    image_id: 'item_image',
    category: null,
    rarity: null,
    weight: null,
    isNC: false,
    isBD: false,
    type: 'np',
    est_val: null,
    specialType: null,
    status: null,
    releaseDate: null,
    retiredDate: null,
    isWearable: false,
    addedAt: new Date(),
    updatedAt: new Date(),
    ip_address: null,
    language: 'en',
    hash: null,
    manual_check: null,
    processed: false,
    meta: null,
    ...overrides,
  }) as ItemProcess;

const dbItem = (overrides: Partial<Items> = {}): Items =>
  ({
    internal_id: 42,
    item_id: null,
    name: 'Item',
    description: null,
    image: 'https://images.neopets.com/items/item.gif',
    image_id: 'item_image',
    category: null,
    rarity: null,
    weight: null,
    type: 'np',
    est_val: null,
    specialType: null,
    releaseDate: null,
    retiredDate: null,
    status: null,
    comment: null,
    slug: 'item',
    addedAt: new Date(),
    updatedAt: new Date(),
    isNC: false,
    isWearable: false,
    isNeohome: false,
    isBD: false,
    canRead: 'unknown',
    canEat: 'unknown',
    canPlay: 'unknown',
    canOpen: 'false',
    imgCacheOverride: null,
    flags: null,
    canonical_id: null,
    ...overrides,
  }) as Items;

const newCtx = (): ProcessContext => ({ usedSlugs: new Set(), manualChecks: [] });

function mockFindMany(dbItemList: unknown[]) {
  prismaMock.items.findMany.mockImplementation(
    async ({ where }: { where: Record<string, unknown> }) => ('slug' in where ? [] : dbItemList)
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.itemProcess.findFirst.mockResolvedValue(null);
  prismaMock.items.findFirst.mockResolvedValue(null);
  mockFindMany([]);
});

describe('canOpen on item creation', () => {
  test('new NP items are created as not openable', async () => {
    const result = await updateOrAddDB(itemProcess({ isNC: false }), newCtx());
    expect(result?.canOpen).toBe('false');
  });

  test('new NC items are created as unknown', async () => {
    const result = await updateOrAddDB(itemProcess({ isNC: true, type: 'nc' }), newCtx());
    expect(result?.canOpen).toBe('unknown');
  });
});

describe('canOpen on item update', () => {
  test('an NP item that becomes NC goes from false to unknown', async () => {
    mockFindMany([dbItem({ isNC: false, canOpen: 'false' })]);

    await updateOrAddDB(itemProcess({ isNC: true, type: 'nc' }), newCtx());

    expect(prismaMock.items.update.mock.calls[0][0].data.canOpen).toBe('unknown');
    expect(createLogMock.mock.calls[0][1].canOpen).toEqual({ oldVal: 'false', newVal: 'unknown' });
  });

  test('keeps canOpen when the item was already NC', async () => {
    mockFindMany([dbItem({ isNC: true, type: 'nc', canOpen: 'false', status: null })]);

    await updateOrAddDB(itemProcess({ isNC: true, type: 'nc', status: 'active' }), newCtx());

    expect(prismaMock.items.update.mock.calls[0][0].data.canOpen).toBeUndefined();
  });

  test('keeps canOpen when an NP item that becomes NC is already openable', async () => {
    mockFindMany([dbItem({ isNC: false, canOpen: 'true' })]);

    await updateOrAddDB(itemProcess({ isNC: true, type: 'nc' }), newCtx());

    expect(prismaMock.items.update.mock.calls[0][0].data.canOpen).toBeUndefined();
  });
});

describe('markNcItemOpenableFromDrops', () => {
  test('marks an unknown NC item when at least one drop is NC', async () => {
    prismaMock.items.count.mockResolvedValue(1);
    prismaMock.items.updateMany.mockResolvedValue({ count: 1 });

    await expect(markNcItemOpenableFromDrops(10, [20, 21])).resolves.toBe(true);
    expect(prismaMock.items.count).toHaveBeenCalledWith({
      where: { internal_id: { in: [20, 21] }, isNC: true },
    });
    expect(prismaMock.items.updateMany).toHaveBeenCalledWith({
      where: { internal_id: 10, isNC: true, canOpen: 'unknown' },
      data: { canOpen: 'true' },
    });
  });

  test('ignores openings whose drops are all NP', async () => {
    prismaMock.items.count.mockResolvedValue(0);

    await expect(markNcItemOpenableFromDrops(10, [20])).resolves.toBe(false);
    expect(prismaMock.items.updateMany).not.toHaveBeenCalled();
  });

  test('ignores openings without drops', async () => {
    await expect(markNcItemOpenableFromDrops(10, [])).resolves.toBe(false);
    expect(prismaMock.items.count).not.toHaveBeenCalled();
    expect(prismaMock.items.updateMany).not.toHaveBeenCalled();
  });
});
