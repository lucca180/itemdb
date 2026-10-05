import { beforeEach, describe, expect, test, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  itemProcess: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  items: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    createMany: vi.fn(),
  },
  itemColor: {
    createMany: vi.fn(),
  },
  openableQueue: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@utils/prisma', () => ({
  default: prismaMock,
}));

vi.mock('@utils/item/detectWearable', () => ({
  detectWearable: vi.fn().mockResolvedValue(false),
}));

vi.mock('@utils/item/itemColorThief', () => ({
  getColorThiefItemColors: vi.fn().mockResolvedValue([]),
}));

vi.mock('@utils/item/revalidateItem', () => ({
  revalidateAppCache: vi.fn(),
  HomeRevalidateTags: {},
}));

vi.mock('@pages/api/v1/items/open', () => ({
  processOpenableItems: vi.fn(),
}));

vi.mock('@utils/discord-hooks', () => ({
  sendNewItemsHook: vi.fn(),
}));

vi.mock('@pages/api/v1/lists/sync', () => ({
  syncAllDynamicLists: vi.fn(),
}));

vi.mock('@services/ActionLogService', () => ({
  LogService: { createLog: vi.fn() },
}));

import type { ItemProcess, Items } from '@prisma/generated/client';
import { processItemProcessQueue } from '@utils/item/processItemQueue';

const itemProcess = (overrides: Partial<ItemProcess> = {}): ItemProcess =>
  ({
    internal_id: 1,
    item_id: null,
    name: 'Yellow Snomorg',
    description: 'Although not the brightest of Petpets',
    image: 'https://images.neopets.com/items/petpet_snomorg_yellow.gif',
    image_id: 'petpet_snomorg_yellow',
    category: 'Spooky Petpet',
    rarity: 180,
    weight: null,
    isNC: false,
    isBD: false,
    type: 'np',
    est_val: null,
    specialType: null,
    status: 'active',
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

const dbItem = (): Partial<Items> => ({
  internal_id: 45934,
  item_id: 19294,
  name: 'Yellow Snomorg',
  description: 'Although not the brightest of Petpets',
  image: 'https://images.neopets.com/items/petpet_snomorg_yellow.gif',
  image_id: 'petpet_snomorg_yellow',
  category: 'Spooky Petpet',
  rarity: 180,
  weight: 1,
  est_val: 15730,
});

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.itemProcess.findFirst.mockResolvedValue(null);
  prismaMock.openableQueue.findMany.mockResolvedValue([]);
  prismaMock.$transaction.mockResolvedValue([{ count: 0 }, { count: 0 }, { count: 0 }]);
  prismaMock.items.findMany.mockImplementation(
    async ({ where }: { where: Record<string, unknown> }) => ('slug' in where ? [] : [dbItem()])
  );
});

// Mirror the real pending-manual-check lookup: once a row is flagged, later rows inherit it.
function trackPendingManualChecks() {
  const flagged: { internal_id: number; manual_check: string }[] = [];
  prismaMock.itemProcess.update.mockImplementation(
    async ({ data, where }: { data: { manual_check: string }; where: { internal_id: number } }) => {
      flagged.push({ internal_id: where.internal_id, manual_check: data.manual_check });
    }
  );
  prismaMock.itemProcess.findFirst.mockImplementation(async () => flagged[0] ?? null);
  return flagged;
}

describe('processItemProcessQueue conflicting groups', () => {
  test('applies the non-conflicting row and flags only the row with the conflicting value', async () => {
    const flagged = trackPendingManualChecks();
    prismaMock.items.findMany.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) =>
        'slug' in where ? [] : [{ ...dbItem(), rarity: null }]
    );
    prismaMock.itemProcess.findMany.mockResolvedValue([
      itemProcess({ internal_id: 10, item_id: 19294, weight: null, rarity: 180 }),
      itemProcess({ internal_id: 11, item_id: null, weight: 3, rarity: null }),
    ]);

    await processItemProcessQueue({ skipColors: true });

    expect(prismaMock.items.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.items.update.mock.calls[0][0].data).toMatchObject({ rarity: 180, weight: 1 });
    expect(flagged).toEqual([
      { internal_id: 11, manual_check: "'weight' Merge Conflict with (45934)" },
    ]);
  });

  test('a merged group without conflict is applied once with the merged data', async () => {
    prismaMock.items.findMany.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) =>
        'slug' in where ? [] : [{ ...dbItem(), rarity: null, weight: null }]
    );
    prismaMock.itemProcess.findMany.mockResolvedValue([
      itemProcess({ internal_id: 10, item_id: 19294, weight: null, rarity: 180 }),
      itemProcess({ internal_id: 11, item_id: null, weight: 3, rarity: null }),
    ]);

    await processItemProcessQueue({ skipColors: true });

    expect(prismaMock.items.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.items.update.mock.calls[0][0].data).toMatchObject({ rarity: 180, weight: 3 });
    expect(prismaMock.itemProcess.update).not.toHaveBeenCalled();
  });

  test('each row is flagged with its own conflicting value', async () => {
    prismaMock.itemProcess.findMany.mockResolvedValue([
      itemProcess({ internal_id: 10, item_id: 19294, weight: 3 }),
      itemProcess({ internal_id: 11, item_id: null, rarity: 99 }),
    ]);

    await processItemProcessQueue({ skipColors: true });

    expect(prismaMock.itemProcess.update.mock.calls.map(([call]) => call)).toEqual([
      {
        data: { manual_check: "'rarity' Merge Conflict with (45934)" },
        where: { internal_id: 11 },
      },
      {
        data: { manual_check: "'weight' Merge Conflict with (45934)" },
        where: { internal_id: 10 },
      },
    ]);
  });

  test('single rows keep the regular manual check flow', async () => {
    prismaMock.itemProcess.findMany.mockResolvedValue([
      itemProcess({ internal_id: 10, item_id: 19294, weight: 3 }),
    ]);

    await processItemProcessQueue({ skipColors: true });

    expect(prismaMock.itemProcess.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.itemProcess.update).toHaveBeenCalledWith({
      data: { manual_check: "'weight' Merge Conflict with (45934)" },
      where: { internal_id: 10 },
    });
  });
});
